# EventHub - Integración Frontend-Backend

## 🎯 Descripción

Este documento describe la integración completa entre el frontend React (festivity-face-panel) y el backend NestJS (metamark-backend).

## 📋 Requisitos Previos

### Backend (NestJS)
- Node.js v18+
- MySQL/PostgreSQL database
- Puerto: 3000

### Frontend (React + Vite)
- Node.js v18+
- pnpm (recomendado) o npm
- Puerto: 5173 (Vite default)

## 🚀 Configuración Inicial

### 1. Backend Setup

```bash
cd /workspace/uploads/metamark-backend-main/metamark-backend-main

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env con:
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=eventhub_db
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
FRONTEND_URL=http://localhost:5173
WEBSITE_URL=http://localhost:5173

# Iniciar en modo desarrollo
npm run start:dev
```

El backend estará disponible en: `http://localhost:3000`
Documentación Swagger: `http://localhost:3000/api/docs`

### 2. Frontend Setup

```bash
cd /workspace/shadcn-ui

# Instalar dependencias
pnpm install

# El archivo .env ya está configurado con:
VITE_API_URL=http://localhost:3000

# Iniciar en modo desarrollo
pnpm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## 🔐 Sistema de Autenticación

### Flujo de Autenticación

1. **Login**: POST `/auth/login`
   - Envía: `{ email, password }`
   - Recibe: `{ access_token }` + cookie `refresh_token`
   - El `access_token` se guarda en localStorage
   - El `refresh_token` se guarda en cookie HttpOnly

2. **Token Refresh Automático**
   - Cuando el `access_token` expira (401), el interceptor de axios automáticamente:
     - Llama a POST `/auth/refresh`
     - Obtiene nuevo `access_token`
     - Reintenta la petición original
   - Si el refresh falla, redirige a `/login`

3. **Logout**: POST `/auth/logout`
   - Limpia tokens del servidor
   - Elimina `access_token` de localStorage
   - Elimina cookie `refresh_token`

### Endpoints de Autenticación

```typescript
// Login
POST /auth/login
Body: { email: string, password: string }
Response: { access_token: string }

// Register
POST /users/register
Headers: { 'Accept-Language': 'es' }
Body: { 
  name: string, 
  last_name: string, 
  email: string, 
  password: string,
  phone?: string 
}
Response: { access_token: string }

// Refresh Token
POST /auth/refresh
Cookie: refresh_token (automático)
Response: { access_token: string }

// Logout
POST /auth/logout
Headers: { Authorization: 'Bearer {token}' }
Response: { message: 'Logged out successfully' }

// Google OAuth
GET /auth/google
Redirect to Google OAuth consent screen

GET /auth/google/callback
Callback from Google, redirects to frontend with token
```

## 📡 Endpoints Principales

### Users

```typescript
// Get Dashboard Data
GET /users/dashboard
Headers: { Authorization: 'Bearer {token}' }
Response: {
  user: User,
  stats?: {
    totalEvents: number,
    totalRevenue: number,
    activeClients: number,
    averageOccupancy: number
  },
  upcomingEvents?: Event[]
}

// Get User by ID
GET /users/:id
Headers: { Authorization: 'Bearer {token}' }
Response: User

// Update Profile
PATCH /users/profile/me
Headers: { Authorization: 'Bearer {token}' }
Body: { name?: string, last_name?: string }
Response: User

// Change Password
PATCH /users/:id/change-password
Headers: { Authorization: 'Bearer {token}' }
Body: { oldPassword: string, newPassword: string }
Response: { message: string }
```

## 🏗️ Arquitectura del Frontend

### Estructura de Carpetas

```
src/
├── components/
│   ├── dashboard/          # Componentes del dashboard
│   │   ├── Header.tsx      # Header con usuario y logout
│   │   ├── Sidebar.tsx     # Navegación lateral
│   │   ├── MetricCard.tsx  # Tarjetas de métricas
│   │   ├── EventCard.tsx   # Tarjetas de eventos
│   │   └── StatChart.tsx   # Gráficos estadísticos
│   ├── ui/                 # Componentes shadcn-ui
│   └── ProtectedRoute.tsx  # HOC para rutas protegidas
├── contexts/
│   └── AuthContext.tsx     # Context de autenticación
├── services/
│   ├── api.ts             # Cliente axios con interceptors
│   ├── auth.service.ts    # Servicios de autenticación
│   └── users.service.ts   # Servicios de usuarios
├── types/
│   └── auth.types.ts      # Tipos TypeScript
├── pages/
│   ├── Login.tsx          # Página de login
│   ├── Register.tsx       # Página de registro
│   ├── Dashboard.tsx      # Dashboard principal
│   └── NotFound.tsx       # Página 404
└── App.tsx                # Configuración de rutas
```

### Servicios

#### API Client (`src/services/api.ts`)
- Cliente axios configurado con baseURL
- Interceptor de request: añade token JWT a headers
- Interceptor de response: maneja refresh automático de tokens
- Queue system para peticiones fallidas durante refresh

#### Auth Service (`src/services/auth.service.ts`)
- `login(credentials)`: Inicia sesión
- `register(data)`: Registra nuevo usuario
- `logout()`: Cierra sesión
- `refreshToken()`: Refresca el access token
- `getCurrentUser()`: Obtiene datos del usuario actual
- `isAuthenticated()`: Verifica si hay sesión activa

#### Users Service (`src/services/users.service.ts`)
- `getDashboard()`: Obtiene datos del dashboard
- `getUsers(params)`: Lista usuarios (admin)
- `updateProfile(data)`: Actualiza perfil
- `changePassword(old, new)`: Cambia contraseña

### Context de Autenticación

```typescript
const { 
  user,           // Usuario actual
  loading,        // Estado de carga
  login,          // Función de login
  register,       // Función de registro
  logout,         // Función de logout
  isAuthenticated // Boolean de autenticación
} = useAuth();
```

## 🔒 Seguridad

### Tokens
- **Access Token**: JWT de corta duración (15 min), almacenado en localStorage
- **Refresh Token**: JWT de larga duración (7 días), almacenado en cookie HttpOnly

### Headers de Seguridad
El backend incluye:
- Helmet.js para headers de seguridad
- CORS configurado para frontend específico
- Rate limiting con Throttler
- Validación de DTOs con class-validator

### Protección de Rutas
```typescript
// Rutas protegidas envueltas en ProtectedRoute
<Route
  path="/"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## 🧪 Testing

### Probar la Integración

1. **Iniciar Backend**:
```bash
cd /workspace/uploads/metamark-backend-main/metamark-backend-main
npm run start:dev
```

2. **Iniciar Frontend**:
```bash
cd /workspace/shadcn-ui
pnpm run dev
```

3. **Crear Usuario de Prueba**:
   - Ir a `http://localhost:5173/register`
   - Registrar nuevo usuario
   - Verificar que redirige al dashboard

4. **Probar Login**:
   - Cerrar sesión
   - Ir a `http://localhost:5173/login`
   - Iniciar sesión con las credenciales creadas

5. **Verificar Token Refresh**:
   - Dejar la aplicación abierta más de 15 minutos
   - Hacer alguna acción (navegar, etc.)
   - El token debería refrescarse automáticamente

## 🐛 Troubleshooting

### Error: CORS
**Problema**: Error de CORS al hacer peticiones
**Solución**: Verificar que `FRONTEND_URL` en backend .env sea `http://localhost:5173`

### Error: 401 Unauthorized
**Problema**: Peticiones fallan con 401
**Solución**: 
- Verificar que el token existe en localStorage
- Verificar que el backend esté corriendo
- Limpiar localStorage y volver a iniciar sesión

### Error: Network Error
**Problema**: No se puede conectar al backend
**Solución**:
- Verificar que el backend esté corriendo en puerto 3000
- Verificar `VITE_API_URL` en frontend .env

### Error: Refresh Token Loop
**Problema**: Bucle infinito de refresh
**Solución**:
- Limpiar cookies del navegador
- Limpiar localStorage
- Reiniciar sesión

## 📝 Notas Importantes

1. **Accept-Language Header**: El endpoint de registro requiere el header `Accept-Language: es` o `en`

2. **Cookies**: El refresh token se envía automáticamente en cookies. Asegúrate de que `withCredentials: true` esté configurado en axios.

3. **JWT Decode**: El frontend decodifica el JWT para obtener el user ID. Esto es seguro para datos no sensibles, pero la verificación real se hace en el backend.

4. **React Query**: Se usa para cache y sincronización de datos del servidor. Configurado con:
   - `staleTime: 5 minutos` para dashboard
   - `retry: 1` para evitar múltiples reintentos
   - `refetchOnWindowFocus: false` para evitar refetch innecesarios

## 🚀 Próximos Pasos

1. Implementar módulo de eventos completo
2. Agregar gestión de clientes
3. Implementar estadísticas y reportes
4. Agregar gestión de espacios
5. Implementar notificaciones en tiempo real con WebSockets
6. Agregar tests unitarios e integración
7. Configurar CI/CD para deployment

## 📞 Soporte

Para problemas o dudas:
1. Revisar logs del backend: `npm run start:dev`
2. Revisar console del navegador (F12)
3. Verificar Network tab para ver peticiones HTTP
4. Revisar Swagger docs: `http://localhost:3000/api/docs`