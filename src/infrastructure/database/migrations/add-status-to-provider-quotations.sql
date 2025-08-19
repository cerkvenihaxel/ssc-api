-- Agregar campo status a la tabla provider_quotations
ALTER TABLE provider_quotations 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;

-- Crear índice para mejorar el rendimiento de consultas por status
CREATE INDEX idx_provider_quotations_status ON provider_quotations(status);

-- Actualizar registros existentes con un status por defecto
UPDATE provider_quotations 
SET status = 'pending' 
WHERE status IS NULL;

-- Agregar comentario a la columna
COMMENT ON COLUMN provider_quotations.status IS 'Estado de la cotización: pending, sent, approved, rejected, completed'; 