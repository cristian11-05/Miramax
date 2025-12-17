import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateReceiptPDF } from '../services/receipt.service.js';
import { saveWhatsAppMessage, generateReceiptWhatsAppMessage, generateRejectionWhatsAppMessage } from '../services/whatsapp.service.js';
const { sign } = jwt;

// ==================== AUTENTICACIÓN ====================

export const adminLogin = async (req, res) => {
    try {
        console.log('🔹 Login attempt:', req.body);
        const { username, password } = req.body;

        if (!username || !password) {
            console.log('❌ Missing credentials');
            return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
        }

        const result = await query(
            'SELECT * FROM admin_users WHERE username = ?',
            [username]
        );

        if (result.rows.length === 0) {
            console.log('❌ User not found:', username);
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        const admin = result.rows[0];
        console.log('✅ User found, verifying password...');

        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            console.log('❌ Password mismatch');
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }
        console.log('✅ Password verified!');

        const token = sign(
            { id: admin.id, username: admin.username, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            admin: {
                id: admin.id,
                fullName: admin.full_name,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Error en login de admin:', error);
        res.status(500).json({ error: 'Error en el servidor.' });
    }
};

// ==================== ESTADÍSTICAS DASHBOARD ====================

export const getDashboardStats = async (req, res) => {
    try {
        const clientsResult = await query('SELECT COUNT(*) as count FROM clients');
        const collectorsResult = await query('SELECT COUNT(*) as count FROM collectors');
        const pendingResult = await query(
            'SELECT COUNT(*) as count FROM payments WHERE verification_status = ?',
            ['pending']
        );

        res.json({
            totalClients: parseInt(clientsResult.rows[0].count),
            totalCollectors: parseInt(collectorsResult.rows[0].count),
            pendingPayments: parseInt(pendingResult.rows[0].count)
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas.' });
    }
};

// ==================== CLIENTES ====================

export const getAllClients = async (req, res) => {
    try {
        const result = await query('SELECT * FROM clients ORDER BY registration_date DESC LIMIT 100');
        res.json({ clients: result.rows });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error al obtener clientes.' });
    }
};

export const createClient = async (req, res) => {
    try {
        const {
            dni, fullName, phone, secondPhone,
            region, province, district, caserio, zone,
            address, contractNumber,
            planType, plan, internetSpeed, cost,
            startDate, paymentDay
        } = req.body;

        if (!dni || !fullName || !region) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (DNI, Nombre, Región).' });
        }

        // Asignación simple de zona basada en el input (o automática si fuese lógica compleja)
        const assignedZone = zone || caserio || district;

        // Intentar asignar un cobrador automáticamente basado en la zona
        let collectorId = null;
        if (assignedZone) {
            const collectors = await query("SELECT id FROM collectors WHERE zone LIKE ? LIMIT 1", [`%${assignedZone}%`]);
            if (collectors.rows.length > 0) {
                collectorId = collectors.rows[0].id;
            }
        }

        // Fallback to first active collector if no specific match
        if (!collectorId) {
            const anyCollector = await query("SELECT id FROM collectors WHERE status='active' LIMIT 1");
            if (anyCollector.rows.length > 0) collectorId = anyCollector.rows[0].id;
        }

        const insertMeta = await query(`
            INSERT INTO clients (
                dni, full_name, phone, second_phone,
                region, province, district, caserio, zone,
                address, contract_number,
                plan_type, plan, internet_speed, cost,
                start_date, payment_day, collector_id, service_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
            dni, fullName, phone || null, secondPhone || null,
            region || null, province || null, district || null, caserio || null, assignedZone || null,
            address || null, contractNumber || null,
            planType || 'INTERNET', plan || (planType === 'INTERNET' ? `Internet ${internetSpeed}` : 'Plan Básico'), internetSpeed || null, cost || 0,
            startDate || new Date(), paymentDay || 5, collectorId || null
        ]);

        const clientId = insertMeta.insertId || insertMeta.rows.insertId;

        // --- Generar Deuda del Mes (Opcional pero solicitado para pruebas) ---
        const currentDate = new Date();
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const currentMonthName = months[currentDate.getMonth()];

        await query(`
            INSERT INTO debts (client_id, month, year, amount, status, due_date)
            VALUES (?, ?, ?, ?, 'pending', DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY))
        `, [clientId, currentMonthName, currentDate.getFullYear(), cost]);

        res.json({ success: true, message: 'Cliente creado exitosamente (con deuda inicial generada).' });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El DNI ya está registrado.' });
        }
        res.status(500).json({ error: 'Error al crear cliente.' });
    }
};

export const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            dni, fullName, phone, secondPhone,
            region, province, district, caserio, zone,
            address, contractNumber,
            planType, plan, internetSpeed, cost,
            paymentDay, service_status
        } = req.body;

        await query(`
            UPDATE clients 
            SET 
                dni = ?, full_name = ?, phone = ?, second_phone = ?,
                region = ?, province = ?, district = ?, caserio = ?, zone = ?,
                address = ?, contract_number = ?,
                plan_type = ?, plan = ?, internet_speed = ?, cost = ?,
                payment_day = ?, service_status = COALESCE(?, service_status)
            WHERE id = ?
        `, [
            dni, fullName, phone, secondPhone || null,
            region || null, province || null, district || null, caserio || null, zone || null,
            address || null, contractNumber || null,
            planType || 'INTERNET', plan || null, internetSpeed || null, cost || 0,
            paymentDay || 5, service_status || null, id
        ]);

        res.json({ success: true, message: 'Cliente actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El DNI ya está registrado por otro cliente.' });
        }
        res.status(500).json({ error: 'Error al actualizar cliente: ' + error.message });
    }
};

export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM clients WHERE id = ?', [id]);
        res.json({ success: true, message: 'Cliente eliminado.' });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({ error: 'Error al eliminar cliente.' });
    }
};

// ==================== COBRADORES ====================

export const getAllCollectors = async (req, res) => {
    try {
        const sql = `
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM clients cl WHERE cl.collector_id = c.id) as assigned_clients,
                (SELECT COALESCE(SUM(amount), 0) FROM payments p WHERE p.collector_id = c.id AND MONTH(p.payment_date) = MONTH(CURRENT_DATE())) as month_collection
            FROM collectors c
            ORDER BY c.full_name ASC
        `;
        const result = await query(sql);
        res.json({ collectors: result.rows });
    } catch (error) {
        console.error('Error getting collectors:', error);
        res.status(500).json({ error: 'Error al obtener cobradores.' });
    }
};

export const createCollector = async (req, res) => {
    try {
        const { username, password, fullName, dni, phone, zone } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await query(
            'INSERT INTO collectors (username, password, full_name, dni, phone, zone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, fullName, dni, phone, zone, 'active']
        );

        res.json({ success: true, message: 'Cobrador creado.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Usuario o DNI ya existe.' });
        console.error(error);
        res.status(500).json({ error: 'Error al crear cobrador.' });
    }
};

export const updateCollector = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, phone, zone, status, password } = req.body;

        let sql = 'UPDATE collectors SET full_name = ?, phone = ?, zone = ?, status = ?';
        let params = [fullName, phone, zone, status];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            sql += ', password = ?';
            params.push(hashedPassword);
        }

        sql += ' WHERE id = ?';
        params.push(id);

        await query(sql, params);
        res.json({ success: true, message: 'Cobrador actualizado.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar cobrador.' });
    }
};

export const deleteCollector = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM collectors WHERE id = ?', [id]);
        res.json({ success: true, message: 'Cobrador eliminado.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar cobrador.' });
    }
};

// ==================== DEUDAS ====================

export const getAllDebts = async (req, res) => {
    try {
        const result = await query('SELECT * FROM debts ORDER BY created_at DESC LIMIT 100');
        res.json({ debts: result.rows });
    } catch (error) {
        console.error('Error al obtener deudas:', error);
        res.status(500).json({ error: 'Error al obtener deudas.' });
    }
};

export const createDebt = async (req, res) => {
    res.status(501).json({ error: 'Funcionalidad no implementada aún.' });
};

export const updateDebt = async (req, res) => {
    res.status(501).json({ error: 'Funcionalidad no implementada aún.' });
};

export const deleteDebt = async (req, res) => {
    res.status(501).json({ error: 'Funcionalidad no implementada aún.' });
};

// ==================== PAGOS ====================

export const getAllPayments = async (req, res) => {
    try {
        const result = await query('SELECT * FROM payments ORDER BY payment_date DESC LIMIT 100');
        res.json({ payments: result.rows });
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({ error: 'Error al obtener pagos.' });
    }
};

// ==================== VERIFICACIÓN DE PAGOS ====================

export const getPendingVerifications = async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                d.id as debt_id,
                d.amount,
                d.month,
                d.year,
                c.full_name as client_name,
                c.dni,
                c.phone
            FROM debts d
            JOIN clients c ON d.client_id = c.id
            WHERE d.status = 'in_review'
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener verificaciones:', error);
        res.status(500).json({ error: 'Error al obtener lista de verificación.' });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { id } = req.params; // debt_id

        // 1. Marcar deuda como pagada
        await query("UPDATE debts SET status = 'paid' WHERE id = ?", [id]);

        // 2. Obtener datos completos de la deuda y cliente
        const clientRes = await query(`
            SELECT 
                c.id as client_id,
                c.phone, 
                c.full_name, 
                c.dni,
                d.id as debt_id,
                d.amount, 
                d.month,
                d.year
            FROM debts d 
            JOIN clients c ON d.client_id = c.id 
            WHERE d.id = ?`, [id]);

        if (clientRes.rows.length === 0) {
            return res.status(404).json({ error: 'Deuda no encontrada' });
        }

        const clientData = clientRes.rows[0];

        // 3. Registrar el pago en la tabla payments (histórico)
        await query(
            "INSERT INTO payments (client_id, debt_id, amount, payment_method, payment_type, verification_status, payment_date, verified_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            [clientData.client_id, id, clientData.amount, 'yape', 'yape_verification', 'verified']
        );

        // 4. Generar mensaje de WhatsApp con instrucciones de boleta
        const whatsappData = generateReceiptWhatsAppMessage(clientData);

        // 5. Guardar mensaje en historial de WhatsApp
        try {
            await saveWhatsAppMessage({
                clientId: clientData.client_id,
                collectorId: null, // Admin verification
                messageType: 'payment_approved',
                messageContent: whatsappData.message
            });
        } catch (whatsappError) {
            console.error('Error al guardar mensaje WhatsApp:', whatsappError);
            // No bloqueamos la operación si falla el guardado del mensaje
        }

        res.json({
            success: true,
            message: 'Pago aprobado y deuda cancelada.',
            whatsappLink: whatsappData.whatsappUrl,
            clientName: clientData.full_name,
            clientDni: clientData.dni,
            amount: clientData.amount,
            month: clientData.month,
            year: clientData.year
        });
    } catch (error) {
        console.error('Error al verificar pago:', error);
        res.status(500).json({ error: 'Error interno.' });
    }
};

export const rejectPayment = async (req, res) => {
    try {
        const { id } = req.params; // debt_id
        const { reason } = req.body;

        // 1. Regresar deuda a estado 'pending'
        await query("UPDATE debts SET status = 'pending' WHERE id = ?", [id]);

        // 2. Obtener datos completos para mensaje de WhatsApp
        const result = await query(`
            SELECT 
                c.id as client_id,
                c.phone, 
                c.full_name, 
                c.dni,
                d.amount, 
                d.month,
                d.year
            FROM debts d 
            JOIN clients c ON d.client_id = c.id 
            WHERE d.id = ?`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Deuda no encontrada' });
        }

        const clientData = result.rows[0];

        // 3. Generar mensaje de WhatsApp con motivo de rechazo
        const whatsappData = generateRejectionWhatsAppMessage(clientData, reason);

        // 4. Guardar mensaje en historial de WhatsApp
        try {
            await saveWhatsAppMessage({
                clientId: clientData.client_id,
                collectorId: null, // Admin verification
                messageType: 'payment_rejected',
                messageContent: whatsappData.message + `\n\nMotivo: ${reason || 'No especificado'}`
            });
        } catch (whatsappError) {
            console.error('Error al guardar mensaje WhatsApp:', whatsappError);
            // No bloqueamos la operación si falla el guardado del mensaje
        }

        res.json({
            success: true,
            message: 'Pago rechazado.',
            whatsappLink: whatsappData.whatsappUrl,
            clientName: clientData.full_name,
            clientDni: clientData.dni,
            amount: clientData.amount,
            month: clientData.month,
            year: clientData.year,
            reason: reason || 'Comprobante no válido'
        });
    } catch (error) {
        console.error('Error al rechazar pago:', error);
        res.status(500).json({ error: 'Error interno.' });
    }
};

export const downloadReceipt = async (req, res) => {
    try {
        const { id } = req.params; // debt_id

        const result = await query(`
            SELECT 
                c.full_name as clientName,
                c.dni as clientDni,
                d.month,
                d.year,
                d.amount
            FROM debts d
            JOIN clients c ON d.client_id = c.id
            WHERE d.id = ?
        `, [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Deuda no encontrada' });

        const data = result.rows[0];
        generateReceiptPDF(data, res);
    } catch (error) {
        console.error('Error al generar boleta:', error);
        res.status(500).json({ error: 'Error al generar boleta' });
    }
};

// ==================== CONFIGURACIÓN ====================

export const getConfig = async (req, res) => {
    try {
        const result = await query('SELECT * FROM system_config');
        const config = {};
        result.rows.forEach(row => {
            config[row.config_key] = row.config_value;
        });
        res.json({ config });
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ error: 'Error al obtener configuración.' });
    }
};

export const updateConfig = async (req, res) => {
    try {
        const { yapeNumber } = req.body;

        await query(
            "INSERT INTO system_config (config_key, config_value) VALUES ('yape_number', ?) ON DUPLICATE KEY UPDATE config_value = ?",
            [yapeNumber, yapeNumber]
        );

        res.json({ success: true, message: 'Configuración actualizada.' });
    } catch (error) {
        console.error('Error al actualizar config:', error);
        res.status(500).json({ error: 'Error al actualizar configuración.' });
    }
};

export const uploadYapeQR = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo.' });
        }

        const filename = req.file.filename; // Asumiendo que upload.middleware ya guardó el archivo

        await query(
            "INSERT INTO system_config (config_key, config_value) VALUES ('yape_qr_url', ?) ON DUPLICATE KEY UPDATE config_value = ?",
            [filename, filename]
        );

        res.json({ success: true, message: 'QR actualizado.', file: filename });
    } catch (error) {
        console.error('Error al subir QR:', error);
        res.status(500).json({ error: 'Error al actualizar QR.' });
    }
};

// ==================== REPORTES ====================

export const getReports = async (req, res) => {
    try {
        const totalResult = await query('SELECT COALESCE(SUM(amount), 0) as total FROM payments');
        res.json({
            totalCollected: parseFloat(totalResult.rows[0].total).toFixed(2),
            collectorPerformance: [],
            pendingVerification: { count: 0, total: '0.00' }
        });
    } catch (error) {
        console.error('Error al generar reportes:', error);
        res.status(500).json({ error: 'Error al generar reportes.' });
    }
};
