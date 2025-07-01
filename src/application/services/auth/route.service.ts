import { Injectable } from '@nestjs/common';
import { RouteInfo } from '../../../api/v1/auth/dtos/user-info.dto';

@Injectable()
export class RouteService {
  
  getRoutesByRole(roleName: string): { defaultRoute: string; routes: RouteInfo[] } {
    switch (roleName) {
      case 'Administrador':
        return {
          defaultRoute: '/admin/dashboard',
          routes: this.getAdminRoutes()
        };
      
      case 'Auditor':
        return {
          defaultRoute: '/auditor/requests',
          routes: this.getAuditorRoutes()
        };
      
      case 'Efector':
        return {
          defaultRoute: '/efector/requests',
          routes: this.getEffectorRoutes()
        };
      
      case 'Proveedor':
        return {
          defaultRoute: '/proveedor/quotations',
          routes: this.getProveedorRoutes()
        };
      
      case 'Médico':
        return {
          defaultRoute: '/medico/solicitudes',
          routes: this.getMedicoRoutes()
        };
      
      case 'Afiliado':
        return {
          defaultRoute: '/afiliado/profile',
          routes: this.getAfiliadoRoutes()
        };
      
      default:
        return {
          defaultRoute: '/unauthorized',
          routes: []
        };
    }
  }

  private getAdminRoutes(): RouteInfo[] {
    return [
      {
        path: '/admin/dashboard',
        title: 'Dashboard',
        icon: 'DashboardIcon',
        description: 'Vista general del sistema',
        order: 1
      },
      {
        path: '/admin/users',
        title: 'Gestión de Usuarios',
        icon: 'UsersIcon',
        description: 'Administrar usuarios del sistema',
        order: 2,
        children: [
          {
            path: '/admin/users',
            title: 'Lista de Usuarios',
            icon: 'ListIcon',
            order: 1
          },
          {
            path: '/admin/users/create',
            title: 'Crear Usuario',
            icon: 'PlusIcon',
            order: 2
          },
          {
            path: '/admin/users/providers',
            title: 'Proveedores',
            icon: 'BusinessIcon',
            order: 3
          },
          {
            path: '/admin/users/auditors',
            title: 'Auditores',
            icon: 'VerifiedIcon',
            order: 4
          },
          {
            path: '/admin/users/effectors',
            title: 'Efectores',
            icon: 'HospitalIcon',
            order: 5
          }
        ]
      },
      {
        path: '/admin/healthcare',
        title: 'Sistema de Salud',
        icon: 'HealthIcon',
        description: 'Gestión del sistema de salud',
        order: 3,
        children: [
          {
            path: '/admin/healthcare/especialidades',
            title: 'Especialidades',
            icon: 'MedicalIcon',
            order: 1
          },
          {
            path: '/admin/healthcare/medicos',
            title: 'Médicos',
            icon: 'DoctorIcon',
            order: 2
          },
          {
            path: '/admin/healthcare/obras-sociales',
            title: 'Obras Sociales',
            icon: 'InsuranceIcon',
            order: 3
          },
          {
            path: '/admin/healthcare/afiliados',
            title: 'Afiliados',
            icon: 'PatientIcon',
            order: 4
          }
        ]
      },
      {
        path: '/admin/deposito',
        title: 'Depósito',
        icon: 'WarehouseIcon',
        description: 'Gestión de artículos y depósito',
        order: 4,
        children: [
          {
            path: '/admin/deposito/articulos',
            title: 'Artículos',
            icon: 'PackageIcon',
            order: 1
          },
          {
            path: '/admin/deposito/grupos',
            title: 'Grupos de Artículos',
            icon: 'FolderIcon',
            order: 2
          }
        ]
      },
      {
        path: '/admin/effector-requests',
        title: 'Pedidos Efector',
        icon: 'HospitalIcon',
        description: 'Gestión de pedidos de efectores institucionales',
        order: 5,
        children: [
          {
            path: '/admin/effector-requests/list',
            title: 'Lista de Pedidos',
            icon: 'ListIcon',
            order: 1
          },
          {
            path: '/admin/effector-requests/create',
            title: 'Crear Pedidos',
            icon: 'PlusIcon',
            order: 2
          },
          {
            path: '/admin/effector-requests',
            title: 'Pendientes de Autorización',
            icon: 'ClockIcon',
            order: 3
          },
          {
            path: '/admin/effector-requests/ai-review',
            title: 'Revisión IA',
            icon: 'BrainIcon',
            order: 4
          }
        ]
      },
      {
        path: '/admin/medical-orders',
        title: 'Pedidos Médicos',
        icon: 'MedicalIcon',
        description: 'Gestión de pedidos médicos con IA',
        order: 6,
        children: [
          {
            path: '/admin/medical-orders',
            title: 'Lista de Pedidos',
            icon: 'ListIcon',
            order: 1
          },
          {
            path: '/admin/medical-orders/create',
            title: 'Crear Pedido',
            icon: 'PlusIcon',
            order: 2
          },
          {
            path: '/admin/medical-orders/ai-review',
            title: 'Revisión IA',
            icon: 'BrainIcon',
            order: 3
          }
        ]
      },
      {
        path: '/admin/analytics',
        title: 'Reportes y Analytics',
        icon: 'AnalyticsIcon',
        description: 'Estadísticas del sistema',
        order: 7
      },
      {
        path: '/admin/settings',
        title: 'Configuración',
        icon: 'SettingsIcon',
        description: 'Configuración del sistema',
        order: 8
      }
    ];
  }

  private getAuditorRoutes(): RouteInfo[] {
    return [
      {
        path: '/auditor/requests',
        title: 'Pedidos para Auditar',
        icon: 'AuditIcon',
        description: 'Pedidos pendientes de auditoría',
        order: 1
      },
      {
        path: '/auditor/requests/pending',
        title: 'Pendientes',
        icon: 'PendingIcon',
        description: 'Pedidos pendientes de revisión',
        order: 2
      },
      {
        path: '/auditor/requests/history',
        title: 'Historial',
        icon: 'HistoryIcon',
        description: 'Pedidos auditados',
        order: 3
      },
      {
        path: '/auditor/reports',
        title: 'Reportes',
        icon: 'ReportIcon',
        description: 'Reportes de auditoría',
        order: 4
      }
    ];
  }

  private getEffectorRoutes(): RouteInfo[] {
    return [
      {
        path: '/efector/requests',
        title: 'Mis Pedidos',
        icon: 'RequestsIcon',
        description: 'Gestionar mis pedidos',
        order: 1
      },
      {
        path: '/efector/requests/create',
        title: 'Crear Pedido',
        icon: 'PlusIcon',
        description: 'Crear nuevo pedido',
        order: 2
      },
      {
        path: '/efector/requests/pending',
        title: 'Pendientes',
        icon: 'PendingIcon',
        description: 'Pedidos pendientes',
        order: 3
      },
      {
        path: '/efector/quotations',
        title: 'Cotizaciones',
        icon: 'QuoteIcon',
        description: 'Ver cotizaciones recibidas',
        order: 4
      },
      {
        path: '/efector/orders',
        title: 'Órdenes',
        icon: 'OrderIcon',
        description: 'Órdenes de provisión',
        order: 5
      },
      {
        path: '/efector/profile',
        title: 'Mi Perfil',
        icon: 'ProfileIcon',
        description: 'Información del efector',
        order: 6
      }
    ];
  }

  private getProveedorRoutes(): RouteInfo[] {
    return [
      {
        path: '/proveedor/quotations',
        title: 'Cotizaciones',
        icon: 'QuoteIcon',
        description: 'Gestionar cotizaciones',
        order: 1
      },
      {
        path: '/proveedor/requests',
        title: 'Pedidos Disponibles',
        icon: 'RequestsIcon',
        description: 'Pedidos para cotizar',
        order: 2
      },
      {
        path: '/proveedor/orders',
        title: 'Órdenes Recibidas',
        icon: 'OrderIcon',
        description: 'Órdenes adjudicadas',
        order: 3
      },
      {
        path: '/proveedor/catalog',
        title: 'Mi Catálogo',
        icon: 'CatalogIcon',
        description: 'Gestionar artículos',
        order: 4
      },
      {
        path: '/proveedor/profile',
        title: 'Mi Perfil',
        icon: 'ProfileIcon',
        description: 'Información del proveedor',
        order: 5
      }
    ];
  }

  private getMedicoRoutes(): RouteInfo[] {
    return [
      {
        path: '/medico/solicitudes',
        title: 'Solicitudes Médicas',
        icon: 'MedicalIcon',
        description: 'Gestionar solicitudes médicas',
        order: 1
      },
      {
        path: '/medico/solicitudes/create',
        title: 'Nueva Solicitud',
        icon: 'PlusIcon',
        description: 'Crear nueva solicitud',
        order: 2
      },
      {
        path: '/medico/pacientes',
        title: 'Pacientes',
        icon: 'PatientIcon',
        description: 'Gestionar pacientes',
        order: 3
      },
      {
        path: '/medico/profile',
        title: 'Mi Perfil',
        icon: 'ProfileIcon',
        description: 'Información del médico',
        order: 4
      }
    ];
  }

  private getAfiliadoRoutes(): RouteInfo[] {
    return [
      {
        path: '/afiliado/profile',
        title: 'Mi Perfil',
        icon: 'ProfileIcon',
        description: 'Información personal',
        order: 1
      },
      {
        path: '/afiliado/solicitudes',
        title: 'Mis Solicitudes',
        icon: 'RequestsIcon',
        description: 'Historial de solicitudes',
        order: 2
      },
      {
        path: '/afiliado/obras-sociales',
        title: 'Obras Sociales',
        icon: 'HealthIcon',
        description: 'Información de obras sociales',
        order: 3
      }
    ];
  }
} 