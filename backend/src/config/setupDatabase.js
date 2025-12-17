import { query } from './database.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const setupDatabase = async () => {
  try {
    console.log('🚀 Iniciando REINICIO COMPLETO de base de datos MySQL...\n');

    // Desactivar chequeo de claves foráneas para poder borrar tablas sin problemas
    await query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('🗑️  Eliminando tablas existentes...');
    await query('DROP TABLE IF EXISTS audit_logs');
    await query('DROP TABLE IF EXISTS whatsapp_history');
    await query('DROP TABLE IF EXISTS payments');
    await query('DROP TABLE IF EXISTS debts');
    await query('DROP TABLE IF EXISTS clients');
    await query('DROP TABLE IF EXISTS system_config');
    await query('DROP TABLE IF EXISTS admin_users');
    await query('DROP TABLE IF EXISTS collectors');

    // Reactivar chequeo
    await query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Tablas eliminadas.');
    console.log('\n🏗️  Creando nueva estructura de tablas...');

    // 2. CREAR TABLAS

    // Tabla: collectors
    // Agregar dni y status
    await query(`
      CREATE TABLE collectors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        dni VARCHAR(8),
        phone VARCHAR(15),
        zone VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla: clients
    await query(`
      CREATE TABLE clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dni VARCHAR(8) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(15),
        second_phone VARCHAR(15),
        region VARCHAR(100),
        province VARCHAR(100),
        district VARCHAR(100),
        caserio VARCHAR(100),
        zone VARCHAR(100),
        address VARCHAR(255),
        contract_number VARCHAR(50),
        plan_type VARCHAR(20) DEFAULT 'INTERNET',
        plan VARCHAR(50),
        internet_speed VARCHAR(20),
        cost DECIMAL(10, 2) DEFAULT 0.00,
        ip_address VARCHAR(50),
        payment_day INT,
        start_date DATE,
        service_status VARCHAR(20) DEFAULT 'active',
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        collector_id INT,
        FOREIGN KEY (collector_id) REFERENCES collectors(id) ON DELETE SET NULL
      )
    `);

    // Tabla: debts
    await query(`
      CREATE TABLE debts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        month VARCHAR(20) NOT NULL,
        year INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);

    // Tabla: payments
    await query(`
      CREATE TABLE payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        debt_id INT,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        payment_type VARCHAR(20) NOT NULL,
        voucher_url VARCHAR(255),
        verification_status VARCHAR(20) DEFAULT 'pending',
        verified_by INT,
        collector_id INT,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP NULL,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL,
        FOREIGN KEY (verified_by) REFERENCES collectors(id) ON DELETE SET NULL,
        FOREIGN KEY (collector_id) REFERENCES collectors(id) ON DELETE SET NULL
      )
    `);

    // Tabla: whatsapp_history
    await query(`
      CREATE TABLE whatsapp_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        collector_id INT,
        message_type VARCHAR(50) NOT NULL,
        message_content TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (collector_id) REFERENCES collectors(id) ON DELETE SET NULL
      )
    `);

    // Tabla: admin_users
    await query(`
      CREATE TABLE admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla: audit_logs
    await query(`
      CREATE TABLE audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        user_type VARCHAR(20) NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INT,
        old_value TEXT,
        new_value TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla: system_config
    await query(`
      CREATE TABLE system_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(50) UNIQUE NOT NULL,
        config_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Estructura de tablas creada exitosamente.');
    console.log('\n🌱 Sembrando datos de prueba...');

    // 3. INSERTAR DATOS (SEEDING)

    // Configuración Sistema
    await query(`
      INSERT INTO system_config (config_key, config_value)
      VALUES 
        ('yape_number', ?),
        ('yape_qr_url', ''),
        ('whatsapp_reminder_template', 'Recordatorio: Tiene una deuda pendiente de S/{amount}. Por favor, regularice su situación.'),
        ('whatsapp_payment_template', 'Hola, he realizado el pago de mi deuda. Mi DNI es {dni}.')
    `, [process.env.WHATSAPP_BUSINESS_NUMBER || '51999999999']);

    // Usuario Admin (admin/admin123)
    const adminHash = await bcrypt.hash('admin123', 10);
    await query(`
      INSERT INTO admin_users (username, password, full_name, role)
      VALUES ('admin', ?, 'Administrador Principal', 'admin')
    `, [adminHash]);
    console.log('👤 Admin creado: admin / admin123');

    // Usuario Cobrador (cobrador/cobrador123)
    const collectorHash = await bcrypt.hash('cobrador123', 10);
    await query(`
      INSERT INTO collectors (username, password, full_name, dni, phone, zone, status)
      VALUES ('cobrador', ?, 'Juan Pérez', '87654321', '999888777', 'Zona Norte', 'active')
    `, [collectorHash]);

    // Obtener ID del cobrador
    const cRes = await query("SELECT id FROM collectors WHERE username = 'cobrador'");
    const collectorId = cRes.rows[0].id;
    console.log(`🏍️  Cobrador creado: cobrador / cobrador123 (ID: ${collectorId})`);

    // Cliente de prueba
    await query(`
      INSERT INTO clients (dni, full_name, phone, region, province, district, caserio, address, contract_number, plan_type, plan, internet_speed, cost, start_date, payment_day, service_status, collector_id)
      VALUES ('12345678', 'María López', '912345678', 'Cajamarca', 'Jaén', 'Jaén', 'Centro', 'Av. Principal 123', 'C001', 'INTERNET', 'Plan 30 Megas', '30MB', 50.00, CURDATE(), 5, 'active', ?)
    `, [collectorId]);

    const clRes = await query("SELECT id FROM clients WHERE dni = '12345678'");
    const clientId = clRes.rows[0].id;
    console.log(`👥 Cliente creado: 12345678 (ID: ${clientId})`);

    // Deuda de prueba
    await query(`
      INSERT INTO debts (client_id, month, year, amount, status, due_date)
      VALUES (?, 'Diciembre', 2025, 50.00, 'pending', DATE_ADD(CURDATE(), INTERVAL 5 DAY))
    `, [clientId]);
    console.log('💰 Deuda creada');

    console.log('\n✨ ¡SISTEMA RESTAURADO COMPLETAMENTE!');
    console.log('===================================');
    console.log('Admin:    admin    / admin123');
    console.log('Cobrador: cobrador / cobrador123');
    console.log('Cliente:  12345678');
    console.log('===================================');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error fatal en configuración:', error);
    process.exit(1);
  }
};

setupDatabase();
