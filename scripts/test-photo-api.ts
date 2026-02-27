import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import axios from 'axios';

async function run() {
    const url = `${process.env.SIMRS_API_URL}/photo/get_photo/307901`;
    console.log(`Fetching ${url} WITHOUT token`);

    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        console.log(`Success! Status: ${response.status}, Content-Type: ${response.headers['content-type']}, Size: ${response.data.byteLength} bytes`);
    } catch (err: any) {
        console.error('Failed without token:', err.response?.status);
    }
}

run().catch(console.error);
