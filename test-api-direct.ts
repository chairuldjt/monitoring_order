import * as dotenv from 'dotenv'; dotenv.config({ path: '.env.local' });
const { getSIMRSOrdersByStatus, getSIMRSOrderHistory } = require('./lib/simrs-client');

async function test() {
    console.log('Fetching status 15 (DONE)...');
    const orders = await getSIMRSOrdersByStatus(15);
    console.log(`Found ${orders?.length || 0} orders.`);

    if (orders && orders.length > 0) {
        console.log('Sample order data:');
        console.log(JSON.stringify(orders[0], null, 2));

        console.log('\nFetching history for first order...');
        const history = await getSIMRSOrderHistory(orders[0].order_id);
        console.log(`History count: ${history?.length || 0}`);
        if (history && history.length > 0) {
            console.log('Sample history entry:');
            console.log(JSON.stringify(history[0], null, 2));
        }
    }
}

test();
