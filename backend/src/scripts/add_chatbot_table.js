import { query } from '../config/database.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

const runMigration = async () => {
    try {
        console.log('Migrating: Adding chatbot_reports table...');

        await query(`
            CREATE TABLE IF NOT EXISTS chatbot_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                collector_id INT,
                report_date DATE DEFAULT (CURRENT_DATE),
                content JSON,
                status VARCHAR(20) DEFAULT 'success',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (collector_id) REFERENCES collectors(id) ON DELETE SET NULL
            )
        `);

        console.log('✅ Migration successful: chatbot_reports table created.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
