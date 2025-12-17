import { query } from './src/config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Configurar dotenv (path relativo desde la raíz donde se ejecuta el script)
dotenv.config();

const testAdminLogin = async () => {
    try {
        console.log('🔍 Testing Admin Login Logic Manually...');
        const username = 'admin';
        const password = 'admin123';

        console.log(`1️⃣  Fetching user: ${username}`);
        const result = await query('SELECT * FROM admin_users WHERE username = ?', [username]);

        if (result.rows.length === 0) {
            console.error('❌ User not found in database!');
            process.exit(1);
        }

        const admin = result.rows[0];
        console.log('✅ User found:', { id: admin.id, username: admin.username, storedHash: admin.password });

        console.log(`2️⃣  Comparing password: '${password}' with stored hash...`);
        const isValid = await bcrypt.compare(password, admin.password);

        console.log(`3️⃣  Result: ${isValid ? '✅ MATCH' : '❌ MISMATCH'}`);

        if (isValid) {
            console.log('🎉 Login logic SHOULD work.');
        } else {
            console.error('🚨 Password comparison failed directly.');

            // Debugging: generate a new hash for comparison
            const newHash = await bcrypt.hash(password, 10);
            console.log('   New hash for same password would be:', newHash);
            console.log('   (Note: bcrypt hashes are different every time, but should compare true)');
        }

        process.exit(0);
    } catch (error) {
        console.error('💥 Error during test:', error);
        process.exit(1);
    }
};

testAdminLogin();
