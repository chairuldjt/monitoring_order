import * as dotenv from 'dotenv'; dotenv.config({ path: '.env.local' });
const { getSIMRSOrdersByStatus, getSIMRSOrderHistory, parseSIMRSDate } = require('./lib/simrs-client');
const fs = require('fs');

async function simulate() {
    console.log('Starting simulation...');
    const doneOrders = await getSIMRSOrdersByStatus(15);
    if (!doneOrders) return;

    const monthMap = new Map();
    const results = [];

    for (const order of doneOrders.slice(0, 50)) {
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

        let diff = 0;
        if (followUpDate && doneDate) {
            diff = (doneDate.getTime() - followUpDate.getTime()) / (1000 * 60 * 60);
        }

        results.push({
            order_no: order.order_no,
            fu: followUpDate ? followUpDate.toISOString() : null,
            done: doneDate ? doneDate.toISOString() : null,
            hours: diff
        });
    }

    fs.writeFileSync('simulation-results.json', JSON.stringify(results, null, 2));
    console.log('Simulation results saved to simulation-results.json');
}

simulate();
