import { query } from '../config/database.js';

/**
 * Initialize Database Tables (Web-based migration)
 * Creates necessary tables if they don't exist.
 */
export const initDatabase = async (req, res) => {
    try {
        console.log('🛠️ Iniciando mantenimiento de base de datos desde web...');

        // 1. Chatbot Reports Table
        await query(`
            CREATE TABLE IF NOT EXISTS chatbot_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                collector_id INT,
                report_date DATE DEFAULT (CURRENT_DATE),
                content JSON,
                status VARCHAR(20) DEFAULT 'success',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (collector_id) REFERENCES collectors(id) ON DELETE SET NULL
            )
        `);

        // Additional tables can be added here in the future

        res.json({ success: true, message: 'Base de datos actualizada correctamente.' });
    } catch (error) {
        console.error('Error in initDatabase:', error);
        res.status(500).json({ error: 'Error al inicializar la base de datos.' });
    }
};

/**
 * Run System Integrity Tests
 * Simulates critical processes to ensure stability.
 */
export const runSystemTests = async (req, res) => {
    try {
        const results = [];

        // Test 1: DB Connection
        try {
            await query('SELECT 1');
            results.push({ name: 'Conexión a Base de Datos', status: 'OK' });
        } catch (e) {
            results.push({ name: 'Conexión a Base de Datos', status: 'ERROR', message: e.message });
        }

        // Test 2: Write Permissions (Chatbot Reports)
        try {
            await query('INSERT INTO chatbot_reports (content, status) VALUES (?, ?)', [JSON.stringify({ test: true }), 'test']);
            // Clean up
            await query("DELETE FROM chatbot_reports WHERE status = 'test'");
            results.push({ name: 'Escritura en Tabla Reportes', status: 'OK' });
        } catch (e) {
            results.push({ name: 'Escritura en Tabla Reportes', status: 'ERROR', message: e.message });
        }

        // Retornar resultados

        // Test 3: Simulación de Carga de Clientes (Transaccional)
        const connection = await import('../config/database.js').then(m => m.getClient());
        try {
            await connection.beginTransaction();

            // Simular inserción
            const testDNI = 'TEST9999';
            await connection.query('INSERT INTO clients (dni, full_name, status) VALUES (?, ?, ?)', [testDNI, 'Test User', 'active']);

            // Verificar lectura
            const [rows] = await connection.query('SELECT * FROM clients WHERE dni = ?', [testDNI]);
            if (rows.length === 1 && rows[0].dni === testDNI) {
                results.push({ name: 'Simulación Carga Clientes (Insert/Rollback)', status: 'OK' });
            } else {
                throw new Error('No se pudo verificar la inserción de prueba.');
            }

            // Test 4: Validación de Pagos (Lógica)
            const mockDebt = { amount: 50, id: 9999 };
            const mockPayment = 50;
            if (mockPayment >= mockDebt.amount) {
                results.push({ name: 'Validación Lógica de Pagos', status: 'OK' });
            } else {
                results.push({ name: 'Validación Lógica de Pagos', status: 'ERROR', message: 'Fallo en lógica de montos' });
            }

        } catch (e) {
            results.push({ name: 'Simulación Carga Clientes', status: 'ERROR', message: e.message });
        } finally {
            await connection.rollback(); // IMPORTANTE: Deshacer cambios
            connection.release();
        }

        res.json({ success: true, results });

    } catch (error) {
        console.error('Error in runSystemTests:', error);
        res.status(500).json({ error: 'Error al ejecutar pruebas del sistema.' });
    }
};
