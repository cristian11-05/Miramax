import { query } from './src/config/database.js';

const runMigration = async () => {
    try {
        console.log('🚀 Starting schema migration...');

        // 1. Add Code (Legacy ID)
        try {
            await query("ALTER TABLE clients ADD COLUMN code VARCHAR(50) NULL AFTER id");
            console.log('✅ Added column: code');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ Column code already exists');
            else console.error('❌ Error adding code:', e.message);
        }

        // 2. Add Second Phone
        try {
            await query("ALTER TABLE clients ADD COLUMN second_phone VARCHAR(20) NULL AFTER phone");
            console.log('✅ Added column: second_phone');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ Column second_phone already exists');
            else console.error('❌ Error adding second_phone:', e.message);
        }

        // 3. Add Sector
        try {
            await query("ALTER TABLE clients ADD COLUMN sector VARCHAR(100) NULL AFTER district");
            console.log('✅ Added column: sector');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ Column sector already exists');
            else console.error('❌ Error adding sector:', e.message);
        }

        // 4. Add Address Details (Reference)
        try {
            await query("ALTER TABLE clients ADD COLUMN address_details VARCHAR(255) NULL AFTER address");
            console.log('✅ Added column: address_details');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ Column address_details already exists');
            else console.error('❌ Error adding address_details:', e.message);
        }

        console.log('🎉 Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('🔥 Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
