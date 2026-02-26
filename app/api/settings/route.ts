import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getPayloadFromCookie } from '@/lib/jwt';

export async function GET() {
    try {
        const payload = await getPayloadFromCookie();
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [rows]: any = await pool.query('SELECT setting_key, setting_value FROM settings');
        const settings: Record<string, any> = {};
        rows.forEach((row: any) => {
            settings[row.setting_key] = row.setting_value;
        });

        // Get Today's AI Usage
        const [usage]: any = await pool.query(
            "SELECT COUNT(*) as count FROM ai_usage_logs WHERE created_at >= CURDATE()"
        );
        settings.ai_usage_today = usage[0]?.count || 0;
        settings.ai_usage_limit = 1500; // Gemini Free Tier Default approx per day for 1.5 flash

        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const payload = await getPayloadFromCookie();
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { settings } = body;

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
        }

        for (const [key, value] of Object.entries(settings)) {
            await pool.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, value, value]
            );
        }

        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
