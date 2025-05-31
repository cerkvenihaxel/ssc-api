# Sistema de Pedidos de Efectores

## Descripción

Sistema completo para la gestión de pedidos de artículos médicos desde efectores hasta proveedores, implementando un flujo de auditoría, cotizaciones y órdenes de provisión.

## Características

- ✅ **Arquitectura Limpia**: Implementa Clean Architecture con separación clara de responsabilidades
- ✅ **Principios SOLID**: Código mantenible y extensible
- ✅ **Patrones DRY y KISS**: Código simple y sin repetición
- ✅ **Autenticación JWT**: Seguridad robusta con roles y permisos
- ✅ **Validación de Datos**: Validación completa con class-validator
- ✅ **Documentación Swagger**: API completamente documentada
- ✅ **Manejo de Archivos**: Subida de archivos PDF y DOCX
- ✅ **Sistema de Notificaciones**: Notificaciones en tiempo real
- ✅ **Auditoría Completa**: Trazabilidad de todos los cambios

## Instalación

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd ssc-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar base de datos**
```bash
# Crear base de datos PostgreSQL
createdb ssc_db

# Ejecutar migraciones
psql -d ssc_db -f src/infrastructure/database/migrations/create-effector-request-tables.sql
```

4. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=ssc_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

5. **Ejecutar la aplicación**
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## Uso

### 1. Autenticación

Primero, obtén un token JWT:

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "axelcrkv@gmail.com",
    "password": "password123"
  }'
```

### 2. Crear Pedido de Efector

```bash
curl -X POST http://localhost:3000/v1/effector-requests \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pedido de insumos médicos",
    "description": "Pedido urgente para área de emergencias",
    "priority": "ALTA",
    "delivery_date": "2024-02-15",
    "delivery_address": "Hospital Central",
    "contact_person": "Dr. Juan Pérez",
    "contact_phone": "+54911234567",
    "contact_email": "juan.perez@hospital.com",
    "items": [
      {
        "article_name": "Jeringa 10ml",
        "description": "Jeringa descartable estéril",
        "quantity": 100,
        "unit_measure": "unidad",
        "expiration_date": "2025-12-31",
        "estimated_unit_price": 150.00,
        "estimated_total_price": 15000.00
      }
    ]
  }'
```

### 3. Aprobar Pedido (Auditor)

```bash
curl -X PATCH http://localhost:3000/v1/effector-requests/{id}/state \
  -H "Authorization: Bearer <auditor_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "state_name": "APROBADO",
    "observations": "Pedido aprobado para cotización"
  }'
```

### 4. Ver Pedidos Disponibles (Proveedor)

```bash
curl -X GET http://localhost:3000/v1/provider-quotations/available-requests \
  -H "Authorization: Bearer <provider_token>"
```

### 5. Crear Cotización (Proveedor)

```bash
curl -X POST http://localhost:3000/v1/provider-quotations \
  -H "Authorization: Bearer <provider_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "uuid-del-pedido",
    "delivery_time_days": 15,
    "delivery_terms": "Entrega en hospital",
    "payment_terms": "30 días",
    "warranty_terms": "12 meses",
    "observations": "Productos certificados",
    "valid_until": "2024-03-01",
    "items": [
      {
        "request_item_id": "uuid-del-item",
        "unit_price": 140.00,
        "quantity": 100,
        "delivery_time_days": 10,
        "observations": "Disponible inmediatamente"
      }
    ]
  }'
```

## Estructura del Proyecto

```
src/
├── api/v1/                          # Capa de Presentación
│   ├── effector-requests/           # Controladores y DTOs
│   ├── provider-quotations/
│   └── provision-orders/
├── application/services/            # Capa de Aplicación
│   ├── effector-request/
│   ├── provider-quotation/
│   └── provision-order/
├── domain/                          # Capa de Dominio
│   ├── models/                      # Modelos de dominio
│   └── repositories/                # Interfaces de repositorio
└── infrastructure/                  # Capa de Infraestructura
    ├── persistence/entities/        # Entidades TypeORM
    └── database/migrations/         # Migraciones SQL
```

## Estados del Sistema

### Flujo de Estados de Pedidos

```
PENDIENTE → APROBADO → EN_COTIZACION → COTIZADO → ADJUDICADO
    ↓           ↓            ↓           ↓
CANCELADO   CANCELADO   CANCELADO   CANCELADO
    ↓
RECHAZADO
```

### Roles y Permisos

- **Efector**: Crear y ver sus pedidos
- **Auditor**: Aprobar/rechazar pedidos
- **Proveedor**: Ver pedidos aprobados y crear cotizaciones
- **Administrador**: Crear órdenes de provisión y gestionar todo el sistema

## Testing

### Ejecutar Tests

```bash
# Tests unitarios
npm run test

# Tests de integración
npm run test:e2e

# Coverage
npm run test:cov
```

### Colección de Postman

Importa la colección `Effector_Requests_API.postman_collection.json` en Postman para probar todos los endpoints.

## Documentación API

Una vez ejecutada la aplicación, accede a:
- **Swagger UI**: http://localhost:3000/api
- **Documentación**: Ver `EFFECTOR_REQUESTS_API_DOCUMENTATION.md`

## Monitoreo y Logs

### Logs de Aplicación

Los logs se almacenan en:
- Consola (desarrollo)
- Archivos de log (producción)
- Base de datos (tabla `logs_circuit`)

### Métricas

- Tiempo de respuesta de endpoints
- Número de pedidos por estado
- Eficiencia de cotizaciones
- Tiempo promedio de adjudicación

## Seguridad

### Autenticación

- JWT con expiración configurable
- Refresh tokens para sesiones largas
- Validación de roles en cada endpoint

### Validación

- Validación de entrada con class-validator
- Sanitización de datos
- Protección contra inyección SQL

### Archivos

- Validación de tipos de archivo (PDF, DOCX)
- Límite de tamaño (10MB por archivo)
- Escaneo de virus (configurable)

## Deployment

### Docker

```bash
# Construir imagen
docker build -t effector-requests-api .

# Ejecutar contenedor
docker run -p 3000:3000 effector-requests-api
```

### Docker Compose

```bash
docker-compose up -d
```

### Variables de Entorno de Producción

```env
NODE_ENV=production
DATABASE_SSL=true
JWT_SECRET=<strong-secret>
CORS_ORIGIN=https://your-frontend.com
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## Soporte

Para soporte técnico:
- Email: soporte@ssc-api.com
- Issues: GitHub Issues
- Documentación: Wiki del proyecto

## Changelog

### v1.0.0 (2024-01-01)
- ✅ Implementación inicial del flujo de pedidos
- ✅ Sistema de autenticación JWT
- ✅ Módulo de cotizaciones
- ✅ Órdenes de provisión
- ✅ Sistema de notificaciones
- ✅ Documentación completa 