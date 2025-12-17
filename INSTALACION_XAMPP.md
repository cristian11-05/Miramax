# Guía Rápida de Instalación con XAMPP

## 1️⃣ Instalar XAMPP
1. Descargar XAMPP desde https://www.apachefriends.org/
2. Instalar y abrir el Panel de Control de XAMPP
3. Iniciar los módulos **Apache** y **MySQL**

## 2️⃣ Crear la Base de Datos

### Opción A: phpMyAdmin (Recomendado - Visual)
1. Abrir el navegador en `http://localhost/phpmyadmin`
2. Clic en "Nueva" en el panel izquierdo
3. Nombre de la base de datos: **`miramax_cobranzas`**
4. Cotejamiento: **`utf8mb4_general_ci`**
5. Clic en "Crear"

### Opción B: Consola MySQL
```bash
# Abrir consola de MySQL desde XAMPP
mysql -u root

# Crear la base de datos
CREATE DATABASE miramax_cobranzas CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

# Salir
exit;
```

## 3️⃣ Configurar el Backend

```bash
# Navegar a la carpeta backend
cd d:\Miramax\backend

# Copiar archivo de configuración (si no existe)
copy .env.example .env

# El archivo .env ya está configurado para XAMPP con:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=     (vacío por defecto en XAMPP)
```

## 4️⃣ Crear las Tablas

```bash
# Ejecutar el script que crea las 8 tablas
npm run db:setup
```

✅ Esto creará:
- Las 8 tablas del sistema
- Usuario admin con contraseña `admin123`
- Configuración inicial de Yape y WhatsApp

## 5️⃣ Iniciar el Backend

```bash
npm run dev
```

El servidor estará en `http://localhost:3000`

## 6️⃣ Iniciar el Frontend

```bash
# En otra terminal
cd d:\Miramax\frontend
npm run dev
```

El frontend estará en `http://localhost:5173`

## 🎉 ¡Listo!

Abre `http://localhost:5173/consulta` para ver el portal del cliente.

**Login Admin:**
- URL: `http://localhost:5173/admin/login`
- Usuario: `admin`
- Contraseña: `admin123`

---

## ⚠️ Solución de Problemas

### Error: "Cannot connect to MySQL"
- ✅ Verifica que MySQL esté corriendo en XAMPP
- ✅ Verifica que el puerto sea 3306
- ✅ Verifica que el usuario sea `root` sin contraseña

### Error: "Database does not exist"
- ✅ Crea la base de datos primero en phpMyAdmin

### Error al ejecutar npm run db:setup
- ✅ Asegúrate de haber ejecutado `npm install` primero
- ✅ Verifica que XAMPP MySQL esté corriendo
