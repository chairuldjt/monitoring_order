import pool from './db';
import { getOptimizedSIMRSOrders, parseSIMRSDate } from './simrs-client';
import axios from 'axios';

export async function processAIAnalysis(startDate?: string, endDate?: string, model: string = 'gemini-1.5-flash') {
    // 1. Get API Key
    const [settings]: any = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
    const apiKey = settings[0]?.setting_value;

    if (!apiKey) {
        throw new Error('API Key Gemini belum diatur di Pengaturan');
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
        throw new Error('Tidak ada data order pada rentang tanggal tersebut');
    }

    // 3. Hybrid Pre-Aggregation (Lokal)
    const problemAggregates: Record<string, { count: number; units: Set<string>; orderNos: string[] }> = {};

    filteredOrders.forEach((order: any) => {
        const firstLine = order.title; // Already taken split[0] in map
        if (!firstLine) return;

        if (!problemAggregates[firstLine]) {
            problemAggregates[firstLine] = { count: 0, units: new Set(), orderNos: [] };
        }
        problemAggregates[firstLine].count++;
        if (order.unit) problemAggregates[firstLine].units.add(order.unit);
        problemAggregates[firstLine].orderNos.push(order.id);
    });

    // Ubah ke format ringkas untuk AI
    const aggregatedList = Object.entries(problemAggregates).map(([text, data]) => ({
        text,
        total: data.count,
        units: Array.from(data.units).slice(0, 10).join(', '), // Limit units for prompt size
        nos: data.orderNos.slice(0, 5)
    })).sort((a, b) => b.total - a.total);

    // 4. Prepare AI Prompt
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
        throw new Error('AI tidak memberikan format JSON yang valid: ' + aiText.slice(0, 100));
    }

    const resultData = JSON.parse(jsonMatch[0]);

    // 6. Save to Local DB (ai_analysis)
    const [result]: any = await pool.query(
        "INSERT INTO ai_analysis (analysis_type, result_json, date_start, date_end, total_orders_analyzed, last_run, status) VALUES ('repeat_orders', ?, ?, ?, ?, NOW(), 'success')",
        [JSON.stringify(resultData), startDate || null, endDate || null, filteredOrders.length]
    );

    await pool.query("INSERT INTO ai_usage_logs (request_type, model) VALUES ('repeat_analysis', ?)", [model]);

    return {
        id: result.insertId,
        data: resultData,
        orderCount: filteredOrders.length
    };
}
