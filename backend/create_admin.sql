-- Script de emergencia para crear usuario admin con contraseña hasheada correcta
-- Este script es compatible con MySQL/XAMPP

-- Eliminar admin anterior si existe
DELETE FROM admin_users WHERE username = 'admin';

-- Crear admin con contraseña hasheada bcrypt (admin123)
-- Hash generado con: bcrypt.hash('admin123', 10)
INSERT INTO admin_users (username, password, full_name, role)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2Z/vLIQnOZFZlSk2/1LScN4kpg5/4lU2y.TQEU5m', 'Administrador', 'admin');

-- Verificar que se creó
SELECT id, username, full_name, role, created_at FROM admin_users WHERE username = 'admin';
