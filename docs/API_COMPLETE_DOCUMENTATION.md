# API SSC - Documentación Completa de Endpoints

## Índice

1. [Descripción General](#descripción-general)
2. [Configuración Base](#configuración-base)
3. [Resumen de Endpoints](#resumen-de-endpoints)
4. [AUTENTICACIÓN](#1-autenticación)
5. [PEDIDOS DE EFECTORES](#2-pedidos-de-efectores)
6. [COTIZACIONES DE PROVEEDORES](#3-cotizaciones-de-proveedores)
7. [GESTIÓN DE USUARIOS (ADMIN)](#4-gestión-de-usuarios-admin)
8. [PROVEEDORES](#5-proveedores)
9. [OBRAS SOCIALES](#6-obras-sociales)
10. [AFILIADOS](#7-afiliados)
11. [DIRECCIONES](#8-direcciones)
12. [PERMISOS](#9-permisos)
13. [HEALTH CHECK](#10-health-check)
14. [Códigos de Estado](#códigos-de-estado-http)
15. [Manejo de Errores](#manejo-de-errores)
16. [Paginación](#paginación)
17. [Filtros y Búsqueda](#filtros-y-búsqueda)
18. [Integración con Frontend](#integración-con-frontend)

## Descripción General

Este documento consolida todos los endpoints del sistema SSC (Sistema de Salud Conectado), incluyendo métodos de acceso, parámetros requeridos y estructuras de datos para integración con el frontend.

**Funcionalidades principales:**
- Sistema de autenticación con Magic Links
- Gestión de pedidos de efectores (hospitales/clínicas)
- Sistema de cotizaciones para proveedores
- Administración de usuarios con permisos granulares
- Gestión de obras sociales y afiliados
- Direcciones y datos de contacto

## Configuración Base

- **URL Base**: `https://api.ssc.com.ar`
- **Autenticación**: JWT Token Bearer
- **Content-Type**: `application/json`
- **Formato de Respuesta**: JSON

## Resumen de Endpoints

### Autenticación (6 endpoints)
- `POST /v1/auth/login` - Solicitar magic link
- `GET /v1/auth/verify` - Verificar magic link y obtener token
- `GET /v1/auth/me` - Obtener usuario actual
- `POST /v1/auth/refresh` - Refrescar token
- `POST /v1/auth/logout` - Cerrar sesión
- `GET /v1/auth/validate` - Validar token

### Pedidos de Efectores (7 endpoints)
- `GET /v1/effector-requests` - Listar pedidos
- `GET /v1/effector-requests/{id}` - Obtener pedido por ID
- `POST /v1/effector-requests` - Crear pedido
- `PUT /v1/effector-requests/{id}` - Actualizar pedido
- `PATCH /v1/effector-requests/{id}/state` - Cambiar estado (auditores)
- `POST /v1/effector-requests/{id}/attachments` - Subir archivos
- `DELETE /v1/effector-requests/{id}` - Eliminar pedido

### Cotizaciones de Proveedores (6 endpoints)
- `GET /v1/provider-quotations/available-requests` - Pedidos disponibles para cotizar
- `POST /v1/provider-quotations` - Crear cotización
- `GET /v1/provider-quotations/my-quotations` - Mis cotizaciones
- `GET /v1/provider-quotations/{id}` - Detalle de cotización
- `PUT /v1/provider-quotations/{id}` - Actualizar cotización
- `DELETE /v1/provider-quotations/{id}` - Eliminar cotización

### Administración de Usuarios (10 endpoints)
- `GET /v1/admin/users` - Listar usuarios
- `GET /v1/admin/users/stats` - Estadísticas de usuarios
- `GET /v1/admin/users/{id}` - Usuario por ID
- `PUT /v1/admin/users/{id}` - Actualizar usuario
- `PATCH /v1/admin/users/{id}/permissions` - Actualizar permisos
- `PATCH /v1/admin/users/bulk-update` - Actualización masiva
- `DELETE /v1/admin/users/{id}` - Eliminar usuario
- `GET /v1/admin/users/providers` - Listar proveedores
- `POST /v1/admin/users/providers` - Crear proveedor
- `POST /v1/admin/users/effectors` - Crear efector

### Proveedores (5 endpoints)
- `GET /v1/proveedores` - Listar proveedores
- `GET /v1/proveedores/{id}` - Proveedor por ID
- `POST /v1/proveedores` - Crear proveedor
- `PUT /v1/proveedores/{id}` - Actualizar proveedor
- `DELETE /v1/proveedores/{id}` - Eliminar proveedor

### Obras Sociales (5 endpoints)
- `GET /v1/obras-sociales` - Listar obras sociales
- `GET /v1/obras-sociales/{id}` - Obra social por ID
- `POST /v1/obras-sociales` - Crear obra social
- `PUT /v1/obras-sociales/{id}` - Actualizar obra social
- `DELETE /v1/obras-sociales/{id}` - Eliminar obra social

### Afiliados (5 endpoints)
- `GET /v1/afiliados` - Listar afiliados
- `GET /v1/afiliados/{id}` - Afiliado por ID
- `POST /v1/afiliados` - Crear afiliado
- `PUT /v1/afiliados/{id}` - Actualizar afiliado
- `DELETE /v1/afiliados/{id}` - Eliminar afiliado

### Direcciones (5 endpoints)
- `GET /v1/address` - Listar direcciones
- `GET /v1/address/{id}` - Dirección por ID
- `POST /v1/address` - Crear dirección
- `PUT /v1/address/{id}` - Actualizar dirección
- `DELETE /v1/address/{id}` - Eliminar dirección

### Permisos (5 endpoints)
- `GET /v1/permisos` - Listar permisos
- `GET /v1/permisos/{id}` - Permiso por ID
- `POST /v1/permisos` - Crear permiso
- `PUT /v1/permisos/{id}` - Actualizar permiso
- `DELETE /v1/permisos/{id}` - Eliminar permiso

### Health Check (1 endpoint)
- `GET /health` - Verificar estado del servidor

**Total: 55 endpoints**

---

## 1. AUTENTICACIÓN

### 1.1 Solicitar Magic Link
**POST** `/v1/auth/login`

**Descripción**: Solicita un enlace de acceso que se envía por email

**Request Body**:
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Response**:
```json
{
  "message": "Se ha enviado un enlace de acceso a tu correo electrónico"
}
```

**Mapeo Frontend**:
- Campo: `email` (input type="email", required)
- Validación: formato email válido
- Mensaje de éxito: mostrar response.message

### 1.2 Verificar Magic Link
**GET** `/v1/auth/verify?token={token}`

**Descripción**: Verifica el magic link y devuelve token JWT con información del usuario

**Query Parameters**:
- `token` (string, required): Token recibido por email

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": {
    "userId": "uuid",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan Pérez",
    "role": {
      "roleId": 1,
      "roleName": "Proveedor",
      "permissions": ["CREATE_QUOTATIONS", "VIEW_REQUESTS"]
    }
  }
}
```

**Mapeo Frontend**:
- Guardar `accessToken` en localStorage/sessionStorage
- Configurar header Authorization: `Bearer {accessToken}`
- Guardar datos de usuario en estado global
- Redirigir según `role.defaultRoute`

### 1.3 Obtener Usuario Actual
**GET** `/v1/auth/me`
**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "userId": "uuid",
  "email": "usuario@ejemplo.com",
  "nombre": "Juan Pérez",
  "role": {
    "roleId": 1,
    "roleName": "Proveedor",
    "permissions": ["CREATE_QUOTATIONS", "VIEW_REQUESTS"]
  }
}
```

### 1.4 Refrescar Token
**POST** `/v1/auth/refresh`
**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### 1.5 Cerrar Sesión
**POST** `/v1/auth/logout`
**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

### 1.6 Validar Token
**GET** `/v1/auth/validate`
**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "valid": true,
  "user": {
    "userId": "string",
    "email": "string",
    "roleId": 1
  }
}
```

---

## 2. PEDIDOS DE EFECTORES

### 2.1 Obtener Todos los Pedidos
**GET** `/v1/effector-requests`
**Headers**: `Authorization: Bearer {token}`

**Query Parameters** (opcionales):
- `effectorId` (string): Filtrar por ID del efector
- `state` (string): Filtrar por estado (PENDIENTE, APROBADO, RECHAZADO, etc.)

**Response**:
```json
[
  {
    "request_id": "uuid",
    "effector_id": "uuid",
    "request_number": "REQ-1234567890",
    "title": "Pedido de insumos médicos",
    "description": "Descripción del pedido",
    "state": {
      "state_id": "uuid",
      "state_name": "PENDIENTE",
      "description": "Pedido pendiente de auditoría"
    },
    "priority": "NORMAL",
    "delivery_date": "2024-01-15",
    "delivery_address": "Hospital Central",
    "contact_person": "Dr. Juan Pérez",
    "contact_phone": "+54911234567",
    "contact_email": "juan.perez@hospital.com",
    "total_estimated_amount": 15000.50,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z",
    "items": [
      {
        "item_id": "uuid",
        "article_code": "MED001",
        "article_name": "Jeringa 10ml",
        "description": "Jeringa descartable de 10ml",
        "quantity": 100,
        "unit_measure": "unidad",
        "expiration_date": "2025-01-01",
        "technical_specifications": "Estéril, descartable",
        "estimated_unit_price": 150.00,
        "estimated_total_price": 15000.00
      }
    ],
    "attachments": [
      {
        "attachment_id": "uuid",
        "file_name": "especificaciones.pdf",
        "file_path": "/uploads/requests/uuid/especificaciones.pdf",
        "file_type": "pdf",
        "file_size": 1024000,
        "uploaded_at": "2024-01-01T10:00:00Z"
      }
    ]
  }
]
```

**Mapeo Frontend**:
- Tabla con columnas: request_number, title, state.state_name, delivery_date, total_estimated_amount
- Filtros por estado y efector
- Acciones: Ver detalle, Editar (si estado permite), Eliminar
- Estados con colores: PENDIENTE (amarillo), APROBADO (verde), RECHAZADO (rojo)

### 2.2 Obtener Pedido por ID
**GET** `/v1/effector-requests/{id}`
**Headers**: `Authorization: Bearer {token}`

**Response**: Mismo formato que el anterior, pero un solo objeto

### 2.3 Crear Nuevo Pedido
**POST** `/v1/effector-requests`
**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "title": "Pedido de insumos médicos",
  "description": "Descripción del pedido",
  "priority": "NORMAL",
  "delivery_date": "2024-01-15",
  "delivery_address": "Hospital Central",
  "contact_person": "Dr. Juan Pérez",
  "contact_phone": "+54911234567",
  "contact_email": "juan.perez@hospital.com",
  "items": [
    {
      "article_code": "MED001",
      "article_name": "Jeringa 10ml",
      "description": "Jeringa descartable de 10ml",
      "quantity": 100,
      "unit_measure": "unidad",
      "expiration_date": "2025-01-01",
      "technical_specifications": "Estéril, descartable",
      "estimated_unit_price": 150.00,
      "estimated_total_price": 15000.00
    }
  ]
}
```

**Mapeo Frontend**:
- Formulario con validaciones:
  - `title`: string, requerido, max 200 caracteres
  - `description`: textarea, opcional
  - `priority`: select (BAJA, NORMAL, ALTA, URGENTE)
  - `delivery_date`: date picker, requerido, fecha futura
  - `contact_email`: email válido
  - `items`: array dinámico con botón "Agregar artículo"

### 2.4 Actualizar Pedido
**PUT** `/v1/effector-requests/{id}`
**Headers**: `Authorization: Bearer {token}`

**Request Body**: Mismo formato que crear pedido

### 2.5 Cambiar Estado del Pedido (Auditores)
**PATCH** `/v1/effector-requests/{id}/state`
**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "state_name": "APROBADO",
  "observations": "Pedido aprobado para cotización"
}
```

**Mapeo Frontend**:
- Solo visible para rol "Auditor"
- Select con estados disponibles según flujo
- Campo de observaciones obligatorio para rechazos

### 2.6 Subir Archivos Adjuntos
**POST** `/v1/effector-requests/{id}/attachments`
**Headers**: `Authorization: Bearer {token}`
**Content-Type**: `multipart/form-data`

**Form Data**:
- `files`: Archivos PDF o DOCX (máximo 10 archivos, 10MB cada uno)

**Mapeo Frontend**:
- Drag & drop zone
- Validación de tipo de archivo (PDF, DOCX)
- Validación de tamaño (10MB máximo)
- Lista de archivos subidos con opción de eliminar

### 2.7 Eliminar Pedido
**DELETE** `/v1/effector-requests/{id}`
**Headers**: `Authorization: Bearer {token}`

---

## 3. COTIZACIONES DE PROVEEDORES

### 3.1 Obtener Pedidos Disponibles para Cotizar
**GET** `/v1/provider-quotations/available-requests`
**Headers**: `Authorization: Bearer {token}`

**Descripción**: Obtiene los pedidos que están aprobados y disponibles para que el proveedor pueda cotizar

**Response**:
```json
[
  {
    "request_id": "uuid",
    "request_number": "REQ-1234567890",
    "title": "Pedido de insumos médicos",
    "effector_name": "Hospital Central",
    "delivery_date": "2024-01-15",
    "items": [
      {
        "item_id": "uuid",
        "article_name": "Jeringa 10ml",
        "description": "Jeringa descartable de 10ml",
        "quantity": 100,
        "unit_measure": "unidad"
      }
    ]
  }
]
```

**Mapeo Frontend**:
- Cards o tabla con pedidos disponibles
- Filtros por fecha de entrega, tipo de artículo
- Botón "Cotizar" para cada pedido
- Vista previa de artículos antes de cotizar

### 3.2 Crear Cotización
**POST** `/v1/provider-quotations`
**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "request_id": "uuid",
  "delivery_time_days": 15,
  "delivery_terms": "Entrega en hospital",
  "payment_terms": "30 días",
  "warranty_terms": "12 meses",
  "observations": "Productos de primera calidad",
  "valid_until": "2024-02-01",
  "items": [
    {
      "request_item_id": "uuid",
      "unit_price": 140.00,
      "quantity": 100,
      "delivery_time_days": 10,
      "observations": "Disponible inmediatamente"
    }
  ]
}
```

**Response**:
```json
{
  "quotation_id": "uuid",
  "quotation_number": "COT-1234567890",
  "status": "ENVIADA",
  "total_amount": 14000.00,
  "created_at": "2024-01-01T10:00:00Z",
  "valid_until": "2024-02-01"
}
```

**Mapeo Frontend**:
- Formulario de cotización con:
  - Lista de artículos del pedido (solo lectura)
  - Precio unitario por artículo (input numérico)
  - Cantidad disponible por artículo
  - Tiempos de entrega
  - Términos y condiciones
  - Observaciones por artículo
- Cálculo automático de total
- Validación de fechas de validez

### 3.3 Obtener Mis Cotizaciones
**GET** `/v1/provider-quotations/my-quotations`
**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `status` (string): Filtrar por estado (ENVIADA, ADJUDICADA, RECHAZADA)
- `date_from` (date): Desde fecha
- `date_to` (date): Hasta fecha

**Response**:
```json
[
  {
    "quotation_id": "uuid",
    "quotation_number": "COT-1234567890",
    "request": {
      "request_number": "REQ-1234567890",
      "title": "Pedido de insumos médicos",
      "effector_name": "Hospital Central"
    },
    "status": "ADJUDICADA",
    "total_amount": 14000.00,
    "created_at": "2024-01-01T10:00:00Z",
    "valid_until": "2024-02-01",
    "adjudication_date": "2024-01-05T10:00:00Z"
  }
]
```

### 3.4 Obtener Detalle de Cotización
**GET** `/v1/provider-quotations/{id}`
**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "quotation_id": "uuid",
  "quotation_number": "COT-1234567890",
  "request": {
    "request_id": "uuid",
    "request_number": "REQ-1234567890",
    "title": "Pedido de insumos médicos",
    "effector_name": "Hospital Central",
    "delivery_address": "Hospital Central, Av. Corrientes 1234",
    "contact_person": "Dr. Juan Pérez",
    "contact_email": "juan.perez@hospital.com"
  },
  "status": "ADJUDICADA",
  "delivery_time_days": 15,
  "delivery_terms": "Entrega en hospital",
  "payment_terms": "30 días",
  "warranty_terms": "12 meses",
  "observations": "Productos de primera calidad",
  "total_amount": 14000.00,
  "created_at": "2024-01-01T10:00:00Z",
  "valid_until": "2024-02-01",
  "items": [
    {
      "quotation_item_id": "uuid",
      "article_name": "Jeringa 10ml",
      "quantity": 100,
      "unit_price": 140.00,
      "total_price": 14000.00,
      "delivery_time_days": 10,
      "observations": "Disponible inmediatamente"
    }
  ]
}
```

### 3.5 Actualizar Cotización (si aún no fue adjudicada)
**PUT** `/v1/provider-quotations/{id}`
**Headers**: `Authorization: Bearer {token}`

**Request Body**: Mismo formato que crear cotización

### 3.6 Eliminar Cotización
**DELETE** `/v1/provider-quotations/{id}`
**Headers**: `Authorization: Bearer {token}`

---

## 4. GESTIÓN DE USUARIOS (ADMIN)

### 4.1 Obtener Todos los Usuarios
**GET** `/v1/admin/users`
**Headers**: `Authorization: Bearer {token}`
**Permisos**: `VIEW_ALL_USERS`

**Query Parameters**:
- `page` (number): Número de página (default: 1)
- `limit` (number): Elementos por página (default: 10)
- `role` (string): Filtrar por rol

**Response**:
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

### 4.2 Estadísticas de Usuarios
**GET** `/v1/admin/users/stats`
**Headers**: `Authorization: Bearer {token}`
**Permisos**: `VIEW_ANALYTICS`

**Response**:
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

### 4.3 Obtener Usuario por ID
**GET** `/v1/admin/users/{id}`
**Headers**: `Authorization: Bearer {token}`
**Permisos**: `VIEW_ALL_USERS`

### 4.4 Actualizar Usuario
**PUT** `/v1/admin/users/{id}`
**Headers**: `Authorization: Bearer {token}`
**Permisos**: `UPDATE_USERS`

**Request Body**:
```json
{
  "email": "nuevo@example.com",
  "nombre": "Nuevo Nombre",
  "password": "nueva_contraseña",
  "status": "active"
}
```

### 4.5 Actualizar Permisos de Usuario
**PATCH** `/v1/admin/users/{id}/permissions`
**Headers**: `Authorization: Bearer {token}`
**Permisos**: `UPDATE_USERS`

### 4.6 Actualización Masiva de Usuarios
**PATCH** `/v1/admin/users/bulk-update`
**Headers**: `Authorization: Bearer {token}`
**Permisos**: `UPDATE_USERS`

### 4.7 Eliminar Usuario
**DELETE** `/v1/admin/users/{id}`
**Headers**: `Authorization: Bearer {token}`
**Permisos**: `DELETE_USERS`

### 4.8 Obtener Todos los Proveedores
**GET** `/v1/admin/users/providers`
**Headers**: `Authorization: Bearer {token}`
**Permisos**: `VIEW_ALL_USERS`

**Response**:
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

### 4.9 Crear Proveedor
**POST** `/v1/admin/users/providers`
**Headers**: `Authorization: Bearer {token}`
**Permisos**: `CREATE_USERS`

**Request Body**:
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

### 4.10 Crear Efector
**POST** `/v1/admin/users/effectors`
**Headers**: `Authorization: Bearer {token}`
**Permisos**: `CREATE_USERS`

---

## 5. PROVEEDORES

### 5.1 Obtener Todos los Proveedores
**GET** `/v1/proveedores`
**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
[
  {
    "proveedor_id": "uuid",
    "nombre": "Farmacia Central S.A.",
    "tipo": "Farmacia",
    "cuit": "20-12345678-9",
    "email": "contacto@farmaciacentral.com",
    "telefono": "+54911234567",
    "direccion": "Av. Corrientes 1234",
    "estado": "activo",
    "fecha_creacion": "2024-01-01T10:00:00Z"
  }
]
```

### 5.2 Obtener Proveedor por ID
**GET** `/v1/proveedores/{id}`
**Headers**: `Authorization: Bearer {token}`

### 5.3 Crear Proveedor
**POST** `/v1/proveedores`
**Headers**: `Authorization: Bearer {token}`

### 5.4 Actualizar Proveedor
**PUT** `/v1/proveedores/{id}`
**Headers**: `Authorization: Bearer {token}`

### 5.5 Eliminar Proveedor
**DELETE** `/v1/proveedores/{id}`
**Headers**: `Authorization: Bearer {token}`

---

## 6. OBRAS SOCIALES

### 6.1 Obtener Todas las Obras Sociales
**GET** `/v1/obras-sociales`
**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
[
  {
    "obra_social_id": "uuid",
    "nombre": "OSDE",
    "codigo": "OS001",
    "tipo": "Prepaga",
    "email": "contacto@osde.com.ar",
    "telefono": "+54114567890",
    "direccion": "Av. Santa Fe 1234",
    "estado": "activo",
    "fecha_creacion": "2024-01-01T10:00:00Z"
  }
]
```

### 6.2 Obtener Obra Social por ID
**GET** `/v1/obras-sociales/{id}`
**Headers**: `Authorization: Bearer {token}`

### 6.3 Crear Obra Social
**POST** `/v1/obras-sociales`
**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "nombre": "OSDE",
  "codigo": "OS001",
  "tipo": "Prepaga",
  "email": "contacto@osde.com.ar",
  "telefono": "+54114567890",
  "direccion": "Av. Santa Fe 1234"
}
```

### 6.4 Actualizar Obra Social
**PUT** `/v1/obras-sociales/{id}`
**Headers**: `Authorization: Bearer {token}`

### 6.5 Eliminar Obra Social
**DELETE** `/v1/obras-sociales/{id}`
**Headers**: `Authorization: Bearer {token}`

---

## 7. AFILIADOS

### 7.1 Obtener Todos los Afiliados
**GET** `/v1/afiliados`
**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
[
  {
    "afiliado_id": "uuid",
    "numero_afiliado": "12345678",
    "cuil": "20-12345678-9",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan.perez@email.com",
    "telefono": "+54911234567",
    "fecha_nacimiento": "1980-01-01",
    "genero": "M",
    "obra_social_id": "uuid",
    "estado": "activo",
    "fecha_alta": "2024-01-01T10:00:00Z"
  }
]
```

### 7.2 Obtener Afiliado por ID
**GET** `/v1/afiliados/{id}`
**Headers**: `Authorization: Bearer {token}`

### 7.3 Crear Afiliado
**POST** `/v1/afiliados`
**Headers**: `Authorization: Bearer {token}`

### 7.4 Actualizar Afiliado
**PUT** `/v1/afiliados/{id}`
**Headers**: `Authorization: Bearer {token}`

### 7.5 Eliminar Afiliado
**DELETE** `/v1/afiliados/{id}`
**Headers**: `Authorization: Bearer {token}`

---

## 8. DIRECCIONES

### 8.1 Obtener Todas las Direcciones
**GET** `/v1/address`
**Headers**: `Authorization: Bearer {token}`

### 8.2 Obtener Dirección por ID
**GET** `/v1/address/{id}`
**Headers**: `Authorization: Bearer {token}`

### 8.3 Crear Dirección
**POST** `/v1/address`
**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "calle": "Av. Corrientes",
  "numero": "1234",
  "piso": "5",
  "departamento": "A",
  "codigo_postal": "C1043AAZ",
  "ciudad": "Buenos Aires",
  "provincia": "CABA",
  "pais": "Argentina"
}
```

### 8.4 Actualizar Dirección
**PUT** `/v1/address/{id}`
**Headers**: `Authorization: Bearer {token}`

### 8.5 Eliminar Dirección
**DELETE** `/v1/address/{id}`
**Headers**: `Authorization: Bearer {token}`

---

## 9. PERMISOS

### 9.1 Obtener Todos los Permisos
**GET** `/v1/permisos`
**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
[
  {
    "permiso_id": 1,
    "nombre": "CREATE_USERS",
    "descripcion": "Crear usuarios del sistema",
    "categoria": "Usuarios",
    "activo": true
  }
]
```

### 9.2 Obtener Permiso por ID
**GET** `/v1/permisos/{id}`
**Headers**: `Authorization: Bearer {token}`

### 9.3 Crear Permiso
**POST** `/v1/permisos`
**Headers**: `Authorization: Bearer {token}`

### 9.4 Actualizar Permiso
**PUT** `/v1/permisos/{id}`
**Headers**: `Authorization: Bearer {token}`

### 9.5 Eliminar Permiso
**DELETE** `/v1/permisos/{id}`
**Headers**: `Authorization: Bearer {token}`

---

## 10. HEALTH CHECK

### 10.1 Verificar Estado del Servidor
**GET** `/health`

**Response**:
```json
{
  "status": "ok"
}
```

---

## CÓDIGOS DE ESTADO HTTP

- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente
- **204 No Content**: Operación exitosa sin contenido
- **400 Bad Request**: Datos de entrada inválidos
- **401 Unauthorized**: No autorizado - token inválido o faltante
- **403 Forbidden**: Acceso denegado - permisos insuficientes
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto - recurso ya existe
- **500 Internal Server Error**: Error interno del servidor

---

## MANEJO DE ERRORES

Todas las respuestas de error siguen este formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de entrada inválidos",
    "details": [
      {
        "field": "email",
        "message": "Email no válido"
      }
    ]
  },
  "timestamp": "2024-01-01T10:00:00Z",
  "path": "/v1/auth/login"
}
```

---

## PAGINACIÓN

Los endpoints que devuelven listas admiten paginación:

**Query Parameters**:
- `page`: Número de página (comenzando en 1)
- `limit`: Elementos por página (máximo 100)

**Respuesta**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## FILTROS Y BÚSQUEDA

Muchos endpoints admiten filtros mediante query parameters:

- `search`: Búsqueda de texto libre
- `status`: Filtrar por estado
- `date_from` / `date_to`: Filtrar por rango de fechas
- `sort`: Campo de ordenamiento
- `order`: Dirección de ordenamiento (asc/desc)

**Ejemplo**:
```
GET /v1/effector-requests?search=jeringa&status=PENDIENTE&sort=created_at&order=desc
```

---

## INTEGRACIÓN CON FRONTEND

### Configuración de Axios
```javascript
// config/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.ssc.com.ar',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Estados de Loading y Error
```javascript
// hooks/useApi.js
import { useState } from 'react';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = async (apiFunction) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction();
      return result;
    } catch (err) {
      setError(err.response?.data?.error || 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, apiCall };
};
```

### Validación de Formularios
```javascript
// utils/validation.js
export const validationRules = {
  email: {
    required: 'Email es requerido',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Email no válido'
    }
  },
  phone: {
    pattern: {
      value: /^\+54\d{10,11}$/,
      message: 'Teléfono debe tener formato +54XXXXXXXXX'
    }
  },
  cuit: {
    pattern: {
      value: /^\d{2}-\d{8}-\d$/,
      message: 'CUIT debe tener formato XX-XXXXXXXX-X'
    }
  }
};
``` 