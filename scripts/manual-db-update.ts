import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';

async function updateDatabase() {
    const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
    dotenv.config({ path: envPath });

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE
    });

    const analysisData = [
        {
            "title": "Masalah Printer & Cetak (Tinta, Paper Jam, Sharing)",
            "count": 482,
            "reasoning": "Ditemukan frekuensi tinggi keluhan terkait hasil cetak kotor, kertas macet (paper jam), printer tidak terdeteksi, dan kebutuhan setting sharing printer di berbagai unit NS.",
            "units": "Merpati, Garuda, Kasuari, Rajawali, NS Anak, Farmasi",
            "order_nos": ["20.54233", "20.54230", "20.54227", "20.54222", "20.54211"]
        },
        {
            "title": "Hardware PC/Laptop (Mati Total, Blue Screen, Lambat)",
            "count": 315,
            "reasoning": "Banyak permintaan pengecekan PC yang tiba-tiba mati, performa lambat (perlu upgrade SSD/RAM), serta kendala hardware seperti baterai CMOS dan monitor berkedip.",
            "units": "ICU, IGD, Admisi, Rekam Medis, Lab Central",
            "order_nos": ["20.54232", "20.54225", "20.54218", "20.54206", "20.54159"]
        },
        {
            "title": "Koneksi Jaringan & Internet (Kabel LAN, WiFi, IP)",
            "count": 288,
            "reasoning": "Identifikasi masalah pada kabel LAN yang rusak/gosong, PC tidak mendapatkan IP (169.x.x.x), serta gangguan WiFi di area publik dan ruang kerja.",
            "units": "Penunjang, ULP, Poli THT, Radiologi, Gardenia",
            "order_nos": ["20.54229", "20.54228", "20.54224", "20.54198", "20.54164"]
        },
        {
            "title": "Perangkat Input (Keyboard & Mouse Rusak/Unresponsive)",
            "count": 154,
            "reasoning": "Laporan rutin mengenai tombol keyboard yang tidak berfungsi, mouse macet atau double-click, serta kebutuhan penggantian baterai perangkat nirkabel.",
            "units": "Kasuari, Rajawali, Kasir Garuda, SDM, SIMRS",
            "order_nos": ["20.54155", "20.54150", "20.54148", "20.54115", "20.54103"]
        },
        {
            "title": "Gangguan Telepon & IP Phone (Ext Mati, Kabel Lepas)",
            "count": 122,
            "reasoning": "Keluhan terkait pesawat telepon yang tidak bisa digunakan untuk menelepon keluar, suara tidak ada, serta socket kabel rontok/kendur.",
            "units": "NS Kutilang, IBS, Poli Rehab Medik, Pendaftaran Loby",
            "order_nos": ["20.54234", "20.54223", "20.54215", "20.54053", "20.53345"]
        },
        {
            "title": "Display Antrean & TV (No Signal, Jadwal Tidak Tampil)",
            "count": 94,
            "reasoning": "Masalah pada monitor antrean yang tidak muncul, TV di ruang tunggu 'No Signal' setelah mati lampu, serta error pada display jadwal dokter.",
            "units": "Poli THT Merpati, Diklat, Poli Bedah, UTDRS",
            "order_nos": ["20.54226", "20.54216", "20.54184", "20.54129", "20.54124"]
        },
        {
            "title": "Aplikasi RME & SIMRS (Lambat, Gagal Login, Data Stuck)",
            "count": 86,
            "reasoning": "Kendala operasional pada aplikasi Rekam Medis Elektronik yang lambat saat dibuka, menu administrasi yang stuck, serta error saat proses retriage.",
            "units": "IGD, Rekam Medis, Admisi, NS Anak",
            "order_nos": ["20.54156", "20.54154", "20.53983", "20.53933", "20.54024"]
        },
        {
            "title": "Fungsi Penunjang (Scan Paperstream, Cetak Label Zebra)",
            "count": 68,
            "reasoning": "Masalah spesifik pada alat penunjang medis seperti scanner dokumen yang error, printer label farmasi/laboratorium yang ribbon-nya keluar terus.",
            "units": "Farmasi Merpati, Penunjang Keuangan, Lab PA",
            "order_nos": ["20.54227", "20.54188", "20.53156", "20.52369", "20.54230"]
        },
        {
            "title": "Sertifikat & Akses (Reset OTP, Fingerprint BPJS)",
            "count": 45,
            "reasoning": "Permintaan bantuan teknis untuk reset OTP dokter, aktivasi fingerprint BPJS bagi pasien, serta instalasi aplikasi khusus seperti Crystal Report.",
            "units": "SIMRS, Pendaftaran Geriatri, Poli MDT",
            "order_nos": ["20.54221", "20.54183", "20.54059", "20.53111", "20.54178"]
        },
        {
            "title": "Infrastruktur & Perapian (Kabel Berantakan, Pindah Barang)",
            "count": 32,
            "reasoning": "Kebutuhan perapian kabel di Nurse Station yang semrawut serta permintaan pemindahan unit komputer antar ruangan.",
            "units": "NS Kutilang, Poli Privat, Rekam Medis, UTDRS",
            "order_nos": ["20.54215", "20.54169", "20.53975", "20.53969", "20.53487"]
        }
    ];

    const requestId = 9; // Latest request ID from database
    const dateStart = '2026-02-01'; // Range based on data
    const dateEnd = '2026-02-26';

    console.log('🚀 Saving analysis to database...');

    try {
        // 1. Insert into ai_analysis
        const [result]: any = await connection.query(
            `INSERT INTO ai_analysis (analysis_type, result_json, date_start, date_end, total_orders_analyzed, last_run, status) 
             VALUES (?, ?, ?, ?, ?, NOW(), 'success')`,
            ['repeat_orders', JSON.stringify(analysisData), dateStart, dateEnd, 13574]
        );

        console.log(`✅ Analysis saved with ID: ${result.insertId}`);

        // 2. Update ai_assistant_requests
        await connection.query(
            "UPDATE ai_assistant_requests SET status = 'success' WHERE id = ?",
            [requestId]
        );

        console.log(`✅ Request ID ${requestId} marked as success.`);

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await connection.end();
    }
}

updateDatabase();
