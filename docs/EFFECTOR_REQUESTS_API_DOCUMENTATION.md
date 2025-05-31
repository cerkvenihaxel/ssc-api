# API de Pedidos de Efectores - Documentación

## Descripción General

Este sistema implementa un flujo completo de pedidos de artículos médicos desde efectores hasta proveedores, incluyendo auditoría, cotizaciones y órdenes de provisión.

## Arquitectura

El sistema sigue los principios de Clean Architecture con:
- **Capa de Dominio**: Modelos y interfaces de repositorio
- **Capa de Aplicación**: Servicios con lógica de negocio
- **Capa de Infraestructura**: Implementaciones de repositorios y entidades TypeORM
- **Capa de Presentación**: Controladores REST y DTOs

## Flujo de Trabajo

### 1. Creación de Pedido por Efector
- Un efector crea un pedido con artículos necesarios
- Estado inicial: `PENDIENTE`
- Puede incluir archivos adjuntos (PDF, DOCX)

### 2. Auditoría
- Los auditores revisan y cambian el estado a:
  - `APROBADO`: Pedido aprobado para cotización
  - `RECHAZADO`: Pedido rechazado
  - `CANCELADO`: Pedido cancelado

### 3. Cotización por Proveedores
- Proveedores ven pedidos aprobados según sus permisos
- Pueden cotizar todos o algunos artículos
- Estado del pedido cambia a `EN_COTIZACION` → `COTIZADO`

### 4. Adjudicación
- Se seleccionan los mejores proveedores
- Se crea una orden de provisión
- Estado final: `ADJUDICADO`

### 5. Notificaciones
- Los proveedores reciben notificaciones sobre selección
- Incluye detalles de entrega y puntos de distribución

## Endpoints

### Pedidos de Efectores

#### GET /v1/effector-requests
Obtener todos los pedidos de efectores

**Query Parameters:**
- `effectorId` (opcional): Filtrar por ID del efector
- `state` (opcional): Filtrar por estado

**Response:**
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

#### POST /v1/effector-requests
Crear un nuevo pedido de efector

**Request Body:**
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

#### PATCH /v1/effector-requests/:id/state
Cambiar estado del pedido (solo auditores)

**Request Body:**
```json
{
  "state_name": "APROBADO",
  "observations": "Pedido aprobado para cotización"
}
```

#### POST /v1/effector-requests/:id/attachments
Subir archivos adjuntos

**Content-Type:** `multipart/form-data`
**Form Data:**
- `files`: Archivos PDF o DOCX (máximo 10 archivos, 10MB cada uno)

### Cotizaciones de Proveedores

#### GET /v1/provider-quotations/available-requests
Obtener pedidos disponibles para cotizar

**Response:**
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

#### POST /v1/provider-quotations
Crear cotización

**Request Body:**
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

#### PUT /v1/provider-quotations/:id/submit
Enviar cotización

### Órdenes de Provisión

#### POST /v1/provision-orders
Crear orden de provisión (seleccionar proveedores)

**Request Body:**
```json
{
  "request_id": "uuid",
  "delivery_date": "2024-01-20",
  "delivery_address": "Hospital Central - Depósito",
  "observations": "Entrega coordinada",
  "selected_quotations": [
    {
      "quotation_id": "uuid",
      "selected_amount": 14000.00,
      "delivery_points": "Depósito principal, Farmacia"
    }
  ]
}
```

## Estados del Sistema

### Estados de Pedidos
- `PENDIENTE`: Pedido creado, esperando auditoría
- `APROBADO`: Pedido aprobado para cotización
- `RECHAZADO`: Pedido rechazado por auditoría
- `CANCELADO`: Pedido cancelado
- `EN_COTIZACION`: Pedido en proceso de cotización
- `COTIZADO`: Pedido con cotizaciones recibidas
- `ADJUDICADO`: Pedido adjudicado a proveedores

### Estados de Cotizaciones
- `BORRADOR`: Cotización en preparación
- `ENVIADA`: Cotización enviada para evaluación
- `ACEPTADA`: Cotización aceptada
- `RECHAZADA`: Cotización rechazada
- `CANCELADA`: Cotización cancelada

### Estados de Órdenes
- `CREADA`: Orden creada
- `ENVIADA`: Orden enviada a proveedores
- `CONFIRMADA`: Orden confirmada por proveedores
- `ENTREGADA`: Orden entregada
- `CANCELADA`: Orden cancelada

## Reglas de Negocio

### Transiciones de Estado Válidas
```
PENDIENTE → [APROBADO, RECHAZADO, CANCELADO]
APROBADO → [EN_COTIZACION, CANCELADO]
EN_COTIZACION → [COTIZADO, CANCELADO]
COTIZADO → [ADJUDICADO, CANCELADO]
RECHAZADO → [] (estado final)
CANCELADO → [] (estado final)
ADJUDICADO → [] (estado final)
```

### Validaciones
- Solo se pueden eliminar pedidos en estado `PENDIENTE`, `RECHAZADO` o `CANCELADO`
- Los proveedores solo pueden ver pedidos en estado `APROBADO` o `EN_COTIZACION`
- Las cotizaciones solo pueden crearse para pedidos `APROBADOS`
- Solo se pueden adjudicar pedidos `COTIZADOS`

## Autenticación

Todos los endpoints requieren autenticación JWT:
```
Authorization: Bearer <jwt_token>
```

El token debe contener:
- `userId`: ID del usuario
- `role`: Rol del usuario (efector, proveedor, auditor, admin)
- `providerId`: ID del proveedor (solo para proveedores)

## Códigos de Error

- `400 Bad Request`: Datos de entrada inválidos
- `401 Unauthorized`: Token de autenticación inválido
- `403 Forbidden`: Sin permisos para la operación
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto de estado o datos duplicados
- `500 Internal Server Error`: Error interno del servidor

## Ejemplos de Uso

### Flujo Completo

1. **Efector crea pedido:**
```bash
POST /v1/effector-requests
Authorization: Bearer <efector_token>
```

2. **Auditor aprueba pedido:**
```bash
PATCH /v1/effector-requests/{id}/state
Authorization: Bearer <auditor_token>
{
  "state_name": "APROBADO"
}
```

3. **Proveedor ve pedidos disponibles:**
```bash
GET /v1/provider-quotations/available-requests
Authorization: Bearer <provider_token>
```

4. **Proveedor crea cotización:**
```bash
POST /v1/provider-quotations
Authorization: Bearer <provider_token>
```

5. **Proveedor envía cotización:**
```bash
PUT /v1/provider-quotations/{id}/submit
Authorization: Bearer <provider_token>
```

6. **Admin crea orden de provisión:**
```bash
POST /v1/provision-orders
Authorization: Bearer <admin_token>
```

## Base de Datos

### Tablas Principales
- `effector_requests`: Pedidos de efectores
- `effector_request_items`: Artículos solicitados
- `effector_request_attachments`: Archivos adjuntos
- `provider_quotations`: Cotizaciones de proveedores
- `provider_quotation_items`: Artículos cotizados
- `provision_orders`: Órdenes de provisión
- `notifications`: Notificaciones del sistema

### Índices Recomendados
- `idx_effector_requests_effector_id`
- `idx_effector_requests_state`
- `idx_provider_quotations_request_id`
- `idx_provider_quotations_provider_id`
- `idx_notifications_user_id` 