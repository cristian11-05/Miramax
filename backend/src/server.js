import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Rutas
import clientRoutes from './routes/client.routes.js';
import collectorRoutes from './routes/collector.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// CORS
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4173',
        'https://miramax-frontend-eovh.onrender.com', // Production Frontend
        /https:\/\/miramax-clientes.*\.onrender\.com$/,
        /https:\/\/miramax-staff.*\.onrender\.com$/
    ],
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==================== RUTAS ====================

app.get('/', (req, res) => {
    res.json({
        message: '🚀 API de Cobranzas MIRAMAX',
        version: '1.0.0',
        endpoints: {
            client: '/api/client',
            collector: '/api/collector',
            admin: '/api/admin'
        }
    });
});

// Rutas de la API
app.use('/api/client', clientRoutes);
app.use('/api/collector', collectorRoutes);
app.use('/api/admin', adminRoutes);

// ==================== MANEJO DE ERRORES ====================

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Error handler global
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es muy grande. Máximo 5MB.' });
        }
        return res.status(400).json({ error: 'Error al subir archivo.' });
    }

    res.status(500).json({
        error: 'Error interno del servidor.',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==================== INICIO DEL SERVIDOR ====================

import pool from './config/database.js';

app.listen(PORT, async () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║   🌐 MIRAMAX Collections API         ║
  ║   ⚡ Servidor iniciado correctamente  ║
  ╠═══════════════════════════════════════╣
  ║   📍 URL: http://localhost:${PORT}      ║
  ║   🔧 Entorno: ${process.env.NODE_ENV || 'development'}      ║
  ╚═══════════════════════════════════════╝
  `);

    // Probar conexión a la base de datos al iniciar
    try {
        console.log('🔄 Probando conexión a la base de datos...');
        const [rows] = await pool.query('SELECT 1 as connection_test');
        console.log('✅ Base de datos conectada exitosamente:', rows);
    } catch (err) {
        console.error('❌ ERROR CRÍTICO: No se pudo conectar a la base de datos');
        console.error('Detalles:', {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            ssl: process.env.DB_SSL,
            error: err.message,
            code: err.code
        });
        console.error('CONSEJO: Verifica que el IP de Render esté permitido en el Firewall de Aiven (o permite 0.0.0.0/0).');
    }
});

export default app;
