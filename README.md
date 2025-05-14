# Sistema de Gestión y Seguimiento de Pedidos de Medicamentos (SSC-API)

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

## Descripción

Este proyecto backend fue desarrollado para SISCON en convenio con el Ministerio de Salud Pública. La aplicación proporciona una plataforma robusta para la gestión, seguimiento y análisis de pedidos de medicamentos, tanto unitarios como masivos, incluyendo funcionalidades para consultas y auditorías de pedidos.

### Características Principales

- Gestión de pedidos unitarios y masivos de medicamentos
- Sistema de seguimiento en tiempo real
- Herramientas de análisis y reportes
- Sistema de auditoría y trazabilidad
- Consultas avanzadas de pedidos
- Integración con sistemas del Ministerio de Salud

## Configuración del Proyecto

```bash
# Instalación de dependencias
$ yarn install
```

## Ejecución del Proyecto

```bash
# Modo desarrollo
$ yarn run start

# Modo desarrollo con hot-reload
$ yarn run start:dev

# Modo producción
$ yarn run start:prod
```

## Pruebas

```bash
# Tests unitarios
$ yarn run test

# Tests end-to-end
$ yarn run test:e2e

# Cobertura de tests
$ yarn run test:cov
```

## Documentación Técnica

### Stack Tecnológico
- NestJS como framework principal
- TypeScript para desarrollo seguro y tipado
- PostgreSQL como base de datos principal
- JWT para autenticación
- Swagger para documentación de API

### Arquitectura
El proyecto sigue una arquitectura modular basada en los principios de NestJS:
- Módulos independientes por funcionalidad
- Patrón Repository para acceso a datos
- Servicios para lógica de negocio
- Controllers para endpoints REST
- Guards para seguridad y autenticación
- Interceptors para transformación de datos

### Endpoints Principales
La documentación detallada de los endpoints está disponible en:
```
/api/docs
```

## Despliegue

Para el despliegue en producción, siga los siguientes pasos:

1. Configure las variables de entorno necesarias
2. Ejecute la build de producción
3. Inicie el servidor usando PM2 o similar

```bash
$ yarn build
$ yarn start:prod
```

## Soporte y Contacto

Para soporte técnico o consultas, contacte a:
- Soporte Técnico: [correo de soporte]
- Mesa de Ayuda: [teléfono de contacto]

## Derechos de Autor

© 2025 Global Médica S.A. Todos los derechos reservados.

Este software es propiedad de Global Médica S.A. y ha sido desarrollado en colaboración con SISCON y el Ministerio de Salud Pública. No se permite su reproducción o distribución sin autorización expresa.

## Licencia

Este proyecto está protegido bajo licencia propietaria. Todos los derechos están reservados a Global Médica S.A.
