# Sistema de Cobranzas MIRAMAX - Backend

API REST para el sistema de gestión de cobranzas de MIRAMAX Internet.

## 🚀 Tecnologías

- Node.js + Express
- **MySQL** (XAMPP)
- JWT para autenticación
- Multer para subida de archivos
- QRCode para generación de códigos QR de Yape

## 📋 Requisitos Previos

- Node.js 18+ 
- **XAMPP** (incluye MySQL/MariaDB)
- npm o yarn

## ⚙️ Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus datos de MySQL (XAMPP):

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=miramax_cobranzas
DB_USER=root
DB_PASSWORD=
JWT_SECRET=tu_secreto_jwt_cambiarlo_en_produccion
```

### 3. Crear la base de datos

**Opción 1: phpMyAdmin (XAMPP)**
1. Abre `http://localhost/phpmyadmin`
2. Clic en "Nueva" en el panel izquierdo
3. Nombre: `miramax_cobranzas`
4. Cotejamiento: `utf8mb4_general_ci`
5. Clic en "Crear"

**Opción 2: Línea de comandos**
```bash
# En la consola de MySQL de XAMPP
mysql -u root
CREATE DATABASE miramax_cobranzas CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
exit;
```

### 4. Ejecutar el setup de tablas

```bash
npm run db:setup
```

Este comando creará todas las tablas necesarias y el usuario admin por defecto:
- **Usuario**: admin
- **Contraseña**: admin123

⚠️ **IMPORTANTE**: Cambia la contraseña del admin en producción.

## 🎯 Uso

### Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Producción

```bash
npm start
```

## 📚 Endpoints de la API

### Portal del Cliente (Público)

- `POST /api/client/check-debt` - Consultar deuda por DNI
- `GET /api/client/yape-info?amount=XX` - Obtener información de Yape (QR)
- `POST /api/client/payment` - Registrar pago  
- `POST /api/client/upload-voucher` - Subir comprobante
- `GET /api/client/whatsapp-url?dni=XXXXXXXX` - Generar URL de WhatsApp
- `GET /api/client/payment-status/:id` - Consultar estado de pago

### Portal del Cobrador (Autenticado)

- `POST /api/collector/login` - Login de cobrador
- `GET /api/collector/clients` - Obtener clientes asignados
- `POST /api/collector/payment` - Registrar pago presencial
- `POST /api/collector/send-reminder` - Enviar recordatorios WhatsApp
- `GET /api/collector/stats` - Obtener estadísticas personales
- `GET /api/collector/whatsapp-history` - Historial de mensajes

### Panel Administrativo (Autenticado + Roles)

- `POST /api/admin/login` - Login de administrador

**Clientes**
- `GET /api/admin/clients` - Listar clientes
- `POST /api/admin/clients` - Crear cliente (requiere rol: admin)
- `PUT /api/admin/clients/:id` - Actualizar cliente (requiere rol: admin)
- `DELETE /api/admin/clients/:id` - Eliminar cliente (requiere rol: admin)

**Cobradores**
- `GET /api/admin/collectors` - Listar cobradores
- `POST /api/admin/collectors` - Crear cobrador (requiere rol: admin)
- `PUT /api/admin/collectors/:id` - Actualizar cobrador (requiere rol: admin)
- `DELETE /api/admin/collectors/:id` - Eliminar cobrador (requiere rol: admin)

**Deudas**
- `GET /api/admin/debts` - Listar deudas
- `POST /api/admin/debts` - Crear deuda (requiere rol: admin)
- `PUT /api/admin/debts/:id` - Actualizar deuda (requiere rol: admin)
- `DELETE /api/admin/debts/:id` - Eliminar deuda (requiere rol: admin)

**Pagos**
- `GET /api/admin/payments` - Listar pagos
- `PUT /api/admin/payments/:id/verify` - Verificar/Rechazar pago (requiere rol: admin o support)

**Configuración**
- `GET /api/admin/config` - Obtener configuración
- `PUT /api/admin/config` - Actualizar configuración (requiere rol: admin)
- `POST /api/admin/config/yape-qr` - Subir QR de Yape (requiere rol: admin)

**Reportes**
- `GET /api/admin/reports` - Obtener reportes globales

## 🔐 Roles

El sistema tiene 3 roles para usuarios administrativos:

- **admin**: Acceso completo a todo
- **supervisor**: Solo lectura (puede ver estadísticas y reportes)
- **support**: Puede ver datos y verificar pagos

## 📁 Estructura de carpetas

```
backend/
├── src/
│   ├── config/          # Configuración (DB, setup)
│   ├── controllers/     # Controladores de la API
│   ├── routes/          # Definición de rutas
│   ├── middlewares/     # Middleware de autenticación
│   ├── services/        # Servicios (Yape, WhatsApp, Upload, Audit)
│   └── server.js        # Servidor principal
├── uploads/             # Comprobantes subidos
├── .env                 # Variables de entorno
└── package.json
```

## 📝 Características Implementadas

✅ Autenticación JWT
✅ Roles y permisos (admin, supervisor, support)
✅ Audit logs (auditoría completa de acciones)
✅ Historial de WhatsApp
✅ Estados de servicio (activo, cortado, suspendido, en reconexión)
✅ Generación de QR de Yape con monto
✅ Integración con WhatsApp (URL schemes)
✅ Subida de comprobantes
✅ Verificación de pagos
✅ Reportes y estadísticas

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación basada en JWT
- Validación de roles para acciones sensibles
- Logs de auditoría para todas las operaciones importantes
- CORS configurado para frontend específico

## 📊 Base de Datos

El sistema utiliza 8 tablas:

1. `clients` - Datos de clientes
2. `collectors` - Cobradores
3. `debts` - Deudas/mensualidades
4. `payments` - Pagos registrados
5. `admin_users` - Usuarios administrativos
6. `audit_logs` - Logs de auditoría
7. `whatsapp_history` - Historial de mensajes
8. `system_config` - Configuración del sistema

## 🆘 Soporte

Para cualquier problema o pregunta, contacta al equipo de desarrollo de MIRAMAX.
