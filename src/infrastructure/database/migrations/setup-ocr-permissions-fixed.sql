-- Setup OCR Reader permissions and admin user (Fixed for existing schema)
-- This script ensures the admin user has access to OCR Reader functionality

-- First, create the OCR documents table if it doesn't exist
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
    processed_by UUID REFERENCES usuarios(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for OCR documents table if they don't exist
CREATE INDEX IF NOT EXISTS idx_ocr_documents_status ON ocr_documents(status);
CREATE INDEX IF NOT EXISTS idx_ocr_documents_created_at ON ocr_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ocr_documents_processed_by ON ocr_documents(processed_by);

-- Create trigger for ocr_documents if it doesn't exist
DROP TRIGGER IF EXISTS update_ocr_documents_updated_at ON ocr_documents;
CREATE TRIGGER update_ocr_documents_updated_at 
    BEFORE UPDATE ON ocr_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert OCR-related permissions if they don't exist
INSERT INTO permisos (permission_name, description) VALUES 
    ('USE_OCR_READER', 'Usar OCR Reader'),
    ('UPLOAD_OCR_DOCUMENTS', 'Subir documentos para OCR'),
    ('VIEW_OCR_DOCUMENTS', 'Ver documentos OCR'),
    ('DELETE_OCR_DOCUMENTS', 'Eliminar documentos OCR'),
    ('REPROCESS_OCR_DOCUMENTS', 'Reprocesar documentos OCR')
ON CONFLICT (permission_name) DO NOTHING;

-- Assign OCR permissions to Administrator role (role_id = 1)
INSERT INTO roles_permisos (role_id, permission_id)
SELECT 1, p.permission_id
FROM permisos p
WHERE p.permission_name IN (
    'USE_OCR_READER',
    'UPLOAD_OCR_DOCUMENTS',
    'VIEW_OCR_DOCUMENTS',
    'DELETE_OCR_DOCUMENTS',
    'REPROCESS_OCR_DOCUMENTS'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create/Update admin user with email admin@admin.com and password 'admin'
INSERT INTO usuarios (email, nombre, password_hash, role_id, status, email_verified)
VALUES (
    'admin@admin.com',
    'Admin User',
    '$2b$10$rO0Ui8JwmcvOJnK.XsGp2eSWQNWHJV8YccfBLGfAA1LdkJhz3.XsW', -- bcrypt hash for 'admin'
    1, -- Administrator role
    'active',
    true
)
ON CONFLICT (email) 
DO UPDATE SET 
    role_id = 1,
    password_hash = '$2b$10$rO0Ui8JwmcvOJnK.XsGp2eSWQNWHJV8YccfBLGfAA1LdkJhz3.XsW',
    status = 'active',
    email_verified = true,
    updated_at = CURRENT_TIMESTAMP;

-- Also update the existing IOSEP admin to have Administrator role to ensure OCR access
UPDATE usuarios 
SET 
    role_id = 1, -- Administrator role
    status = 'active',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'administracion@iosep.com.ar';

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
    'OCR permissions setup completed successfully. Admin users updated with OCR access.' as status;

-- Verify the setup by showing admin users and their roles
SELECT 
    u.email,
    u.nombre,
    r.role_name,
    u.status
FROM usuarios u
JOIN roles r ON u.role_id = r.role_id
WHERE u.email IN ('admin@admin.com', 'administracion@iosep.com.ar')
ORDER BY u.email;