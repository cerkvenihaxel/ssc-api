-- Add OCR Reader permissions for existing admin user axelcrkv@gmail.com
-- This script adds OCR functionality to the existing system

-- Create the OCR documents table
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

-- Create trigger for ocr_documents updated_at
DROP TRIGGER IF EXISTS update_ocr_documents_updated_at ON ocr_documents;
CREATE TRIGGER update_ocr_documents_updated_at 
    BEFORE UPDATE ON ocr_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert OCR-related permissions
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

-- Ensure the admin user has Administrator role and is active
UPDATE usuarios 
SET 
    role_id = 1, -- Administrator role
    status = 'active',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'axelcrkv@gmail.com';

-- Add table comments
COMMENT ON TABLE ocr_documents IS 'Stores uploaded documents and their OCR processing results';

-- Display final status
SELECT 
    'OCR permissions added successfully for admin user: axelcrkv@gmail.com' as status;

-- Verify the setup
SELECT 
    'Admin user verification:' as info,
    u.email,
    u.nombre,
    r.role_name,
    u.status
FROM usuarios u
JOIN roles r ON u.role_id = r.role_id
WHERE u.email = 'axelcrkv@gmail.com';

-- Show OCR permissions added
SELECT 
    'OCR permissions added:' as info,
    p.permission_name,
    p.description
FROM permisos p
WHERE p.permission_name LIKE '%OCR%'
ORDER BY p.permission_name;