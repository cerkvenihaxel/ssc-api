# 🔧 CORRECCIÓN FRONTEND - ERROR DE VALIDACIÓN AUDITORÍA

## 🚨 PROBLEMA IDENTIFICADO

El error `"audit_status must be one of the following values: "` indica que el frontend no está enviando correctamente el campo `audit_status` o está enviando un valor inválido.

## ✅ SOLUCIÓN

### 1. **Verificar el Payload del Frontend**

Asegúrate de que el frontend esté enviando exactamente esta estructura:

```typescript
// ✅ CORRECTO - Para APROBAR
const approvePayload = {
  audit_status: 'approved', // ← DEBE ser exactamente 'approved'
  approved_cost: 15000,     // ← Número, no string
  auditor_notes: 'Cotización aprobada por cumplir criterios',
  audit_criteria: {
    price_reasonable: true,
    quality_adequate: true,
    delivery_time_acceptable: true,
    provider_reliable: true,
    documentation_complete: true
  }
};

// ✅ CORRECTO - Para RECHAZAR
const rejectPayload = {
  audit_status: 'rejected', // ← DEBE ser exactamente 'rejected'
  rejection_reason: 'Precio muy alto para el mercado',
  auditor_notes: 'Cotización rechazada por exceder presupuesto',
  audit_criteria: {
    price_reasonable: false,
    quality_adequate: true,
    delivery_time_acceptable: true,
    provider_reliable: true,
    documentation_complete: true
  }
};
```

### 2. **Corregir la Función de Auditoría en el Frontend**

```typescript
// ✅ CORRECCIÓN - AuditorService.ts
export class AuditorService {
  
  // Método para aprobar cotización
  async approveQuotation(quotationId: string, approvedCost: number, notes: string = '') {
    try {
      const response = await this.apiClient.put(
        `/api/auditor/quotations/${quotationId}/audit`,
        {
          audit_status: 'approved', // ← VALOR EXACTO
          approved_cost: Number(approvedCost), // ← Asegurar que sea número
          auditor_notes: notes,
          audit_criteria: {
            price_reasonable: true,
            quality_adequate: true,
            delivery_time_acceptable: true,
            provider_reliable: true,
            documentation_complete: true
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error approving quotation:', error);
      throw error;
    }
  }

  // Método para rechazar cotización
  async rejectQuotation(quotationId: string, reason: string, notes: string = '') {
    try {
      const response = await this.apiClient.put(
        `/api/auditor/quotations/${quotationId}/audit`,
        {
          audit_status: 'rejected', // ← VALOR EXACTO
          rejection_reason: reason,
          auditor_notes: notes,
          audit_criteria: {
            price_reasonable: false,
            quality_adequate: false,
            delivery_time_acceptable: false,
            provider_reliable: false,
            documentation_complete: false
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      throw error;
    }
  }
}
```

### 3. **Corregir el Componente de Auditoría**

```typescript
// ✅ CORRECCIÓN - AuditQuotationPage.tsx
const handleSubmit = async (values: any) => {
  try {
    setLoading(true);
    
    if (auditAction === 'approve') {
      // Validar que el costo aprobado sea un número
      const approvedCost = Number(values.approved_cost);
      if (isNaN(approvedCost) || approvedCost <= 0) {
        message.error('El costo aprobado debe ser un número válido mayor a 0');
        return;
      }
      
      await auditorService.approveQuotation(
        quotationId,
        approvedCost,
        values.auditor_notes || ''
      );
      
      message.success('Cotización aprobada exitosamente');
    } else if (auditAction === 'reject') {
      // Validar que la razón del rechazo esté presente
      if (!values.rejection_reason?.trim()) {
        message.error('Debe especificar una razón para el rechazo');
        return;
      }
      
      await auditorService.rejectQuotation(
        quotationId,
        values.rejection_reason,
        values.auditor_notes || ''
      );
      
      message.success('Cotización rechazada exitosamente');
    }
    
    // Cerrar modal y recargar datos
    onClose();
    onSuccess();
    
  } catch (error) {
    console.error('Error updating audit request:', error);
    
    // Mostrar mensaje de error específico
    if (error.response?.data?.message) {
      const errorMessage = Array.isArray(error.response.data.message) 
        ? error.response.data.message[0] 
        : error.response.data.message;
      message.error(errorMessage);
    } else {
      message.error('Error al procesar la auditoría');
    }
  } finally {
    setLoading(false);
  }
};
```

### 4. **Validación en el Formulario**

```typescript
// ✅ CORRECCIÓN - Validación del formulario
const [form] = Form.useForm();

// Validar antes de enviar
const validateAndSubmit = async () => {
  try {
    const values = await form.validateFields();
    
    // Validaciones adicionales
    if (auditAction === 'approve') {
      if (!values.approved_cost || Number(values.approved_cost) <= 0) {
        message.error('Debe especificar un costo aprobado válido');
        return;
      }
    } else if (auditAction === 'reject') {
      if (!values.rejection_reason?.trim()) {
        message.error('Debe especificar una razón para el rechazo');
        return;
      }
    }
    
    await handleSubmit(values);
  } catch (error) {
    console.error('Validation error:', error);
  }
};
```

### 5. **Tipos TypeScript Correctos**

```typescript
// ✅ CORRECCIÓN - Tipos para auditoría
interface AuditPayload {
  audit_status: 'approved' | 'rejected' | 'completed';
  approved_cost?: number;
  rejection_reason?: string;
  auditor_notes?: string;
  audit_criteria: {
    price_reasonable: boolean;
    quality_adequate: boolean;
    delivery_time_acceptable: boolean;
    provider_reliable: boolean;
    documentation_complete: boolean;
  };
}

interface ApprovePayload extends Omit<AuditPayload, 'rejection_reason'> {
  audit_status: 'approved';
  approved_cost: number; // Obligatorio para aprobar
}

interface RejectPayload extends Omit<AuditPayload, 'approved_cost'> {
  audit_status: 'rejected';
  rejection_reason: string; // Obligatorio para rechazar
}
```

## 🔍 DEBUGGING

### 1. **Verificar el Payload Antes del Envío**

```typescript
// Agregar este log antes de enviar
console.log('Payload being sent:', JSON.stringify(payload, null, 2));
```

### 2. **Verificar la Respuesta del Servidor**

```typescript
// Agregar este log para ver la respuesta completa
console.log('Server response:', error.response?.data);
```

### 3. **Valores Permitidos para audit_status**

Los únicos valores válidos son:
- `'pending'`
- `'in_progress'`
- `'approved'`
- `'rejected'`
- `'completed'`

## 🚀 PASOS PARA IMPLEMENTAR

1. **Actualizar AuditorService.ts** con los métodos corregidos
2. **Actualizar el componente** de auditoría con la validación correcta
3. **Verificar que audit_status** se envíe exactamente como string
4. **Verificar que approved_cost** se envíe como número
5. **Probar con el endpoint** `/api/auditor/quotations/{id}/audit`

## ✅ VERIFICACIÓN

Después de implementar los cambios:

1. Abrir DevTools → Network
2. Intentar aprobar/rechazar una cotización
3. Verificar que el payload sea correcto
4. Verificar que la respuesta sea 200 OK
5. Verificar que la cotización se actualice en la lista

---

**Estado**: ✅ Listo para implementación  
**Prioridad**: Crítica  
**Tiempo estimado**: 30 minutos 