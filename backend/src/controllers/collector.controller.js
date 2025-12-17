import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Login de cobrador
export const collectorLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
        }

        // Buscar cobrador
        const result = await query(
            'SELECT * FROM collectors WHERE username = ?',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        const collector = result.rows[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, collector.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: collector.id, username: collector.username, role: 'collector' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            collector: {
                id: collector.id,
                fullName: collector.full_name,
                zone: collector.zone
            }
        });
    } catch (error) {
        console.error('Error en login de cobrador:', error);
        res.status(500).json({ error: 'Error en el servidor.' });
    }
};

// Obtener clientes asignados al cobrador
export const getAssignedClients = async (req, res) => {
    try {
        const collectorId = req.user.id;
        const { search } = req.query;

        let sql = `
      SELECT 
        c.id, c.dni, c.full_name, c.phone, c.second_phone,
        c.region, c.province, c.district, c.caserio, c.zone,
        c.address, c.contract_number, 
        c.plan_type, c.plan, c.internet_speed, c.cost,
        c.service_status,
        COALESCE(SUM(CASE WHEN d.status = 'pending' THEN d.amount ELSE 0 END), 0) as total_debt,
        COUNT(CASE WHEN d.status = 'pending' THEN 1 END) as pending_months
      FROM clients c
      LEFT JOIN debts d ON c.id = d.client_id
      WHERE c.collector_id = ?
    `;

        const params = [collectorId];

        if (search) {
            sql += ` AND (c.full_name LIKE ? OR c.dni LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ` GROUP BY c.id ORDER BY c.full_name ASC`;

        const result = await query(sql, params);

        res.json({ clients: result.rows });
    } catch (error) {
        console.error('Error al obtener clientes asignados:', error);
        res.status(500).json({ error: 'Error al obtener clientes asignados.' });
    }
};

// Obtener estadísticas del cobrador
export const getCollectorStats = async (req, res) => {
    try {
        const collectorId = req.user.id;

        // Total cobrado hoy
        const todayResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE collector_id = ? 
        AND DATE(payment_date) = CURDATE()
    `, [collectorId]);

        // Total cobrado en el mes
        const monthResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE collector_id = ? 
        AND YEAR(payment_date) = YEAR(CURDATE())
        AND MONTH(payment_date) = MONTH(CURDATE())
    `, [collectorId]);

        // Clientes visitados hoy
        const visitsResult = await query(`
      SELECT COUNT(DISTINCT client_id) as count
      FROM payments
      WHERE collector_id = ? 
        AND DATE(payment_date) = CURDATE()
    `, [collectorId]);

        res.json({
            todayTotal: parseFloat(todayResult.rows[0].total).toFixed(2),
            monthTotal: parseFloat(monthResult.rows[0].total).toFixed(2),
            todayVisits: parseInt(visitsResult.rows[0].count)
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas.' });
    }
};

// Placeholder funciones (implementar después)
export const registerFieldPayment = async (req, res) => {
    try {
        const collectorId = req.user.id;
        const { clientId, amount, paymentMethod, debtIds } = req.body; // debtIds array of ids to close

        if (!clientId || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Faltan datos del pago.' });
        }

        // 1. Registrar el Pago
        const result = await query(`
            INSERT INTO payments (
                client_id, collector_id, amount, payment_method, 
                payment_type, payment_date, verification_status
            ) VALUES (?, ?, ?, ?, 'cobro_campo', NOW(), 'verified')
        `, [clientId, collectorId, amount, paymentMethod]);

        const paymentId = result.rows.insertId;

        // 2. Actualizar estado de las deudas seleccionadas (si se enviaron)
        if (debtIds && Array.isArray(debtIds) && debtIds.length > 0) {
            // Convert array to CSV safely
            const idsPlaceholder = debtIds.map(() => '?').join(',');
            await query(`
                UPDATE debts 
                SET status = 'paid' 
                WHERE id IN (${idsPlaceholder}) AND client_id = ?
            `, [...debtIds, clientId]);
        }

        res.json({
            success: true,
            message: 'Cobro registrado exitosamente.',
            paymentId: paymentId
        });

    } catch (error) {
        console.error('Error al registrar cobro:', error);
        res.status(500).json({ error: 'Error al registrar el cobro: ' + error.message });
    }
};

export const sendReminder = async (req, res) => {
    res.status(501).json({ error: 'Funcionalidad no implementada aún.' });
};

export const getWhatsAppHistory = async (req, res) => {
    res.status(501).json({ error: 'Funcionalidad no implementada aún.' });
};
