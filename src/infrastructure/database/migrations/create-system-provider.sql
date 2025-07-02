-- Insertar proveedor especial del sistema para administradores
INSERT INTO proveedores (
  provider_id,
  provider_name,
  provider_type,
  cuit,
  contact_name,
  contact_phone,
  contact_email,
  status,
  creation_date,
  last_update,
  created_by,
  updated_by,
  user_id
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SISTEMA - ADMINISTRADOR',
  'SISTEMA',
  '00-00000000-0', -- CUIT especial para el sistema
  'Administrador del Sistema',
  'N/A',
  'admin@sistema.com',
  'ACTIVO',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL,
  NULL,
  NULL
) ON CONFLICT (provider_id) DO NOTHING; 