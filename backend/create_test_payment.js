import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'miramax_cobranzas',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
});

async function createTestPayment() {
    try {
        console.log('🔄 Creando pago de prueba en estado "in_review"...');

        // Obtener un cliente existente
        const [clients] = await pool.query("SELECT id, full_name FROM clients LIMIT 1");

        if (clients.length === 0) {
            console.log('❌ No hay clientes. Ejecuta seed_data.js primero.');
            process.exit(1);
        }

        const clientId = clients[0].id;
        console.log(`✅ Cliente encontrado: ${clients[0].full_name} (ID: ${clientId})`);

        // Crear una deuda en estado "in_review"
        await pool.query(`
            INSERT INTO debts (client_id, amount, month, year, status, due_date)
            VALUES (?, 75.00, 'Diciembre', 2025, 'in_review', CURDATE())
        `, [clientId]);

        console.log('✅ Deuda creada en estado "in_review"');
        console.log('✅ Ahora puedes probar la verificación de pagos!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestPayment();
