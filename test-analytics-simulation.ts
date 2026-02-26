import * as dotenv from 'dotenv'; dotenv.config({ path: '.env.local' });
const { getSIMRSOrdersByStatus, getSIMRSOrderHistory, parseSIMRSDate } = require('./lib/simrs-client');

async function simulate() {
    console.log('[Sim] Fetching DONE orders...');
    const doneOrders = await getSIMRSOrdersByStatus(15);
    console.log(`[Sim] Found ${doneOrders?.length || 0} orders.`);

    if (!doneOrders || doneOrders.length === 0) return;

    const monthMap = new Map();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const getMonthKey = (date) => {
        if (!date || isNaN(date.getTime())) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    console.log('[Sim] Fetching histories for 20 orders max...');
    const samples = doneOrders.slice(0, 20);

    for (const order of samples) {
        process.stdout.write(`.`);
        const history = await getSIMRSOrderHistory(order.order_id);

        let followUpDate = null;
        let doneDate = null;

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
            } else {
                doneDate = parseSIMRSDate(order.create_date);
            }
        }

        if (followUpDate && doneDate) {
            const start = followUpDate.getTime();
            const end = doneDate.getTime();
            const diffHours = (end - start) / (1000 * 60 * 60);

            const monthKey = getMonthKey(doneDate);
            if (monthKey) {
                if (!monthMap.has(monthKey)) monthMap.set(monthKey, { total: 0, count: 0 });
                const m = monthMap.get(monthKey);
                m.total += diffHours;
                m.count += 1;
            }
        } else {
            console.log(`\n[Sim] Order ${order.order_no} FAILED date detection.`);
        }
    }

    console.log('\n[Sim] Simulation Result:');
    monthMap.forEach((v, k) => {
        const [year, month] = k.split('-');
        console.log(`${monthNames[parseInt(month) - 1]} ${year}: ${(v.total / v.count).toFixed(2)} hours (${v.count} orders)`);
    });
}

simulate();
