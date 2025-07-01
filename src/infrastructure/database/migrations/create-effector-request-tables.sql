-- Crear extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Estados para pedidos de efectores
CREATE TABLE effector_request_states (
  state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar estados predefinidos
INSERT INTO effector_request_states (state_name, description) VALUES
  ('PENDIENTE', 'Pedido pendiente de auditoría'),
  ('APROBADO', 'Pedido aprobado por auditoría'),
  ('RECHAZADO', 'Pedido rechazado por auditoría'),
  ('CANCELADO', 'Pedido cancelado'),
  ('EN_COTIZACION', 'Pedido en proceso de cotización'),
  ('COTIZADO', 'Pedido cotizado por proveedores'),
  ('ADJUDICADO', 'Pedido adjudicado a proveedor');

-- Tabla de pedidos de efectores
CREATE TABLE effector_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effector_id UUID NOT NULL REFERENCES usuarios(user_id),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  state_id UUID NOT NULL REFERENCES effector_request_states(state_id),
  priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('BAJA', 'NORMAL', 'ALTA', 'URGENTE')),
  delivery_date DATE,
  delivery_address TEXT,
  contact_person VARCHAR(100),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(100),
  institution_department VARCHAR(100),
  institutional_justification TEXT,
  estimated_beneficiaries INTEGER,
  urgency_context TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES usuarios(user_id),
  updated_by UUID REFERENCES usuarios(user_id)
);

-- Artículos solicitados en cada pedido
CREATE TABLE effector_request_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES effector_requests(request_id) ON DELETE CASCADE,
  article_id UUID REFERENCES articulos(articulo_id),
  article_code VARCHAR(50),
  article_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_measure VARCHAR(50),
  expiration_date DATE,
  technical_specifications TEXT,
  justification TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Archivos adjuntos a pedidos
CREATE TABLE effector_request_attachments (
  attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES effector_requests(request_id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('pdf', 'docx', 'doc', 'xlsx', 'xls', 'jpg', 'jpeg', 'png')),
  file_size BIGINT,
  uploaded_by UUID REFERENCES usuarios(user_id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estados para cotizaciones
CREATE TABLE quotation_states (
  state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO quotation_states (state_name, description) VALUES
  ('BORRADOR', 'Cotización en borrador'),
  ('ENVIADA', 'Cotización enviada'),
  ('ACEPTADA', 'Cotización aceptada'),
  ('RECHAZADA', 'Cotización rechazada'),
  ('CANCELADA', 'Cotización cancelada');

-- Cotizaciones de proveedores
CREATE TABLE provider_quotations (
  quotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES effector_requests(request_id),
  provider_id UUID NOT NULL REFERENCES proveedores(provider_id),
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  state_id UUID NOT NULL REFERENCES quotation_states(state_id),
  total_amount DECIMAL(15,2) NOT NULL,
  delivery_time_days INTEGER,
  delivery_terms TEXT,
  payment_terms TEXT,
  warranty_terms TEXT,
  observations TEXT,
  valid_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES usuarios(user_id),
  updated_by UUID REFERENCES usuarios(user_id)
);

-- Artículos cotizados por proveedores
CREATE TABLE provider_quotation_items (
  quotation_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES provider_quotations(quotation_id) ON DELETE CASCADE,
  request_item_id UUID NOT NULL REFERENCES effector_request_items(item_id),
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  quantity INTEGER NOT NULL,
  delivery_time_days INTEGER,
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Archivos adjuntos a cotizaciones
CREATE TABLE provider_quotation_attachments (
  attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES provider_quotations(quotation_id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES usuarios(user_id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Órdenes de provisión
CREATE TABLE provision_orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES effector_requests(request_id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'CREADA' CHECK (status IN ('CREADA', 'ENVIADA', 'CONFIRMADA', 'ENTREGADA', 'CANCELADA')),
  delivery_date DATE,
  delivery_address TEXT NOT NULL,
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES usuarios(user_id),
  updated_by UUID REFERENCES usuarios(user_id)
);

-- Proveedores seleccionados para cada orden
CREATE TABLE provision_order_providers (
  order_provider_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES provision_orders(order_id) ON DELETE CASCADE,
  quotation_id UUID NOT NULL REFERENCES provider_quotations(quotation_id),
  provider_id UUID NOT NULL REFERENCES proveedores(provider_id),
  selected_amount DECIMAL(15,2) NOT NULL,
  delivery_time_days INTEGER,
  status VARCHAR(50) DEFAULT 'SELECCIONADO' CHECK (status IN ('SELECCIONADO', 'NOTIFICADO', 'CONFIRMADO', 'RECHAZADO')),
  delivery_points TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notificaciones del sistema
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(user_id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSON,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar permisos básicos
INSERT INTO permisos (nombre, descripcion) VALUES
  ('CREATE_USERS', 'Crear usuarios del sistema'),
  ('UPDATE_USERS', 'Actualizar usuarios del sistema'),
  ('DELETE_USERS', 'Eliminar usuarios del sistema'),
  ('VIEW_ALL_REQUESTS', 'Ver todos los pedidos del sistema'),
  ('APPROVE_REQUESTS', 'Aprobar o rechazar pedidos'),
  ('CREATE_QUOTATIONS', 'Crear cotizaciones'),
  ('MANAGE_ORDERS', 'Gestionar órdenes de provisión'),
  ('VIEW_ANALYTICS', 'Ver reportes y analytics');

-- Asignar permisos a roles
INSERT INTO roles_permisos (role_id, permiso_id) VALUES
  -- Administrador tiene todos los permisos
  ((SELECT role_id FROM roles WHERE role_name = 'Administrador'), (SELECT permiso_id FROM permisos WHERE nombre = 'CREATE_USERS')),
  ((SELECT role_id FROM roles WHERE role_name = 'Administrador'), (SELECT permiso_id FROM permisos WHERE nombre = 'UPDATE_USERS')),
  ((SELECT role_id FROM roles WHERE role_name = 'Administrador'), (SELECT permiso_id FROM permisos WHERE nombre = 'DELETE_USERS')),
  ((SELECT role_id FROM roles WHERE role_name = 'Administrador'), (SELECT permiso_id FROM permisos WHERE nombre = 'VIEW_ALL_REQUESTS')),
  ((SELECT role_id FROM roles WHERE role_name = 'Administrador'), (SELECT permiso_id FROM permisos WHERE nombre = 'APPROVE_REQUESTS')),
  ((SELECT role_id FROM roles WHERE role_name = 'Administrador'), (SELECT permiso_id FROM permisos WHERE nombre = 'MANAGE_ORDERS')),
  ((SELECT role_id FROM roles WHERE role_name = 'Administrador'), (SELECT permiso_id FROM permisos WHERE nombre = 'VIEW_ANALYTICS')),
  
  -- Auditor puede aprobar pedidos
  ((SELECT role_id FROM roles WHERE role_name = 'Auditor'), (SELECT permiso_id FROM permisos WHERE nombre = 'VIEW_ALL_REQUESTS')),
  ((SELECT role_id FROM roles WHERE role_name = 'Auditor'), (SELECT permiso_id FROM permisos WHERE nombre = 'APPROVE_REQUESTS')),
  
  -- Proveedor puede crear cotizaciones
  ((SELECT role_id FROM roles WHERE role_name = 'Proveedor'), (SELECT permiso_id FROM permisos WHERE nombre = 'CREATE_QUOTATIONS'));

-- Índices para mejor performance
CREATE INDEX idx_effector_requests_effector_id ON effector_requests(effector_id);
CREATE INDEX idx_effector_requests_state ON effector_requests(state_id);
CREATE INDEX idx_effector_requests_created_at ON effector_requests(created_at);
CREATE INDEX idx_provider_quotations_request_id ON provider_quotations(request_id);
CREATE INDEX idx_provider_quotations_provider_id ON provider_quotations(provider_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at); 