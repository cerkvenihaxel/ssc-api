# 🚀 Instrucciones de Configuración - Vada Health Backend

## ✅ **Estado Actual**
- ✅ **Servidor funcionando** en puerto 3000
- ✅ **Compilación exitosa** sin errores
- ✅ **Dependencias instaladas** y compatibles
- ✅ **Migraciones TypeORM deshabilitadas** (usar script SQL manual)

---

## 📋 **Pasos Siguientes**

### **1. Configurar Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar con tus valores
nano .env
```

**Variables críticas a configurar:**
```bash
# === APLICACIÓN ===
APP_NAME="SSC-MSP"
FRONTEND_URL=http://localhost:5173  # Puerto de Vite (React)

# === POSTGRESQL ===
# Para Docker (recomendado):
DB_HOST=db
DB_USER=admin
DB_PASSWORD=admin
DATABASE_URL=postgres://admin:admin@db:5432/ssc_db

# Para PostgreSQL local:
# DB_HOST=localhost
# DB_USER=postgres
# DB_PASSWORD=tu_password_local

# === JWT ===
JWT_SECRET=tu_jwt_secret_de_64_caracteres  # Generar con: openssl rand -hex 64

# === EMAIL (Gmail) ===
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD="tu_password_app_16_caracteres"  # Password de aplicación de Google
MAIL_FROM_ADDRESS="tu_email@gmail.com"
```

### **2. Configurar Base de Datos PostgreSQL**

#### **Opción A: Con Docker (Recomendado)**
```bash
# 1. Iniciar PostgreSQL en Docker
docker-compose up -d postgres
# o si no tienes docker-compose, crear manualmente:
# docker run --name ssc-postgres -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=ssc_db -p 5432:5432 -d postgres:15

# 2. Ejecutar script SQL
psql -h localhost -U admin -d ssc_db -f script.sql

# 3. Verificar tablas creadas
psql -h localhost -U admin -d ssc_db -c "\dt"
```

#### **Opción B: PostgreSQL Local**
```bash
# 1. Cambiar en .env:
# DB_HOST=localhost
# DB_USER=postgres
# DB_PASSWORD=tu_password_local

# 2. Crear base de datos
createdb -U postgres ssc_db

# 3. Ejecutar script SQL
psql -h localhost -U postgres -d ssc_db -f script.sql

# 4. Verificar tablas
psql -h localhost -U postgres -d ssc_db -c "\dt"
```

### **3. Verificar Funcionamiento Completo**
```bash
# Health check
curl http://localhost:3000/api/health
# Debe retornar: {"status":"ok"}

# Swagger docs
open http://localhost:3000/api/docs

# Probar endpoint de autenticación
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com"}'
```

### **4. 🔧 Corregir Problemas de Esquema (Si es necesario)**

Si obtienes un error como `column "last_login" does not exist`, ejecuta este script de corrección:

#### **Para Docker:**
```bash
# Verificar estructura actual
npm run db:check-usuarios

# Corregir esquema automáticamente
npm run db:fix-schema

# O manualmente:
psql -h localhost -U admin -d ssc_db -f fix-database-schema.sql
```

#### **Para PostgreSQL Local:**
```bash
# Corregir esquema
npm run db:fix-schema-local

# O manualmente:
psql -h localhost -U postgres -d ssc_db -f fix-database-schema.sql
```

**Este script agregará automáticamente las columnas faltantes sin afectar los datos existentes.**

---

## 👥 **Usuarios de Prueba Disponibles**

Una vez configurada la base de datos, estos usuarios estarán disponibles:

| Email | Rol | Ruta Default |
|-------|-----|--------------|
| `admin@sistema.com` | Administrador | `/admin/dashboard` |
| `auditor@sistema.com` | Auditor | `/auditor/requests` |
| `efector@hospital.com` | Efector | `/efector/requests` |
| `medico@hospital.com` | Médico | `/medico/solicitudes` |
| `proveedor1@farmacia.com` | Proveedor | `/proveedor/quotations` |
| `proveedor2@laboratorio.com` | Proveedor | `/proveedor/quotations` |

---

## 🔧 **Solución de Problemas**

### **Error de Conexión a BD**
```bash
# Verificar que PostgreSQL esté ejecutándose
sudo systemctl status postgresql

# Verificar conectividad
psql -h localhost -U postgres -c "SELECT version();"
```

### **Error de Migraciones**
> ⚠️ **Las migraciones automáticas están DESHABILITADAS** por design. Usar únicamente el script SQL manual.

### **Error de Email**
Para Gmail, necesitas:
1. Habilitar autenticación de 2 factores
2. Generar password de aplicación específica
3. Usar ese password en `MAIL_PASSWORD`

---

## 🎯 **¡Sistema Listo!**

Una vez completados estos pasos:

- ✅ **Backend funcionando** en `http://localhost:3000`
- ✅ **API Swagger** en `http://localhost:3000/api/docs`
- ✅ **Autenticación** con Magic Links operativa
- ✅ **Base de datos** con usuarios de prueba
- ✅ **Sistema de roles** y permisos funcionando

**¡Listo para integrar con React Frontend!** 🚀

Consulta `FRONTEND_INTEGRATION_GUIDE.md` para las instrucciones de integración con React. 