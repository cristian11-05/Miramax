import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'miramax_cobranzas',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
});

async function seed() {
    try {
        console.log('🌱 Sembrando datos de prueba...');

        // 1. Cobrador
        const passwordHash = await bcrypt.hash('cobrador123', 10);
        await pool.query(`
            INSERT INTO collectors (username, password, full_name, dni, phone, zone, status)
            VALUES ('cobrador', ?, 'Juan Pérez', '87654321', '987654321', 'Zona Norte', 'active')
            ON DUPLICATE KEY UPDATE password = VALUES(password)
        `, [passwordHash]);
        console.log('✅ Cobrador creado (cobrador/cobrador123)');

        // 2. Obtener ID
        const [rows] = await pool.query("SELECT id FROM collectors WHERE username = 'cobrador'");
        const collectorId = rows[0].id;

        // 3. Cliente
        await pool.query(`
            INSERT INTO clients (dni, full_name, phone, address, caserio, start_date, payment_day, plan, cost, service_status, collector_id)
            VALUES ('12345678', 'María López', '912345678', 'Av. Principal 123', 'Caserío Central', CURDATE(), 5, '30 Megas', 50.00, 'active', ?)
            ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)
        `, [collectorId]);
        console.log('✅ Cliente creado (DNI: 12345678)');

        // 4. Obtener ID Cliente
        const [clientRows] = await pool.query("SELECT id FROM clients WHERE dni = '12345678'");
        const clientId = clientRows[0].id;

        // 5. Deuda
        await pool.query(`
            INSERT INTO debts (client_id, amount, month, year, status, due_date)
            VALUES (?, 50.00, 'Diciembre', 2025, 'pending', DATE_ADD(CURDATE(), INTERVAL 5 DAY))
            ON DUPLICATE KEY UPDATE amount = VALUES(amount)
        `, [clientId]);
        console.log('✅ Deuda creada');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seed();
