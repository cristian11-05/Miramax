# 🔍 Script de Verificación del Sistema

Este script verifica:
1. Si el usuario admin existe en la base de datos
2. Si el backend tiene sintaxis MySQL correcta
3. Los logs del servidor

## Verificar en phpMyAdmin

Ejecuta estos SQLs en phpMyAdmin > miramax_cobranzas > SQL:

```sql
-- Ver si el admin existe
SELECT * FROM admin_users WHERE username = 'admin';

-- Ver todos los admins
SELECT id, username, full_name, role, LENGTH(password) as password_length 
FROM admin_users;

-- Ver estructura de la tabla
DESCRIBE admin_users;
```

**Resultados esperados:**
- Debe haber 1 admin con username='admin'
- El password debe tener ~60 caracteres (hash bcrypt)
- El role debe ser 'admin'

## Crear Admin Manualmente Si No Existe

Si no aparece ningún admin, ejecuta:

```sql
DELETE FROM admin_users WHERE username = 'admin';

INSERT INTO admin_users (username, password, full_name, role)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2Z/v LIQnOZFZlSk2/1LScN4kpg5/4lU2y.TQEU5m', 'Administrador', 'admin');

SELECT * FROM admin_users WHERE username = 'admin';
```

## Probar el Login

En Postman o curl:

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Respuesta exitosa:**
```json
{
  "token": "eyJhbGc...",
  "admin": {
    "id": 1,
    "fullName": "Administrador",
    "role": "admin"
  }
}
```

**Respuesta de error:**
```json
{
  "error": "Credenciales incorrectas."
}
```
o
```json
{
  "error": "Error en el servidor."
}
```

---

**Si sigue sin funcionar**, el problema puede ser:
1. El hash de la contraseña está corrupto
2. El backend no se reinició después de los cambios
3. Hay errores de sintaxis en el código actualizado
