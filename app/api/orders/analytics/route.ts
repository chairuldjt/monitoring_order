import { NextResponse } from 'next/server';
import { getPayloadFromCookie } from '@/lib/jwt';
import { getSIMRSOrdersByStatus, getSIMRSOrderHistory, parseSIMRSDate } from '@/lib/simrs-client';

export async function GET(request: Request) {
    try {
        const payload = await getPayloadFromCookie();
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch all DONE orders
        const doneOrders = await getSIMRSOrdersByStatus(15);
        console.log(`[Analytics API] Found ${doneOrders?.length || 0} DONE orders`);

        if (!doneOrders || doneOrders.length === 0) {
            console.log('[Analytics API] Returning early: No DONE orders found');
            return NextResponse.json({ success: true, data: [] });
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
        const monthMap = new Map<string, { totalHours: number, count: number, orders: any[] }>();

        // Format: YYYY-MM
        const getMonthKey = (date: Date | null) => {
            if (!date || isNaN(date.getTime())) return null;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}`;
        };

        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

        histories.forEach(({ order, history }) => {
            if (!history || !Array.isArray(history)) {
                console.log(`[Analytics API] Skip order ${order.order_no}: No history array`);
                return;
            }

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

                // Earliest FOLLOW UP
                if (statusName === 'FOLLOW UP' && !followUpDate) {
                    followUpDate = hDate;
                }

                // Latest DONE
                if (statusName === 'DONE') {
                    doneDate = hDate;
                }
            }

            // Fallback 1: If no FOLLOW UP in history, use create_date of the order
            if (!followUpDate && order.create_date) {
                followUpDate = parseSIMRSDate(order.create_date);
            }

            // Fallback 2: If no DONE in history but order IS done, use last log date or order create_date
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

                if (isNaN(start) || isNaN(end)) {
                    console.log(`[Analytics API] Skip order ${order.order_no}: Invalid date strings (FU: ${followUpDate}, Done: ${doneDate})`);
                    return;
                }

                let diffHours = (end - start) / (1000 * 60 * 60);
                if (diffHours < 0) diffHours = 0;

                const monthKey = getMonthKey(doneDate);
                if (monthKey) {
                    if (!monthMap.has(monthKey)) {
                        monthMap.set(monthKey, { totalHours: 0, count: 0, orders: [] });
                    }
                    const mData = monthMap.get(monthKey)!;
                    mData.totalHours += diffHours;
                    mData.count += 1;
                    mData.orders.push({
                        order_no: order.order_no,
                        title: order.catatan || order.order_no,
                        follow_up_date: followUpDate.toISOString(),
                        done_date: doneDate.toISOString(),
                        duration_hours: Number(diffHours.toFixed(2))
                    });
                } else {
                    console.log(`[Analytics API] Skip order ${order.order_no}: Could not determine month key for ${doneDate}`);
                }
            } else {
                console.log(`[Analytics API] Skip order ${order.order_no}: Missing dates (FU: ${followUpDate}, Done: ${doneDate})`);
            }
        });

        // 3. Format into array for Recharts
        const chartData = Array.from(monthMap.entries()).map(([key, value]) => {
            const [year, month] = key.split('-');
            const monthLabel = `${monthNames[parseInt(month) - 1]} ${year}`;
            return {
                rawKey: key,
                month: monthLabel,
                averageHours: value.count > 0 ? Number((value.totalHours / value.count).toFixed(2)) : 0,
                orderCount: value.count,
                details: value.orders.sort((a, b) => b.duration_hours - a.duration_hours)
            };
        }).sort((a, b) => a.rawKey.localeCompare(b.rawKey));

        console.log(`[Analytics API] Calculated ${chartData.length} months of data`);

        return NextResponse.json({
            success: true,
            data: chartData
        });

    } catch (error: any) {
        console.error('Analytics API error:', error);
        return NextResponse.json({ error: 'Gagal memproses analitik: ' + error.message }, { status: 500 });
    }
}
