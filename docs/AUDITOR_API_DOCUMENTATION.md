# 🛡️ API DE AUDITORÍA - DOCUMENTACIÓN COMPLETA

## 📋 RESUMEN

La API de Auditoría permite a los auditores y administradores gestionar el proceso de auditoría de cotizaciones de proveedores. Incluye funcionalidades para revisar, aprobar o rechazar cotizaciones, así como generar estadísticas del proceso de auditoría.

## 🔐 AUTENTICACIÓN

Todos los endpoints requieren autenticación JWT:

```
Authorization: Bearer {token}
Content-Type: application/json
```

## 👥 PERMISOS REQUERIDOS

- **Auditor**: Acceso completo al módulo
- **Administrador**: Acceso completo al módulo
- **Proveedor**: Solo lectura de sus propias cotizaciones

## 📡 ENDPOINTS

### 1. GET /api/auditor/pending-quotations

**Descripción**: Obtener cotizaciones pendientes de auditoría

**Query Parameters**:
- `status` (opcional): Filtrar por estado de cotización
- `provider_id` (opcional): Filtrar por proveedor
- `date_from` (opcional): Fecha desde (YYYY-MM-DD)
- `date_to` (opcional): Fecha hasta (YYYY-MM-DD)
- `patient_name` (opcional): Filtrar por nombre de paciente
- `medical_order_id` (opcional): Filtrar por orden médica
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "quotation_id": "uuid",
        "medical_order_id": "uuid",
        "provider_id": "uuid",
        "provider_name": "string",
        "patient_name": "string",
        "total_cost": "number",
        "delivery_days": "number",
        "items_count": "number",
        "status": "pending|sent|approved|rejected|completed",
        "created_at": "ISO 8601 date string",
        "updated_at": "ISO 8601 date string",
        "items": [
          {
            "item_id": "uuid",
            "name": "string",
            "description": "string|null",
            "quantity": "number",
            "unit_cost": "number",
            "total_cost": "number",
            "category": "string|null"
          }
        ],
        "medical_order": {
          "medical_order_id": "uuid",
          "patient_name": "string",
          "doctor_name": "string|null",
          "specialty": "string[]",
          "urgency": "low|medium|high",
          "created_at": "ISO 8601 date string"
        }
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number",
    "total_pages": "number"
  }
}
```

### 2. GET /api/auditor/quotations/{id}

**Descripción**: Obtener detalle de una cotización específica

**Path Parameters**:
- `id`: ID de la cotización

**Response**:
```json
{
  "success": true,
  "data": {
    "quotation_id": "uuid",
    "medical_order_id": "uuid",
    "provider_id": "uuid",
    "provider_name": "string",
    "patient_name": "string",
    "total_cost": "number",
    "delivery_days": "number",
    "items_count": "number",
    "status": "pending|sent|approved|rejected|completed",
    "created_at": "ISO 8601 date string",
    "updated_at": "ISO 8601 date string",
    "items": [
      {
        "item_id": "uuid",
        "name": "string",
        "description": "string|null",
        "quantity": "number",
        "unit_cost": "number",
        "total_cost": "number",
        "category": "string|null"
      }
    ],
    "medical_order": {
      "medical_order_id": "uuid",
      "patient_name": "string",
      "doctor_name": "string|null",
      "specialty": "string[]",
      "urgency": "low|medium|high",
      "created_at": "ISO 8601 date string"
    }
  }
}
```

### 3. GET /api/auditor/completed-requests

**Descripción**: Obtener solicitudes de auditoría finalizadas

**Query Parameters**: Mismos que pending-quotations

**Response**: Misma estructura que pending-quotations pero con datos de auditoría

### 4. POST /api/auditor/audit-requests

**Descripción**: Crear una nueva solicitud de auditoría

**Request Body**:
```json
{
  "quotation_id": "uuid",
  "medical_order_id": "uuid",
  "provider_id": "uuid",
  "audit_type": "manual|ai|hybrid",
  "auditor_notes": "string|null"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "audit_request_id": "uuid",
    "quotation_id": "uuid",
    "medical_order_id": "uuid",
    "provider_id": "uuid",
    "audit_status": "pending",
    "audit_type": "manual|ai|hybrid",
    "created_at": "ISO 8601 date string"
  }
}
```

### 5. PUT /api/auditor/audit-requests/{id}

**Descripción**: Actualizar una solicitud de auditoría (aprobar/rechazar)

**Path Parameters**:
- `id`: ID de la solicitud de auditoría

**Request Body**:
```json
{
  "audit_status": "approved|rejected|completed",
  "auditor_notes": "string|null",
  "rejection_reason": "string|null",
  "approved_cost": "number|null",
  "audit_criteria": {
    "price_reasonable": "boolean",
    "quality_adequate": "boolean",
    "delivery_time_acceptable": "boolean",
    "provider_reliable": "boolean",
    "documentation_complete": "boolean"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "audit_request_id": "uuid",
    "audit_status": "approved|rejected|completed",
    "auditor_notes": "string|null",
    "rejection_reason": "string|null",
    "approved_cost": "number|null",
    "audited_at": "ISO 8601 date string",
    "updated_at": "ISO 8601 date string"
  }
}
```

### 5.1 PUT /api/auditor/quotations/{id}/audit

**Descripción**: Auditar una cotización específica (aprobar/rechazar) - **ENDPOINT RECOMENDADO**

**Path Parameters**:
- `id`: ID de la cotización

**Request Body**:
```json
{
  "audit_status": "approved|rejected|completed",
  "auditor_notes": "string|null",
  "rejection_reason": "string|null",
  "approved_cost": "number|null",
  "audit_criteria": {
    "price_reasonable": "boolean",
    "quality_adequate": "boolean",
    "delivery_time_acceptable": "boolean",
    "provider_reliable": "boolean",
    "documentation_complete": "boolean"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "audit_request_id": "uuid",
    "quotation_id": "uuid",
    "audit_status": "approved|rejected",
    "auditor_notes": "string|null",
    "rejection_reason": "string|null",
    "approved_cost": "number|null",
    "audited_at": "ISO 8601 date string",
    "updated_at": "ISO 8601 date string"
  },
  "message": "Cotización aprobada/rechazada exitosamente"
}
```

**Notas**:
- Este endpoint es más directo y recomendado para el frontend
- Crea automáticamente una solicitud de auditoría si no existe
- Actualiza automáticamente el estado de la cotización
- Marca la cotización como no disponible para auditoría después del proceso

### 6. GET /api/auditor/audit-requests/{id}

**Descripción**: Obtener detalle de una solicitud de auditoría

**Path Parameters**:
- `id`: ID de la solicitud de auditoría

**Response**:
```json
{
  "success": true,
  "data": {
    "audit_request_id": "uuid",
    "quotation_id": "uuid",
    "medical_order_id": "uuid",
    "provider_id": "uuid",
    "audit_status": "pending|in_progress|approved|rejected|completed",
    "auditor_notes": "string|null",
    "rejection_reason": "string|null",
    "original_order_cost": "number|null",
    "quoted_cost": "number|null",
    "approved_cost": "number|null",
    "audit_criteria": "object|null",
    "audit_type": "manual|ai|hybrid",
    "auditor_id": "uuid|null",
    "audited_at": "ISO 8601 date string|null",
    "completed_at": "ISO 8601 date string|null",
    "created_at": "ISO 8601 date string",
    "updated_at": "ISO 8601 date string"
  }
}
```

### 7. GET /api/auditor/statistics

**Descripción**: Obtener estadísticas de auditoría

**Response**:
```json
{
  "success": true,
  "data": {
    "total_requests": "number",
    "pending_requests": "number",
    "in_progress_requests": "number",
    "approved_requests": "number",
    "rejected_requests": "number",
    "completed_requests": "number",
    "average_processing_time": "number",
    "cost_savings": "number",
    "monthly_trends": [
      {
        "month": "YYYY-MM",
        "requests": "number",
        "approved": "number",
        "rejected": "number"
      }
    ]
  }
}
```

## 📊 ESTRUCTURAS DE DATOS

### Quotation (Cotización)
```typescript
interface Quotation {
  quotation_id: string;
  medical_order_id: string;
  provider_id: string;
  provider_name: string;
  patient_name: string;
  total_cost: number;
  delivery_days: number;
  items_count: number;
  status: 'pending' | 'sent' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  items: QuotationItem[];
  medical_order: MedicalOrder;
}
```

### QuotationItem (Item de Cotización)
```typescript
interface QuotationItem {
  item_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  category: string | null;
}
```

### MedicalOrder (Orden Médica)
```typescript
interface MedicalOrder {
  medical_order_id: string;
  patient_name: string;
  doctor_name: string | null;
  specialty: string[];
  urgency: 'low' | 'medium' | 'high';
  created_at: string;
}
```

### AuditRequest (Solicitud de Auditoría)
```typescript
interface AuditRequest {
  audit_request_id: string;
  quotation_id: string;
  medical_order_id: string;
  provider_id: string;
  audit_status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  auditor_notes: string | null;
  rejection_reason: string | null;
  original_order_cost: number | null;
  quoted_cost: number | null;
  approved_cost: number | null;
  audit_criteria: AuditCriteria | null;
  audit_type: 'manual' | 'ai' | 'hybrid';
  auditor_id: string | null;
  audited_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### AuditCriteria (Criterios de Auditoría)
```typescript
interface AuditCriteria {
  price_reasonable: boolean;
  quality_adequate: boolean;
  delivery_time_acceptable: boolean;
  provider_reliable: boolean;
  documentation_complete: boolean;
}
```

## ⚠️ CÓDIGOS DE ERROR

### Errores HTTP
- `400` - Bad Request: Datos de entrada inválidos
- `401` - Unauthorized: Token inválido o expirado
- `403` - Forbidden: Sin permisos para acceder al recurso
- `404` - Not Found: Recurso no encontrado
- `422` - Unprocessable Entity: Validación fallida
- `500` - Internal Server Error: Error interno del servidor

### Códigos de Error Específicos
- `AUDIT_001` - Cotización no encontrada
- `AUDIT_002` - Solicitud de auditoría no encontrada
- `AUDIT_003` - Sin permisos para auditar
- `AUDIT_004` - Cotización ya auditada
- `AUDIT_005` - Datos de auditoría inválidos
- `AUDIT_006` - Error al procesar auditoría

## 🔄 FLUJO DE TRABAJO

1. **Auditor** ve cotizaciones pendientes en `/pending-quotations`
2. **Auditor** selecciona una cotización para revisar en `/quotations/{id}`
3. **Auditor** crea solicitud de auditoría en `/audit-requests`
4. **Auditor** revisa y aprueba/rechaza en `/audit-requests/{id}`
5. **Sistema** actualiza estado y notifica al proveedor
6. **Auditor** puede ver estadísticas en `/statistics`

## 📝 NOTAS DE IMPLEMENTACIÓN

### Migraciones de Base de Datos
Se requiere ejecutar la migración para agregar el campo `status` a la tabla `provider_quotations`:

```sql
-- Agregar campo status a la tabla provider_quotations
ALTER TABLE provider_quotations 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;

-- Crear índice para mejorar el rendimiento
CREATE INDEX idx_provider_quotations_status ON provider_quotations(status);
```

### Optimizaciones Implementadas
- **Cálculos reales** de estadísticas en lugar de datos mock
- **Relaciones completas** con proveedores, afiliados y categorías
- **Paginación eficiente** con conteo total
- **Filtros avanzados** por múltiples criterios
- **Validación robusta** de datos de entrada

### TODOs Completados
- ✅ Obtener nombre del proveedor desde `proveedores` table
- ✅ Obtener nombre del paciente desde `afiliados` table
- ✅ Implementar estado de cotización con campo `status`
- ✅ Obtener nombres de items desde `medical_order_items` table
- ✅ Obtener categorías desde `medical_categories` table
- ✅ Obtener urgencia desde `urgency_types` table
- ✅ Implementar cálculo real de tiempo promedio de procesamiento
- ✅ Implementar cálculo real de ahorro de costos
- ✅ Implementar consulta real de tendencias mensuales

## 🚀 PRÓXIMOS PASOS

1. **Implementar obtención del doctor** desde `healthcare_providers` table
2. **Agregar notificaciones** en tiempo real para cambios de estado
3. **Implementar exportación** de reportes en PDF/Excel
4. **Agregar auditoría de cambios** con historial completo
5. **Optimizar consultas** con índices adicionales según uso 