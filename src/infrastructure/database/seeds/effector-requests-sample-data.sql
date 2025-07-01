-- Datos de prueba para pedidos de efectores
-- Ejecutar después de las migraciones principales

-- Obtener IDs necesarios
DO $$
DECLARE
    v_estado_pendiente UUID;
    v_estado_aprobado UUID;
    v_efector1_id UUID;
    v_efector2_id UUID;
    v_admin_id UUID;
    v_articulo1_id UUID;
    v_articulo2_id UUID;
    v_articulo3_id UUID;
    v_articulo4_id UUID;
    v_request1_id UUID;
    v_request2_id UUID;
    v_efector_role_id INTEGER;
    v_admin_role_id INTEGER;
    v_provider_role_id INTEGER;
    v_provider_id UUID;
    v_provider_user_id UUID;
BEGIN
    -- Obtener estados
    SELECT state_id INTO v_estado_pendiente FROM effector_request_states WHERE state_name = 'PENDIENTE';
    SELECT state_id INTO v_estado_aprobado FROM effector_request_states WHERE state_name = 'APROBADO';
    
    -- Obtener IDs de roles
    SELECT role_id INTO v_efector_role_id FROM roles WHERE role_name = 'Efector';
    SELECT role_id INTO v_admin_role_id FROM roles WHERE role_name = 'Administrador';
    SELECT role_id INTO v_provider_role_id FROM roles WHERE role_name = 'Proveedor';
    
    -- Obtener efectores existentes
    SELECT user_id INTO v_efector1_id FROM usuarios 
    WHERE role_id = v_efector_role_id LIMIT 1;
    
    SELECT user_id INTO v_efector2_id FROM usuarios 
    WHERE role_id = v_efector_role_id OFFSET 1 LIMIT 1;
    
    -- Si no existen efectores, crear algunos de prueba
    IF v_efector1_id IS NULL THEN
        INSERT INTO usuarios (
            user_id, nombre, email, role_id, status, email_verified, 
            effector_info
        ) VALUES (
            gen_random_uuid(), 
            'Hospital Central Dr. Ramón Madariaga', 
            'hospital.central@salud.corrientes.gov.ar', 
            v_efector_role_id, 
            'active', 
            true,
            '{"cuil": "30-12345678-9", "telefono": "+54 379 4567890", "direccion": "Av. Libertad 1234", "localidad": "Corrientes", "provincia": "Corrientes", "tipo": "Hospital"}'::jsonb
        ) RETURNING user_id INTO v_efector1_id;
    END IF;
    
    IF v_efector2_id IS NULL THEN
        INSERT INTO usuarios (
            user_id, nombre, email, role_id, status, email_verified,
            effector_info
        ) VALUES (
            gen_random_uuid(), 
            'Centro de Salud Belgrano', 
            'cs.belgrano@salud.corrientes.gov.ar', 
            v_efector_role_id, 
            'active', 
            true,
            '{"cuil": "30-87654321-2", "telefono": "+54 379 7654321", "direccion": "Calle San Juan 567", "localidad": "Corrientes", "provincia": "Corrientes", "tipo": "Centro de Salud"}'::jsonb
        ) RETURNING user_id INTO v_efector2_id;
    END IF;
    
    -- Obtener admin para created_by
    SELECT user_id INTO v_admin_id FROM usuarios 
    WHERE role_id = v_admin_role_id LIMIT 1;
    
    -- Obtener un proveedor para los artículos (requerido por la estructura)
    SELECT provider_id INTO v_provider_id FROM proveedores LIMIT 1;
    
    -- Si no existe proveedor, crear uno de prueba
    IF v_provider_id IS NULL THEN
        -- Crear usuario proveedor
        INSERT INTO usuarios (
            user_id, nombre, email, role_id, status, email_verified
        ) VALUES (
            gen_random_uuid(), 
            'Farmacia del Hospital', 
            'farmacia@hospitalproveedor.com.ar', 
            v_provider_role_id, 
            'active', 
            true
        ) RETURNING user_id INTO v_provider_user_id;
        
        -- Crear proveedor
        INSERT INTO proveedores (
            provider_id, user_id, nombre, direccion, telefono, email,
            cuit, contacto_principal, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_provider_user_id,
            'Farmacia del Hospital S.A.',
            'Av. Principal 123, Corrientes',
            '+54 379 1234567',
            'farmacia@hospitalproveedor.com.ar',
            '30-12345678-0',
            'Juan Pérez',
            v_admin_id,
            v_admin_id
        ) RETURNING provider_id INTO v_provider_id;
    END IF;
    
    -- Crear algunos artículos de depósito si no existen
    IF NOT EXISTS (SELECT 1 FROM articulos WHERE codigo = 'MED001') THEN
        INSERT INTO articulos (articulo_id, provider_id, codigo, nombre, descripcion, presentacion, precio, stock)
        VALUES (gen_random_uuid(), v_provider_id, 'MED001', 'Paracetamol 500mg', 'Analgésico y antipirético', 'Comp x 20', 150.00, 1000);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM articulos WHERE codigo = 'MED002') THEN
        INSERT INTO articulos (articulo_id, provider_id, codigo, nombre, descripcion, presentacion, precio, stock)
        VALUES (gen_random_uuid(), v_provider_id, 'MED002', 'Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo', 'Comp x 30', 250.00, 800);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM articulos WHERE codigo = 'INS001') THEN
        INSERT INTO articulos (articulo_id, provider_id, codigo, nombre, descripcion, presentacion, precio, stock)
        VALUES (gen_random_uuid(), v_provider_id, 'INS001', 'Jeringas 5ml descartables', 'Jeringas estériles descartables', 'Caja x 100', 450.00, 500);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM articulos WHERE codigo = 'INS002') THEN
        INSERT INTO articulos (articulo_id, provider_id, codigo, nombre, descripcion, presentacion, precio, stock)
        VALUES (gen_random_uuid(), v_provider_id, 'INS002', 'Gasas estériles 10x10cm', 'Gasas estériles para curaciones', 'Paquete x 50', 300.00, 300);
    END IF;
    
    -- Obtener IDs de artículos
    SELECT articulo_id INTO v_articulo1_id FROM articulos WHERE codigo = 'MED001';
    SELECT articulo_id INTO v_articulo2_id FROM articulos WHERE codigo = 'MED002';
    SELECT articulo_id INTO v_articulo3_id FROM articulos WHERE codigo = 'INS001';
    SELECT articulo_id INTO v_articulo4_id FROM articulos WHERE codigo = 'INS002';
    
    -- Crear pedidos de efectores
    
    -- Pedido 1: Hospital Central - Urgente
    INSERT INTO effector_requests (
        request_id, effector_id, request_number, title, description, state_id, priority,
        delivery_date, delivery_address, contact_person, contact_phone, contact_email,
        total_estimated_amount, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_efector1_id, 'EFR-2024-001', 
        'Pedido Urgente de Medicamentos para Emergencias',
        'Pedido de medicamentos esenciales para el área de emergencias debido al aumento de consultas en época invernal. Incremento del 40% en consultas por enfermedades respiratorias. Stock crítico de analgéticos y antiinflamatorios. Temporada invernal con alta demanda de atención médica.',
        v_estado_pendiente, 'URGENTE',
        CURRENT_DATE + INTERVAL '7 days',
        'Av. Libertad 1234, Corrientes Capital',
        'Dr. María González', '+54 379 4567890', 'emergencias@hospital.central.gov.ar',
        15000.00,
        v_admin_id, v_admin_id
    ) RETURNING request_id INTO v_request1_id;
    
    -- Items del pedido 1
    INSERT INTO effector_request_items (
        item_id, request_id, article_code, article_name, description, quantity,
        unit_measure, technical_specifications, estimated_unit_price, estimated_total_price
    ) VALUES 
        (gen_random_uuid(), v_request1_id, 'MED001', 'Paracetamol 500mg',
         'Analgésico y antipirético de primera línea. Alto consumo en emergencias para tratamiento de dolor y fiebre', 50, 'Cajas x 20 comp',
         'Comprimidos recubiertos, registro ANMAT vigente', 150.00, 7500.00),
        (gen_random_uuid(), v_request1_id, 'MED002', 'Ibuprofeno 400mg',
         'Antiinflamatorio no esteroideo para dolor moderado. Necesario para manejo de dolor inflamatorio en pacientes adultos', 30, 'Cajas x 30 comp',
         'Comprimidos recubiertos, contraindicaciones en ficha técnica', 250.00, 7500.00);
    
    -- Pedido 2: Centro de Salud - Normal
    INSERT INTO effector_requests (
        request_id, effector_id, request_number, title, description, state_id, priority,
        delivery_date, delivery_address, contact_person, contact_phone, contact_email,
        total_estimated_amount, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_efector2_id, 'EFR-2024-002',
        'Pedido Mensual de Insumos para Consultorios',
        'Pedido regular de insumos médicos para mantener el funcionamiento normal de los consultorios. Reposición de stock regular para mantener atención programada y de demanda espontánea. Operación normal del centro de salud con demanda estable de consultas.',
        v_estado_aprobado, 'NORMAL',
        CURRENT_DATE + INTERVAL '15 days',
        'Calle San Juan 567, Corrientes Capital',
        'Enf. Roberto Sánchez', '+54 379 7654321', 'insumos@cs.belgrano.gov.ar',
        13500.00,
        v_admin_id, v_admin_id
    ) RETURNING request_id INTO v_request2_id;
    
    -- Items del pedido 2
    INSERT INTO effector_request_items (
        item_id, request_id, article_code, article_name, description, quantity,
        unit_measure, technical_specifications, estimated_unit_price, estimated_total_price
    ) VALUES 
        (gen_random_uuid(), v_request2_id, 'INS001', 'Jeringas 5ml descartables',
         'Jeringas estériles descartables para inyecciones intramusculares. Consumo regular para vacunación y aplicación de medicamentos inyectables', 20, 'Cajas x 100 unid',
         'Estériles, descartables, con aguja 21G x 1.5", libre de látex', 450.00, 9000.00),
        (gen_random_uuid(), v_request2_id, 'INS002', 'Gasas estériles 10x10cm',
         'Gasas estériles para curaciones y procedimientos menores. Necesarias para curaciones diarias y procedimientos de enfermería', 15, 'Paquetes x 50 unid',
         'Estériles, no tejidas, absorbentes, empaque individual', 300.00, 4500.00),
        (gen_random_uuid(), v_request2_id, 'HIG001', 'Alcohol en gel 500ml',
         'Alcohol en gel para higiene de manos del personal y visitantes. Protocolo de bioseguridad e higiene hospitalaria', 25, 'Frascos x 500ml',
         'Concentración 70%, con humectantes, dispensador incluido', 0.00, 0.00);
    
    -- Crear algunos archivos adjuntos de ejemplo
    INSERT INTO effector_request_attachments (
        attachment_id, request_id, file_name, file_path, file_type, file_size, uploaded_by
    ) VALUES 
        (gen_random_uuid(), v_request1_id, 'justificacion_emergencias.pdf', 
         '/uploads/effector-requests/justificacion_emergencias.pdf', 'pdf', 1024576, v_admin_id),
        (gen_random_uuid(), v_request1_id, 'estadisticas_consultas.xlsx',
         '/uploads/effector-requests/estadisticas_consultas.xlsx', 'xlsx', 2048000, v_admin_id),
        (gen_random_uuid(), v_request2_id, 'planilla_stock_actual.pdf',
         '/uploads/effector-requests/planilla_stock_actual.pdf', 'pdf', 756432, v_admin_id);
    
    RAISE NOTICE 'Datos de prueba creados exitosamente:';
    RAISE NOTICE '- Pedido urgente: % (ID: %)', 'EFR-2024-001', v_request1_id;
    RAISE NOTICE '- Pedido normal: % (ID: %)', 'EFR-2024-002', v_request2_id;
    RAISE NOTICE '- Efectores: % y %', v_efector1_id, v_efector2_id;
    RAISE NOTICE '- Proveedor: %', v_provider_id;
    
END $$; 