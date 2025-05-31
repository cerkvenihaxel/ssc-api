# API de Administración de Usuarios - Documentación

## Descripción General

Sistema de administración para crear y gestionar usuarios del sistema (efectores, proveedores, auditores, médicos) con control de permisos granular.

## Autenticación y Permisos

### Requerimientos
- **JWT Token**: Todos los endpoints requieren autenticación
- **Rol Administrador**: Solo usuarios con rol administrador pueden acceder
- **Permisos Específicos**: Cada endpoint verifica permisos granulares

### Permisos del Sistema
- `CREATE_USERS`: Crear usuarios del sistema
- `UPDATE_USERS`: Actualizar usuarios del sistema  
- `DELETE_USERS`: Eliminar usuarios del sistema
- `VIEW_ALL_USERS`: Ver todos los usuarios del sistema
- `VIEW_ANALYTICS`: Ver reportes y analytics

## Endpoints de Administración

### Usuarios Generales

#### GET /v1/admin/users
Obtener todos los usuarios del sistema

**Permisos requeridos:** `VIEW_ALL_USERS`

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)
- `role` (opcional): Filtrar por rol

**Response:**
```json
{
  "users": [
    {
      "user_id": "uuid",
      "email": "usuario@example.com",
      "nombre": "Nombre Usuario",
      "role": {
        "role_id": 1,
        "role_name": "Proveedor"
      },
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 150,
  "message": "Limited functionality - full user system pending implementation"
}
```

#### GET /v1/admin/users/stats
Obtener estadísticas de usuarios

**Permisos requeridos:** `VIEW_ANALYTICS`

**Response:**
```json
{
  "total": 45,
  "by_role": {
    "Proveedor": 25,
    "Auditor": 10,
    "Efector": 8,
    "Médico": 2
  },
  "message": "Limited stats - only providers available until full user system is implemented"
}
```

#### GET /v1/admin/users/:id
Obtener usuario por ID

**Permisos requeridos:** `VIEW_ALL_USERS`

#### PUT /v1/admin/users/:id
Actualizar usuario

**Permisos requeridos:** `UPDATE_USERS`

**Request Body:**
```json
{
  "email": "nuevo@example.com",
  "nombre": "Nuevo Nombre",
  "password": "nueva_contraseña",
  "status": "active"
}
```

#### DELETE /v1/admin/users/:id
Eliminar usuario

**Permisos requeridos:** `DELETE_USERS`

### Proveedores

#### GET /v1/admin/users/providers
Obtener todos los proveedores

**Permisos requeridos:** `VIEW_ALL_USERS`

**Query Parameters:**
- `page` (opcional): Número de página
- `limit` (opcional): Elementos por página

**Response:**
```json
{
  "providers": [
    {
      "providerId": "uuid",
      "providerName": "Farmacia Central S.A.",
      "providerType": "Farmacia",
      "cuit": "20-12345678-9",
      "contactName": "Juan Pérez",
      "contactPhone": "+54911234567",
      "contactEmail": "contacto@farmaciacentral.com",
      "status": "active",
      "creationDate": "2024-01-01T10:00:00Z",
      "lastUpdate": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 25
}
```

#### POST /v1/admin/users/providers
Crear proveedor

**Permisos requeridos:** `CREATE_USERS`

**Request Body:**
```json
{
  "email": "proveedor@example.com",
  "nombre": "Sistema Proveedor Central",
  "role": "Proveedor",
  "provider_name": "Farmacia Central S.A.",
  "provider_type": "Farmacia",
  "cuit": "20-12345678-9",
  "contact_name": "Juan Pérez",
  "contact_phone": "+54911234567",
  "contact_email": "contacto@farmaciacentral.com",
  "status": "active",
  "specialties": ["especialidad-uuid-1", "especialidad-uuid-2"],
  "healthcare_providers": ["obra-social-uuid-1"]
}
```

**Response:**
```json
{
  "provider": {
    "providerId": "uuid",
    "providerName": "Farmacia Central S.A.",
    "providerType": "Farmacia",
    "cuit": "20-12345678-9",
    "contactName": "Juan Pérez",
    "contactPhone": "+54911234567",
    "contactEmail": "contacto@farmaciacentral.com",
    "status": "active",
    "creationDate": "2024-01-01T10:00:00Z"
  },
  "message": "Provider created successfully. User account will be created when full user system is implemented.",
  "temporaryPassword": "TempPass123!"
}
```

#### PUT /v1/admin/users/providers/:id
Actualizar proveedor

**Permisos requeridos:** `UPDATE_USERS`

#### DELETE /v1/admin/users/providers/:id
Eliminar proveedor

**Permisos requeridos:** `DELETE_USERS`

### Efectores

#### POST /v1/admin/users/effectors
Crear efector

**Permisos requeridos:** `CREATE_USERS`

**Request Body:**
```json
{
  "email": "efector@hospital.com",
  "nombre": "Sistema Hospital Central",
  "role": "Afiliado",
  "institution_name": "Hospital Central",
  "institution_type": "Hospital Público",
  "contact_phone": "+54911234567",
  "address": "Av. Corrientes 1234, CABA",
  "department": "Área de Compras",
  "position": "Jefe de Compras"
}
```

### Auditores

#### POST /v1/admin/users/auditors
Crear auditor

**Permisos requeridos:** `CREATE_USERS`

**Request Body:**
```json
{
  "email": "auditor@sistema.com",
  "nombre": "Juan Pérez",
  "role": "Auditor",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "+54911234567",
  "department": "Auditoría Médica",
  "employee_id": "AUD001",
  "permissions": ["APPROVE_REQUESTS", "VIEW_ALL_REQUESTS"]
}
```

### Médicos

#### POST /v1/admin/users/medicos
Crear médico

**Permisos requeridos:** `CREATE_USERS`

**Request Body:**
```json
{
  "email": "medico@hospital.com",
  "nombre": "Dr. María García",
  "role": "Médico",
  "matricula": "12345",
  "especialidad_id": "especialidad-uuid",
  "first_name": "María",
  "last_name": "García",
  "phone": "+54911234567",
  "picture": "https://example.com/foto.jpg",
  "healthcare_providers": ["obra-social-uuid-1", "obra-social-uuid-2"]
}
```

## Operaciones Masivas

#### PATCH /v1/admin/users/bulk-update
Actualización masiva de usuarios

**Permisos requeridos:** `UPDATE_USERS`

**Request Body:**
```json
{
  "user_ids": ["uuid1", "uuid2", "uuid3"],
  "status": "inactive",
  "reason": "Mantenimiento programado"
}
```

#### PATCH /v1/admin/users/:id/permissions
Actualizar permisos de usuario

**Permisos requeridos:** `UPDATE_USERS`

**Request Body:**
```json
{
  "permissions": ["CREATE_QUOTATIONS", "VIEW_ALL_REQUESTS"]
}
```

## Estados del Sistema

### Estados de Usuario
- `active`: Usuario activo
- `inactive`: Usuario inactivo
- `suspended`: Usuario suspendido temporalmente

### Tipos de Proveedor
- `Farmacia`: Farmacia o droguería
- `Laboratorio`: Laboratorio médico
- `Instrumental`: Proveedor de instrumental médico
- `Servicios`: Proveedor de servicios médicos

### Tipos de Institución (Efectores)
- `Hospital Público`: Hospital del sistema público
- `Hospital Privado`: Hospital privado
- `Clínica`: Clínica privada
- `Centro de Salud`: Centro de atención primaria
- `Obra Social`: Obra social o prepaga

## Códigos de Error

- `400 Bad Request`: Datos de entrada inválidos
- `401 Unauthorized`: Token de autenticación inválido
- `403 Forbidden`: Sin permisos para la operación
- `404 Not Found`: Usuario/Recurso no encontrado
- `409 Conflict`: Email/CUIT/Matrícula ya existe
- `500 Internal Server Error`: Error interno del servidor

## Ejemplos de Uso

### Crear Proveedor Completo
```bash
curl -X POST http://localhost:3000/v1/admin/users/providers \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmacia@central.com",
    "nombre": "Sistema Farmacia Central",
    "role": "Proveedor",
    "provider_name": "Farmacia Central S.A.",
    "provider_type": "Farmacia",
    "cuit": "20-12345678-9",
    "contact_name": "Juan Pérez",
    "contact_phone": "+54911234567",
    "contact_email": "contacto@farmaciacentral.com",
    "status": "active"
  }'
```

### Crear Auditor
```bash
curl -X POST http://localhost:3000/v1/admin/users/auditors \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "auditor@sistema.com",
    "nombre": "Juan Pérez",
    "role": "Auditor",
    "first_name": "Juan",
    "last_name": "Pérez",
    "phone": "+54911234567",
    "department": "Auditoría Médica"
  }'
```

### Obtener Estadísticas
```bash
curl -X GET http://localhost:3000/v1/admin/users/stats \
  -H "Authorization: Bearer <admin_token>"
```

### Actualizar Permisos de Usuario
```bash
curl -X PATCH http://localhost:3000/v1/admin/users/{user_id}/permissions \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": ["CREATE_QUOTATIONS", "VIEW_ALL_REQUESTS"]
  }'
```

## Limitaciones Actuales

### Funcionalidad Implementada
✅ Creación y gestión de proveedores  
✅ Sistema de permisos básico  
✅ Validaciones de datos  
✅ Control de acceso por roles  

### Funcionalidad Pendiente
⏳ Sistema de usuarios completo (tabla usuarios)  
⏳ Creación de efectores y auditores  
⏳ Sistema de permisos granular  
⏳ Autenticación integrada para nuevos usuarios  
⏳ Notificaciones por email  

## Seguridad

### Validaciones Implementadas
- Verificación de CUIT único para proveedores
- Validación de matrícula única para médicos
- Control de permisos granular
- Encriptación de contraseñas
- Validación de formatos de email

### Consideraciones de Seguridad
- Solo administradores pueden crear usuarios
- Las contraseñas se generan automáticamente si no se proporcionan
- Los usuarios eliminados no pueden ser recuperados
- Logs de auditoría para todas las operaciones administrativas

## Monitoreo

### Métricas Disponibles
- Número total de usuarios por rol
- Usuarios creados por período
- Operaciones administrativas realizadas
- Errores de autenticación y autorización

### Logs de Auditoría
Todas las operaciones administrativas se registran con:
- Usuario que realizó la operación
- Timestamp de la operación
- Tipo de operación realizada
- Datos modificados
- IP de origen 