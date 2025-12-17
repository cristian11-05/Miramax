import mysql from 'mysql2/promise';

async function testConnection() {
    try {
        console.log('🔌 Probando conexión a MySQL...\n');

        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'miramax_cobranzas'
        });

        console.log('✅ Conexión exitosa a MySQL!');
        console.log('📊 Base de datos: miramax_cobranzas');

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.error('\n⚠️  Verifica que:');
        console.error('   1. XAMPP esté corriendo (MySQL iniciado)');
        console.error('   2. La base de datos "miramax_cobranzas" exista');
        console.error('   3. El usuario sea "root" sin contraseña');
        process.exit(1);
    }
}

testConnection();
