import dotenv from 'dotenv';
import path from 'path';

// Load env FIRST
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function runTask(id: number) {
    // Dynamic import to ensure pool is initialized AFTER dotenv
    const { default: pool } = await import('../lib/db');
    const { processAIAnalysis } = await import('../lib/ai-handler');
    const fs = await import('fs');
    const path = await import('path');

    console.log(`[Manual Process] Starting task #${id}`);

    try {
        const [rows]: any = await pool.query(
            "SELECT * FROM ai_assistant_requests WHERE id = ?", [id]
        );

        if (rows.length === 0) {
            console.error(`Task #${id} not found`);
            return;
        }

        const task = rows[0];
        console.log(`[Manual Process] Task found: ${task.start_date} to ${task.end_date}`);

        // Try to load raw data
        let providedOrders: any[] | undefined = undefined;
        let usedFile = 'NONE';
        const scriptsDir = path.join(process.cwd(), 'scripts');

        // Find latest date-stamped file
        const files = fs.readdirSync(scriptsDir)
            .filter(f => f.startsWith('raw_data_') && f.endsWith('.json'))
            .sort((a, b) => b.localeCompare(a)); // Sort descending (latest date first)

        const latestDateFile = files[0] ? path.join(scriptsDir, files[0]) : null;
        const legacyPath = path.join(scriptsDir, 'raw_data.json');

        if (latestDateFile && fs.existsSync(latestDateFile)) {
            console.log(`[Manual Process] Latest snapshot found: ${files[0]}. Reading...`);
            providedOrders = JSON.parse(fs.readFileSync(latestDateFile, 'utf8'));
            usedFile = files[0];
        } else if (fs.existsSync(legacyPath)) {
            console.log(`[Manual Process] Falling back to legacy raw_data.json. Reading...`);
            providedOrders = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
            usedFile = 'raw_data.json';
        }

        if (providedOrders) {
            console.log(`[Manual Process] Successfully loaded ${providedOrders.length} orders from ${usedFile}`);
        } else {
            console.log(`[Manual Process] NO raw data files found in scripts/. Will attempt API fetch.`);
        }

        await pool.query("UPDATE ai_assistant_requests SET status = 'executing' WHERE id = ?", [id]);

        const model = process.argv[3] || 'gemini-1.5-flash-latest';

        const result = await processAIAnalysis(
            task.start_date instanceof Date ? task.start_date.toISOString().split('T')[0] : task.start_date,
            task.end_date instanceof Date ? task.end_date.toISOString().split('T')[0] : task.end_date,
            model,
            providedOrders
        );

        await pool.query("UPDATE ai_assistant_requests SET status = 'success' WHERE id = ?", [id]);
        console.log(`[Manual Process] Task #${id} SUCCESS. New Analysis ID: ${result.id}`);

    } catch (err: any) {
        console.error(`[Manual Process] Task #${id} FAILED:`, err.message);
        await pool.query("UPDATE ai_assistant_requests SET status = 'error' WHERE id = ?", [id]);
    } finally {
        await pool.end();
    }
}

const argId = process.argv[2];
const taskId = argId ? Number(argId) : 3;

if (isNaN(taskId)) {
    console.error("Usage: npx tsx scripts/process-manual-task.ts <taskId>");
    process.exit(1);
}

runTask(taskId).catch(console.error);
