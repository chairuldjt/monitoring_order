import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
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

async function initDatabase() {
    console.log('🚀 Starting database initialization (Live View Mode)...\n');

    // Connect without database to create it if needed
    const connection = await mysql.createConnection({
        host: MYSQL_HOST,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD || '',
    });

    console.log(`📦 Creating database "${MYSQL_DATABASE}" if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${MYSQL_DATABASE}\``);

    // ================================
    // TABLE: users
    // ================================
    console.log('📋 Creating table: users');
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
            profile_image TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ================================
    // CLEANUP: Drop local orders tables (As requested: Live only)
    // ================================
    console.log('🗑️  Dropping local orders tables (data now live from SIMRS)...');
    await connection.query(`DROP TABLE IF EXISTS notifications`);
    await connection.query(`DROP TABLE IF EXISTS order_status_history`);
    await connection.query(`DROP TABLE IF EXISTS orders`);
    await connection.query(`DROP TABLE IF EXISTS sync_logs`);

    // ================================
    // SEED: Default admin user
    // ================================
    console.log('\n👤 Seeding default admin user...');
    const [existingAdmin]: any = await connection.query(
        'SELECT id FROM users WHERE username = ?', ['admin']
    );

    if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.query(
            `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
            ['admin', 'admin@monitoring.local', hashedPassword, 'admin']
        );
        console.log('   ✅ Admin user created (username: admin, password: admin123)');
    } else {
        console.log('   ⏭️  Admin user already exists, skipping...');
    }

    await connection.end();
    console.log('\n✅ Database initialization complete!');
    console.log('   Mode: LIVE VIEW (No local orders storage)');
    console.log('   Database:', MYSQL_DATABASE);
    console.log('   Tables: users');
}

initDatabase().catch(err => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
});
