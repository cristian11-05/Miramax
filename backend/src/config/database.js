import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Crear pool de conexiones a MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'miramax_cobranzas',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función helper para ejecutar queries
export const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const [rows] = await pool.execute(text, params);
        const duration = Date.now() - start;
        console.log('Query ejecutada', { text: text.substring(0, 50), duration, rows: rows.length || rows.affectedRows });
        return { rows };
    } catch (error) {
        console.error('Error en query:', error);
        throw error;
    }
};

// Función para obtener una conexión (para transacciones)
export const getClient = async () => {
    const connection = await pool.getConnection();

    const query = connection.execute.bind(connection);
    const release = connection.release.bind(connection);

    // Timeout para evitar conexiones colgadas
    const timeout = setTimeout(() => {
        console.error('Conexión no liberada después de 5 segundos');
    }, 5000);

    connection.release = () => {
        clearTimeout(timeout);
        release();
    };

    return connection;
};

export default pool;
