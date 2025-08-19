-- Datos de prueba para el módulo de auditoría

-- Insertar proveedores de prueba
INSERT INTO proveedores (provider_id, provider_name, provider_type, cuit, status, creation_date, last_update)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Proveedor Test 1', 'medical', '20-12345678-9', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('550e8400-e29b-41d4-a716-446655440002', 'Proveedor Test 2', 'equipment', '20-87654321-0', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (provider_id) DO NOTHING;

-- Insertar afiliados de prueba
INSERT INTO afiliados (affiliate_id, affiliate_number, affiliate_status, creation_date, last_update, cuil, document_type, document_number, document_country, gender, first_name, last_name, birth_date, nationality, email, password_hash, created_by)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440003', 'AFF001', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '20-12345678-9', 'DNI', '12345678', 'AR', 'M', 'Juan', 'Pérez', '1990-01-01', 'AR', 'juan.perez@test.com', 'hash123', '550e8400-e29b-41d4-a716-446655440000'),
  ('550e8400-e29b-41d4-a716-446655440004', 'AFF002', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '20-87654321-0', 'DNI', '87654321', 'AR', 'F', 'María', 'García', '1985-05-15', 'AR', 'maria.garcia@test.com', 'hash456', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (affiliate_id) DO NOTHING;

-- Insertar órdenes médicas de prueba
INSERT INTO medical_orders (order_id, order_number, requester_id, requester_type, affiliate_id, state_id, urgency_id, title, medical_justification, created_by)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440005', 'MO-2025-000001', '550e8400-e29b-41d4-a716-446655440000', 'admin', '550e8400-e29b-41d4-a716-446655440003', 1, 1, 'Orden Médica Test 1', 'Justificación médica de prueba', '550e8400-e29b-41d4-a716-446655440000'),
  ('550e8400-e29b-41d4-a716-446655440006', 'MO-2025-000002', '550e8400-e29b-41d4-a716-446655440000', 'admin', '550e8400-e29b-41d4-a716-446655440004', 1, 2, 'Orden Médica Test 2', 'Justificación médica de prueba 2', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (order_id) DO NOTHING;

-- Insertar cotizaciones de prueba
INSERT INTO provider_quotations (quotation_id, request_id, provider_id, quotation_number, state_id, total_amount, delivery_time_days, available_for_audit, status, created_by)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Q-2025-000001', '550e8400-e29b-41d4-a716-446655440008', 15000.00, 7, true, 'pending', '550e8400-e29b-41d4-a716-446655440000'),
  ('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Q-2025-000002', '550e8400-e29b-41d4-a716-446655440008', 25000.00, 10, true, 'pending', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (quotation_id) DO NOTHING;

-- Insertar items de cotización de prueba
INSERT INTO provider_quotation_items (quotation_item_id, quotation_id, request_item_id, unit_price, total_price, quantity)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440011', 5000.00, 5000.00, 1),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440013', 10000.00, 10000.00, 1),
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440015', 25000.00, 25000.00, 1)
ON CONFLICT (quotation_item_id) DO NOTHING;

-- Insertar solicitudes de auditoría de prueba
INSERT INTO audit_requests (audit_request_id, quotation_id, medical_order_id, provider_id, audit_status, audit_type, created_by)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'pending', 'manual', '550e8400-e29b-41d4-a716-446655440000'),
  ('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'approved', 'manual', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (audit_request_id) DO NOTHING;

-- Actualizar la segunda auditoría como completada
UPDATE audit_requests 
SET audit_status = 'approved', 
    auditor_notes = 'Cotización aprobada después de revisión',
    approved_cost = 24000.00,
    audited_at = CURRENT_TIMESTAMP,
    completed_at = CURRENT_TIMESTAMP
WHERE audit_request_id = '550e8400-e29b-41d4-a716-446655440017'; 