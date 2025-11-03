-- Add OCR Reader permissions for existing admin user axelcrkv@gmail.com
-- This script adds OCR functionality to the existing system with correct column names

-- Insert OCR-related permissions using correct column names
INSERT INTO permisos (nombre, descripcion) VALUES 
    ('USE_OCR_READER', 'Usar OCR Reader'),
    ('UPLOAD_OCR_DOCUMENTS', 'Subir documentos para OCR'),
    ('VIEW_OCR_DOCUMENTS', 'Ver documentos OCR'),
    ('DELETE_OCR_DOCUMENTS', 'Eliminar documentos OCR'),
    ('REPROCESS_OCR_DOCUMENTS', 'Reprocesar documentos OCR')
ON CONFLICT (nombre) DO NOTHING;

-- Assign OCR permissions to Administrator role (role_id = 1)
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 1, p.permiso_id
FROM permisos p
WHERE p.nombre IN (
    'USE_OCR_READER',
    'UPLOAD_OCR_DOCUMENTS',
    'VIEW_OCR_DOCUMENTS',
    'DELETE_OCR_DOCUMENTS',
    'REPROCESS_OCR_DOCUMENTS'
)
ON CONFLICT (role_id, permiso_id) DO NOTHING;

-- Display final status
SELECT 
    'OCR permissions added successfully for admin user: axelcrkv@gmail.com' as status;

-- Verify the admin user
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
    p.nombre,
    p.descripcion
FROM permisos p
WHERE p.nombre LIKE '%OCR%'
ORDER BY p.nombre;

-- Show total permissions count for Administrator role
SELECT 
    'Total permissions for Administrator role:' as info,
    COUNT(*) as permission_count
FROM roles_permisos rp
WHERE rp.role_id = 1;