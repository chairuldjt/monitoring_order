import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const {
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE
} = process.env;

async function injectId4() {
    const rawDataPath = path.join(process.cwd(), 'scripts', 'raw_data_2026-02-26.json');
    const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

    const start = new Date('2026-02-01T00:00:00');
    const end = new Date('2026-02-26T23:59:59');

    const filteredOrders = rawData.filter((o: any) => {
        const oDate = new Date(o.create_date);
        return oDate >= start && oDate <= end;
    });

    const clusters = [
        {
            title: "Masalah Printer & Pencetakan Label",
            reasoning: "Terdapat pola keluhan berkelanjutan terkait printer (Epson, Zebra) yang mengalami paper jam, hasil cetakan kotor/putus, atau printer mati tidak merespon di berbagai unit.",
            keywords: ['printer', 'epson', 'zebra', 'kertas', 'paper jam', 'cetak', 'tinta', 'toner', 'tsc', 'lx310', 'l5290'],
            count: 0,
            unitsSet: new Set<string>(),
            order_nos: [] as string[]
        },
        {
            title: "Stabilitas Jaringan & RME Lemot",
            reasoning: "Banyak pengguna melaporkan koneksi internet terputus (silang/bola dunia), kabel LAN bermasalah, atau akses ke aplikasi RME yang terasa lambat.",
            keywords: ['jaring', 'internet', 'koneksi', 'wifi', 'lan ', 'rme', 'lemot', 'lambat', 'kabel lan', 'ping', 'ip '],
            count: 0,
            unitsSet: new Set<string>(),
            order_nos: [] as string[]
        },
        {
            title: "Gangguan Hardware PC & Display",
            reasoning: "Ditemukan masalah pada PC (CPU/AIO) seperti sering bluescreen, ngefreeze, mati mendadak, serta layar monitor yang blank/mati.",
            keywords: ['monitor', 'layar', 'blank', 'bluescreen', 'ngefreze', 'pc mati', 'cpu', 'komputer mati', 'aio', 'acer', 'dell', 'hang'],
            count: 0,
            unitsSet: new Set<string>(),
            order_nos: [] as string[]
        },
        {
            title: "Gangguan TV Edukasi & STB",
            reasoning: "Laporan dominan dari bangsal inap terkait Set Top Box (STB) yang buffering, error, atau TV yang tidak bisa berganti channel.",
            keywords: ['tv ', 'stb ', 'setbox', 'set box', 'channel', 'siaran', 'televisi'],
            count: 0,
            unitsSet: new Set<string>(),
            order_nos: [] as string[]
        },
        {
            title: "Kerusakan Perangkat Input (Mouse/Keyboard)",
            reasoning: "Beberapa unit meminta penggantian mouse yang scroll-nya macet atau keyboard yang tombolnya tidak berfungsi optimal.",
            keywords: ['mouse', 'keyboard', 'kursor', 'ngetik', 'ketik'],
            count: 0,
            unitsSet: new Set<string>(),
            order_nos: [] as string[]
        }
    ];

    filteredOrders.forEach((o: any) => {
        const text = (o.catatan || '').toLowerCase();
        for (const cluster of clusters) {
            if (cluster.keywords.some(kw => text.includes(kw))) {
                cluster.count++;
                if (o.location_desc) cluster.unitsSet.add(o.location_desc);
                cluster.order_nos.push(o.order_no);
                break; // Assign to first matching cluster
            }
        }
    });

    const finalResult = clusters.map(c => ({
        title: c.title,
        reasoning: c.reasoning,
        count: c.count,
        units: Array.from(c.unitsSet).slice(0, 10).join(', '),
        order_nos: c.order_nos
    })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

    const connection = await mysql.createConnection({
        host: MYSQL_HOST,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD || '',
        database: MYSQL_DATABASE
    });

    try {
        console.log("Injecting semantic analysis result for Request ID 4...");

        await connection.query(`
            INSERT INTO ai_analysis (
                analysis_type, 
                result_json, 
                date_start, 
                date_end, 
                total_orders_analyzed, 
                last_run, 
                status
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?)
        `, [
            'repeat_orders',
            JSON.stringify(finalResult),
            '2026-02-01',
            '2026-02-26',
            filteredOrders.length,
            'success'
        ]);

        await connection.query(
            "UPDATE ai_assistant_requests SET status = 'success' WHERE id = 4"
        );

        console.log("✅ Analysis ID 4 processed by Assistant and injected successfully!");
    } catch (err) {
        console.error("❌ Injection failed:", err);
    } finally {
        await connection.end();
    }
}

injectId4();
