import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getPayloadFromCookie } from '@/lib/jwt';
import { getOptimizedSIMRSOrders } from '@/lib/simrs-client';
import axios from 'axios';

export async function GET() {
    try {
        const payload = await getPayloadFromCookie();
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Check cache
        const [cache]: any = await pool.query(
            "SELECT * FROM ai_analysis WHERE analysis_type = 'repeat_orders' AND status = 'success' AND last_run > DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY last_run DESC LIMIT 1"
        );

        if (cache.length > 0) {
            return NextResponse.json({
                data: JSON.parse(cache[0].result_json),
                lastRun: cache[0].last_run,
                cached: true
            });
        }

        return NextResponse.json({ message: 'No recent analysis found' }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        const payload = await getPayloadFromCookie();
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get API Key
        const [settings]: any = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
        const apiKey = settings[0]?.setting_value;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key Gemini belum diatur di Pengaturan' }, { status: 400 });
        }

        // 2. Fetch all relevant orders (Open, Follow Up, Running, Pending)
        // To keep the prompt size manageable, let's take the most recent 100 orders or all active ones
        const [open, followUp, running, pending] = await Promise.all([
            getOptimizedSIMRSOrders(10), // Open
            getOptimizedSIMRSOrders(11), // Follow Up
            getOptimizedSIMRSOrders(12), // Running
            getOptimizedSIMRSOrders(13), // Pending
        ]);

        const activeOrders = [...open, ...followUp, ...running, ...pending].map(o => ({
            id: o.order_no,
            title: (o.catatan || '').split('\n')[0]?.trim(),
            unit: o.location_desc
        })).filter(o => o.title);

        if (activeOrders.length === 0) {
            return NextResponse.json({ error: 'Tidak ada data order untuk dianalisis' }, { status: 400 });
        }

        // 3. Prepare AI Prompt
        const prompt = `
    Saya memiliki data order perbaikan/layanan IT dari SIMRS. 
    Tugas Anda adalah mendeteksi "Repeat Order" (order yang berulang untuk masalah yang sama atau sangat mirip).
    
    Data Order:
    ${JSON.stringify(activeOrders)}

    Aturan:
    1. Kelompokkan order yang memiliki masalah yang secara semantik sama (misal: "printer mati" dan "printer tidak bisa nyala" adalah sama).
    2. Hasilkan list berisi objek: { "title": "Deskripsi Masalah Umum", "count": 12, "units": "Unit A, Unit B", "order_nos": ["NO1", "NO2"] }
    3. Urutkan berdasarkan 'count' terbanyak.
    4. Ambil 5-10 kelompok repeat order terbanyak.
    5. Jawab HANYA dengan JSON valid. Jangan ada teks tambahan.
    `;

        // 4. Call Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = aiText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('AI tidak memberikan format JSON yang valid');
        }

        const resultData = JSON.parse(jsonMatch[0]);

        // 5. Save to Cache & Log Usage
        await pool.query(
            "INSERT INTO ai_analysis (analysis_type, result_json, last_run, status) VALUES ('repeat_orders', ?, NOW(), 'success')",
            [JSON.stringify(resultData)]
        );

        await pool.query("INSERT INTO ai_usage_logs () VALUES ()");

        return NextResponse.json({
            data: resultData,
            lastRun: new Date(),
            cached: false
        });

    } catch (error: any) {
        console.error('AI Analysis error:', error);
        return NextResponse.json({ error: 'Analisis AI Gagal: ' + (error.response?.data?.error?.message || error.message) }, { status: 500 });
    }
}
