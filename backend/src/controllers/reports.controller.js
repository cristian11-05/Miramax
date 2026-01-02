import { query } from '../config/database.js';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';

/**
 * Get aggregated earnings reports: Daily, Monthly, and Annual
 */
export const getEarningsStats = async (req, res) => {
    try {
        // 1. Daily Earnings (Last 30 days)
        const dailyResult = await query(`
            SELECT 
                DATE(payment_date) as date,
                SUM(amount) as total
            FROM payments
            WHERE verification_status = 'verified'
              AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(payment_date)
            ORDER BY date ASC
        `);

        // 2. Monthly Earnings (Last 12 months)
        const monthlyResult = await query(`
            SELECT 
                DATE_FORMAT(payment_date, '%Y-%m') as month,
                SUM(amount) as total
            FROM payments
            WHERE verification_status = 'verified'
              AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `);

        // 3. Annual Earnings
        const annualResult = await query(`
            SELECT 
                YEAR(payment_date) as year,
                SUM(amount) as total
            FROM payments
            WHERE verification_status = 'verified'
            GROUP BY year
            ORDER BY year ASC
        `);

        res.json({
            daily: dailyResult.rows,
            monthly: monthlyResult.rows,
            annual: annualResult.rows
        });
    } catch (error) {
        console.error('Error in getEarningsStats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas de ganancias.' });
    }
};

/**
 * Get detailed collector performance reports with monthly breakdown
 */
export const getCollectorsPerformance = async (req, res) => {
    try {
        // 1. General performance
        const generalResult = await query(`
            SELECT 
                c.id,
                c.full_name as name,
                c.zone,
                COUNT(p.id) as total_payments,
                COALESCE(SUM(p.amount), 0) as total_collected,
                (SELECT COUNT(*) FROM clients cl WHERE cl.collector_id = c.id) as assigned_clients
            FROM collectors c
            LEFT JOIN payments p ON c.id = p.collector_id AND p.verification_status = 'verified'
            GROUP BY c.id, c.full_name, c.zone
            ORDER BY total_collected DESC
        `);

        // 2. Monthly breakdown per collector (Last 6 months)
        const monthlyResult = await query(`
            SELECT 
                p.collector_id,
                DATE_FORMAT(p.payment_date, '%Y-%m') as month,
                SUM(p.amount) as total
            FROM payments p
            WHERE p.verification_status = 'verified'
              AND p.collector_id IS NOT NULL
              AND p.payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY p.collector_id, month
            ORDER BY month ASC
        `);

        // Map results
        const collectors = generalResult.rows.map(col => ({
            ...col,
            monthly_history: monthlyResult.rows.filter(m => m.collector_id === col.id)
        }));

        res.json({ collectors });
    } catch (error) {
        console.error('Error in getCollectorsPerformance:', error);
        res.status(500).json({ error: 'Error al obtener rendimiento de cobradores.' });
    }
};

/**
 * System Data Reset (Admin only)
 */
export const resetSystemData = async (req, res) => {
    try {
        // Security check should be in middleware, but let's double check here
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado.' });
        }
        const { password } = req.body;
        console.log('🔑 Intento de reinicio. Password recibido:', password ? 'SI' : 'NO');

        if (password !== 'miramax.net') {
            console.log('❌ Password incorrecto');
            return res.status(403).json({ error: 'Contraseña de seguridad incorrecta.' });
        }

        console.log('🚮 Iniciando reinicio de datos por petición de admin...');

        try {
            await query('SET FOREIGN_KEY_CHECKS = 0');
            console.log('✅ FK Checks disabled');

            await query('TRUNCATE TABLE audit_logs');
            console.log('✅ audit_logs truncated');

            await query('TRUNCATE TABLE whatsapp_history');
            console.log('✅ whatsapp_history truncated');

            await query('TRUNCATE TABLE payments');
            console.log('✅ payments truncated');

            await query('TRUNCATE TABLE debts');
            console.log('✅ debts truncated');

            await query('TRUNCATE TABLE clients');
            console.log('✅ clients truncated');

            await query('TRUNCATE TABLE collectors');
            console.log('✅ collectors truncated');

            await query('SET FOREIGN_KEY_CHECKS = 1');
            console.log('✅ FK Checks enabled');

            res.json({ success: true, message: 'Todos los datos de negocio han sido eliminados correctamente.' });
        } catch (sqlError) {
            console.error('❌ Error SQL durante el reinicio:', sqlError);
            throw sqlError;
        }
    } catch (error) {
        console.error('Error in resetSystemData:', error);
        res.status(500).json({ error: 'Error al reiniciar el sistema.' });
    }
};

export const exportDebtsReport = async (req, res) => {
    try {
        const { format } = req.query; // 'excel' or 'pdf'

        // 1. Obtener datos de la BD
        const sql = `
            SELECT 
                c.dni, 
                c.full_name as Cliente, 
                c.address as Direccion,
                c.sector as Sector,
                c.zone as Zona,
                d.month as Mes, 
                d.year as Anio, 
                d.amount as Monto, 
                d.status as Estado
            FROM debts d
            JOIN clients c ON d.client_id = c.id
            WHERE d.status = 'pending'
            ORDER BY c.full_name ASC, d.year DESC, d.month DESC
        `;

        const result = await query(sql);
        const data = result.rows;

        if (format === 'excel') {
            // 2. Generar Excel
            const worksheet = xlsx.utils.json_to_sheet(data);
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, "Deudas Pendientes");

            // Crear buffer
            const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            // Enviar respuesta
            res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Deudas.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);

        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 50 });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Deudas.pdf"');

            doc.pipe(res);

            // Header
            doc.fontSize(20).text('Reporte de Deudas Pendientes', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, { align: 'right' });
            doc.moveDown();

            // Table Header
            const tableTop = 150;
            const colX = [50, 200, 300, 400, 500]; // X positions for columns

            doc.font('Helvetica-Bold');
            doc.text('Cliente', colX[0], tableTop);
            doc.text('DNI', colX[1], tableTop);
            doc.text('Periodo', colX[2], tableTop);
            doc.text('Monto', colX[3], tableTop);

            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Table Body
            let y = tableTop + 25;
            doc.font('Helvetica');

            data.forEach((row, i) => {
                if (y > 700) { // New page
                    doc.addPage();
                    y = 50;
                }

                doc.text(row.Cliente.substring(0, 25), colX[0], y);
                doc.text(row.dni, colX[1], y);
                doc.text(`${row.Mes} ${row.Anio}`, colX[2], y);
                doc.text(`S/ ${parseFloat(row.Monto).toFixed(2)}`, colX[3], y);

                y += 20;
            });

            // Summary
            doc.moveDown();
            doc.font('Helvetica-Bold');
            const total = data.reduce((sum, row) => sum + parseFloat(row.Monto), 0);
            doc.text(`Total Deuda Pendiente: S/ ${total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, { align: 'right' });

            doc.end();
        } else {
            res.status(400).json({ error: 'Formato no soportado. Use ?format=excel' });
        }

    } catch (error) {
        console.error('Error exportando reporte:', error);
        res.status(500).json({ error: 'Error al generar el reporte.' });
    }
};
