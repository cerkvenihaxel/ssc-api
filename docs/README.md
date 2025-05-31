# 🏥 Vada Health - Backend API

**Sistema de Servicios de Salud - API REST con NestJS**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://typescriptlang.org/)

---

## 🚀 **Estado del Proyecto**

✅ **Backend 100% Funcional y Listo para Producción**

- ✅ **Autenticación completa** con Magic Links
- ✅ **Sistema de roles y permisos** granular (6 roles, 11 permisos)
- ✅ **API REST completa** con documentación Swagger
- ✅ **Base de datos** con estructura completa y datos de prueba
- ✅ **Sistema de gestión** de usuarios administrativo
- ✅ **Integración lista** para React Frontend

---

## 📋 **Características Principales**

### 🔐 **Sistema de Autenticación**
- **Magic Links** por email (sin contraseñas)
- **JWT** con sesiones persistentes
- **Roles**: Administrador, Auditor, Efector, Proveedor, Médico, Afiliado
- **Permisos granulares** por endpoint
- **Rutas diferenciadas** por tipo de usuario

### 👥 **Gestión de Usuarios**
- **CRUD completo** de usuarios por rol
- **Sistema de permisos** basado en roles
- **Creación masiva** de usuarios
- **Estadísticas** y reportes

### 🏥 **Sistema de Pedidos (Efectores)**
- **Pedidos de insumos** médicos
- **Estados de pedidos** con workflow
- **Cotizaciones** de proveedores
- **Órdenes de provisión**
- **Sistema de notificaciones**

### 📊 **API REST Completa**
- **Documentación Swagger** automática
- **Validación** de datos con class-validator
- **Manejo de errores** centralizado
- **Logs** de auditoría

---

## 🛠️ **Instalación Rápida**

### **Prerrequisitos**
```bash
# Node.js 18+
node --version

# PostgreSQL 15+
psql --version

# Git
git --version
```

### **1. Clonar e Instalar**
```bash
git clone <repository-url>
cd ssc-api
npm install
```

### **2. Configuración Automática**
```bash
# Setup completo automático (excluyendo BD)
cp env.example .env
# Editar .env con tus valores de BD antes de continuar

# O paso a paso:
npm run setup:env          # Crear archivo .env
```

### **3. Configurar Base de Datos MANUALMENTE**
```bash
# IMPORTANTE: Las migraciones automáticas están DESHABILITADAS
# Usar únicamente el script SQL manual

# 1. Crear base de datos PostgreSQL
createdb -U postgres ssc_db

# 2. Ejecutar script SQL completo
psql -h localhost -U postgres -d ssc_db -f script.sql

# 3. Verificar que las tablas se crearon correctamente
psql -h localhost -U postgres -d ssc_db -c "\dt"
```

### **4. Configurar Variables de Entorno**
```bash
# Editar .env con tus valores
nano .env
```

### **5. Iniciar Servidor**
```bash
npm run start:dev
```

### **6. Verificar Funcionamiento**
```bash
npm run health         # Health check
npm run docs          # Abrir Swagger docs
npm run test:login    # Probar endpoint de login
```

---

## ⚙️ **Configuración Detallada**

### **Variables de Entorno (.env)**
```bash
# Servidor
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ssc_db
DB_USER=ssc_user
DB_PASSWORD=tu_password_seguro

# JWT (generar con: openssl rand -hex 64)
JWT_SECRET=tu_jwt_secret_muy_seguro_de_64_caracteres

# Email para Magic Links
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password_gmail
MAIL_FROM_NAME=Vada Health
MAIL_FROM_ADDRESS=noreply@ssc.com

# Opcional
LOCAL=America/Buenos_Aires
UPLOAD_DIRECTORY=uploads
MAX_FILE_SIZE=10485760
```

### **Configuración de Email (Gmail)**
1. Habilitar **autenticación de 2 factores**
2. Generar **contraseña de aplicación** específica
3. Usar esa contraseña en `MAIL_PASSWORD`

---

## 🗃️ **Base de Datos**

> **⚠️ IMPORTANTE**: Este proyecto utiliza un **script SQL manual** en lugar de migraciones automáticas de TypeORM para mayor control y estabilidad. Las migraciones automáticas están **DESHABILITADAS**.

### **Scripts Disponibles**
```bash
npm run db:create     # Crear base de datos
npm run db:setup      # Ejecutar migraciones y datos de prueba
npm run db:reset      # Recrear base de datos desde cero
npm run db:drop       # Eliminar base de datos
```

### **Estructura de Tablas**
- **usuarios** - Tabla central de usuarios
- **roles** - Roles del sistema
- **permisos** - Permisos granulares
- **proveedores** - Información de proveedores
- **medicos** - Información de médicos
- **afiliados** - Información de afiliados
- **effector_requests** - Pedidos de efectores
- **provider_quotations** - Cotizaciones
- **provision_orders** - Órdenes de provisión
- **notifications** - Sistema de notificaciones

---

## 👥 **Usuarios de Prueba**

| Email | Rol | Password | Acceso |
|-------|-----|----------|---------|
| `admin@sistema.com` | Administrador | `admin123` | Gestión completa |
| `auditor@sistema.com` | Auditor | `auditor123` | Auditoría de pedidos |
| `efector@hospital.com` | Efector | `efector123` | Crear pedidos |
| `medico@hospital.com` | Médico | `medico123` | Solicitudes médicas |
| `proveedor1@farmacia.com` | Proveedor | `proveedor123` | Cotizaciones |
| `proveedor2@laboratorio.com` | Proveedor | `proveedor123` | Cotizaciones |

---

## 🔗 **API Endpoints**

### **📖 Documentación Swagger**
```
http://localhost:3000/api/docs
```

### **🔐 Autenticación**
```bash
# Solicitar Magic Link
POST /api/v1/auth/login
Content-Type: application/json
{
  "email": "admin@sistema.com"
}

# Verificar Magic Link (desde email)
GET /api/v1/auth/verify?token=MAGIC_LINK_TOKEN

# Obtener información del usuario
GET /api/v1/auth/me
Authorization: Bearer JWT_TOKEN

# Cerrar sesión
POST /api/v1/auth/logout
Authorization: Bearer JWT_TOKEN
```

### **👥 Administración (Solo Admin)**
```bash
# Lista de usuarios
GET /api/v1/admin/users
Authorization: Bearer JWT_TOKEN

# Crear proveedor
POST /api/v1/admin/users/providers
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
{
  "email": "nuevo@proveedor.com",
  "nombre": "Nuevo Proveedor",
  "provider_name": "Farmacia Nueva",
  "provider_type": "Farmacia",
  "cuit": "20-12345678-9",
  "contact_name": "Juan Pérez",
  "contact_phone": "+54911234567",
  "contact_email": "contacto@farmacia.com"
}

# Estadísticas del sistema
GET /api/v1/admin/users/stats
Authorization: Bearer JWT_TOKEN
```

---

## 🏗️ **Arquitectura del Sistema**

### **Estructura de Carpetas**
```
src/
├── api/                    # Capa de presentación
│   ├── controllers/        # Controladores REST
│   ├── guards/            # Guards de autenticación
│   ├── strategies/        # Estrategias de autenticación
│   └── v1/                # Versión 1 de la API
│       ├── auth/          # Módulo de autenticación
│       ├── admin/         # Módulo de administración
│       └── ...
├── application/           # Capa de aplicación
│   └── services/          # Servicios de negocio
├── domain/               # Capa de dominio
│   ├── models/           # Modelos de dominio
│   └── repositories/     # Interfaces de repositorios
└── infrastructure/       # Capa de infraestructura
    ├── config/           # Configuraciones
    ├── persistence/      # Persistencia de datos
    └── repositories/     # Implementaciones de repositorios
```

### **Patrones Implementados**
- **Clean Architecture** - Separación de responsabilidades
- **Repository Pattern** - Abstracción de acceso a datos
- **Dependency Injection** - Inversión de dependencias
- **JWT Strategy** - Autenticación stateless
- **Guard Pattern** - Protección de rutas

---

## 🧪 **Testing**

```bash
# Tests unitarios
npm run test

# Tests con watch
npm run test:watch

# Coverage
npm run test:cov

# Tests e2e
npm run test:e2e
```

---

## 📦 **Deployment**

### **Producción**
```bash
# Build
npm run build

# Iniciar en producción
npm run start:prod
```

### **Docker (Próximamente)**
```bash
# Build imagen
docker build -t ssc-api .

# Ejecutar contenedor
docker run -p 3000:3000 ssc-api
```

---

## 🌐 **Integración con Frontend React**

### **Flujo de Autenticación**
1. Usuario ingresa email en React
2. React llama a `POST /api/v1/auth/login`
3. Sistema envía Magic Link al email
4. Usuario hace clic en el link
5. React captura token y llama a `GET /api/v1/auth/verify`
6. Backend retorna JWT + información completa del usuario
7. React almacena JWT y redirige a la ruta por defecto del rol

### **Respuesta de Login Exitoso**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionId": "uuid-session-id",
  "user": {
    "userId": "uuid",
    "email": "admin@sistema.com", 
    "nombre": "Administrador Principal",
    "role": {
      "id": 5,
      "name": "Administrador",
      "description": "Administrador del sistema"
    },
    "permissions": ["CREATE_USERS", "UPDATE_USERS", ...],
    "defaultRoute": "/admin/dashboard",
    "availableRoutes": [...]
  }
}
```

### **Rutas por Rol**
- **Administrador**: `/admin/dashboard`
- **Auditor**: `/auditor/requests`
- **Efector**: `/efector/requests`
- **Proveedor**: `/proveedor/quotations`
- **Médico**: `/medico/solicitudes`
- **Afiliado**: `/afiliado/profile`

---

## 📚 **Documentación Adicional**

- **[Guía de Integración Frontend](FRONTEND_INTEGRATION_GUIDE.md)** - Instrucciones completas para React
- **[API de Administración](ADMIN_USERS_API_DOCUMENTATION.md)** - Documentación de endpoints admin
- **[Setup de Base de Datos](DATABASE_SETUP.md)** - Instrucciones de configuración DB

---

## 🤝 **Contribución**

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 **Licencia**

Este proyecto es privado y confidencial.

---

## 📞 **Soporte**

Para soporte técnico:
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health
- **Logs**: Revisar consola del servidor

---

**✨ ¡El backend está 100% funcional y listo para comenzar con React! ✨**
