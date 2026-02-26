import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const url = process.env.SIMRS_API_URL;
const login = process.env.SIMRS_USERNAME;
const pwd = process.env.SIMRS_PASSWORD;

async function run() {
    try {
        console.log(`Logging in to ${url}...`);
        const loginRes = await axios.post(`${url}/secure/auth_validate_login`, { login, pwd });

        if (!loginRes.data.result || !loginRes.data.token) {
            console.log('Login failed.');
            return;
        }

        const token = loginRes.data.token;
        const statuses = [10, 11, 12, 13, 15, 30];
        let allOrders: any[] = [];

        for (const s of statuses) {
            console.log(`Fetching status ${s}...`);
            const res = await axios.get(`${url}/order/order_list_by_status/${s}`, {
                headers: { 'access-token': token }
            });
            const data = res.data.result || res.data.data || res.data || [];
            if (Array.isArray(data)) {
                console.log(`Received ${data.length} orders for status ${s}`);
                allOrders = [...allOrders, ...data];
            }
            // Delay to avoid 429
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const output = allOrders.map(o => ({
            order_no: o.order_no,
            catatan: o.catatan,
            location_desc: o.location_desc,
            create_date: o.create_date
        }));

        const dateStr = new Date().toISOString().split('T')[0];
        const baseFilename = `raw_data_${dateStr}.json`;
        const legacyFilename = `raw_data.json`;

        const scriptsDir = path.join(process.cwd(), 'scripts');
        fs.writeFileSync(path.join(scriptsDir, baseFilename), JSON.stringify(output, null, 2), 'utf8');
        fs.writeFileSync(path.join(scriptsDir, legacyFilename), JSON.stringify(output, null, 2), 'utf8');

        console.log(`\n--- FETCH SUMMARY ---`);
        console.log(`Total Orders: ${allOrders.length}`);
        console.log(`Date Stamped: scripts/${baseFilename}`);
        console.log(`Legacy File: scripts/${legacyFilename}`);
        console.log(`---------------------\n`);
        console.log('SUCCESS: Raw data backup created.');
    } catch (e: any) {
        console.error('ERROR:', e.response?.data || e.message);
    }
}

run();
