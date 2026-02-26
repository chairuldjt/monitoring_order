import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Check for follow_up orders older than 1 day
        const [followUpOverdue]: any = await pool.query(`
      SELECT o.id, o.order_no, o.title, o.requester_name, o.updated_at
      FROM orders o
      WHERE o.status = 'follow_up'
      AND o.updated_at < DATE_SUB(NOW(), INTERVAL 1 DAY)
    `);

        for (const order of followUpOverdue) {
            // Check if notification already exists for this order today
            const [existing]: any = await pool.query(
                `SELECT id FROM notifications WHERE order_id = ? AND type = 'follow_up_overdue' AND DATE(created_at) = CURDATE()`,
                [order.id]
            );
            if (existing.length === 0) {
                await pool.query(
                    `INSERT INTO notifications (user_id, title, message, type, order_id)
           VALUES (NULL, ?, ?, 'follow_up_overdue', ?)`,
                    [
                        `Follow-up Terlambat: ${order.order_no}`,
                        `Order "${order.title}" dari ${order.requester_name} sudah lebih dari 1 hari dalam status follow-up.`,
                        order.id
                    ]
                );
            }
        }

        // Check for pending orders older than 1 month
        const [pendingOverdue]: any = await pool.query(`
      SELECT o.id, o.order_no, o.title, o.requester_name, o.updated_at
      FROM orders o
      WHERE o.status = 'pending'
      AND o.updated_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)
    `);

        for (const order of pendingOverdue) {
            const [existing]: any = await pool.query(
                `SELECT id FROM notifications WHERE order_id = ? AND type = 'pending_overdue' AND DATE(created_at) = CURDATE()`,
                [order.id]
            );
            if (existing.length === 0) {
                await pool.query(
                    `INSERT INTO notifications (user_id, title, message, type, order_id)
           VALUES (NULL, ?, ?, 'pending_overdue', ?)`,
                    [
                        `Pending Terlalu Lama: ${order.order_no}`,
                        `Order "${order.title}" dari ${order.requester_name} sudah lebih dari 1 bulan dalam status pending!`,
                        order.id
                    ]
                );
            }
        }

        return NextResponse.json({
            message: 'Check completed',
            followUpOverdue: followUpOverdue.length,
            pendingOverdue: pendingOverdue.length,
        });
    } catch (error) {
        console.error('Notification check error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
