import { query } from '../config/database.js';
import { processCollectorQuery } from '../services/groq.service.js';

// Interactuar con el Chatbot (IA)
export const chatWithAssistant = async (req, res) => {
    try {
        const { query: userQuery } = req.body;
        const { id: userId, role } = req.user; // From JWT middleware

        if (!userQuery) {
            return res.status(400).json({ error: 'La consulta es requerida.' });
        }

        const response = await processCollectorQuery(userId, userQuery, role);

        // Guardar interacción (opcional)
        // await saveInteractionLog(...)

        res.json(response);

    } catch (error) {
        console.error('Error en chat chatbot:', error);
        res.status(500).json({ error: 'Error interno del asistente.' });
    }
};

// Guardar un reporte generado por el chatbot
export const saveReport = async (req, res) => {
    try {
        const { collectorId, content, status } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'El contenido del reporte es obligatorio.' });
        }

        await query(
            'INSERT INTO chatbot_reports (collector_id, content, status) VALUES (?, ?, ?)',
            [collectorId || null, JSON.stringify(content), status || 'success']
        );

        res.json({ success: true, message: 'Reporte guardado exitosamente.' });
    } catch (error) {
        console.error('Error al guardar reporte:', error);
        res.status(500).json({ error: 'Error al guardar reporte.' });
    }
};

// Obtener reportes (para admin o cobrador)
export const getChatbotReports = async (req, res) => {
    try {
        const { collectorId, date } = req.query;
        let sql = `
            SELECT r.*, c.full_name as collector_name 
            FROM chatbot_reports r
            LEFT JOIN collectors c ON r.collector_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (collectorId) {
            sql += ' AND r.collector_id = ?';
            params.push(collectorId);
        }

        if (date) {
            sql += ' AND r.report_date = ?';
            params.push(date);
        }

        sql += ' ORDER BY r.created_at DESC LIMIT 50';

        const result = await query(sql, params);
        res.json({ reports: result.rows });
    } catch (error) {
        console.error('Error al obtener reportes:', error);
        res.status(500).json({ error: 'Error al obtener reportes.' });
    }
};
