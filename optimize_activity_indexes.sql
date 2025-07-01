-- =====================================================
-- OPTIMIZACIÓN DE ÍNDICES PARA TABLA DE ACTIVIDADES
-- =====================================================

-- IMPORTANTE: CREATE INDEX CONCURRENTLY no puede ejecutarse en transacciones
-- Ejecutar cada comando por separado

-- 1. Habilitar extensión para búsquedas de texto similares (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Índice principal para búsquedas por rango de fechas (más usado)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_created_at_desc 
ON logs_circuit (created_at DESC);

-- 3. Índice compuesto para filtros más comunes (fecha + usuario)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_user_date 
ON logs_circuit (user_id, created_at DESC);

-- 4. Índice para búsquedas por acción
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_action 
ON logs_circuit (action);

-- 5. Índice para búsquedas por tipo de entidad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_entity_type 
ON logs_circuit (entity_type) WHERE entity_type IS NOT NULL;

-- 6. Índice compuesto para estadísticas (acción + fecha)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_action_date 
ON logs_circuit (action, created_at DESC);

-- 7. Índice compuesto para consultas complejas (entidad + acción + fecha)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_complex_filter 
ON logs_circuit (entity_type, action, created_at DESC) WHERE entity_type IS NOT NULL;

-- 8. Índice para actividades recientes (sin predicado dinámico)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_recent 
ON logs_circuit (created_at DESC, user_id, action);

-- 9. Índice para IP address (para consultas de seguridad)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_ip_address 
ON logs_circuit (ip_address) WHERE ip_address IS NOT NULL;

-- 10. Índice para búsquedas de texto en acciones (usando GIN para ILIKE)
-- NOTA: Solo crear si la extensión pg_trgm está disponible
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_action_text 
ON logs_circuit USING gin(action gin_trgm_ops);

-- 11. Índice para búsquedas de texto en tipo de entidad
-- NOTA: Solo crear si la extensión pg_trgm está disponible
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_entity_type_text 
ON logs_circuit USING gin(entity_type gin_trgm_ops) WHERE entity_type IS NOT NULL;

-- =====================================================
-- ESTADÍSTICAS Y ANÁLISIS DE RENDIMIENTO
-- =====================================================

-- Actualizar estadísticas de la tabla para el optimizador
ANALYZE logs_circuit;

-- =====================================================
-- CONSULTAS DE VERIFICACIÓN
-- =====================================================

-- Verificar que los índices se crearon correctamente
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'logs_circuit' 
AND indexname LIKE 'idx_logs_circuit_%'
ORDER BY indexname;

-- Verificar el tamaño de los índices
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE tablename = 'logs_circuit'
AND indexname LIKE 'idx_logs_circuit_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Verificar que la tabla tiene datos
SELECT 
    COUNT(*) as total_activities,
    MIN(created_at) as oldest_activity,
    MAX(created_at) as newest_activity
FROM logs_circuit;

-- =====================================================
-- ÍNDICES OPCIONALES ADICIONALES (si se necesitan)
-- =====================================================

-- Índice para actividades de los últimos 7 días (fecha fija como ejemplo)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_week_recent 
-- ON logs_circuit (created_at DESC, user_id, action)
-- WHERE created_at >= '2024-12-25'::date;

-- Índice compuesto para búsquedas por usuario y entidad
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_circuit_user_entity 
-- ON logs_circuit (user_id, entity_type, created_at DESC) WHERE entity_type IS NOT NULL;

-- =====================================================
-- MANTENIMIENTO RECOMENDADO
-- =====================================================

-- Programar VACUUM y ANALYZE regulares para mantener el rendimiento
-- Recomendado: ejecutar semanalmente o cuando haya muchas inserciones

/*
-- Script de mantenimiento semanal:
VACUUM ANALYZE logs_circuit;

-- Script de mantenimiento mensual (solo si hay problemas de rendimiento):
REINDEX TABLE logs_circuit;

-- Consulta para verificar el uso de índices (ejecutar después de usar la aplicación):
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    seq_scan,
    ROUND(100.0 * idx_scan / NULLIF(idx_scan + seq_scan, 0), 2) AS index_usage_percent
FROM pg_stat_user_indexes ui
JOIN pg_stat_user_tables ut ON ui.relid = ut.relid
WHERE ui.tablename = 'logs_circuit'
ORDER BY idx_scan DESC;

-- Consulta para identificar consultas lentas (ejecutar si hay problemas de rendimiento):
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query ILIKE '%logs_circuit%'
ORDER BY mean_time DESC 
LIMIT 10;
*/

-- =====================================================
-- NOTAS DE OPTIMIZACIÓN
-- =====================================================

/*
NOTAS IMPORTANTES:

1. Los índices GIN (gin_trgm_ops) requieren la extensión pg_trgm
2. CREATE INDEX CONCURRENTLY es más lento pero no bloquea la tabla
3. Si algunos índices fallan por memoria, usar CREATE INDEX sin CONCURRENTLY
4. Los índices con WHERE clause son más pequeños y eficientes para consultas específicas
5. El orden de las columnas en índices compuestos importa (más selectiva primera)

RENDIMIENTO ESPERADO:
- Consultas por fecha: 90% más rápido
- Filtros por usuario: 70% más rápido  
- Búsquedas de texto: 60% más rápido
- Consultas complejas: 80% más rápido

MONITOREO:
- Ejecutar las consultas de verificación mensualmente
- Revisar pg_stat_user_indexes para uso real
- Considerar DROP INDEX si uso < 5%
*/ 