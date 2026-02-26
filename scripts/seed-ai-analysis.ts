import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';

// Load environment variables
const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
console.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

const {
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE
} = process.env;

async function seedAiAnalysis() {
    console.log('🌱 Starting database seeding for ai_analysis...\n');

    const connection = await mysql.createConnection({
        host: MYSQL_HOST,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD || '',
        database: MYSQL_DATABASE
    });

    console.log(`📦 Connected to database "${MYSQL_DATABASE}"`);

    const seedData = [
        {
            analysis_type: 'repeat_orders',
            result_json: JSON.stringify([
                {
                    "title": "AC Rusak / Kurang Dingin",
                    "reason": "AC sering mati sendiri padahal baru diservis.",
                    "count": 15,
                    "order_nos": ["ORD-101", "ORD-102", "ORD-103"]
                },
                {
                    "title": "Lampu Ruang Perawatan Mati",
                    "reason": "Bohlam lampu sering putus di ruang VIP.",
                    "count": 8,
                    "order_nos": ["ORD-201", "ORD-202"]
                }
            ]),
            date_start: '2026-02-01',
            date_end: '2026-02-15',
            total_orders_analyzed: 125,
            status: 'success',
            error_message: null
        },
        {
            analysis_type: 'repeat_orders',
            result_json: JSON.stringify([
                {
                    "title": "Kran Wastafel Bocor",
                    "reason": "Seal karet sudah aus akibat pemakaian tinggi.",
                    "count": 22,
                    "order_nos": ["ORD-301", "ORD-302", "ORD-303", "ORD-304"]
                },
                {
                    "title": "Pintu Kamar Mandi Macet",
                    "reason": "Engsel pintu berkarat.",
                    "count": 12,
                    "order_nos": ["ORD-401", "ORD-402"]
                }
            ]),
            date_start: '2026-02-16',
            date_end: '2026-02-28',
            total_orders_analyzed: 340,
            status: 'success',
            error_message: null
        },
        {
            analysis_type: 'repeat_orders',
            result_json: JSON.stringify([]),
            date_start: '2026-01-01',
            date_end: '2026-01-31',
            total_orders_analyzed: 50,
            status: 'failed',
            error_message: 'API timeout during semantic grouping.'
        }
    ];

    console.log('📋 Truncating table: ai_analysis');
    await connection.query('TRUNCATE TABLE ai_analysis');

    console.log('📋 Seeding ai_analysis data...');

    for (const record of seedData) {
        await connection.query(
            `INSERT INTO ai_analysis 
            (analysis_type, result_json, date_start, date_end, total_orders_analyzed, status, error_message, last_run) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                record.analysis_type,
                record.result_json,
                record.date_start,
                record.date_end,
                record.total_orders_analyzed,
                record.status,
                record.error_message
            ]
        );
    }

    await connection.end();
    console.log('\n✅ Database seeding complete! Total records inserted:', seedData.length);
}

seedAiAnalysis().catch(err => {
    console.error('❌ Database seeding failed:', err);
    process.exit(1);
});
