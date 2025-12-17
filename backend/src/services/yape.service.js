import QRCode from 'qrcode';
import { query } from '../config/database.js';

// Generar QR de Yape con monto
export const generateYapeQR = async (phone, amount) => {
    try {
        // Formato para Yape QR: yape://pay?phone=51999999999&amount=50.00
        const yapeData = `yape://pay?phone=${phone}&amount=${amount.toFixed(2)}`;

        // Generar QR code como Data URL (base64)
        const qrDataURL = await QRCode.toDataURL(yapeData, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 2
        });

        return qrDataURL;
    } catch (error) {
        console.error('Error al generar QR de Yape:', error);
        throw error;
    }
};

// Obtener configuración de Yape (número y QR personalizado)
export const getYapeConfig = async () => {
    try {
        // En MySQL IN (?) funciona si pasamos múltiples valores o usamos string join,
        // pero mejor hardcodear valores seguros o usar OR
        const results = await query(`
      SELECT config_key, config_value
      FROM system_config
      WHERE config_key IN ('yape_number', 'yape_qr_url')
    `);

        const config = {};
        results.rows.forEach(row => {
            config[row.config_key] = row.config_value;
        });

        return {
            yapeNumber: config.yape_number || '',
            customQRUrl: config.yape_qr_url || null
        };
    } catch (error) {
        console.error('Error al obtener configuración de Yape:', error);
        throw error;
    }
};

// Actualizar QR personalizado de Yape
export const updateYapeQR = async (qrUrl) => {
    try {
        // MySQL usa ON DUPLICATE KEY UPDATE en lugar de ON CONFLICT
        await query(`
      INSERT INTO system_config (config_key, config_value)
      VALUES ('yape_qr_url', ?)
      ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = CURRENT_TIMESTAMP
    `, [qrUrl]);

        return { success: true };
    } catch (error) {
        console.error('Error al actualizar QR de Yape:', error);
        throw error;
    }
};

// Actualizar número de Yape
export const updateYapeNumber = async (phone) => {
    try {
        await query(`
      INSERT INTO system_config (config_key, config_value)
      VALUES ('yape_number', ?)
      ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = CURRENT_TIMESTAMP
    `, [phone]);

        return { success: true };
    } catch (error) {
        console.error('Error al actualizar número de Yape:', error);
        throw error;
    }
};
