# 🚀 Guía de Integración Frontend React - Vada Health

## 📋 Resumen Ejecutivo

El backend del Vada Health está **completamente funcional** y listo para integración con React. Incluye:

- ✅ **Autenticación completa** con Magic Links
- ✅ **Sistema de roles y permisos** granular
- ✅ **Rutas diferenciadas** por tipo de usuario
- ✅ **API REST completa** con documentación Swagger
- ✅ **Base de datos** con usuarios de prueba
- ✅ **Sistema de gestión** de usuarios (Admin)

---

## 🔐 Flujo de Autenticación

### 1. Login con Magic Link

#### **Paso 1: Solicitar Magic Link**
```typescript
// POST /api/v1/auth/login
const requestLogin = async (email: string) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  return response.json();
  // Respuesta: { message: "Se ha enviado un enlace de acceso a tu correo electrónico" }
};
```

#### **Paso 2: Verificar Magic Link**
```typescript
// GET /api/v1/auth/verify?token=TOKEN
const verifyMagicLink = async (token: string) => {
  const response = await fetch(`/api/v1/auth/verify?token=${token}`);
  const data = await response.json();
  
  // Respuesta completa con información del usuario
  return data;
  /*
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "sessionId": "uuid-session-id",
    "user": {
      "userId": "uuid",
      "email": "admin@sistema.com",
      "nombre": "Administrador Principal",
      "role": {
        "id": 5,
        "name": "Administrador",
        "description": "Administrador del sistema"
      },
      "status": "active",
      "permissions": ["CREATE_USERS", "UPDATE_USERS", "DELETE_USERS", ...],
      "defaultRoute": "/admin/dashboard",
      "availableRoutes": [
        {
          "path": "/admin/dashboard",
          "title": "Dashboard",
          "icon": "DashboardIcon",
          "description": "Vista general del sistema",
          "order": 1
        },
        ...
      ]
    },
    "message": "Inicio de sesión exitoso",
    "expiresIn": 86400
  }
  */
};
```

---

## 🗺️ Rutas por Rol de Usuario

### **Administrador** → `/admin/dashboard`
```typescript
const adminRoutes = [
  { path: '/admin/dashboard', title: 'Dashboard', icon: 'DashboardIcon' },
  { 
    path: '/admin/users', 
    title: 'Gestión de Usuarios', 
    icon: 'UsersIcon',
    children: [
      { path: '/admin/users/list', title: 'Lista de Usuarios' },
      { path: '/admin/users/create', title: 'Crear Usuario' },
      { path: '/admin/users/providers', title: 'Proveedores' },
      { path: '/admin/users/auditors', title: 'Auditores' }
    ]
  },
  { path: '/admin/requests', title: 'Pedidos', icon: 'RequestsIcon' },
  { path: '/admin/analytics', title: 'Reportes y Analytics', icon: 'AnalyticsIcon' },
  { path: '/admin/settings', title: 'Configuración', icon: 'SettingsIcon' }
];
```

### **Auditor** → `/auditor/requests`
```typescript
const auditorRoutes = [
  { path: '/auditor/requests', title: 'Pedidos para Auditar', icon: 'AuditIcon' },
  { path: '/auditor/requests/pending', title: 'Pendientes', icon: 'PendingIcon' },
  { path: '/auditor/requests/history', title: 'Historial', icon: 'HistoryIcon' },
  { path: '/auditor/reports', title: 'Reportes', icon: 'ReportIcon' }
];
```

### **Efector** → `/efector/requests`
```typescript
const effectorRoutes = [
  { path: '/efector/requests', title: 'Mis Pedidos', icon: 'RequestsIcon' },
  { path: '/efector/requests/create', title: 'Crear Pedido', icon: 'PlusIcon' },
  { path: '/efector/requests/pending', title: 'Pendientes', icon: 'PendingIcon' },
  { path: '/efector/quotations', title: 'Cotizaciones', icon: 'QuoteIcon' },
  { path: '/efector/orders', title: 'Órdenes', icon: 'OrderIcon' },
  { path: '/efector/profile', title: 'Mi Perfil', icon: 'ProfileIcon' }
];
```

### **Proveedor** → `/proveedor/quotations`
```typescript
const proveedorRoutes = [
  { path: '/proveedor/quotations', title: 'Cotizaciones', icon: 'QuoteIcon' },
  { path: '/proveedor/requests', title: 'Pedidos Disponibles', icon: 'RequestsIcon' },
  { path: '/proveedor/orders', title: 'Órdenes Recibidas', icon: 'OrderIcon' },
  { path: '/proveedor/catalog', title: 'Mi Catálogo', icon: 'CatalogIcon' },
  { path: '/proveedor/profile', title: 'Mi Perfil', icon: 'ProfileIcon' }
];
```

### **Médico** → `/medico/solicitudes`
```typescript
const medicoRoutes = [
  { path: '/medico/solicitudes', title: 'Solicitudes Médicas', icon: 'MedicalIcon' },
  { path: '/medico/solicitudes/create', title: 'Nueva Solicitud', icon: 'PlusIcon' },
  { path: '/medico/pacientes', title: 'Pacientes', icon: 'PatientIcon' },
  { path: '/medico/profile', title: 'Mi Perfil', icon: 'ProfileIcon' }
];
```

### **Afiliado** → `/afiliado/profile`
```typescript
const afiliadoRoutes = [
  { path: '/afiliado/profile', title: 'Mi Perfil', icon: 'ProfileIcon' },
  { path: '/afiliado/solicitudes', title: 'Mis Solicitudes', icon: 'RequestsIcon' },
  { path: '/afiliado/obras-sociales', title: 'Obras Sociales', icon: 'HealthIcon' }
];
```

---

## 🔧 Endpoints de Autenticación

### 1. **Información del Usuario Actual**
```typescript
// GET /api/v1/auth/me
const getCurrentUser = async (token: string) => {
  const response = await fetch('/api/v1/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
  // Retorna la misma estructura de user que en el login
};
```

### 2. **Refrescar Token**
```typescript
// POST /api/v1/auth/refresh
const refreshToken = async (token: string) => {
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
  // Respuesta: { accessToken: "nuevo_token", expiresIn: 86400 }
};
```

### 3. **Logout**
```typescript
// POST /api/v1/auth/logout
const logout = async (token: string) => {
  const response = await fetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
  // Respuesta: { message: "Sesión cerrada exitosamente" }
};
```

### 4. **Validar Token**
```typescript
// GET /api/v1/auth/validate
const validateToken = async (token: string) => {
  const response = await fetch('/api/v1/auth/validate', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
  // Respuesta: { valid: true, user: { userId, email, roleId } }
};
```

---

## 👥 Usuarios de Prueba

| Email | Rol | Password | Ruta Default |
|-------|-----|----------|--------------|
| `admin@sistema.com` | Administrador | `admin123` | `/admin/dashboard` |
| `auditor@sistema.com` | Auditor | `auditor123` | `/auditor/requests` |
| `efector@hospital.com` | Efector | `efector123` | `/efector/requests` |
| `medico@hospital.com` | Médico | `medico123` | `/medico/solicitudes` |
| `proveedor1@farmacia.com` | Proveedor | `proveedor123` | `/proveedor/quotations` |
| `proveedor2@laboratorio.com` | Proveedor | `proveedor123` | `/proveedor/quotations` |

---

## 🛡️ Sistema de Permisos

### Verificar Permisos en Frontend
```typescript
const hasPermission = (userPermissions: string[], requiredPermission: string) => {
  return userPermissions.includes(requiredPermission);
};

// Ejemplo de uso
const canCreateUsers = hasPermission(user.permissions, 'CREATE_USERS');
const canViewAnalytics = hasPermission(user.permissions, 'VIEW_ANALYTICS');
```

### Permisos Disponibles
```typescript
const PERMISSIONS = {
  CREATE_USERS: 'CREATE_USERS',
  UPDATE_USERS: 'UPDATE_USERS',
  DELETE_USERS: 'DELETE_USERS',
  VIEW_ALL_REQUESTS: 'VIEW_ALL_REQUESTS',
  APPROVE_REQUESTS: 'APPROVE_REQUESTS',
  CREATE_QUOTATIONS: 'CREATE_QUOTATIONS',
  MANAGE_ORDERS: 'MANAGE_ORDERS',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  CREATE_REQUESTS: 'CREATE_REQUESTS',
  AUDIT_REQUESTS: 'AUDIT_REQUESTS'
};
```

---

## 🏗️ Implementación React Sugerida

### 1. **Context de Autenticación**
```typescript
// context/AuthContext.tsx
interface AuthContextType {
  user: UserInfo | null;
  login: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Implementar métodos aquí
  
  return (
    <AuthContext.Provider value={{ user, login, verifyMagicLink, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. **Router Protegido**
```typescript
// components/ProtectedRoute.tsx
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredPermission?: string }> = ({ 
  children, 
  requiredPermission 
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredPermission && !user?.permissions.includes(requiredPermission)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};
```

### 3. **Router Principal**
```typescript
// App.tsx
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/verify" element={<MagicLinkVerifyPage />} />
          
          {/* Rutas Administrador */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredPermission="ADMIN_ACCESS">
              <AdminLayout />
            </ProtectedRoute>
          } />
          
          {/* Rutas Auditor */}
          <Route path="/auditor/*" element={
            <ProtectedRoute requiredPermission="AUDIT_REQUESTS">
              <AuditorLayout />
            </ProtectedRoute>
          } />
          
          {/* Rutas Efector */}
          <Route path="/efector/*" element={
            <ProtectedRoute requiredPermission="CREATE_REQUESTS">
              <EffectorLayout />
            </ProtectedRoute>
          } />
          
          {/* Rutas Proveedor */}
          <Route path="/proveedor/*" element={
            <ProtectedRoute requiredPermission="CREATE_QUOTATIONS">
              <ProveedorLayout />
            </ProtectedRoute>
          } />
          
          {/* Rutas Médico */}
          <Route path="/medico/*" element={
            <ProtectedRoute>
              <MedicoLayout />
            </ProtectedRoute>
          } />
          
          {/* Rutas Afiliado */}
          <Route path="/afiliado/*" element={
            <ProtectedRoute>
              <AfiliadoLayout />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<RedirectToUserHome />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};
```

### 4. **Redirección Automática**
```typescript
// components/RedirectToUserHome.tsx
const RedirectToUserHome = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Redirigir a la ruta por defecto del usuario
  return <Navigate to={user?.defaultRoute || '/login'} />;
};
```

---

## 🔌 API Endpoints Disponibles

### **Autenticación**
- `POST /api/v1/auth/login` - Solicitar magic link
- `GET /api/v1/auth/verify` - Verificar magic link
- `GET /api/v1/auth/me` - Información usuario actual
- `POST /api/v1/auth/refresh` - Refrescar token
- `POST /api/v1/auth/logout` - Cerrar sesión
- `GET /api/v1/auth/validate` - Validar token

### **Administración de Usuarios** (Solo Admin)
- `GET /api/v1/admin/users` - Lista de usuarios
- `POST /api/v1/admin/users` - Crear usuario
- `GET /api/v1/admin/users/:id` - Obtener usuario
- `PUT /api/v1/admin/users/:id` - Actualizar usuario
- `DELETE /api/v1/admin/users/:id` - Eliminar usuario
- `GET /api/v1/admin/users/stats` - Estadísticas de usuarios
- `POST /api/v1/admin/users/providers` - Crear proveedor
- `GET /api/v1/admin/users/providers` - Lista de proveedores

### **Swagger Documentation**
- `GET /api/docs` - Documentación completa de la API

---

## ⚙️ Variables de Entorno

```bash
# Backend (copiar env.example a .env)
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001  # ← URL del React app

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ssc_db
DB_USER=ssc_user
DB_PASSWORD=tu_password_seguro

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro

# Email para magic links
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_password_app_gmail
MAIL_FROM_NAME=Vada Health
MAIL_FROM_ADDRESS=noreply@ssc.com
```

---

## 🚀 Comandos de Inicio

### 1. **Configurar Base de Datos**
```bash
# Crear base de datos
createdb -U postgres ssc_db

# Ejecutar script SQL
psql -h localhost -U ssc_user -d ssc_db -f script.sql
```

### 2. **Configurar Backend**
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus valores

# Iniciar servidor
npm run start:dev
```

### 3. **Verificar Funcionamiento**
```bash
# Health check
curl http://localhost:3000/api/health

# Swagger docs
open http://localhost:3000/api/docs

# Probar login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com"}'
```

---

## 🎯 Próximos Pasos

1. **Crear proyecto React**
2. **Implementar AuthContext**
3. **Configurar React Router**
4. **Crear componentes de Login**
5. **Implementar Layouts por rol**
6. **Conectar con API del backend**
7. **Implementar gestión de permisos**

---

## 📞 Soporte

El backend está **100% funcional** y documentado. Todas las funcionalidades están implementadas y probadas:

- ✅ **Magic Links** funcionando
- ✅ **Roles y permisos** implementados
- ✅ **API REST** completa
- ✅ **Base de datos** con datos de prueba
- ✅ **Documentación** Swagger disponible

**¡Todo listo para comenzar con el frontend React!** 🚀 