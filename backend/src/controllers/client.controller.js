import { query } from '../config/database.js';

// Consultar deuda por DNI (público)
export const checkDebt = async (req, res) => {
    try {
        const { dni } = req.params;

        if (!dni || dni.length !== 8) {
            return res.status(400).json({ error: 'DNI inválido.' });
        }

        // Buscar cliente
        const clientResult = await query(
            'SELECT * FROM clients WHERE dni = ?',
            [dni]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }

        const client = clientResult.rows[0];

        // Obtener deudas pendientes
        const debtsResult = await query(
            'SELECT * FROM debts WHERE client_id = ? AND status = ? ORDER BY year DESC, month DESC',
            [client.id, 'pending']
        );

        // Obtener último pago
        const lastPaymentResult = await query(
            'SELECT payment_date FROM payments WHERE client_id = ? ORDER BY payment_date DESC LIMIT 1',
            [client.id]
        );
        const lastPayment = lastPaymentResult.rows.length > 0 ? lastPaymentResult.rows[0].payment_date : null;

        // Calculate total debt (Fixing undefined error)
        const totalDebt = debtsResult.rows.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);

        res.json({
            client: {
                dni: client.dni,
                fullName: client.full_name,
                phone: client.phone,
                address: client.address,
                caserio: client.caserio,
                contractNumber: client.contract_number,
                plan: client.plan,
                serviceStatus: client.service_status
            },
            pendingDebts: debtsResult.rows.map(d => ({
                id: d.id,
                month: d.month,
                year: d.year,
                amount: parseFloat(d.amount),
                dueDate: d.due_date
            })),
            totalDebt: totalDebt.toFixed(2),
            lastPayment: lastPayment
        });
    } catch (error) {
        console.error('Error al consultar deuda:', error);
        res.status(500).json({ error: 'Error al consultar deuda.' });
    }
};

// Obtener información de Yape
export const getYapeInfo = async (req, res) => {
    try {
        const result = await query(
            'SELECT config_value FROM system_config WHERE config_key = ?',
            ['yape_number']
        );

        const yapeNumber = result.rows.length > 0 ? result.rows[0].config_value : '999999999';

        res.json({
            yapeNumber: '', // No longer using number for Yape as per request
            qrUrl: '/images/qryape.png' // New static QR
        });
    } catch (error) {
        console.error('Error al obtener info de Yape:', error);
        res.status(500).json({ error: 'Error al obtener información de Yape.' });
    }
};

// Registrar pago de cliente
export const registerPayment = async (req, res) => {
    try {
        const { dni, amount, paymentMethod } = req.body;

        if (!dni || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Datos incompletos.' });
        }

        // Buscar cliente
        const clientResult = await query(
            'SELECT id FROM clients WHERE dni = ?',
            [dni]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }

        const clientId = clientResult.rows[0].id;

        // Registrar pago
        const result = await query(`
      INSERT INTO payments (client_id, amount, payment_method, payment_type, verification_status)
      VALUES (?, ?, ?, 'cliente', 'pending')
    `, [clientId, amount, paymentMethod]);

        // En MySQL, result.rows no contiene el registro insertado, necesitamos obtenerlo
        const paymentId = result.rows.insertId;

        res.json({
            success: true,
            paymentId: paymentId,
            message: 'Pago registrado exitosamente. Pendiente de verificación.'
        });
    } catch (error) {
        console.error('Error al registrar pago:', error);
        res.status(500).json({ error: 'Error al registrar pago.' });
    }
};

// Placeholder funciones (implementar después)
// Subir voucher de pago
export const uploadVoucher = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }

        const { paymentId } = req.body;
        if (!paymentId) {
            // Si no hay paymentId, podríamos crear el pago aquí, pero asumiremos que el frontend lo envía
            // Opcional: Eliminar archivo si no hay ID
            return res.status(400).json({ error: 'Falta el ID del pago.' });
        }

        const filename = req.file.filename;

        // Actualizar el pago con la URL del voucher
        await query(
            'UPDATE payments SET voucher_url = ?, verification_status = ? WHERE id = ?',
            [filename, 'pending', paymentId]
        );

        res.json({
            success: true,
            message: 'Comprobante subido exitosamente.',
            file: filename
        });
    } catch (error) {
        console.error('Error al subir voucher:', error);
        res.status(500).json({ error: 'Error al subir el comprobante.' });
    }
};

export const getWhatsAppURL = async (req, res) => {
    try {
        const { dni } = req.query;
        if (!dni) return res.status(400).json({ error: 'DNI requerido.' });

        // Obtener datos del cliente y deuda
        const clientResult = await query('SELECT * FROM clients WHERE dni = ?', [dni]);
        if (clientResult.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado.' });

        const client = clientResult.rows[0];

        // Calcular deuda total
        const debtsResult = await query(
            "SELECT * FROM debts WHERE client_id = ? AND status IN ('pending', 'in_review')",
            [client.id]
        );
        const totalDebt = debtsResult.rows.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2);

        // Obtener número de WhatsApp del sistema (o usar uno fijo si no está en config)
        // const configRes = await query("SELECT config_value FROM system_config WHERE config_key = 'yape_number'");
        // const systemPhone = configRes.rows.length > 0 ? configRes.rows[0].config_value : '918 762 620';

        // FORCING NUMBER AS PER REQUEST
        // FORCING NUMBER AS PER REQUEST
        const systemPhone = '994371164';

        // Construir mensaje
        // Construir mensaje detallado
        const message = `
*HOLA, ADJUNTO MI COMPROBANTE DE PAGO* 📸

👤 *Cliente:* ${client.full_name}
🆔 *DNI:* ${client.dni}
📍 *Dirección:* ${client.address} (${client.caserio} - ${client.district})
📡 *Plan:* ${client.plan}
💰 *Monto a Pagar:* S/ ${totalDebt}

⚠️ *Por favor, confirmar recepción y validar mi pago.*
        `.trim();

        // Limpiar número y quitar prefijo 51 si ya lo tiene para evitar duplicado
        let cleanPhone = systemPhone.replace(/\D/g, '');
        if (cleanPhone.startsWith('51') && cleanPhone.length > 9) {
            cleanPhone = cleanPhone.substring(2);
        }

        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/51${cleanPhone}?text=${encodedMessage}`;

        res.json({ whatsappURL });

    } catch (error) {
        console.error('Error generando link de WhatsApp:', error);
        res.status(500).json({ error: 'Error al generar enlace.' });
    }
};

// Reportar pago (Cliente avisa que ya pagó)
export const reportPayment = async (req, res) => {
    try {
        const { dni, debtIds } = req.body;

        // Validar que existan deudas seleccionadas
        if (!debtIds || debtIds.length === 0) {
            return res.status(400).json({ error: 'No se especificaron deudas.' });
        }

        // Update status to 'in_review'
        // FIX: pool.execute does not support IN (?) with array, we must expand it
        const placeholders = debtIds.map(() => '?').join(',');

        await query(
            `UPDATE debts SET status = 'in_review' WHERE id IN (${placeholders}) AND status = 'pending'`,
            debtIds
        );

        res.json({ success: true, message: 'Pago reportado. Esperando verificación del administrador.' });
    } catch (error) {
        console.error('Error reportando pago:', error);
        res.status(500).json({ error: error.message || 'Error al reportar el pago.' });
    }
};

export const checkPaymentStatus = async (req, res) => {
    try {
        const { dni } = req.query;
        // Buscar si tiene deudas en revisión
        // Primero obtener ID del cliente
        const clientRes = await query('SELECT id FROM clients WHERE dni = ?', [dni]);
        if (clientRes.rows.length === 0) return res.json({ status: 'unknown' });

        const clientId = clientRes.rows[0].id;

        const reviewRes = await query(
            "SELECT COUNT(*) as count FROM debts WHERE client_id = ? AND status = 'in_review'",
            [clientId]
        );

        if (reviewRes.rows[0].count > 0) {
            return res.json({ status: 'in_review' });
        }

        res.json({ status: 'clean' }); // O tiene pendientes o no tiene nada, pero no está en revisión
    } catch (error) {
        res.status(500).json({ error: 'Error.' });
    }
};
