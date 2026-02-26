import { NextResponse } from 'next/server';
import { getPayloadFromCookie } from '@/lib/jwt';
import { getSIMRSOrdersByStatus, getSIMRSOrderHistory, parseSIMRSDate } from '@/lib/simrs-client';

export async function GET(request: Request) {
    try {
        const payload = await getPayloadFromCookie();
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const viewType = searchParams.get('type') || 'weekly'; // daily, weekly, monthly
        const selectedMonth = searchParams.get('month'); // "1" - "12"
        const selectedYear = searchParams.get('year'); // "2024", etc.

        // 1. Fetch all DONE orders
        let doneOrders = await getSIMRSOrdersByStatus(15);
        console.log(`[Analytics API] Found ${doneOrders?.length || 0} DONE orders raw`);

        if (!doneOrders || doneOrders.length === 0) {
            console.log('[Analytics API] Returning early: No DONE orders found');
            return NextResponse.json({ success: true, data: [] });
        }

        // Apply month/year filter if provided
        if (selectedMonth || selectedYear) {
            doneOrders = doneOrders.filter(o => {
                const date = parseSIMRSDate(o.create_date);
                if (!date) return false;

                let matches = true;
                if (selectedMonth) {
                    matches = matches && (date.getMonth() + 1).toString() === selectedMonth;
                }
                if (selectedYear) {
                    matches = matches && date.getFullYear().toString() === selectedYear;
                }
                return matches;
            });
            console.log(`[Analytics API] Filtered to ${doneOrders.length} orders for ${selectedMonth}/${selectedYear}`);
        }

        // Limit concurrent requests to avoid SIMRS API timeout
        const concurrencyLimit = 10;
        const histories: any[] = [];

        for (let i = 0; i < doneOrders.length; i += concurrencyLimit) {
            const chunk = doneOrders.slice(i, i + concurrencyLimit);
            const chunkHistories = await Promise.all(
                chunk.map(async (order: any) => {
                    const history = await getSIMRSOrderHistory(order.order_id);
                    return { order, history };
                })
            );
            histories.push(...chunkHistories);
        }

        console.log(`[Analytics API] Successfully fetched histories for ${histories.length} orders`);

        // 2. Process histories to find "FOLLOW UP" -> "DONE" duration
        const groupMap = new Map<string, { totalHours: number, count: number, orders: any[] }>();

        const getWeekNumber = (d: Date) => {
            const date = new Date(d.getTime());
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() + 4 - (date.getDay() || 7));
            const yearStart = new Date(date.getFullYear(), 0, 1);
            return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };

        const getGroupKey = (date: Date | null, type: string) => {
            if (!date || isNaN(date.getTime())) return null;
            const year = date.getFullYear();

            if (type === 'daily') {
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            } else if (type === 'monthly') {
                const month = String(date.getMonth() + 1).padStart(2, '0');
                return `${year}-${month}`;
            } else { // weekly
                const weekNum = getWeekNumber(date);
                return `${year}-W${String(weekNum).padStart(2, '0')}`;
            }
        };

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

        histories.forEach(({ order, history }) => {
            if (!history || !Array.isArray(history)) return;

            let followUpDate: Date | null = null;
            let doneDate: Date | null = null;

            // Sort history by date asc
            const sortedHistory = [...history].sort((a, b) => {
                const da = parseSIMRSDate(a.status_date || a.create_date)?.getTime() || 0;
                const db = parseSIMRSDate(b.status_date || b.create_date)?.getTime() || 0;
                return da - db;
            });

            for (const h of sortedHistory) {
                const statusName = (h.status_desc || '').toUpperCase().trim();
                const hDate = parseSIMRSDate(h.status_date || h.create_date);

                if (statusName === 'FOLLOW UP' && !followUpDate) followUpDate = hDate;
                if (statusName === 'DONE') doneDate = hDate;
            }

            if (!followUpDate && order.create_date) followUpDate = parseSIMRSDate(order.create_date);
            if (!doneDate) {
                if (sortedHistory.length > 0) {
                    const lastLog = sortedHistory[sortedHistory.length - 1];
                    doneDate = parseSIMRSDate(lastLog.status_date || lastLog.create_date);
                } else if (order.create_date) {
                    doneDate = parseSIMRSDate(order.create_date);
                }
            }

            if (followUpDate && doneDate) {
                const start = followUpDate.getTime();
                const end = doneDate.getTime();
                if (isNaN(start) || isNaN(end)) return;

                let diffHours = (end - start) / (1000 * 60 * 60);
                if (diffHours < 0) diffHours = 0;

                const groupKey = getGroupKey(doneDate, viewType);
                if (groupKey) {
                    if (!groupMap.has(groupKey)) {
                        groupMap.set(groupKey, { totalHours: 0, count: 0, orders: [] });
                    }
                    const gData = groupMap.get(groupKey)!;
                    gData.totalHours += diffHours;
                    gData.count += 1;
                    gData.orders.push({
                        order_no: order.order_no,
                        title: order.catatan || order.order_no,
                        follow_up_date: followUpDate.toISOString(),
                        done_date: doneDate.toISOString(),
                        duration_hours: Number(diffHours.toFixed(2))
                    });
                }
            }
        });

        // 3. Format into array for Recharts
        const chartData = Array.from(groupMap.entries()).map(([key, value]) => {
            let label = key;
            if (viewType === 'monthly') {
                const [year, month] = key.split('-');
                label = `${monthNames[parseInt(month) - 1]} ${year}`;
            } else if (viewType === 'weekly') {
                label = `Minggu ${key.split('-W')[1]} (${key.split('-')[0]})`;
            } else if (viewType === 'daily') {
                const [year, month, day] = key.split('-');
                label = `${day} ${monthNames[parseInt(month) - 1]}`;
            }

            return {
                rawKey: key,
                label,
                averageHours: value.count > 0 ? Number((value.totalHours / value.count).toFixed(2)) : 0,
                orderCount: value.count,
                details: value.orders.sort((a, b) => b.duration_hours - a.duration_hours)
            };
        }).sort((a, b) => a.rawKey.localeCompare(b.rawKey));

        return NextResponse.json({
            success: true,
            data: chartData,
            viewType
        });

    } catch (error: any) {
        console.error('Analytics API error:', error);
        return NextResponse.json({ error: 'Gagal memproses analitik: ' + error.message }, { status: 500 });
    }
}
