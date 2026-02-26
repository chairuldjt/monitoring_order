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

    const results = {
        range1: [
            {
                "title": "Gangguan Jaringan & Internet",
                "reasoning": "Ditemukan 454 keluhan serupa terkait gangguan jaringan & internet.",
                "count": 454,
                "units": "Siswo - LAB PATOLOGI ANATOMI, bu fitri - SIMRS, Rajawali 6B - pak ngatno, depo farmasi rajawali lt dasar",
                "order_nos": ["20.52885", "20.53345", "20.53317", "20.52977", "20.52963", "20.52940", "20.52918", "20.52893", "20.52545", "20.52000", "20.51863", "20.53423", "20.53429", "20.53427", "20.53424", "20.53420", "20.53419", "20.53396", "20.53393", "20.53390"]
            },
            {
                "title": "Masalah Printer & Hardware Cetak",
                "reasoning": "Ditemukan 318 keluhan serupa terkait masalah printer & hardware cetak.",
                "count": 318,
                "units": "mbak isna - farmasi kasuari, gd penunjang lt 4 pelaksanaan anggaran, ika/garuda a lantai 3, Arni/PPA",
                "order_nos": ["20.53342", "20.52369", "20.51949", "20.52353", "20.52014", "20.51783", "20.53434", "20.53414", "20.53411", "20.53409", "20.53405", "20.53404", "20.53403", "20.53399", "20.53391", "20.53387", "20.53376", "20.53371", "20.53365", "20.53352"]
            },
            {
                "title": "Masalah Display & Monitor",
                "reasoning": "Ditemukan 120 keluhan serupa terkait masalah display & monitor.",
                "count": 120,
                "units": "Darsono/ruang setting dan packing cssd, BEKTI TV POLI GARUDA, Arief / OK 11 Ibs Sentral",
                "order_nos": ["20.53413", "20.52009", "20.52926", "20.52879", "20.52498", "20.52479", "20.52296", "20.53435", "20.53431", "20.53401", "20.53368", "20.53364", "20.53348", "20.53339", "20.53336", "20.53327", "20.53315", "20.53296", "20.53290", "20.53246"]
            },
            {
                "title": "Masalah Software & Aplikasi (SIMRS/RME)",
                "reasoning": "Ditemukan 90 keluhan serupa terkait masalah software & aplikasi (simrs/rme).",
                "count": 90,
                "units": "mbak cut simrs, desi / ns garuda lt 5, R1A / Marsih, Lina - laborat merpati",
                "order_nos": ["20.53111", "20.52096", "20.53417", "20.53398", "20.53397", "20.53384", "20.53331", "20.53307", "20.53306", "20.53281", "20.53280", "20.53276", "20.53216", "20.53213", "20.53212", "20.53210", "20.53207", "20.53200", "20.53182", "20.53169"]
            },
            {
                "title": "PC Mati Total & Baterai CMOS",
                "reasoning": "Ditemukan 72 keluhan serupa terkait pc mati total & baterai cmos.",
                "count": 72,
                "units": "ICU Central, wida-merak lt 2, ana - garuda lt 6, INNKA-ODS rajawali",
                "order_nos": ["20.53437", "20.53432", "20.53392", "20.53323", "20.53319", "20.53229", "20.53219", "20.53202", "20.53189", "20.53152", "20.53137", "20.53129", "20.53074", "20.53072", "20.53047", "20.53035", "20.52953", "20.52950", "20.52923", "20.52865"]
            },
            {
                "title": "Perbaikan Perangkat Input (Keyboard/Mouse)",
                "reasoning": "Ditemukan 65 keluhan serupa terkait perbaikan perangkat input (keyboard/mouse).",
                "count": 65,
                "units": "niken-komite medik, niken-rajawali 2a, heru-kenari, Erlin / IPS",
                "order_nos": ["20.53421", "20.53408", "20.53406", "20.53382", "20.53374", "20.53362", "20.53335", "20.53328", "20.53265", "20.53262", "20.53237", "20.53236", "20.53116", "20.53082", "20.53056", "20.53051", "20.53038", "20.53004", "20.52985", "20.52935"]
            }
        ],
        range2: [
            {
                "title": "Gangguan Jaringan & Internet",
                "reasoning": "Ditemukan 244 keluhan serupa terkait gangguan jaringan & internet.",
                "count": 244,
                "units": "cahya / garuda a pendaftaran loby lantai dasar, Anak Lt 1 - Willi, bu eni - ULP",
                "order_nos": ["20.54234", "20.54232", "20.54229", "20.54228", "20.54224", "20.54212", "20.54198", "20.54193", "20.54191", "20.54172", "20.54164", "20.54156", "20.54154", "20.54149", "20.54143", "20.54142", "20.54138", "20.54137", "20.54114", "20.54053"]
            },
            {
                "title": "Masalah Printer & Hardware Cetak",
                "reasoning": "Ditemukan 153 keluhan serupa terkait masalah printer & hardware cetak.",
                "count": 153,
                "units": "Klinik Amarilis Garuda, Bu ida - rumah tangga, mbak nila - farmasi merpati",
                "order_nos": ["20.54233", "20.54230", "20.54227", "20.54222", "20.54211", "20.54189", "20.54188", "20.54171", "20.54158", "20.54157", "20.54153", "20.54152", "20.54151", "20.54027", "20.54231", "20.54181", "20.54178", "20.54166", "20.54161", "20.53941"]
            },
            {
                "title": "Masalah Display & Monitor",
                "reasoning": "Ditemukan 45 keluhan serupa terkait masalah display & monitor.",
                "count": 45,
                "units": "Poli THT Merpati Lt 1 - Andin, Diklat Lt Dasar - Amal, Kasuari Lt5 - Gandhes",
                "order_nos": ["20.54226", "20.54216", "20.54184", "20.54066", "20.54036", "20.54129", "20.54124", "20.53840", "20.53692", "20.53740", "20.53724", "20.54054", "20.53857", "20.53856", "20.53662", "20.54116", "20.54105", "20.54074", "20.54033", "20.54029"]
            }
        ],
        range3: [
            {
                "title": "Gangguan Jaringan & Internet",
                "reasoning": "Ditemukan 707 keluhan serupa terkait gangguan jaringan & internet (Full Range Analysis).",
                "count": 707,
                "units": "cahya / garuda a pendaftaran loby lantai dasar, Anak Lt 1, ULP, SIMRS",
                "order_nos": ["20.54234", "20.54232", "20.54228", "20.54224", "20.54212", "20.54198", "20.54172", "20.54164", "20.54156", "20.54154", "20.54149", "20.53423", "20.53429", "20.53427", "20.53396", "20.53393", "20.53390", "20.53216", "20.53213", "20.53212"]
            },
            {
                "title": "Masalah Printer & Hardware Cetak",
                "reasoning": "Ditemukan 474 keluhan serupa terkait masalah printer & hardware cetak (Full Range Analysis).",
                "count": 474,
                "units": "Klinik Amarilis, Merpati, Kasuari, Radioterapi",
                "order_nos": ["20.54233", "20.54230", "20.54227", "20.54222", "20.54211", "20.54189", "20.54188", "20.54171", "20.54158", "20.54157", "20.54153", "20.53342", "20.52369", "20.51949", "20.52353", "20.52014", "20.51783", "20.53434", "20.53414", "20.53411"]
            }
        ]
    };

    const seedData = [
        {
            analysis_type: 'repeat_orders',
            result_json: JSON.stringify(results.range1),
            date_start: '2025-12-08',
            date_end: '2026-01-31',
            total_orders_analyzed: 1529,
            status: 'success',
            error_message: null
        },
        {
            analysis_type: 'repeat_orders',
            result_json: JSON.stringify(results.range2),
            date_start: '2026-02-01',
            date_end: '2026-02-26',
            total_orders_analyzed: 710,
            status: 'success',
            error_message: null
        },
        {
            analysis_type: 'repeat_orders',
            result_json: JSON.stringify(results.range3),
            date_start: '2025-11-20',
            date_end: '2026-02-26',
            total_orders_analyzed: 2262,
            status: 'success',
            error_message: null
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
