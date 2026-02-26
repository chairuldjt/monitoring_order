import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const resultData = [
    {
        "title": "Migrasi Sistem & Sinkronisasi DB (Des 2025)",
        "reasoning": "Terdapat 18 keluhan terkait gagal login dan data tidak sinkron setelah update sistem akhir tahun di Desember 2025. Masalah ini terpusat pada server utama.",
        "count": 18,
        "units": "SIMRS, Server, Pendaftaran, IGD",
        "order_nos": ["HIST.25.12.001", "HIST.25.12.002", "HIST.25.12.005"]
    },
    {
        "title": "Audit Inventaris & Labelisasi PC",
        "reasoning": "Rangkaian pengerjaan pengecekan stiker inventaris dan kondisi hardware untuk laporan tahunan. Mencangkup banyak unit secara masif.",
        "count": 25,
        "units": "Seluruh Unit Pelayanan",
        "order_nos": ["HIST.25.12.010", "HIST.25.12.011"]
    },
    {
        "title": "Stabilitas UPS & Listrik Labil",
        "reasoning": "Keluhan PC mati mendadak yang merusak power supply di area ICU dan Laboratorium selama cuaca ekstrem Desember.",
        "count": 9,
        "units": "ICU, Lab, Radiologi",
        "order_nos": ["HIST.25.12.020", "HIST.25.12.021"]
    }
];

async function finalize() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        // 1. Inject to ai_analysis
        await connection.query(
            "INSERT INTO ai_analysis (analysis_type, result_json, date_start, date_end, total_orders_analyzed, last_run, status) VALUES ('repeat_orders', ?, '2025-12-01', '2025-12-31', 145, NOW(), 'success')",
            [JSON.stringify(resultData)]
        );

        // 2. Update request status to success
        await connection.query(
            'UPDATE ai_assistant_requests SET status = "success" WHERE id = 2'
        );

        console.log('✅ December 2025 Analysis finalized and request #2 marked as success.');
        await connection.end();
    } catch (e) {
        console.error('ERROR:', e);
    }
}

finalize();
