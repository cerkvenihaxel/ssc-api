# Documentación Técnica - SSC API

## Autenticación con Magic Links

El sistema implementa un mecanismo de autenticación sin contraseñas utilizando magic links. Este método es seguro y proporciona una experiencia de usuario fluida.

### Endpoints de Autenticación

Base URL: `/api/v1/auth`

#### 1. Solicitar Magic Link

```http
POST /login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta exitosa (200)**
```json
{
  "message": "Se ha enviado un enlace de acceso a tu correo electrónico"
}
```

**Respuesta de error (404)**
```json
{
  "message": "Usuario no encontrado",
  "statusCode": 404
}
```

#### 2. Verificar Magic Link

```http
GET /verify?token=abc123...
```

**Respuesta exitosa (200)**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta de error (401)**
```json
{
  "message": "Link inválido o expirado",
  "statusCode": 401
}
```

#### 3. Cerrar Sesión

```http
POST /logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200)**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

**Respuesta de error (401)**
```json
{
  "message": "No hay token de acceso",
  "statusCode": 401
}
```

### Flujo de Autenticación

1. El usuario solicita acceso proporcionando su correo electrónico
2. El sistema:
   - Verifica que el usuario existe
   - Invalida cualquier magic link activo anterior
   - Genera un nuevo magic link
   - Envía el correo con el enlace
3. El usuario hace clic en el enlace o usa el token
4. El sistema:
   - Verifica que el token sea válido y no haya expirado
   - Marca el magic link como usado
   - Genera y devuelve un JWT
5. El usuario utiliza el JWT para las siguientes peticiones

### Seguridad

- Los magic links expiran después de 15 minutos
- Cada magic link solo puede usarse una vez
- Se registra la IP y User Agent tanto en la solicitud como en el uso
- Los JWT expiran después de 24 horas
- Se implementa rate limiting para prevenir abusos

### Documentación Swagger

La documentación completa de la API está disponible en formato Swagger/OpenAPI:

```
http://localhost:3000/api/docs
```

### Variables de Entorno Requeridas

```env
# Configuración de la aplicación
PORT=3000
APP_URL=http://localhost:3000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ssc_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=no-reply@example.com
``` 