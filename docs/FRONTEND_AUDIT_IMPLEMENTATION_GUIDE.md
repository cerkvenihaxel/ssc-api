# 🎯 GUÍA DE IMPLEMENTACIÓN FRONTEND - MÓDULO DE AUDITORÍA

## 📋 RESUMEN

Esta guía proporciona instrucciones completas para implementar en el frontend:
1. **Listado de cotizaciones pendientes** con paginación
2. **Funcionalidad de aprobar/rechazar** cotizaciones
3. **Gestión de solicitudes de auditoría**
4. **Estadísticas y reportes**

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

### 4. **Aprobar/Rechazar Cotización**
```
PUT /api/auditor/audit-requests/{id}
Body: { audit_status, auditor_notes, rejection_reason, approved_cost, audit_criteria }
```

### 4.1 **Auditar Cotización (Recomendado)**
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

## 🎨 IMPLEMENTACIÓN FRONTEND

### 1. **Componente Principal de Auditoría**

```typescript
// components/AuditorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Pagination, Card, Statistic } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';

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
  items: QuotationItem[];
  medical_order: MedicalOrder;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const AuditorDashboard: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    provider_id: '',
    date_from: '',
    date_to: '',
    patient_name: '',
    medical_order_id: ''
  });
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Cargar cotizaciones pendientes
  const loadPendingQuotations = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
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
        setPagination({
          total: data.data.total,
          page: data.data.page,
          limit: data.data.limit,
          total_pages: data.data.total_pages
        });
      } else {
        console.error('Error cargando cotizaciones');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aprobar cotización
  const approveQuotation = async (quotationId: string, approvedCost: number, notes: string) => {
    try {
      const response = await fetch(`/api/auditor/audit-requests/${quotationId}`, {
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
        loadPendingQuotations(pagination.page, pagination.limit);
        setAuditModalVisible(false);
      } else {
        message.error('Error al aprobar cotización');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Error al aprobar cotización');
    }
  };

  // Rechazar cotización
  const rejectQuotation = async (quotationId: string, reason: string, notes: string) => {
    try {
      const response = await fetch(`/api/auditor/audit-requests/${quotationId}`, {
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
        loadPendingQuotations(pagination.page, pagination.limit);
        setAuditModalVisible(false);
      } else {
        message.error('Error al rechazar cotización');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Error al rechazar cotización');
    }
  };

  // Columnas de la tabla
  const columns = [
    {
      title: 'Cotización',
      dataIndex: 'quotation_id',
      key: 'quotation_id',
      render: (id: string) => <span className="font-mono text-sm">{id.slice(0, 8)}...</span>
    },
    {
      title: 'Paciente',
      dataIndex: 'patient_name',
      key: 'patient_name',
    },
    {
      title: 'Proveedor',
      dataIndex: 'provider_name',
      key: 'provider_name',
    },
    {
      title: 'Costo Total',
      dataIndex: 'total_cost',
      key: 'total_cost',
      render: (cost: number) => `$${cost.toLocaleString()}`,
    },
    {
      title: 'Días Entrega',
      dataIndex: 'delivery_days',
      key: 'delivery_days',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={`px-2 py-1 rounded text-xs ${
          status === 'sent' ? 'bg-blue-100 text-blue-800' :
          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status.toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record: Quotation) => (
        <div className="space-x-2">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedQuotation(record);
              setDetailModalVisible(true);
            }}
          >
            Ver
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setSelectedQuotation(record);
              setAuditModalVisible(true);
            }}
          >
            Auditar
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadPendingQuotations();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Panel de Auditoría</h1>
      
      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            placeholder="Filtrar por estado"
            value={filters.status}
            onChange={(value) => setFilters({...filters, status: value})}
            allowClear
          >
            <Select.Option value="sent">Enviada</Select.Option>
            <Select.Option value="pending">Pendiente</Select.Option>
          </Select>
          
          <Input
            placeholder="Buscar por paciente"
            value={filters.patient_name}
            onChange={(e) => setFilters({...filters, patient_name: e.target.value})}
          />
          
          <Button type="primary" onClick={() => loadPendingQuotations(1, pagination.limit)}>
            Filtrar
          </Button>
        </div>
      </Card>

      {/* Tabla de cotizaciones */}
      <Card>
        <Table
          columns={columns}
          dataSource={quotations}
          loading={loading}
          rowKey="quotation_id"
          pagination={false}
        />
        
        {/* Paginación personalizada */}
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Mostrando {quotations.length} de {pagination.total} cotizaciones
          </span>
          <Pagination
            current={pagination.page}
            total={pagination.total}
            pageSize={pagination.limit}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => 
              `${range[0]}-${range[1]} de ${total} items`
            }
            onChange={(page, pageSize) => {
              loadPendingQuotations(page, pageSize || pagination.limit);
            }}
          />
        </div>
      </Card>

      {/* Modal de Auditoría */}
      <AuditModal
        visible={auditModalVisible}
        quotation={selectedQuotation}
        onApprove={approveQuotation}
        onReject={rejectQuotation}
        onCancel={() => setAuditModalVisible(false)}
      />

      {/* Modal de Detalle */}
      <DetailModal
        visible={detailModalVisible}
        quotation={selectedQuotation}
        onCancel={() => setDetailModalVisible(false)}
      />
    </div>
  );
};

export default AuditorDashboard;
```

### 2. **Modal de Auditoría (Aprobar/Rechazar)**

```typescript
// components/AuditModal.tsx
import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Radio, Button, Space, Divider } from 'antd';

interface AuditModalProps {
  visible: boolean;
  quotation: Quotation | null;
  onApprove: (quotationId: string, approvedCost: number, notes: string) => void;
  onReject: (quotationId: string, reason: string, notes: string) => void;
  onCancel: () => void;
}

const AuditModal: React.FC<AuditModalProps> = ({
  visible,
  quotation,
  onApprove,
  onReject,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    if (!quotation) return;
    
    setLoading(true);
    try {
      if (auditAction === 'approve') {
        await onApprove(
          quotation.quotation_id,
          values.approved_cost,
          values.auditor_notes
        );
      } else {
        await onReject(
          quotation.quotation_id,
          values.rejection_reason,
          values.auditor_notes
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Auditar Cotización - ${quotation?.patient_name}`}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          approved_cost: quotation?.total_cost,
          audit_action: 'approve'
        }}
      >
        {/* Información de la cotización */}
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <h4 className="font-semibold mb-2">Información de la Cotización</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Paciente:</span> {quotation?.patient_name}
            </div>
            <div>
              <span className="font-medium">Proveedor:</span> {quotation?.provider_name}
            </div>
            <div>
              <span className="font-medium">Costo Original:</span> ${quotation?.total_cost?.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Días de Entrega:</span> {quotation?.delivery_days}
            </div>
          </div>
        </div>

        <Divider />

        {/* Acción de auditoría */}
        <Form.Item label="Acción de Auditoría" required>
          <Radio.Group
            value={auditAction}
            onChange={(e) => setAuditAction(e.target.value)}
          >
            <Radio.Button value="approve">Aprobar</Radio.Button>
            <Radio.Button value="reject">Rechazar</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Campos específicos según la acción */}
        {auditAction === 'approve' && (
          <Form.Item
            label="Costo Aprobado"
            name="approved_cost"
            rules={[{ required: true, message: 'Ingrese el costo aprobado' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              min={0}
            />
          </Form.Item>
        )}

        {auditAction === 'reject' && (
          <Form.Item
            label="Razón del Rechazo"
            name="rejection_reason"
            rules={[{ required: true, message: 'Ingrese la razón del rechazo' }]}
          >
            <Input.TextArea rows={3} placeholder="Especifique la razón del rechazo..." />
          </Form.Item>
        )}

        {/* Notas del auditor */}
        <Form.Item
          label="Notas del Auditor"
          name="auditor_notes"
        >
          <Input.TextArea rows={3} placeholder="Agregue notas adicionales..." />
        </Form.Item>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-2">
          <Button onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            danger={auditAction === 'reject'}
          >
            {auditAction === 'approve' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AuditModal;
```

### 3. **Modal de Detalle de Cotización**

```typescript
// components/DetailModal.tsx
import React from 'react';
import { Modal, Descriptions, Table, Tag, Divider } from 'antd';

interface DetailModalProps {
  visible: boolean;
  quotation: Quotation | null;
  onCancel: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({
  visible,
  quotation,
  onCancel
}) => {
  const itemColumns = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Costo Unitario',
      dataIndex: 'unit_cost',
      key: 'unit_cost',
      render: (cost: number) => `$${cost.toLocaleString()}`,
    },
    {
      title: 'Costo Total',
      dataIndex: 'total_cost',
      key: 'total_cost',
      render: (cost: number) => `$${cost.toLocaleString()}`,
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category ? <Tag>{category}</Tag> : '-',
    },
  ];

  return (
    <Modal
      title={`Detalle de Cotización - ${quotation?.patient_name}`}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      {quotation && (
        <div>
          {/* Información general */}
          <Descriptions title="Información General" bordered column={2}>
            <Descriptions.Item label="ID Cotización">
              {quotation.quotation_id}
            </Descriptions.Item>
            <Descriptions.Item label="Paciente">
              {quotation.patient_name}
            </Descriptions.Item>
            <Descriptions.Item label="Proveedor">
              {quotation.provider_name}
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag color={
                quotation.status === 'sent' ? 'blue' :
                quotation.status === 'pending' ? 'orange' :
                'default'
              }>
                {quotation.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Costo Total">
              <span className="font-semibold text-lg">
                ${quotation.total_cost.toLocaleString()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Días de Entrega">
              {quotation.delivery_days} días
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Información de la orden médica */}
          {quotation.medical_order && (
            <>
              <Descriptions title="Orden Médica" bordered column={2}>
                <Descriptions.Item label="ID Orden">
                  {quotation.medical_order.medical_order_id}
                </Descriptions.Item>
                <Descriptions.Item label="Doctor">
                  {quotation.medical_order.doctor_name || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Especialidades">
                  {quotation.medical_order.specialty?.join(', ') || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Urgencia">
                  <Tag color={
                    quotation.medical_order.urgency === 'high' ? 'red' :
                    quotation.medical_order.urgency === 'medium' ? 'orange' :
                    'green'
                  }>
                    {quotation.medical_order.urgency.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <Divider />
            </>
          )}

          {/* Items de la cotización */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Items de la Cotización</h4>
            <Table
              columns={itemColumns}
              dataSource={quotation.items}
              rowKey="item_id"
              pagination={false}
              size="small"
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DetailModal;
```

### 4. **Hook Personalizado para Auditoría**

```typescript
// hooks/useAuditor.ts
import { useState, useCallback } from 'react';

interface UseAuditorReturn {
  loading: boolean;
  error: string | null;
  loadPendingQuotations: (page?: number, limit?: number, filters?: any) => Promise<any>;
  approveQuotation: (quotationId: string, data: any) => Promise<boolean>;
  rejectQuotation: (quotationId: string, data: any) => Promise<boolean>;
  getQuotationDetail: (quotationId: string) => Promise<any>;
  getStatistics: () => Promise<any>;
}

export const useAuditor = (): UseAuditorReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPendingQuotations = useCallback(async (page = 1, limit = 10, filters = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    return await apiCall(`/api/auditor/pending-quotations?${queryParams}`);
  }, [apiCall]);

  const approveQuotation = useCallback(async (quotationId: string, data: any) => {
    try {
      await apiCall(`/api/auditor/quotations/${quotationId}/audit`, {
        method: 'PUT',
        body: JSON.stringify({
          audit_status: 'approved',
          ...data
        })
      });
      return true;
    } catch (err) {
      return false;
    }
  }, [apiCall]);

  const rejectQuotation = useCallback(async (quotationId: string, data: any) => {
    try {
      await apiCall(`/api/auditor/quotations/${quotationId}/audit`, {
        method: 'PUT',
        body: JSON.stringify({
          audit_status: 'rejected',
          ...data
        })
      });
      return true;
    } catch (err) {
      return false;
    }
  }, [apiCall]);

  const getQuotationDetail = useCallback(async (quotationId: string) => {
    return await apiCall(`/api/auditor/quotations/${quotationId}`);
  }, [apiCall]);

  const getStatistics = useCallback(async () => {
    return await apiCall('/api/auditor/statistics');
  }, [apiCall]);

  return {
    loading,
    error,
    loadPendingQuotations,
    approveQuotation,
    rejectQuotation,
    getQuotationDetail,
    getStatistics
  };
};
```

### 5. **Componente de Estadísticas**

```typescript
// components/AuditorStatistics.tsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';

const AuditorStatistics: React.FC = () => {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/auditor/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando estadísticas...</div>;
  }

  if (!statistics) {
    return <div>Error cargando estadísticas</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Estadísticas de Auditoría</h2>
      
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Solicitudes"
              value={statistics.total_requests}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Aprobadas"
              value={statistics.approved_requests}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Rechazadas"
              value={statistics.rejected_requests}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Ahorro Total"
              value={statistics.cost_savings}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => `$${value?.toLocaleString()}`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Tiempo Promedio de Procesamiento">
            <Statistic
              value={statistics.average_processing_time}
              suffix="días"
              precision={1}
            />
            <Progress
              percent={Math.min((statistics.average_processing_time / 7) * 100, 100)}
              status="active"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Tendencias Mensuales">
            <Table
              dataSource={statistics.monthly_trends}
              columns={[
                { title: 'Mes', dataIndex: 'month', key: 'month' },
                { title: 'Solicitudes', dataIndex: 'requests', key: 'requests' },
                { title: 'Aprobadas', dataIndex: 'approved', key: 'approved' },
                { title: 'Rechazadas', dataIndex: 'rejected', key: 'rejected' }
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AuditorStatistics;
```

## 🎯 FLUJO DE TRABAJO COMPLETO

### 1. **Cargar Cotizaciones Pendientes**
```typescript
// El usuario accede al dashboard
// Se cargan automáticamente las cotizaciones pendientes
// Se muestra la tabla con paginación
```

### 2. **Ver Detalle de Cotización**
```typescript
// Usuario hace clic en "Ver" en una cotización
// Se abre modal con detalles completos
// Se muestran items, información del paciente, etc.
```

### 3. **Auditar Cotización**
```typescript
// Usuario hace clic en "Auditar"
// Se abre modal de auditoría
// Usuario puede elegir Aprobar o Rechazar
// Se completan los campos requeridos
// Se envía la solicitud al backend
```

### 4. **Resultado de Auditoría**
```typescript
// Backend procesa la auditoría
// Se actualiza el estado de la cotización
// Se muestra mensaje de éxito/error
// Se recarga la lista de cotizaciones
```

## 🔧 CONFIGURACIÓN ADICIONAL

### 1. **Variables de Entorno**
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_AUDITOR_PAGE_SIZE=10
REACT_APP_MAX_PAGE_SIZE=100
```

### 2. **Tipos TypeScript**
```typescript
// types/auditor.ts
export interface Quotation {
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

export interface QuotationItem {
  item_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  category: string | null;
}

export interface MedicalOrder {
  medical_order_id: string;
  patient_name: string;
  doctor_name: string | null;
  specialty: string[];
  urgency: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface AuditCriteria {
  price_reasonable: boolean;
  quality_adequate: boolean;
  delivery_time_acceptable: boolean;
  provider_reliable: boolean;
  documentation_complete: boolean;
}
```

### 3. **Rutas de React Router**
```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuditorDashboard from './components/AuditorDashboard';
import AuditorStatistics from './components/AuditorStatistics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auditor" element={<AuditorDashboard />} />
        <Route path="/auditor/statistics" element={<AuditorStatistics />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## ✅ VERIFICACIÓN DE IMPLEMENTACIÓN

### Tests Recomendados:
1. **Test de carga de datos**: Verificar que se cargan las cotizaciones correctamente
2. **Test de paginación**: Verificar que funciona la navegación entre páginas
3. **Test de filtros**: Verificar que los filtros funcionan correctamente
4. **Test de aprobación**: Verificar el flujo completo de aprobación
5. **Test de rechazo**: Verificar el flujo completo de rechazo
6. **Test de permisos**: Verificar que solo usuarios autorizados pueden acceder

### Comandos de Verificación:
```bash
# Verificar que el backend está funcionando
curl http://localhost:3000/api/health

# Verificar endpoint de auditoría (requiere token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/auditor/pending-quotations?page=1&limit=5
```

---

**Estado**: ✅ Listo para implementación  
**Versión**: 1.0.0  
**Fecha**: Julio 2025 