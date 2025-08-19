# 🎯 GUÍA DE IMPLEMENTACIÓN: MÓDULOS DE AUDITORÍA Y ENTREGA DE MATERIALES

## 📋 CONTEXTO DEL PROYECTO

Estás trabajando en un sistema de gestión de pedidos médicos y cotizaciones de proveedores. El backend ya tiene implementado un sistema completo de auditoría y entrega de materiales con las siguientes características:

### 🔧 BACKEND IMPLEMENTADO:
- **Módulo de Auditoría** (`/auditor/*`) - Para auditores y administradores
- **Sistema de Cotizaciones** con campo `available_for_audit`
- **Tablas de Base de Datos**: `audit_requests`, `material_deliveries`
- **Flujo completo**: Pedido → Cotización → Auditoría → Entrega

### 🏗️ ESTRUCTURA ACTUAL DEL FRONTEND:
- **React + TypeScript + Vite**
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Arquitectura limpia** con separación de capas
- **Sistema de permisos** basado en roles
- **Rutas protegidas** con `ProtectedRoute`

## 🎯 OBJETIVO

Implementar en el frontend los módulos de **Auditoría** y **Material Delivery** que complementen el backend ya desarrollado, siguiendo los patrones y estructura existente del proyecto.

---

## 📁 ESTRUCTURA A IMPLEMENTAR

### 1. NUEVAS PÁGINAS PARA AUDITORES

#### 📂 `/src/presentation/pages/auditor/`
```
auditor/
├── AuditorDashboard.tsx           # Dashboard principal del auditor
├── PendingAuditRequestsPage.tsx   # Solicitudes pendientes de auditoría
├── AuditedRequestsPage.tsx        # Solicitudes ya auditadas
├── AuditRequestDetailPage.tsx     # Detalle de solicitud de auditoría
├── CreateAuditRequestPage.tsx     # Crear nueva solicitud de auditoría
├── AuditStatisticsPage.tsx        # Estadísticas de auditoría
└── index.ts                       # Exportaciones
```

#### 📂 `/src/presentation/pages/material-delivery/`
```
material-delivery/
├── MaterialDeliveryListPage.tsx   # Lista de entregas
├── MaterialDeliveryCreatePage.tsx # Crear nueva entrega
├── MaterialDeliveryDetailPage.tsx # Detalle de entrega
├── MaterialDeliveryEditPage.tsx   # Editar entrega
├── DeliveryTrackingPage.tsx       # Seguimiento de entregas
└── index.ts                       # Exportaciones
```

### 2. SERVICIOS Y REPOSITORIOS

#### 📂 `/src/application/services/`
```
services/
├── AuditorService.ts              # Lógica de negocio para auditoría
├── MaterialDeliveryService.ts     # Lógica de negocio para entregas
└── index.ts
```

#### 📂 `/src/infrastructure/repositories/`
```
repositories/
├── AuditorRepository.ts           # API calls para auditoría
├── MaterialDeliveryRepository.ts  # API calls para entregas
└── index.ts
```

### 3. TIPOS Y MODELOS

#### 📂 `/src/domain/models/`
```
models/
├── audit/
│   ├── AuditRequest.ts
│   ├── AuditStatistics.ts
│   └── index.ts
├── material-delivery/
│   ├── MaterialDelivery.ts
│   ├── DeliveryStatus.ts
│   └── index.ts
└── index.ts
```

### 4. COMPONENTES COMPARTIDOS

#### 📂 `/src/shared/components/`
```
components/
├── audit/
│   ├── AuditRequestCard.tsx
│   ├── AuditStatusBadge.tsx
│   ├── ItemComparisonTable.tsx
│   └── AuditCriteriaForm.tsx
├── material-delivery/
│   ├── DeliveryStatusBadge.tsx
│   ├── DeliveryTrackingCard.tsx
│   ├── QualityCheckForm.tsx
│   └── PatientSatisfactionForm.tsx
└── index.ts
```

---

## 📡 ENDPOINTS DEL BACKEND A INTEGRAR

### 📡 AUDITORÍA
```typescript
// GET /auditor/pending-requests
// GET /auditor/audited-requests
// POST /auditor/audit-requests
// PUT /auditor/audit-requests/:id
// GET /auditor/audit-requests/:id
// GET /auditor/statistics
```

### 📡 MATERIAL DELIVERY (a implementar en backend)
```typescript
// GET /material-delivery
// POST /material-delivery
// PUT /material-delivery/:id
// GET /material-delivery/:id
// GET /material-delivery/provider/:providerId
// PUT /material-delivery/:id/status
```

---

## 🎨 DISEÑO Y UX

### 🎨 PRINCIPIOS DE DISEÑO:
- **Consistencia** con el diseño existente
- **Responsive** para móviles y desktop
- **Accesibilidad** siguiendo estándares WCAG
- **Feedback visual** para todas las acciones
- **Navegación intuitiva** con breadcrumbs

### 🧩 COMPONENTES DE UI:
- **Cards** para mostrar solicitudes/entregas
- **Badges** para estados (pending, approved, rejected, etc.)
- **Tables** para listas con paginación
- **Forms** con validación
- **Modals** para confirmaciones
- **Progress indicators** para tracking

### 🎨 PALETA DE COLORES:
```typescript
// Estados de auditoría
const auditStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800'
};

// Estados de entrega
const deliveryStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};
```

---

## 🔐 SISTEMA DE PERMISOS

### 🔐 NUEVOS PERMISSIONS A AGREGAR:
```typescript
// En /src/domain/constants/permissions.ts
export const PERMISSIONS = {
  // ... existing permissions
  
  // Auditoría
  AUDIT_REQUESTS: 'AUDIT_REQUESTS',
  VIEW_AUDIT_REQUESTS: 'VIEW_AUDIT_REQUESTS',
  CREATE_AUDIT_REQUESTS: 'CREATE_AUDIT_REQUESTS',
  UPDATE_AUDIT_REQUESTS: 'UPDATE_AUDIT_REQUESTS',
  
  // Material Delivery
  MANAGE_DELIVERIES: 'MANAGE_DELIVERIES',
  VIEW_DELIVERIES: 'VIEW_DELIVERIES',
  CREATE_DELIVERIES: 'CREATE_DELIVERIES',
  UPDATE_DELIVERIES: 'UPDATE_DELIVERIES',
  COMPLETE_DELIVERIES: 'COMPLETE_DELIVERIES',
} as const;

// Actualizar ROLE_PERMISSIONS
export const ROLE_PERMISSIONS = {
  Administrador: [
    // ... existing permissions
    PERMISSIONS.AUDIT_REQUESTS,
    PERMISSIONS.VIEW_AUDIT_REQUESTS,
    PERMISSIONS.CREATE_AUDIT_REQUESTS,
    PERMISSIONS.UPDATE_AUDIT_REQUESTS,
    PERMISSIONS.MANAGE_DELIVERIES,
    PERMISSIONS.VIEW_DELIVERIES,
    PERMISSIONS.CREATE_DELIVERIES,
    PERMISSIONS.UPDATE_DELIVERIES,
    PERMISSIONS.COMPLETE_DELIVERIES,
  ],
  Auditor: [
    // ... existing permissions
    PERMISSIONS.AUDIT_REQUESTS,
    PERMISSIONS.VIEW_AUDIT_REQUESTS,
    PERMISSIONS.CREATE_AUDIT_REQUESTS,
    PERMISSIONS.UPDATE_AUDIT_REQUESTS,
    PERMISSIONS.VIEW_DELIVERIES,
  ],
  Proveedor: [
    // ... existing permissions
    PERMISSIONS.VIEW_DELIVERIES,
    PERMISSIONS.CREATE_DELIVERIES,
    PERMISSIONS.UPDATE_DELIVERIES,
    PERMISSIONS.COMPLETE_DELIVERIES,
  ],
  // ... other roles
};
```

---

## 🛣️ NUEVAS RUTAS A AGREGAR

### 🛣️ En `/src/App.tsx`:
```typescript
// Auditor routes
<Route
  path="/auditor/dashboard"
  element={
    <ProtectedRoute requiredPermission={PERMISSIONS.AUDIT_REQUESTS}>
      <AuditorDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/auditor/pending-requests"
  element={
    <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_AUDIT_REQUESTS}>
      <PendingAuditRequestsPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/auditor/audited-requests"
  element={
    <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_AUDIT_REQUESTS}>
      <AuditedRequestsPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/auditor/audit-requests/:id"
  element={
    <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_AUDIT_REQUESTS}>
      <AuditRequestDetailPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/auditor/statistics"
  element={
    <ProtectedRoute requiredPermission={PERMISSIONS.AUDIT_REQUESTS}>
      <AuditStatisticsPage />
    </ProtectedRoute>
  }
/>

// Material Delivery routes
<Route
  path="/material-delivery"
  element={
    <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DELIVERIES}>
      <MaterialDeliveryListPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/material-delivery/create"
  element={
    <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_DELIVERIES}>
      <MaterialDeliveryCreatePage />
    </ProtectedRoute>
  }
/>
<Route
  path="/material-delivery/:id"
  element={
    <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DELIVERIES}>
      <MaterialDeliveryDetailPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/material-delivery/:id/edit"
  element={
    <ProtectedRoute requiredPermission={PERMISSIONS.UPDATE_DELIVERIES}>
      <MaterialDeliveryEditPage />
    </ProtectedRoute>
  }
/>
```

---

## 📊 FLUJO DE TRABAJO A IMPLEMENTAR

### 📊 FLUJO DE AUDITORÍA:
1. **Auditor** ve solicitudes pendientes en `/auditor/pending-requests`
2. **Auditor** selecciona una cotización para auditar
3. **Auditor** compara items y costos del pedido original vs cotización
4. **Auditor** aprueba/rechaza con justificación
5. **Sistema** actualiza estado y notifica al proveedor

### 📦 FLUJO DE ENTREGA:
1. **Proveedor** ve cotizaciones aprobadas en `/material-delivery`
2. **Proveedor** crea entrega con detalles (fecha, dirección, etc.)
3. **Proveedor** actualiza estado (preparing → shipped → delivered)
4. **Proveedor** completa entrega con control de calidad
5. **Sistema** marca como completado y genera reporte

---

## 🎯 FUNCIONALIDADES CLAVE A IMPLEMENTAR

### 📋 AUDITORÍA:
- ✅ **Lista de solicitudes pendientes** con filtros
- ✅ **Comparación visual** de items y costos
- ✅ **Formulario de auditoría** con criterios
- ✅ **Estados de auditoría** con badges
- ✅ **Estadísticas y reportes**
- ✅ **Historial de auditorías**

### 📦 MATERIAL DELIVERY:
- ✅ **Lista de entregas** por proveedor
- ✅ **Formulario de entrega** con validación
- ✅ **Tracking de estado** con timeline
- ✅ **Control de calidad** con checklist
- ✅ **Satisfacción del paciente**
- ✅ **Reportes de entrega**

---

## ⚙️ CONSIDERACIONES TÉCNICAS

### 📱 RESPONSIVE DESIGN:
- **Mobile-first** approach
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-friendly** interfaces para móviles

### ⚡ PERFORMANCE:
- **Lazy loading** para listas grandes
- **Pagination** con virtual scrolling
- **Caching** de datos frecuentes
- **Optimistic updates** para mejor UX

### 🔒 SEGURIDAD:
- **Validación** en frontend y backend
- **Sanitización** de inputs
- **CSRF protection**
- **Rate limiting** en formularios

### 🧪 TESTING:
- **Unit tests** para servicios
- **Integration tests** para componentes
- **E2E tests** para flujos críticos
- **Accessibility tests**

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### ✅ FASE 1: ESTRUCTURA BASE
- [ ] Crear directorios y archivos base
- [ ] Definir tipos y modelos
- [ ] Configurar servicios y repositorios
- [ ] Agregar permisos y rutas

### ✅ FASE 2: MÓDULO DE AUDITORÍA
- [ ] Implementar páginas de auditoría
- [ ] Crear componentes de UI
- [ ] Integrar con API del backend
- [ ] Implementar filtros y búsqueda

### ✅ FASE 3: MÓDULO DE MATERIAL DELIVERY
- [ ] Implementar páginas de entrega
- [ ] Crear formularios de entrega
- [ ] Implementar tracking de estado
- [ ] Agregar control de calidad

### ✅ FASE 4: INTEGRACIÓN Y TESTING
- [ ] Integrar con sistema de permisos
- [ ] Probar flujos completos
- [ ] Optimizar performance
- [ ] Documentar funcionalidades

---

## 🧩 EJEMPLOS DE COMPONENTES

### 📋 AuditRequestCard.tsx:
```typescript
interface AuditRequestCardProps {
  auditRequest: AuditRequest;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

export const AuditRequestCard: React.FC<AuditRequestCardProps> = ({
  auditRequest,
  onView,
  onEdit
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {auditRequest.quotation.quotation_number}
          </h3>
          <p className="text-sm text-gray-600">
            Pedido: {auditRequest.medical_order.order_number}
          </p>
        </div>
        <AuditStatusBadge status={auditRequest.audit_status} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Costo Original</p>
          <p className="text-lg font-semibold text-gray-900">
            ${auditRequest.original_order_cost?.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Costo Cotizado</p>
          <p className="text-lg font-semibold text-blue-600">
            ${auditRequest.quoted_cost?.toLocaleString()}
          </p>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => onView(auditRequest.audit_request_id)}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Ver Detalle
        </button>
        {auditRequest.audit_status === 'pending' && (
          <button
            onClick={() => onEdit(auditRequest.audit_request_id)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Auditar
          </button>
        )}
      </div>
    </div>
  );
};
```

### 🏷️ AuditStatusBadge.tsx:
```typescript
interface AuditStatusBadgeProps {
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
}

export const AuditStatusBadge: React.FC<AuditStatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      className: 'bg-yellow-100 text-yellow-800'
    },
    in_progress: {
      label: 'En Progreso',
      className: 'bg-blue-100 text-blue-800'
    },
    approved: {
      label: 'Aprobado',
      className: 'bg-green-100 text-green-800'
    },
    rejected: {
      label: 'Rechazado',
      className: 'bg-red-100 text-red-800'
    },
    completed: {
      label: 'Completado',
      className: 'bg-gray-100 text-gray-800'
    }
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
};
```

### 📊 ItemComparisonTable.tsx:
```typescript
interface ItemComparisonTableProps {
  originalItems: any[];
  quotedItems: any[];
}

export const ItemComparisonTable: React.FC<ItemComparisonTableProps> = ({
  originalItems,
  quotedItems
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cantidad Original
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cantidad Cotizada
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Precio Unitario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Diferencia
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {originalItems.map((item, index) => {
            const quotedItem = quotedItems.find(qi => qi.item_id === item.item_id);
            const difference = quotedItem ? quotedItem.total_price - item.total_price : 0;
            
            return (
              <tr key={item.item_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.item_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {quotedItem?.quantity || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${quotedItem?.unit_price?.toLocaleString() || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${quotedItem?.total_price?.toLocaleString() || '-'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {difference !== 0 ? `${difference > 0 ? '+' : ''}${difference.toLocaleString()}` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 🚀 COMANDOS PARA INICIAR

```bash
# Navegar al directorio del frontend
cd /Users/axelcerkvenih/Documents/repos/ssc/ssc-frontend

# Instalar dependencias (si no están instaladas)
npm install

# Iniciar servidor de desarrollo
npm run dev

# Ejecutar tests
npm run test

# Build para producción
npm run build
```

---

## 📚 SOPORTE Y RECURSOS

### 📚 DOCUMENTACIÓN:
- **API Docs**: `/API_COMPLETE_DOCS.md`
- **Backend Endpoints**: Documentación en el backend
- **Diseño System**: Componentes existentes como referencia

### 📋 PATRONES A SEGUIR:
- **Naming conventions**: camelCase para variables, PascalCase para componentes
- **File structure**: Seguir la estructura existente
- **Component patterns**: Reutilizar componentes existentes
- **State management**: Usar React hooks y context

### 🔧 HERRAMIENTAS:
- **TypeScript**: Para type safety
- **Tailwind CSS**: Para estilos
- **React Router**: Para navegación
- **React Hook Form**: Para formularios (si se usa)

---

## 🎯 TOKENS DE IMPLEMENTACIÓN

### 🔑 TOKEN 1: ESTRUCTURA BASE
```bash
# Crear directorios
mkdir -p src/presentation/pages/auditor
mkdir -p src/presentation/pages/material-delivery
mkdir -p src/application/services
mkdir -p src/infrastructure/repositories
mkdir -p src/domain/models/audit
mkdir -p src/domain/models/material-delivery
mkdir -p src/shared/components/audit
mkdir -p src/shared/components/material-delivery
```

### 🔑 TOKEN 2: TIPOS Y MODELOS
```typescript
// src/domain/models/audit/AuditRequest.ts
export interface AuditRequest {
  audit_request_id: string;
  quotation_id: string;
  medical_order_id: string;
  provider_id: string;
  audit_status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  auditor_notes?: string;
  rejection_reason?: string;
  original_order_cost?: number;
  quoted_cost?: number;
  approved_cost?: number;
  item_comparison?: any;
  audit_criteria?: any;
  audit_type: 'manual' | 'ai' | 'hybrid';
  auditor_id?: string;
  audited_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
  quotation?: any;
  medical_order?: any;
}

// src/domain/models/material-delivery/MaterialDelivery.ts
export interface MaterialDelivery {
  delivery_id: string;
  audit_request_id: string;
  provider_id: string;
  delivery_status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  expected_delivery_date?: Date;
  actual_delivery_date?: Date;
  delivery_address?: string;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_email?: string;
  tracking_number?: string;
  courier_company?: string;
  delivered_items?: any;
  delivery_notes?: any;
  foja_number?: string;
  total_quantity_delivered?: number;
  final_cost?: number;
  quality_check_passed: boolean;
  quality_check_notes?: string;
  patient_satisfaction: boolean;
  patient_feedback?: string;
  is_completed: boolean;
  completed_at?: Date;
  completed_by?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}
```

### 🔑 TOKEN 3: SERVICIOS
```typescript
// src/application/services/AuditorService.ts
export class AuditorService {
  async getPendingAuditRequests(filters: any): Promise<any> {
    // Implementar lógica para obtener solicitudes pendientes
  }
  
  async getAuditedRequests(filters: any): Promise<any> {
    // Implementar lógica para obtener solicitudes auditadas
  }
  
  async createAuditRequest(data: any): Promise<any> {
    // Implementar lógica para crear solicitud de auditoría
  }
  
  async updateAuditRequest(id: string, data: any): Promise<any> {
    // Implementar lógica para actualizar solicitud de auditoría
  }
  
  async getAuditStatistics(): Promise<any> {
    // Implementar lógica para obtener estadísticas
  }
}

// src/application/services/MaterialDeliveryService.ts
export class MaterialDeliveryService {
  async getDeliveries(filters: any): Promise<any> {
    // Implementar lógica para obtener entregas
  }
  
  async createDelivery(data: any): Promise<any> {
    // Implementar lógica para crear entrega
  }
  
  async updateDelivery(id: string, data: any): Promise<any> {
    // Implementar lógica para actualizar entrega
  }
  
  async updateDeliveryStatus(id: string, status: string): Promise<any> {
    // Implementar lógica para actualizar estado de entrega
  }
}
```

### 🔑 TOKEN 4: REPOSITORIOS
```typescript
// src/infrastructure/repositories/AuditorRepository.ts
export class AuditorRepository {
  private apiClient: ApiClient;
  
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }
  
  async getPendingAuditRequests(filters: any): Promise<any> {
    return this.apiClient.get('/auditor/pending-requests', { params: filters });
  }
  
  async getAuditedRequests(filters: any): Promise<any> {
    return this.apiClient.get('/auditor/audited-requests', { params: filters });
  }
  
  async createAuditRequest(data: any): Promise<any> {
    return this.apiClient.post('/auditor/audit-requests', data);
  }
  
  async updateAuditRequest(id: string, data: any): Promise<any> {
    return this.apiClient.put(`/auditor/audit-requests/${id}`, data);
  }
  
  async getAuditRequestDetail(id: string): Promise<any> {
    return this.apiClient.get(`/auditor/audit-requests/${id}`);
  }
  
  async getAuditStatistics(): Promise<any> {
    return this.apiClient.get('/auditor/statistics');
  }
}

// src/infrastructure/repositories/MaterialDeliveryRepository.ts
export class MaterialDeliveryRepository {
  private apiClient: ApiClient;
  
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }
  
  async getDeliveries(filters: any): Promise<any> {
    return this.apiClient.get('/material-delivery', { params: filters });
  }
  
  async createDelivery(data: any): Promise<any> {
    return this.apiClient.post('/material-delivery', data);
  }
  
  async updateDelivery(id: string, data: any): Promise<any> {
    return this.apiClient.put(`/material-delivery/${id}`, data);
  }
  
  async getDeliveryDetail(id: string): Promise<any> {
    return this.apiClient.get(`/material-delivery/${id}`);
  }
  
  async updateDeliveryStatus(id: string, status: string): Promise<any> {
    return this.apiClient.put(`/material-delivery/${id}/status`, { status });
  }
}
```

### 🔑 TOKEN 5: PÁGINAS PRINCIPALES
```typescript
// src/presentation/pages/auditor/AuditorDashboard.tsx
import React from 'react';
import { AuditStatistics } from '../../shared/components/audit/AuditStatistics';
import { PendingRequestsSummary } from '../../shared/components/audit/PendingRequestsSummary';

export const AuditorDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Dashboard de Auditoría
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AuditStatistics />
            <PendingRequestsSummary />
          </div>
        </div>
      </div>
    </div>
  );
};

// src/presentation/pages/auditor/PendingAuditRequestsPage.tsx
import React, { useState, useEffect } from 'react';
import { AuditRequestCard } from '../../shared/components/audit/AuditRequestCard';
import { AuditorService } from '../../../application/services/AuditorService';

export const PendingAuditRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  
  useEffect(() => {
    loadPendingRequests();
  }, [filters]);
  
  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const auditorService = new AuditorService();
      const result = await auditorService.getPendingAuditRequests(filters);
      setRequests(result.data);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleView = (id: string) => {
    // Navegar al detalle
  };
  
  const handleEdit = (id: string) => {
    // Navegar a editar
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Solicitudes Pendientes de Auditoría
          </h1>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((request) => (
                <AuditRequestCard
                  key={request.audit_request_id}
                  auditRequest={request}
                  onView={handleView}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## 🎯 RESUMEN DE IMPLEMENTACIÓN

### ✅ PASOS FINALES:
1. **Crear estructura de directorios**
2. **Implementar tipos y modelos**
3. **Crear servicios y repositorios**
4. **Implementar componentes de UI**
5. **Crear páginas principales**
6. **Agregar rutas y permisos**
7. **Integrar con backend**
8. **Testing y optimización**

### 🚀 RESULTADO ESPERADO:
- **Sistema completo de auditoría** para auditores y administradores
- **Sistema de entrega de materiales** para proveedores
- **Flujo completo** desde pedido hasta entrega
- **UI consistente** con el diseño existente
- **Performance optimizada** y responsive

---

**¡Listo para implementar! 🚀**

Esta guía proporciona una estructura completa y tokenizada para implementar los módulos de auditoría y entrega de materiales en el frontend, siguiendo los patrones y estructura existente del proyecto. 