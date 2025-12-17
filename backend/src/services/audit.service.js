import { query } from '../config/database.js';

// Servicio para registrar acciones en el log de auditoría
export const logAction = async ({ userId, userType, action, entityType, entityId, oldValue, newValue, ipAddress }) => {
    try {
        await query(`
      INSERT INTO audit_logs (user_id, user_type, action, entity_type, entity_id, old_value, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            userId,
            userType,
            action,
            entityType || null,
            entityId || null,
            oldValue ? JSON.stringify(oldValue) : null,
            newValue ? JSON.stringify(newValue) : null,
            ipAddress || null
        ]);

        console.log(`✅ Audit log: ${userType} ${userId} - ${action}`);
    } catch (error) {
        console.error('❌ Error al guardar audit log:', error);
        // No detenemos la operación si falla el log
    }
};

// Servicio para obtener logs de auditoría con filtros
export const getAuditLogs = async ({ userType, entityType, startDate, endDate, limit = 100 }) => {
    try {
        let queryText = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];

        if (userType) {
            queryText += ' AND user_type = ?';
            params.push(userType);
        }

        if (entityType) {
            queryText += ' AND entity_type = ?';
            params.push(entityType);
        }

        if (startDate) {
            queryText += ' AND created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            queryText += ' AND created_at <= ?';
            params.push(endDate);
        }

        queryText += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const result = await query(queryText, params);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener audit logs:', error);
        throw error;
    }
};
