import { query, pool } from '../config/database.js';
import xlsx from 'xlsx';
import fs from 'fs';

export const importPayments = async (req, res) => {
    let filePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo.' });
        }

        filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(worksheet);

        let successCount = 0;
        let errors = [];

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const [index, row] of rows.entries()) {
                const dni = row['DNI'] || row['dni'];
                const amount = parseFloat(row['Monto'] || row['monto'] || row['Importe'] || row['amount']);

                if (!dni || isNaN(amount)) {
                    errors.push({ row: index + 2, error: 'DNI o Monto inválido' });
                    continue;
                }

                // 1. Find Client
                const [clients] = await connection.query('SELECT id, full_name FROM clients WHERE dni = ? LIMIT 1', [dni]);

                if (clients.length === 0) {
                    errors.push({ row: index + 2, dni, error: 'Cliente no encontrado' });
                    continue;
                }
                const client = clients[0];

                // 2. Find Oldest Pending Debt
                const [debts] = await connection.query(
                    'SELECT id, amount, month, year FROM debts WHERE client_id = ? AND status = ? ORDER BY year ASC, month ASC LIMIT 1',
                    [client.id, 'pending']
                );

                if (debts.length === 0) {
                    errors.push({ row: index + 2, dni, error: 'Sin deudas pendientes' });
                    continue;
                }

                const debt = debts[0];

                // 3. Process Payment - Strict amount check for MVP
                if (amount < parseFloat(debt.amount)) {
                    errors.push({ row: index + 2, dni, error: `Monto insuficiente (Deuda: ${debt.amount}, Pago: ${amount})` });
                    continue;
                }

                // Mark debt as paid
                await connection.execute("UPDATE debts SET status = 'paid' WHERE id = ?", [debt.id]);

                // Create payment record
                await connection.execute(
                    "INSERT INTO payments (client_id, debt_id, amount, payment_method, payment_type, verification_status, payment_date, verified_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                    [client.id, debt.id, amount, 'cash', 'bulk_import', 'verified']
                );

                successCount++;
            }

            await connection.commit();

            // Delete file after success
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

            res.json({
                success: true,
                message: `Procesado: ${successCount} éxitos.`,
                details: { successCount, errorCount: errors.length, errors }
            });

        } catch (innerError) {
            await connection.rollback();
            throw innerError;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error importing payments:', error);
        // Delete file on error
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: 'Error al importar pagos.' });
    }
};
