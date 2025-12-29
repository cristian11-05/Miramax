import { query } from '../config/database.js';

export const runAutoMigrations = async () => {
    try {
        console.log('🔍 Checking database schema...');

        // 1. Add Code (Legacy ID)
        try {
            await query("ALTER TABLE clients ADD COLUMN code VARCHAR(50) NULL AFTER id");
            console.log('✅ Added column: code');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error adding code:', e.message);
        }

        // 2. Add Sector
        try {
            await query("ALTER TABLE clients ADD COLUMN sector VARCHAR(100) NULL AFTER district");
            console.log('✅ Added column: sector');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error adding sector:', e.message);
        }

        // 3. Add Address Details (Reference)
        try {
            await query("ALTER TABLE clients ADD COLUMN address_details VARCHAR(255) NULL AFTER address");
            console.log('✅ Added column: address_details');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error adding address_details:', e.message);
        }

        // 4. Update Plan size if needed
        try {
            await query("ALTER TABLE clients MODIFY COLUMN plan VARCHAR(100)");
            console.log('✅ Updated column: plan (size increased)');
        } catch (e) {
            console.error('❌ Error updating plan:', e.message);
        }

        console.log('🚀 Auto-migrations check completed.');
    } catch (error) {
        console.error('🔥 Auto-migration failed:', error);
    }
};
