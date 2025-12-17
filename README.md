# 🌐 Sistema de Cobranzas MIRAMAX

Sistema completo de gestión de cobranzas para MIRAMAX Internet con tres portales diferenciados: Cliente (público), Cobrador (autenticado) y Administrativo (backoffice).

## 📌 Descripción

Plataforma web full-stack que permite:
- **Clientes**: Consultar su deuda por DNI y pagar con Yape
- **Cobradores**: Gestionar clientes asignados, registrar pagos y enviar recordatorios
- **Administradores**: Control total del sistema con gestión de usuarios, deudas, pagos y configuración

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de Datos**: MySQL (XAMPP)
- **Autenticación**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **QR Generation**: qrcode
- **Password Hashing**: bcryptjs

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Router**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Vanilla CSS (Design System)

## 📋 Características Principales

### ✅ Sistema de Autenticación
- JWT con expiración de 24h
- Roles diferenciados (admin, supervisor, support)
- Middleware de autorización por rol
- Sesión persistente con localStorage

### ✅ Gestión de Clientes
- CRUD completo de clientes
- Estados de servicio: Activo, Suspendido, Cortado, En Reconexión
- Asignación a cobradores por zona
- Historial de pagos

### ✅ Sistema de Pagos
- Pagos online con Yape (QR dinámico)
- Pagos presenciales registrados por cobradores
- Subida de comprobantes
- Verificación manual de pagos
- Estados: Pendiente, Verificado, Rechazado

### ✅ Integración WhatsApp
- URL schemes para envío de mensajes
- Templates configurables
- Historial completo de mensajes enviados
- Registro automático en base de datos

### ✅ Auditoría y Seguridad
- Logs de todas las acciones importantes
- Registro de quién, cuándo y qué se modificó
- Contraseñas hasheadas con bcrypt
- Validación de entrada en todas las rutas

### ✅ Diseño Moderno
- Paleta de colores MIRAMAX (Naranja #FF6600 + Negro #1A1A1A)
- 100% responsive (mobile-first)
- Animaciones suaves
- Componentes reutilizables

## 📁 Estructura del Proyecto

```
miramax-cobranzas/
├── backend/                # API REST con Node.js + Express
│   ├── src/
│   │   ├── config/        # Configuración DB y setup
│   │   ├── controllers/   # Lógica de negocio
│   │   ├── routes/        # Rutas de la API
│   │   ├── middlewares/   # Auth y validación
│   │   ├── services/      # Servicios (WhatsApp, Yape, etc.)
│   │   └── server.js      # Servidor principal
│   ├── uploads/           # Comprobantes subidos
│   └── README.md
│
└── frontend/              # React + TypeScript + Vite
    ├── src/
    │   ├── pages/         # Páginas de los 3 portales
    │   ├── services/      # API client
    │   ├── App.tsx        # Router principal
    │   └── index.css      # Design system
    └── README.md
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 18 o superior
- **XAMPP** (incluye Apache + MySQL/MariaDB + PHP)
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd miramax-cobranzas
```

### 2. Configurar Backend

```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de MySQL (por defecto XAMPP: root sin contraseña)

# Crear base de datos en MySQL
# Opción 1: Usar phpMyAdmin (http://localhost/phpmyadmin)
#   - Crear nueva base de datos: miramax_cobranzas
# Opción 2: Línea de comandos MySQL
#   mysql -u root
#   CREATE DATABASE miramax_cobranzas;
#   exit;

# Ejecutar script de setup (crea tablas y admin)
npm run db:setup

# Iniciar servidor de desarrollo
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### 3. Configurar Frontend

```bash
cd frontend
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 👤 Credenciales por Defecto

Después de ejecutar `npm run db:setup`:

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

⚠️ **IMPORTANTE**: Cambiar estas credenciales en producción.

## 📚 Documentación de la API

### Portal del Cliente (Público)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/client/check-debt` | Consultar deuda por DNI |
| GET | `/api/client/yape-info` | Obtener QR de Yape |
| POST | `/api/client/payment` | Registrar pago |
| POST | `/api/client/upload-voucher` | Subir comprobante |

### Portal del Cobrador (Autenticado)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/collector/login` | Iniciar sesión |
| GET | `/api/collector/clients` | Clientes asignados |
| POST | `/api/collector/payment` | Registrar pago presencial |
| POST | `/api/collector/send-reminder` | Enviar recordatorios |
| GET | `/api/collector/stats` | Estadísticas personales |

### Panel Administrativo (Autenticado + Roles)

| Módulo | Endpoints | Roles |
|--------|-----------|-------|
| Clientes | GET, POST, PUT, DELETE `/api/admin/clients` | admin |
| Cobradores | GET, POST, PUT, DELETE `/api/admin/collectors` | admin |
| Deudas | GET, POST, PUT, DELETE `/api/admin/debts` | admin |
| Pagos | GET `/api/admin/payments`, PUT `/api/admin/payments/:id/verify` | admin, support |
| Config | GET, PUT `/api/admin/config`, POST `/api/admin/config/yape-qr` | admin |
| Reportes | GET `/api/admin/reports` | admin, supervisor |

## 🎨 Capturas de Pantalla

### Portal del Cliente
- Página de consulta de deuda con input de DNI
- Vista de detalles con información completa del cliente
- Página de pago Yape con QR dinámico

### Portal del Cobrador
- Dashboard con estadísticas personales
- Lista de clientes asignados con deuda total

### Panel Administrativo
- Dashboard con módulos de gestión
- Stats globales del sistema

## 🔒 Seguridad

- ✅ Autenticación JWT
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Roles y permisos
- ✅ CORS configurado
- ✅ Validación de entrada
- ✅ Audit logs
- ✅ Protección contra SQL injection (prepared statements)

## 📊 Base de Datos (MySQL)

El sistema utiliza 8 tablas principales:
- `clients` - Datos de clientes
- `collectors` - Cobradores del sistema
- `debts` - Mensualidades pendientes/pagadas
- `payments` - Registro de todos los pagos
- `admin_users` - Usuarios administrativos
- `audit_logs` - Logs de auditoría
- `whatsapp_history` - Historial de mensajes
- `system_config` - Configuración del sistema

## 🧪 Testing

Para probar el sistema localmente:

1. Crear un cliente de prueba en la base de datos
2. Consultar con DNI en `/consulta`
3. Verificar detalles y proceso de pago
4. Login como cobrador o admin
5. Probar funcionalidades de cada portal

## 🚀 Despliegue

### Backend (Render, Railway, etc.)
1. Configurar variables de entorno
2. Crear base de datos PostgreSQL
3. Ejecutar `npm run db:setup`
4. Deploy con `npm start`

### Frontend (Vercel, Netlify, etc.)
1. Configurar variable `VITE_API_URL`
2. Build con `npm run build`
3. Deploy de la carpeta `dist/`

## 🤝 Contribución

Este es un proyecto privado de MIRAMAX Internet.

## 📝 Licencia

Propietario: MIRAMAX Internet  
© 2024 Todos los derechos reservados

## 📧 Soporte

Para soporte técnico, contactar al equipo de desarrollo de MIRAMAX.

---

**Desarrollado con ❤️ para MIRAMAX Internet**
