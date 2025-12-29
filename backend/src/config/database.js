import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de conexión flexible y robusta
let pool;

if (process.env.DATABASE_URL) {
    // Si hay una URL completa, la usamos directamente (es lo más seguro para Aiven)
    const dbUri = process.env.DATABASE_URL.trim();
    console.log('🔗 Usando DATABASE_URL para la conexión');
    pool = mysql.createPool(dbUri);
} else {
    // Si no, usamos campos individuales
    const host = (process.env.DB_HOST || '').trim();
    const user = (process.env.DB_USER || '').trim();
    const pass = (process.env.DB_PASSWORD || '').trim();
    const name = (process.env.DB_NAME || '').trim();
    const port = parseInt(process.env.DB_PORT || '16851', 10);
    const ssl = (process.env.DB_SSL || 'false').trim().toLowerCase() === 'true';

    console.log(`🔗 Conectando a ${host}:${port} (SSL: ${ssl})`);

    pool = mysql.createPool({
        host: host || 'localhost',
        port: port,
        user: user || 'avnadmin',
        password: pass,
        database: name || 'defaultdb',
        ssl: ssl ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
}

// Función helper para ejecutar queries
export const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const [rows] = await pool.query(text, params);
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

export { pool };
export default pool;
