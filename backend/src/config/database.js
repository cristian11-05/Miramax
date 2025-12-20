import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de conexión flexible
const connectionConfig = process.env.DATABASE_URL
    ? { uri: process.env.DATABASE_URL.trim() }
    : {
        host: (process.env.DB_HOST || '').trim(),
        port: parseInt(process.env.DB_PORT || '3306', 10),
        database: (process.env.DB_NAME || '').trim(),
        user: (process.env.DB_USER || '').trim(),
        password: (process.env.DB_PASSWORD || '').trim(),
    };

const DB_SSL = (process.env.DB_SSL || 'false').trim().toLowerCase() === 'true';

// Crear pool de conexiones a MySQL
const pool = mysql.createPool({
    ...connectionConfig,
    ssl: DB_SSL ? { rejectUnauthorized: false } : undefined,
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
