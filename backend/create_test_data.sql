-- Script para crear datos de prueba (Cobrador y Clientes)
-- Ejecutar en phpMyAdmin

-- 1. Crear un cobrador de prueba (cobrador / cobrador123)
-- Password hash para 'cobrador123': $2a$10$XqRzH7X.kM2y5B9FGfh3yuHbKvJ5T1FmE3nT8vO8L3Hj6g9dY.RfK (reutilizando hash seguro o generando uno nuevo)
-- Vamos a usar el mismo hash de admin123 para simplificar por ahora: $2a$10$N9qo8uLOickgx2Z/vLIQnOZFZlSk2/1LScN4kpg5/4lU2y.TQEU5m
INSERT INTO collectors (username, password, full_name, dni, phone, zone, status)
VALUES ('cobrador', '$2a$10$N9qo8uLOickgx2Z/vLIQnOZFZlSk2/1LScN4kpg5/4lU2y.TQEU5m', 'Juan Pérez', '87654321', '987654321', 'Zona Norte', 'active')
ON DUPLICATE KEY UPDATE password = VALUES(password);

-- 2. Crear un cliente de prueba asociado al cobrador
-- Primero obtenemos el ID del cobrador (asumiendo que es el último insertado o buscándolo)
SET @collector_id = (SELECT id FROM collectors WHERE username = 'cobrador' LIMIT 1);

INSERT INTO clients (dni, full_name, phone, address, caserio, start_date, payment_day, plan, cost, ip_address, service_status, collector_id)
VALUES ('12345678', 'María López', '912345678', 'Av. Principal 123', 'Caserío Central', CURDATE(), 5, '30 Megas', 50.00, '192.168.1.10', 'active', @collector_id)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 3. Crear deuda de prueba para el cliente
SET @client_id = (SELECT id FROM clients WHERE dni = '12345678' LIMIT 1);

INSERT INTO debts (client_id, amount, month, year, status, due_date)
VALUES (@client_id, 50.00, 'Diciembre', 2025, 'pending', DATE_ADD(CURDATE(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

SELECT * FROM collectors WHERE username = 'cobrador';
SELECT * FROM clients WHERE dni = '12345678';
