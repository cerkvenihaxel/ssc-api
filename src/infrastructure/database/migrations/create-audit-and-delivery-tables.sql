-- Migración para crear tablas de auditoría y entrega de materiales
-- Ejecutar después de las migraciones existentes

-- Agregar campo available_for_audit a provider_quotations
ALTER TABLE provider_quotations 
ADD COLUMN available_for_audit BOOLEAN DEFAULT FALSE;

-- Crear tabla audit_requests
CREATE TABLE audit_requests (
  audit_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES provider_quotations(quotation_id),
  medical_order_id UUID NOT NULL REFERENCES medical_orders(order_id),
  provider_id UUID NOT NULL REFERENCES proveedores(provider_id),
  audit_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (audit_status IN ('pending', 'in_progress', 'approved', 'rejected', 'completed')),
  auditor_notes TEXT,
  rejection_reason TEXT,
  original_order_cost DECIMAL(12,2),
  quoted_cost DECIMAL(12,2),
  approved_cost DECIMAL(12,2),
  item_comparison JSONB,
  audit_criteria JSONB,
  audit_type VARCHAR(20) DEFAULT 'manual' CHECK (audit_type IN ('manual', 'ai', 'hybrid')),
  auditor_id UUID REFERENCES usuarios(user_id),
  audited_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES usuarios(user_id),
  updated_by UUID REFERENCES usuarios(user_id)
);

-- Crear tabla material_deliveries
CREATE TABLE material_deliveries (
  delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_request_id UUID NOT NULL REFERENCES audit_requests(audit_request_id),
  provider_id UUID NOT NULL REFERENCES proveedores(provider_id),
  delivery_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'preparing', 'shipped', 'delivered', 'completed', 'cancelled')),
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  delivery_address TEXT,
  recipient_name VARCHAR(255),
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(255),
  tracking_number VARCHAR(100),
  courier_company VARCHAR(100),
  delivered_items JSONB,
  delivery_notes JSONB,
  foja_number VARCHAR(100),
  total_quantity_delivered INTEGER,
  final_cost DECIMAL(12,2),
  quality_check_passed BOOLEAN DEFAULT FALSE,
  quality_check_notes TEXT,
  patient_satisfaction BOOLEAN DEFAULT FALSE,
  patient_feedback TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES usuarios(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES usuarios(user_id),
  updated_by UUID REFERENCES usuarios(user_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_audit_requests_quotation_id ON audit_requests(quotation_id);
CREATE INDEX idx_audit_requests_medical_order_id ON audit_requests(medical_order_id);
CREATE INDEX idx_audit_requests_provider_id ON audit_requests(provider_id);
CREATE INDEX idx_audit_requests_audit_status ON audit_requests(audit_status);
CREATE INDEX idx_audit_requests_auditor_id ON audit_requests(auditor_id);
CREATE INDEX idx_audit_requests_created_at ON audit_requests(created_at);

CREATE INDEX idx_material_deliveries_audit_request_id ON material_deliveries(audit_request_id);
CREATE INDEX idx_material_deliveries_provider_id ON material_deliveries(provider_id);
CREATE INDEX idx_material_deliveries_delivery_status ON material_deliveries(delivery_status);
CREATE INDEX idx_material_deliveries_expected_delivery_date ON material_deliveries(expected_delivery_date);
CREATE INDEX idx_material_deliveries_created_at ON material_deliveries(created_at);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_audit_requests_updated_at 
    BEFORE UPDATE ON audit_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_deliveries_updated_at 
    BEFORE UPDATE ON material_deliveries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo para testing
INSERT INTO audit_requests (
  quotation_id, 
  medical_order_id, 
  provider_id, 
  audit_status, 
  auditor_notes, 
  original_order_cost, 
  quoted_cost, 
  approved_cost,
  audit_type,
  created_by
) VALUES 
(
  (SELECT quotation_id FROM provider_quotations LIMIT 1),
  (SELECT order_id FROM medical_orders LIMIT 1),
  (SELECT provider_id FROM proveedores LIMIT 1),
  'pending',
  'Cotización pendiente de revisión',
  100000.00,
  95000.00,
  95000.00,
  'manual',
  (SELECT user_id FROM usuarios WHERE role_id = 3 LIMIT 1)
);

-- Comentarios sobre la estructura
COMMENT ON TABLE audit_requests IS 'Solicitudes de auditoría para cotizaciones de proveedores';
COMMENT ON TABLE material_deliveries IS 'Seguimiento de entregas de materiales aprobados';
COMMENT ON COLUMN audit_requests.audit_status IS 'Estado de la auditoría: pending, in_progress, approved, rejected, completed';
COMMENT ON COLUMN audit_requests.audit_type IS 'Tipo de auditoría: manual, ai, hybrid';
COMMENT ON COLUMN material_deliveries.delivery_status IS 'Estado de la entrega: pending, preparing, shipped, delivered, completed, cancelled';
COMMENT ON COLUMN material_deliveries.foja_number IS 'Número de foja para prótesis y materiales especiales'; 