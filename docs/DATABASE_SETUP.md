# Configuración de Base de Datos - Vada Health

## Script SQL Corregido

El archivo `script.sql` contiene el script completo y corregido para crear todas las tablas del sistema con:

### ✅ Características Principales

1. **Sistema de usuarios unificado**
   - Tabla `usuarios` centralizada
   - Roles y permisos granulares
   - Referencias consistentes en todas las tablas

2. **Relaciones corregidas**
   - Todas las foreign keys apuntan a las tablas correctas
   - Referencias a `usuarios(user_id)` en lugar de emails
   - Constraints de integridad referencial

3. **Sistema completo de pedidos de efectores**
   - Estados de pedidos
   - Artículos solicitados
   - Cotizaciones de proveedores
   - Órdenes de provisión

4. **Usuarios de prueba incluidos**
   - Administrador principal
   - Auditor
   - Efector (Hospital)
   - Médico
   - 2 Proveedores

## Cómo ejecutar el script

### 1. Preparar la base de datos

```bash
# Conectar a PostgreSQL como superusuario
sudo -u postgres psql

# Crear la base de datos (si no existe)
CREATE DATABASE ssc_db;

# Crear usuario de la aplicación (si no existe)
CREATE USER ssc_user WITH PASSWORD 'tu_password_seguro';

# Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE ssc_db TO ssc_user;

# Conectar a la base de datos
\c ssc_db

# Otorgar permisos en el esquema
GRANT ALL ON SCHEMA public TO ssc_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ssc_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ssc_user;

\q
```

### 2. Ejecutar el script

```bash
# Opción 1: Desde línea de comandos
psql -h localhost -U ssc_user -d ssc_db -f script.sql

# Opción 2: Desde psql
psql -h localhost -U ssc_user -d ssc_db
\i script.sql
```

### 3. Verificar la instalación

```sql
-- Verificar que las tablas se crearon correctamente
\dt

-- Ver los usuarios de prueba
SELECT u.email, u.nombre, r.role_name, u.status 
FROM usuarios u 
JOIN roles r ON u.role_id = r.role_id;

-- Ver los permisos por rol
SELECT r.role_name, p.nombre as permiso, p.descripcion
FROM roles r
JOIN roles_permisos rp ON r.role_id = rp.role_id
JOIN permisos p ON rp.permiso_id = p.permiso_id
ORDER BY r.role_name, p.nombre;
```

## Usuarios de Prueba

| Email | Nombre | Rol | Password |
|-------|--------|-----|----------|
| admin@sistema.com | Administrador Principal | Administrador | admin123 |
| auditor@sistema.com | María García - Auditora | Auditor | auditor123 |
| efector@hospital.com | Hospital Central - Sistema | Efector | efector123 |
| medico@hospital.com | Dr. Juan Pérez | Médico | medico123 |
| proveedor1@farmacia.com | Farmacia Central S.A. | Proveedor | proveedor123 |
| proveedor2@laboratorio.com | Laboratorio Médico ABC | Proveedor | proveedor123 |

## Estructura de Tablas Principales

### Sistema de Usuarios
- `usuarios` - Tabla central de usuarios
- `roles` - Roles del sistema
- `permisos` - Permisos granulares
- `roles_permisos` - Relación N:M roles-permisos

### Entidades Específicas
- `afiliados` - Usuarios afiliados
- `medicos` - Usuarios médicos
- `proveedores` - Usuarios proveedores
- `empleados` - Empleados de obras sociales

### Sistema de Pedidos
- `effector_requests` - Pedidos de efectores
- `effector_request_items` - Artículos solicitados
- `effector_request_states` - Estados de pedidos
- `provider_quotations` - Cotizaciones de proveedores
- `provision_orders` - Órdenes de provisión

### Otros Sistemas
- `user_sessions` - Sesiones de usuario
- `magic_links` - Enlaces mágicos para autenticación
- `notifications` - Sistema de notificaciones
- `logs_circuit` - Logs de auditoría

## Cambios Principales Realizados

### 🔧 Correcciones de Relaciones
1. **Unificación de usuarios**: Todas las entidades de usuarios ahora referencian `usuarios(user_id)`
2. **Eliminación de emails duplicados**: Solo la tabla `usuarios` mantiene el campo email
3. **Foreign keys corregidas**: Todas apuntan a las tablas correctas
4. **Constraints de integridad**: Agregados para mantener consistencia

### 🚀 Nuevas Implementaciones
1. **Sistema de permisos granular**: 11 permisos específicos asignados por rol
2. **Estados de pedidos y cotizaciones**: Estados bien definidos para el workflow
3. **Sistema de notificaciones**: Para comunicación entre usuarios
4. **Logs de auditoría**: Para tracking de cambios
5. **Índices optimizados**: Para mejorar performance

### 📊 Datos de Prueba
1. **6 usuarios completos**: Uno por cada rol principal
2. **Especialidades médicas**: 4 especialidades base
3. **Obras sociales**: 3 obras sociales de prueba
4. **Pedido de ejemplo**: Con artículos y estados
5. **Notificaciones**: Ejemplos de notificaciones del sistema

## Notas Importantes

⚠️ **Contraseñas de prueba**: Las contraseñas están hasheadas con bcrypt (costo 10)
🔐 **Seguridad**: Cambiar las contraseñas en producción
📧 **Emails**: Usar emails reales para pruebas de notificaciones
🆔 **UUIDs fijos**: Los usuarios de prueba tienen UUIDs fijos para facilitar testing

## Próximos Pasos

1. **Ejecutar el script** en tu entorno de desarrollo
2. **Probar la autenticación** con los usuarios de prueba
3. **Verificar los endpoints** de administración
4. **Adaptar las entidades** de TypeORM si es necesario
5. **Configurar las variables** de entorno para la conexión

¡El sistema está listo para usarse con todas las funcionalidades implementadas! 