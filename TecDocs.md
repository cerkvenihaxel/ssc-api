# Documentación Técnica - SSC API

## Descripción General
API REST para el Sistema de Servicios de Salud (SSC) implementada con NestJS y PostgreSQL. La API utiliza una arquitectura limpia (Clean Architecture) y sigue los principios SOLID.

## Arquitectura

### Capas
1. **API (Presentación)**
   - Controllers
   - DTOs
   - Guards
   - Decorators

2. **Aplicación**
   - Servicios
   - Casos de uso

3. **Dominio**
   - Modelos
   - Interfaces de repositorios
   - Reglas de negocio

4. **Infraestructura**
   - Implementaciones de repositorios
   - Configuraciones
   - Adaptadores externos

## Autenticación
El sistema utiliza un mecanismo de autenticación basado en Magic Links y JWT:

1. **Magic Link**
   - El usuario solicita acceso con su email
   - Se genera un token único y temporal
   - Se envía un enlace por correo
   - El enlace contiene el token para verificación

2. **JWT**
   - Al verificar el Magic Link, se genera un JWT
   - El token JWT se utiliza para autenticar las solicitudes subsiguientes
   - Duración del token: 24 horas

## Endpoints

### Autenticación
```
POST /api/v1/auth/login
GET  /api/v1/auth/verify
POST /api/v1/auth/logout
```

### Permisos
```
GET    /api/v1/permisos     - Listar todos los permisos
GET    /api/v1/permisos/:id - Obtener un permiso por ID
POST   /api/v1/permisos     - Crear un nuevo permiso
PUT    /api/v1/permisos/:id - Actualizar un permiso
DELETE /api/v1/permisos/:id - Eliminar un permiso
```

## Modelos de Base de Datos

### Permisos
```sql
CREATE TABLE permisos (
    permiso_id  serial PRIMARY KEY,
    nombre      varchar(50) NOT NULL UNIQUE,
    descripcion text
);
```

## Variables de Entorno
```env
# Aplicación
PORT=3000
APP_URL=http://localhost:3000

# JWT
JWT_SECRET=your_super_secret_key_here

# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ssc_db
DB_USER=postgres
DB_PASSWORD=postgres

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_specific_password
MAIL_FROM_NAME=SSC Sistema
MAIL_FROM_ADDRESS=your_email@gmail.com
```

## Seguridad
- Todos los endpoints (excepto auth/login) requieren autenticación JWT
- Los tokens Magic Link son de un solo uso y expiran en 15 minutos
- Los tokens JWT expiran en 24 horas
- Se registra la IP y User-Agent en cada solicitud de acceso
- Validación de datos con class-validator
- Sanitización de entradas
- Manejo de errores centralizado

## Documentación API
- Swagger UI disponible en `/api/docs`
- Colección de Postman actualizada con todos los endpoints
- Ejemplos de requests y responses incluidos

## Dependencias Principales
```json
{
  "@nestjs/common": "latest",
  "@nestjs/core": "latest",
  "@nestjs/swagger": "latest",
  "@nestjs/jwt": "latest",
  "@nestjs/passport": "latest",
  "@nestjs-modules/mailer": "latest",
  "pg": "latest",
  "class-validator": "latest",
  "class-transformer": "latest"
}
```

## Flujo de Autenticación

1. **Solicitud de Magic Link**
   ```mermaid
   sequenceDiagram
   participant U as Usuario
   participant A as API
   participant DB as Base de Datos
   participant E as Email

   U->>A: POST /auth/login (email)
   A->>DB: Verificar usuario
   A->>DB: Crear magic link
   A->>E: Enviar email
   A->>U: 200 OK
   ```

2. **Verificación y Obtención de JWT**
   ```mermaid
   sequenceDiagram
   participant U as Usuario
   participant A as API
   participant DB as Base de Datos

   U->>A: GET /auth/verify (token)
   A->>DB: Verificar token
   A->>DB: Marcar token como usado
   A->>U: JWT Token
   ```

## Manejo de Errores
- 400 Bad Request: Errores de validación
- 401 Unauthorized: Token inválido o expirado
- 404 Not Found: Recurso no encontrado
- 409 Conflict: Conflicto de recursos (ej: nombre duplicado)
- 500 Internal Server Error: Errores del servidor

## Pruebas
- Unit tests con Jest
- E2E tests con Supertest
- Tests de integración para la base de datos

## Monitoreo y Logs
- Health check endpoint: `/api/health`
- Logging de errores y accesos
- Tracking de intentos de acceso fallidos

## Consideraciones de Despliegue
1. Configurar variables de entorno
2. Ejecutar migraciones de base de datos
3. Configurar CORS según necesidad
4. Configurar rate limiting
5. Configurar SSL/TLS 