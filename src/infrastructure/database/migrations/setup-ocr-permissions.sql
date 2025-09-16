-- Setup OCR Reader permissions and admin user
-- This script ensures the admin user has access to OCR Reader functionality

-- First, create the OCR documents table if it doesn't exist (from previous migration)
CREATE TABLE IF NOT EXISTS ocr_documents (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    extracted_text TEXT,
    ocr_result JSONB,
    medical_data JSONB,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    processed_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for OCR documents table if they don't exist
CREATE INDEX IF NOT EXISTS idx_ocr_documents_status ON ocr_documents(status);
CREATE INDEX IF NOT EXISTS idx_ocr_documents_created_at ON ocr_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ocr_documents_processed_by ON ocr_documents(processed_by);

-- Create trigger function for updating updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for ocr_documents if it doesn't exist
DROP TRIGGER IF EXISTS update_ocr_documents_updated_at ON ocr_documents;
CREATE TRIGGER update_ocr_documents_updated_at 
    BEFORE UPDATE ON ocr_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure roles table exists
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure permissions table exists
CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure role_permissions table exists
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure usuarios table exists with proper structure
CREATE TABLE IF NOT EXISTS usuarios (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    password_hash VARCHAR(255),
    role_id INTEGER REFERENCES roles(role_id),
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Insert basic roles if they don't exist
INSERT INTO roles (name, description) VALUES 
    ('Administrador', 'Administrador del sistema con acceso completo'),
    ('Auditor', 'Usuario auditor con permisos de auditoría'),
    ('Efector', 'Usuario efector para crear solicitudes'),
    ('Proveedor', 'Usuario proveedor para gestionar cotizaciones'),
    ('Médico', 'Usuario médico para crear solicitudes médicas'),
    ('Afiliado', 'Usuario afiliado básico')
ON CONFLICT (name) DO NOTHING;

-- Insert all permissions including OCR permissions
INSERT INTO permissions (name, description) VALUES 
    -- User management
    ('CREATE_USERS', 'Crear usuarios'),
    ('UPDATE_USERS', 'Actualizar usuarios'),
    ('DELETE_USERS', 'Eliminar usuarios'),
    ('VIEW_ALL_USERS', 'Ver todos los usuarios'),
    
    -- Request management
    ('VIEW_ALL_REQUESTS', 'Ver todas las solicitudes'),
    ('APPROVE_REQUESTS', 'Aprobar solicitudes'),
    ('CREATE_REQUESTS', 'Crear solicitudes'),
    ('AUDIT_REQUESTS', 'Auditar solicitudes'),
    
    -- Quotation and order management
    ('CREATE_QUOTATIONS', 'Crear cotizaciones'),
    ('MANAGE_QUOTATIONS', 'Gestionar cotizaciones'),
    ('VIEW_ALL_QUOTATIONS', 'Ver todas las cotizaciones'),
    ('AUDIT_QUOTATIONS', 'Auditar cotizaciones'),
    ('MANAGE_ORDERS', 'Gestionar órdenes'),
    
    -- Audit
    ('VIEW_AUDIT_REQUESTS', 'Ver solicitudes de auditoría'),
    ('CREATE_AUDIT_REQUESTS', 'Crear solicitudes de auditoría'),
    ('UPDATE_AUDIT_REQUESTS', 'Actualizar solicitudes de auditoría'),
    
    -- Material Delivery
    ('MANAGE_DELIVERIES', 'Gestionar entregas'),
    ('VIEW_DELIVERIES', 'Ver entregas'),
    ('CREATE_DELIVERIES', 'Crear entregas'),
    ('UPDATE_DELIVERIES', 'Actualizar entregas'),
    ('COMPLETE_DELIVERIES', 'Completar entregas'),
    
    -- Analytics
    ('VIEW_ANALYTICS', 'Ver analíticas'),
    
    -- OCR Reader permissions
    ('USE_OCR_READER', 'Usar OCR Reader'),
    ('UPLOAD_OCR_DOCUMENTS', 'Subir documentos para OCR'),
    ('VIEW_OCR_DOCUMENTS', 'Ver documentos OCR'),
    ('DELETE_OCR_DOCUMENTS', 'Eliminar documentos OCR'),
    ('REPROCESS_OCR_DOCUMENTS', 'Reprocesar documentos OCR'),
    
    -- Admin access
    ('ADMIN_ACCESS', 'Acceso administrativo completo')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to Administrator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Administrador'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign specific permissions to Auditor role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Auditor' AND p.name IN (
    'AUDIT_REQUESTS',
    'VIEW_ALL_REQUESTS',
    'APPROVE_REQUESTS',
    'VIEW_ALL_USERS',
    'VIEW_AUDIT_REQUESTS',
    'CREATE_AUDIT_REQUESTS',
    'UPDATE_AUDIT_REQUESTS',
    'VIEW_DELIVERIES'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign specific permissions to Efector role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Efector' AND p.name IN (
    'CREATE_REQUESTS'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign specific permissions to Proveedor role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Proveedor' AND p.name IN (
    'CREATE_QUOTATIONS',
    'MANAGE_ORDERS',
    'VIEW_DELIVERIES',
    'CREATE_DELIVERIES',
    'UPDATE_DELIVERIES',
    'COMPLETE_DELIVERIES'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign specific permissions to Médico role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'Médico' AND p.name IN (
    'CREATE_REQUESTS'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create admin user if it doesn't exist
INSERT INTO usuarios (email, nombre, apellido, password_hash, role_id, status, email_verified)
SELECT 
    'admin@admin.com',
    'Admin',
    'User',
    '$2b$10$rO0Ui8JwmcvOJnK.XsGp2eSWQNWHJV8YccfBLGfAA1LdkJhz3.XsW', -- Hash for "admin"
    r.role_id,
    'active',
    true
FROM roles r
WHERE r.name = 'Administrador'
AND NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@admin.com');

-- Update existing admin user to ensure it has the Administrator role
UPDATE usuarios 
SET 
    role_id = (SELECT role_id FROM roles WHERE name = 'Administrador'),
    password_hash = '$2b$10$rO0Ui8JwmcvOJnK.XsGp2eSWQNWHJV8YccfBLGfAA1LdkJhz3.XsW', -- Hash for "admin"
    status = 'active',
    email_verified = true,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@admin.com';

-- Insert the admin user if no existing admin user with password 'admin'
DO $$ 
DECLARE 
    admin_role_id INTEGER;
BEGIN
    -- Get the Administrator role ID
    SELECT role_id INTO admin_role_id FROM roles WHERE name = 'Administrador';
    
    -- Insert admin user if it doesn't exist
    INSERT INTO usuarios (email, nombre, apellido, password_hash, role_id, status, email_verified)
    VALUES (
        'admin@admin.com',
        'Admin',
        'User',
        '$2b$10$rO0Ui8JwmcvOJnK.XsGp2eSWQNWHJV8YccfBLGfAA1LdkJhz3.XsW', -- bcrypt hash for 'admin'
        admin_role_id,
        'active',
        true
    )
    ON CONFLICT (email) 
    DO UPDATE SET 
        role_id = admin_role_id,
        password_hash = '$2b$10$rO0Ui8JwmcvOJnK.XsGp2eSWQNWHJV8YccfBLGfAA1LdkJhz3.XsW',
        status = 'active',
        email_verified = true,
        updated_at = CURRENT_TIMESTAMP;
END $$;

-- Add comments for documentation
COMMENT ON TABLE ocr_documents IS 'Stores uploaded documents and their OCR processing results';
COMMENT ON COLUMN ocr_documents.file_name IS 'Generated unique filename for the uploaded file';
COMMENT ON COLUMN ocr_documents.original_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN ocr_documents.extracted_text IS 'Text extracted from document via OCR';
COMMENT ON COLUMN ocr_documents.medical_data IS 'Structured medical information extracted from text';
COMMENT ON COLUMN ocr_documents.ocr_result IS 'Raw OCR processing result with confidence scores';
COMMENT ON COLUMN ocr_documents.processed_by IS 'User ID who uploaded the document';

-- Display final status
SELECT 
    'OCR permissions setup completed successfully. Admin user created/updated with email: admin@admin.com, password: admin' as status;

-- Verify the setup by showing admin user and their permissions
SELECT 
    u.email,
    u.nombre,
    r.name as role_name,
    COUNT(rp.permission_id) as permission_count
FROM usuarios u
JOIN roles r ON u.role_id = r.role_id
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
WHERE u.email = 'admin@admin.com'
GROUP BY u.email, u.nombre, r.name;