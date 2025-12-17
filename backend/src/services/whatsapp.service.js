import { query } from '../config/database.js';

// Servicio para registrar mensajes de WhatsApp enviados
export const saveWhatsAppMessage = async ({ clientId, collectorId, messageType, messageContent }) => {
    try {
        // En MySQL INSERT no retorna datos por defecto, hay que hacer SELECT después o usar insertId
        const result = await query(`
      INSERT INTO whatsapp_history (client_id, collector_id, message_type, message_content)
      VALUES (?, ?, ?, ?)
    `, [clientId, collectorId || null, messageType, messageContent]);

        console.log(`📱 WhatsApp mensaje guardado: ${messageType} para client ${clientId}`);
        return { id: result.rows.insertId, clientId, collectorId, messageType, messageContent };
    } catch (error) {
        console.error('Error al guardar mensaje WhatsApp:', error);
        throw error;
    }
};

// Generar URL de WhatsApp con mensaje predeterminado
export const generateWhatsAppURL = (phone, message) => {
    const formattedPhone = phone.startsWith('51') ? phone : `51${phone}`;
    const encodedMessage = encodeURIComponent(message);
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
};

// Obtener template de mensaje y reemplazar variables
export const getMessageTemplate = async (templateKey, variables = {}) => {
    try {
        const result = await query(
            'SELECT config_value FROM system_config WHERE config_key = ?',
            [templateKey]
        );

        if (result.rows.length === 0) {
            throw new Error(`Template ${templateKey} no encontrado`);
        }

        let template = result.rows[0].config_value;

        // Reemplazar variables en el template
        Object.keys(variables).forEach(key => {
            template = template.replace(`{${key}}`, variables[key]);
        });

        return template;
    } catch (error) {
        console.error('Error al obtener template:', error);
        throw error;
    }
};

// Obtener historial de WhatsApp para un cliente
export const getClientWhatsAppHistory = async (clientId, limit = 50) => {
    try {
        const result = await query(`
      SELECT wh.*, c.full_name as collector_name
      FROM whatsapp_history wh
      LEFT JOIN collectors c ON wh.collector_id = c.id
      WHERE wh.client_id = ?
      ORDER BY wh.sent_at DESC
      LIMIT ?
    `, [clientId, parseInt(limit)]);

        return result.rows;
    } catch (error) {
        console.error('Error al obtener historial WhatsApp:', error);
        throw error;
    }
};

// Obtener historial de WhatsApp para un cobrador
export const getCollectorWhatsAppHistory = async (collectorId, limit = 100) => {
    try {
        const result = await query(`
      SELECT wh.*, cl.full_name as client_name, cl.dni
      FROM whatsapp_history wh
      LEFT JOIN clients cl ON wh.client_id = cl.id
      WHERE wh.collector_id = ?
      ORDER BY wh.sent_at DESC
      LIMIT ?
    `, [collectorId, parseInt(limit)]);

        return result.rows;
    } catch (error) {
        console.error('Error al obtener historial WhatsApp del cobrador:', error);
        throw error;
    }
};

// Generar mensaje de WhatsApp para pago aprobado con instrucciones de boleta
export const generateReceiptWhatsAppMessage = (clientData) => {
    const { full_name, phone, amount, month, year } = clientData;

    const message = `✅ *PAGO APROBADO - MIRAMAX*

Hola ${full_name},

Confirmamos la recepción de tu pago de *S/ ${parseFloat(amount).toFixed(2)}* correspondiente a *${month} ${year}*.

📄 *Tu boleta de pago está lista*
Por favor descarga tu boleta adjunta en este mensaje.

✨ Gracias por tu puntualidad y preferencia.

_MIRAMAX Telecomunicaciones_
RUC: 10407658864`;

    // Limpiar y formatear teléfono
    let cleanPhone = phone?.replace(/\D/g, '') || '';
    if (cleanPhone.startsWith('51') && cleanPhone.length > 9) {
        cleanPhone = cleanPhone.substring(2);
    }

    const whatsappUrl = cleanPhone ? `https://wa.me/51${cleanPhone}?text=${encodeURIComponent(message)}` : '';

    return {
        message,
        whatsappUrl,
        phone: cleanPhone
    };
};

// Generar mensaje de WhatsApp para pago rechazado
export const generateRejectionWhatsAppMessage = (clientData, reason) => {
    const { full_name, phone, amount, month, year } = clientData;

    const message = `❌ *PAGO RECHAZADO - MIRAMAX*

Hola ${full_name},

Tu reporte de pago de *S/ ${parseFloat(amount).toFixed(2)}* correspondiente a *${month} ${year}* ha sido rechazado.

📋 *Motivo:* ${reason || 'Comprobante no válido o ilegible'}

🔄 *Próximos pasos:*
1. Verifica que el comprobante sea claro y legible
2. Asegúrate de que el monto coincida
3. Vuelve a enviar tu comprobante desde el portal

Para cualquier consulta, estamos a tu disposición.

_MIRAMAX Telecomunicaciones_
RUC: 10407658864`;

    // Limpiar y formatear teléfono
    let cleanPhone = phone?.replace(/\D/g, '') || '';
    if (cleanPhone.startsWith('51') && cleanPhone.length > 9) {
        cleanPhone = cleanPhone.substring(2);
    }

    const whatsappUrl = cleanPhone ? `https://wa.me/51${cleanPhone}?text=${encodeURIComponent(message)}` : '';

    return {
        message,
        whatsappUrl,
        phone: cleanPhone
    };
};
