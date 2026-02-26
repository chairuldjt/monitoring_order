import * as dotenv from 'dotenv'; dotenv.config({ path: '.env.local' });
const { getSIMRSOrdersByStatus, getSIMRSOrderHistory } = require('./lib/simrs-client');
const fs = require('fs');

async function dump() {
    const orders = await getSIMRSOrdersByStatus(15);
    const target = orders.find((o: any) => o.order_no === '20.54195') || orders[0];
    console.log(`Dumping order ${target.order_no}...`);
    const history = await getSIMRSOrderHistory(target.order_id);
    fs.writeFileSync('order-history-dump.json', JSON.stringify({ order: target, history }, null, 2));
    console.log('Saved to order-history-dump.json');
}

dump();
