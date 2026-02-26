import { getOptimizedSIMRSOrders, parseSIMRSDate } from '../lib/simrs-client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function fetchData() {
    try {
        const [f, r, p, d] = await Promise.all([
            getOptimizedSIMRSOrders(11),
            getOptimizedSIMRSOrders(12),
            getOptimizedSIMRSOrders(13),
            getOptimizedSIMRSOrders(15),
        ]);

        const all = [...f, ...r, ...p, ...d];

        // Filter last 30 days
        const limit = new Date();
        limit.setDate(limit.getDate() - 30);

        const filtered = all.filter(o => {
            const date = parseSIMRSDate(o.create_date);
            return date && date >= limit;
        });

        console.log(JSON.stringify(filtered.map(o => ({
            order_no: o.order_no,
            catatan: o.catatan,
            location_desc: o.location_desc,
            create_date: o.create_date
        }))));
    } catch (e) {
        console.error(e);
    }
}

fetchData();
