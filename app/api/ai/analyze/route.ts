import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getPayloadFromCookie } from '@/lib/jwt';
import { getOptimizedSIMRSOrders, parseSIMRSDate } from '@/lib/simrs-client';
import axios from 'axios';

export async function GET(req: Request) {
    try {
        const payload = await getPayloadFromCookie();
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        // 1. Get history list (always return for dropdown)
        const [history]: any = await pool.query(
            "SELECT id, date_start, date_end, total_orders_analyzed, last_run FROM ai_analysis WHERE analysis_type = 'repeat_orders' AND status = 'success' ORDER BY last_run DESC LIMIT 50"
        );

        // 2. Determine which data to return
        let targetAnalysis = null;
        if (id) {
            const [specific]: any = await pool.query(
                "SELECT * FROM ai_analysis WHERE id = ? AND analysis_type = 'repeat_orders'", [id]
            );
            targetAnalysis = specific[0];
        } else {
            // Default to latest
            const [latest]: any = await pool.query(
                "SELECT * FROM ai_analysis WHERE analysis_type = 'repeat_orders' AND status = 'success' ORDER BY last_run DESC LIMIT 1"
            );
            targetAnalysis = latest[0];
        }

        if (targetAnalysis) {
            return NextResponse.json({
                data: JSON.parse(targetAnalysis.result_json),
                dateStart: targetAnalysis.date_start,
                dateEnd: targetAnalysis.date_end,
                totalOrders: targetAnalysis.total_orders_analyzed,
                lastRun: targetAnalysis.last_run,
                id: targetAnalysis.id,
                history: history,
                cached: true
            });
        }

        return NextResponse.json({ data: null, history: history, message: 'No recent analysis found' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const payload = await getPayloadFromCookie();
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, startDate, endDate, model = 'gemini-1.5-flash' } = body;

        // 1. Get API Key
        const [settings]: any = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
        const apiKey = settings[0]?.setting_value;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key Gemini belum diatur di Pengaturan' }, { status: 400 });
        }

        // 2. Fetch orders and filter by date locally
        const statusIds = [10, 11, 12, 13, 15, 30]; // All statuses
        const allOrdersPromises = statusIds.map(sid => getOptimizedSIMRSOrders(sid));
        const allResponse = await Promise.all(allOrdersPromises);
        let allOrders = allResponse.flat();

        // Parse and filter
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        const filteredOrders = allOrders.filter(o => {
            const oDate = parseSIMRSDate(o.create_date);
            if (!oDate) return false;
            if (start && oDate < start) return false;
            if (end && oDate > end) return false;
            return true;
        }).map(o => ({
            id: o.order_no,
            title: (o.catatan || '').split('\n')[0]?.trim(),
            unit: o.location_desc,
            date: o.create_date
        })).filter(o => o.title);

        if (filteredOrders.length === 0) {
            return NextResponse.json({ error: 'Tidak ada data order pada rentang tanggal tersebut' }, { status: 400 });
        }

        // Action: Estimate
        if (action === 'estimate') {
            const charCount = JSON.stringify(filteredOrders).length;
            const estimatedTokens = Math.ceil(charCount / 4); // Rough estimate
            return NextResponse.json({
                orderCount: filteredOrders.length,
                estimatedTokens: estimatedTokens + 500 // + prompt tokens
            });
        }

        // 3. Hybrid Pre-Aggregation (Lokal)
        // Kelompokkan masalah yang tulisan deskripsinya sama persis sebelum dikirim ke AI
        const problemAggregates: Record<string, { count: number; units: Set<string>; orderNos: string[] }> = {};

        filteredOrders.forEach((order: any) => {
            const firstLine = (order.catatan || '').split('\n')[0]?.trim();
            if (!firstLine) return;

            if (!problemAggregates[firstLine]) {
                problemAggregates[firstLine] = { count: 0, units: new Set(), orderNos: [] };
            }
            problemAggregates[firstLine].count++;
            if (order.location_desc) problemAggregates[firstLine].units.add(order.location_desc);
            problemAggregates[firstLine].orderNos.push(order.order_no);
        });

        // Ubah ke format ringkas untuk AI
        const aggregatedList = Object.entries(problemAggregates).map(([text, data]) => ({
            text,
            total: data.count,
            units: Array.from(data.units).join(', '),
            nos: data.orderNos.slice(0, 5) // Kirim sample saja untuk hemat token
        })).sort((a, b) => b.total - a.total);

        // 4. Prepare AI Prompt (Much smaller now)
        const prompt = `
    Saya memiliki ringkasan data order perbaikan IT.
    Terdapat ${aggregatedList.length} kelompok masalah unik dari total ${filteredOrders.length} order.
    
    Data Ringkasan Kelompok (Pra-Agregasi Lokal):
    ${JSON.stringify(aggregatedList)}

    Tugas Anda:
    Lakukan "Semantic Merging". Gabungkan kelompok-kelompok di atas yang secara makna/konteks sama.
    Contoh: "Printer Rusak" (10x) dan "Printer tidak keluar tinta" (5x) harus digabung menjadi satu kategori "Masalah Printer" dengan total 15x.

    Output format (JSON Array ONLY):
    [{ "title": "Deskripsi Masalah", "reasoning": "Kenapa digabung", "count": total_gabungan, "units": "Daftar Unit", "order_nos": ["NO1", "NO2"...] }]
    
    Hanya jawab JSON valid.
    `;

        // 5. Call Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = aiText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('AI tidak memberikan format JSON yang valid');
        }

        const resultData = JSON.parse(jsonMatch[0]);

        // 5. Save to Local DB (Manual Trigger Results)
        await pool.query(
            "INSERT INTO ai_analysis (analysis_type, result_json, date_start, date_end, total_orders_analyzed, last_run, status) VALUES ('repeat_orders', ?, ?, ?, ?, NOW(), 'success')",
            [JSON.stringify(resultData), startDate || null, endDate || null, filteredOrders.length]
        );

        await pool.query("INSERT INTO ai_usage_logs (request_type, model) VALUES ('repeat_analysis', 'gemini-1.5-flash')");

        return NextResponse.json({
            data: resultData,
            dateStart: startDate,
            dateEnd: endDate,
            totalOrders: filteredOrders.length,
            lastRun: new Date()
        });

    } catch (error: any) {
        console.error('AI Analysis error:', error);
        let message = error.message;

        // Handle Quota/Rate Limit Errors
        if (error.response?.status === 429 || error.message.includes('quota') || error.message.includes('rate limit')) {
            const detail = error.response?.data?.error?.message || error.message;
            message = 'Kuota API Gemini Habis atau Terlalu Cepat (Rate Limit). ';
            if (detail.includes('retry in')) {
                const retryMatch = detail.match(/retry in ([\d\.]+s)/);
                if (retryMatch) message += `Mohon tunggu ${retryMatch[1]} lagi sebelum mencoba.`;
            } else {
                message += 'Silakan coba lagi dalam 1 menit atau ganti ke model "Lite".';
            }
        } else if (error.message.includes('SIMRS API error')) {
            message = 'Gagal mengambil data dari SIMRS. Server SIMRS sedang tidak menanggapi.';
        } else if (error.response?.data?.error?.message) {
            message = 'Gemini AI Error: ' + error.response.data.error.message;
        }

        return NextResponse.json({ error: 'Analisis AI Gagal: ' + message }, { status: error.response?.status || 500 });
    }
}
