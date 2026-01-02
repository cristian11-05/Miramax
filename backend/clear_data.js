import { query } from './src/config/database.js';

async function clearAll() {
    try {
        console.log("🧹 Iniciando limpieza de base de datos...");

        // Desactivar chequeo de llaves foráneas para poder borrar en orden
        await query('SET FOREIGN_KEY_CHECKS = 0');

        console.log("- Borrando Pagos...");
        await query('DELETE FROM payments');

        console.log("- Borrando Deudas...");
        await query('DELETE FROM debts');

        console.log("- Borrando Clientes...");
        await query('DELETE FROM clients');

        console.log("- Borrando Cobradores...");
        await query('DELETE FROM collectors');

        console.log("- Borrando Historial de WhatsApp...");
        await query('DELETE FROM whatsapp_messages');

        console.log("- Limpiando Configuración de Zonas...");
        await query("UPDATE system_config SET config_value = '[]' WHERE config_key = 'defined_zones'");

        // Reactivar chequeo de llaves foráneas
        await query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("✅ Limpieza completada exitosamente.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error durante la limpieza:", error);
        process.exit(1);
    }
}

clearAll();
