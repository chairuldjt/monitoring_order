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
        const statuses = [11, 12, 13, 15];
        let allOrders: any[] = [];

        for (const s of statuses) {
            const res = await axios.get(`${url}/order/order_list_by_status/${s}`, {
                headers: { 'access-token': token }
            });
            const data = res.data.result || res.data.data || res.data || [];
            if (Array.isArray(data)) {
                allOrders = [...allOrders, ...data];
            }
        }

        const output = allOrders.map(o => ({
            order_no: o.order_no,
            catatan: o.catatan,
            location_desc: o.location_desc,
            create_date: o.create_date
        }));

        fs.writeFileSync(path.join(process.cwd(), 'scripts/raw_data.json'), JSON.stringify(output, null, 2), 'utf8');
        console.log('SUCCESS: Written ' + output.length + ' orders to scripts/raw_data.json');
    } catch (e: any) {
        console.error('ERROR:', e.response?.data || e.message);
    }
}

run();
