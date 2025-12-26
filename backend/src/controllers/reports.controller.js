import { query } from '../config/database.js';

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
