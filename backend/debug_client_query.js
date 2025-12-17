
import { query } from './src/config/database.js';
import dotenv from 'dotenv';
dotenv.config();

const testFullCheckDebt = async () => {
    try {
        const dni = '40765886';
        console.log(`Testing FULL CheckDebt for DNI: ${dni}`);

        // 1. Get Client
        const clientResult = await query(
            'SELECT * FROM clients WHERE dni = ?',
            [dni]
        );

        if (clientResult.rows.length === 0) {
            console.log('Client not found');
            return;
        }

        const client = clientResult.rows[0];
        console.log('Client found ID:', client.id);

        // 2. Get Debts
        const debtsResult = await query(
            'SELECT * FROM debts WHERE client_id = ? AND status = ? ORDER BY year DESC, month DESC',
            [client.id, 'pending']
        );
        console.log('Debts found:', debtsResult.rows.length);

        // 3. Get Last Payment
        const lastPaymentResult = await query(
            'SELECT payment_date FROM payments WHERE client_id = ? ORDER BY payment_date DESC LIMIT 1',
            [client.id]
        );
        const lastPayment = lastPaymentResult.rows.length > 0 ? lastPaymentResult.rows[0].payment_date : null;
        console.log('Last Payment:', lastPayment);

        // 4. Calculate Total Debt
        console.log('Calculating total debt...');
        const totalDebt = debtsResult.rows.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
        console.log('Total Debt:', totalDebt.toFixed(2));

        console.log('✅ Logic executed successfully');

    } catch (error) {
        console.error('💥 Error executing logic:', error);
    }
};

testFullCheckDebt();
