# 🎯 PROMPT PARA IMPLEMENTACIÓN FRONTEND - MÓDULO DE AUDITORÍA

## 📋 CONTEXTO

Necesitas implementar en el frontend la funcionalidad completa del módulo de auditoría que incluye:

1. **Listado de cotizaciones pendientes** con paginación avanzada
2. **Funcionalidad de aprobar/rechazar** cotizaciones
3. **Gestión de solicitudes de auditoría**
4. **Estadísticas y reportes**
5. **Filtros avanzados**

## 🚀 ENDPOINTS DISPONIBLES

### 1. **Cotizaciones Pendientes**
```
GET /api/auditor/pending-quotations
Query Params: page, limit, status, provider_id, date_from, date_to, patient_name, medical_order_id
```

### 2. **Detalle de Cotización**
```
GET /api/auditor/quotations/{id}
```

### 3. **Crear Solicitud de Auditoría**
```
POST /api/auditor/audit-requests
Body: { quotation_id, medical_order_id, provider_id, audit_type, auditor_notes }
```

### 4. **Aprobar/Rechazar Cotización (RECOMENDADO)**
```
PUT /api/auditor/quotations/{id}/audit
Body: { audit_status, auditor_notes, rejection_reason, approved_cost, audit_criteria }
```

### 5. **Solicitudes Completadas**
```
GET /api/auditor/completed-requests
Query Params: page, limit, status, provider_id, date_from, date_to
```

### 6. **Estadísticas**
```
GET /api/auditor/statistics
```

## 🎨 IMPLEMENTACIÓN REQUERIDA

### 1. **Componente Principal de Auditoría**

Crea un componente `AuditorDashboard` que incluya:

- **Tabla de cotizaciones** con columnas: ID, Paciente, Proveedor, Costo, Días Entrega, Estado, Acciones
- **Paginación avanzada** con límites de 1-100 elementos por página
- **Filtros en tiempo real** por estado, proveedor, fecha, paciente
- **Botones de acción** para Ver Detalle y Auditar
- **Indicadores visuales** de estado (colores diferentes para cada estado)

### 2. **Modal de Auditoría**

Crea un modal `AuditModal` que permita:

- **Seleccionar acción**: Aprobar o Rechazar
- **Campos específicos** según la acción:
  - Para Aprobar: Costo aprobado (obligatorio), Notas (opcional)
  - Para Rechazar: Razón del rechazo (obligatorio), Notas (opcional)
- **Validación de formulario** con mensajes de error claros
- **Botones de confirmación** con estados de carga

### 3. **Modal de Detalle**

Crea un modal `DetailModal` que muestre:

- **Información completa** de la cotización
- **Lista de items** con detalles (nombre, cantidad, costo unitario, total)
- **Información del paciente** y orden médica
- **Archivos adjuntos** si los hay
- **Historial de cambios** si está disponible

### 4. **Componente de Estadísticas**

Crea un componente `AuditorStatistics` con:

- **Métricas principales**: Total solicitudes, Aprobadas, Rechazadas, Ahorro total
- **Gráficos de tendencias** mensuales
- **Tiempo promedio** de procesamiento
- **Indicadores visuales** (iconos, colores, progreso)

## 🔧 REQUISITOS TÉCNICOS

### 1. **Autenticación**
- Todos los requests deben incluir el header: `Authorization: Bearer {token}`
- Manejar errores 401/403 apropiadamente
- Redirigir a login si el token expira

### 2. **Paginación**
- Implementar paginación con límites: página 1-1000, elementos 1-100
- Mostrar información: "Mostrando X de Y cotizaciones"
- Incluir navegación rápida y selector de tamaño de página

### 3. **Validación**
- Validar todos los campos requeridos antes de enviar
- Mostrar mensajes de error específicos
- Deshabilitar botones durante el envío

### 4. **Estados de Carga**
- Mostrar spinners durante las operaciones
- Deshabilitar interacciones durante el procesamiento
- Mostrar mensajes de éxito/error apropiados

### 5. **Responsive Design**
- Funcionar correctamente en desktop, tablet y móvil
- Adaptar la tabla para pantallas pequeñas
- Optimizar modales para diferentes tamaños

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

## 🎯 FLUJO DE TRABAJO

### 1. **Cargar Cotizaciones**
```typescript
// Al montar el componente
useEffect(() => {
  loadPendingQuotations(1, 10);
}, []);

// Función de carga
const loadPendingQuotations = async (page: number, limit: number, filters = {}) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });

  const response = await fetch(`/api/auditor/pending-quotations?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    const data = await response.json();
    setQuotations(data.data.data);
    setPagination(data.data);
  }
};
```

### 2. **Auditar Cotización**
```typescript
// Función de aprobación
const approveQuotation = async (quotationId: string, approvedCost: number, notes: string) => {
  const response = await fetch(`/api/auditor/quotations/${quotationId}/audit`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      audit_status: 'approved',
      approved_cost: approvedCost,
      auditor_notes: notes,
      audit_criteria: {
        price_reasonable: true,
        quality_adequate: true,
        delivery_time_acceptable: true,
        provider_reliable: true,
        documentation_complete: true
      }
    })
  });

  if (response.ok) {
    message.success('Cotización aprobada exitosamente');
    loadPendingQuotations(currentPage, currentLimit);
  } else {
    message.error('Error al aprobar cotización');
  }
};

// Función de rechazo
const rejectQuotation = async (quotationId: string, reason: string, notes: string) => {
  const response = await fetch(`/api/auditor/quotations/${quotationId}/audit`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      audit_status: 'rejected',
      rejection_reason: reason,
      auditor_notes: notes,
      audit_criteria: {
        price_reasonable: false,
        quality_adequate: false,
        delivery_time_acceptable: false,
        provider_reliable: false,
        documentation_complete: false
      }
    })
  });

  if (response.ok) {
    message.success('Cotización rechazada exitosamente');
    loadPendingQuotations(currentPage, currentLimit);
  } else {
    message.error('Error al rechazar cotización');
  }
};
```

## 🎨 EJEMPLO DE UI/UX

### Tabla Principal
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Panel de Auditoría                                    [Filtros] [Estadísticas] │
├─────────────────────────────────────────────────────────────────────────────┤
│ Estado: [Enviada ▼] Paciente: [Buscar...] [Filtrar] [Limpiar]              │
├─────────────────────────────────────────────────────────────────────────────┤
│ ID        │ Paciente        │ Proveedor │ Costo    │ Días │ Estado │ Acciones │
├───────────┼─────────────────┼───────────┼──────────┼──────┼────────┼──────────┤
│ MO-2025-..│ Juan Pérez      │ MedCorp   │ $15,000  │ 5    │ Enviada│ [Ver][Auditar] │
│ MO-2025-..│ María García    │ HealthPro │ $8,500   │ 3    │ Enviada│ [Ver][Auditar] │
│ MO-2025-..│ Carlos López    │ MedCorp   │ $22,300  │ 7    │ Enviada│ [Ver][Auditar] │
├───────────┴─────────────────┴───────────┴──────────┴──────┴────────┴──────────┤
│ Mostrando 1-10 de 45 cotizaciones                    [1] [2] [3] [4] [5] [>] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Modal de Auditoría
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Auditar Cotización - Juan Pérez                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Información de la Cotización:                                                │
│ Paciente: Juan Pérez    Proveedor: MedCorp    Costo Original: $15,000       │
│ Días de Entrega: 5                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Acción de Auditoría: ○ Aprobar  ● Rechazar                                  │
│                                                                             │
│ Costo Aprobado: [$ 15,000] (solo para aprobación)                          │
│ Razón del Rechazo: [_________________] (solo para rechazo)                 │
│                                                                             │
│ Notas del Auditor: [_________________________________________________]     │
│                                                                             │
│ [Cancelar]                    [Aprobar Cotización]                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## ✅ CRITERIOS DE ACEPTACIÓN

### Funcionalidad
- [ ] Se cargan las cotizaciones pendientes correctamente
- [ ] La paginación funciona con límites 1-100 elementos
- [ ] Los filtros funcionan en tiempo real
- [ ] Se puede ver el detalle de una cotización
- [ ] Se puede aprobar una cotización con costo y notas
- [ ] Se puede rechazar una cotización con razón y notas
- [ ] Se muestran mensajes de éxito/error apropiados
- [ ] Se actualiza la lista después de auditar

### UI/UX
- [ ] Diseño responsive y moderno
- [ ] Estados de carga claros
- [ ] Validación de formularios
- [ ] Mensajes de error específicos
- [ ] Navegación intuitiva
- [ ] Accesibilidad básica

### Técnico
- [ ] Manejo correcto de autenticación
- [ ] Manejo de errores HTTP
- [ ] Código limpio y mantenible
- [ ] Tipos TypeScript correctos
- [ ] Performance optimizada

## 🚀 ENTREGABLES

1. **Componente AuditorDashboard** - Tabla principal con paginación
2. **Componente AuditModal** - Modal para aprobar/rechazar
3. **Componente DetailModal** - Modal de detalles
4. **Componente AuditorStatistics** - Estadísticas y métricas
5. **Hook useAuditor** - Lógica de negocio reutilizable
6. **Tipos TypeScript** - Interfaces completas
7. **Tests básicos** - Verificación de funcionalidad

## 📝 NOTAS IMPORTANTES

- **Endpoint recomendado**: Usar `PUT /api/auditor/quotations/{id}/audit` en lugar del endpoint de audit-requests
- **Paginación**: Respetar los límites de 1-1000 páginas y 1-100 elementos
- **Estados**: Las cotizaciones pueden tener estados: pending, sent, approved, rejected, completed
- **Permisos**: Solo usuarios con rol Auditor o Administrador pueden acceder
- **Validación**: Todos los campos requeridos deben validarse antes del envío

---

**Estado**: ✅ Listo para implementación  
**Prioridad**: Alta  
**Complejidad**: Media  
**Tiempo estimado**: 2-3 días 