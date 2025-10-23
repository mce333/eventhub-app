# Event Hub - Sistema de Gestión de Eventos

Sistema profesional de gestión de eventos con autenticación, dashboards, seguimiento financiero y chatbot integrado.

## 🚀 Características

- ✅ Autenticación de usuarios (JWT)
- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión completa de eventos
- ✅ Seguimiento de ingresos y gastos
- ✅ Chatbot inteligente
- ✅ **Modo Demo** sin necesidad de backend
- ✅ Diseño responsive y moderno

## 🎭 Modo Demo

El sistema incluye un **Modo Demo** completamente funcional que no requiere backend. Perfecto para:
- Pruebas rápidas
- Demostraciones
- Desarrollo frontend
- Exploración de funcionalidades

### Usuarios de Prueba Disponibles

#### 1. Administrador
- **Email:** admin@test.com
- **Password:** Admin123!
- **Rol:** Administrador
- **Estado:** ✅ Verificado y Activo
- **Datos:** 24 eventos, $145,800 ingresos

#### 2. Juan Pérez
- **Email:** user1@test.com
- **Password:** User123!
- **Rol:** Usuario
- **Estado:** ✅ Verificado y Activo
- **Datos:** 8 eventos, $45,200 ingresos

#### 3. María García
- **Email:** user2@test.com
- **Password:** User123!
- **Rol:** Usuario
- **Estado:** ✅ Verificado y Activo
- **Datos:** 12 eventos, $68,900 ingresos

#### 4. Carlos López
- **Email:** user3@test.com
- **Password:** User123!
- **Rol:** Usuario
- **Estado:** ⚠️ NO Verificado
- **Datos:** 2 eventos, $5,200 ingresos

#### 5. Ana Martínez
- **Email:** user4@test.com
- **Password:** User123!
- **Rol:** Usuario
- **Estado:** 🚫 Bloqueado
- **Datos:** 6 eventos, $28,400 ingresos

### Activar/Desactivar Modo Demo

Edita el archivo `.env`:

```env
# Modo Demo (sin backend)
VITE_DEMO_MODE=true

# Modo Real (con backend)
VITE_DEMO_MODE=false
VITE_API_URL=http://localhost:3000
```

## 📦 Instalación

```bash
# Instalar dependencias
pnpm install

# Modo Desarrollo
pnpm run dev

# Construir para Producción
pnpm run build

# Vista Previa de Producción
pnpm run preview
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
# API Backend (solo si VITE_DEMO_MODE=false)
VITE_API_URL=http://localhost:3000

# Modo Demo
VITE_DEMO_MODE=true
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes shadcn-ui
│   ├── dashboard/      # Componentes del dashboard
│   └── ChatBot.tsx     # Chatbot integrado
├── contexts/           # Contextos de React
│   └── AuthContext.tsx # Gestión de autenticación
├── lib/                # Utilidades y configuración
│   ├── mockData.ts     # Datos simulados para modo demo
│   └── utils.ts        # Funciones auxiliares
├── pages/              # Páginas principales
│   ├── Login.tsx       # Página de inicio de sesión
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── Eventos.tsx     # Gestión de eventos
│   └── EventoDetalle.tsx # Detalle de evento
├── services/           # Servicios API
│   ├── api.ts          # Cliente Axios
│   ├── auth.service.ts # Servicio de autenticación
│   └── users.service.ts # Servicio de usuarios
└── types/              # Definiciones TypeScript
    └── auth.types.ts   # Tipos de autenticación
```

## 🎨 Tecnologías

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **shadcn-ui** - Componentes UI
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP
- **Sonner** - Notificaciones toast

## 🔐 Autenticación

### Modo Demo
- Login instantáneo con un clic
- Datos simulados realistas
- Sin necesidad de backend

### Modo Real
- JWT tokens
- Refresh tokens
- Protección de rutas
- Interceptores HTTP

## 📊 Funcionalidades del Dashboard

- **Métricas en tiempo real:**
  - Total de eventos
  - Ingresos totales
  - Gastos totales
  - Ganancia neta

- **Eventos próximos:**
  - Lista de eventos futuros
  - Detalles de ubicación y fecha
  - Número de asistentes

- **Actividad reciente:**
  - Historial de acciones
  - Pagos recibidos
  - Gastos registrados

- **Estadísticas mensuales:**
  - Gráficos de ingresos vs gastos
  - Tendencias temporales

## 🤖 Chatbot

El chatbot integrado puede responder preguntas sobre:
- Eventos próximos
- Métricas financieras
- Estado de pagos
- Información general del sistema

## 🚀 Despliegue

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

### Netlify

```bash
# Construir
pnpm run build

# Desplegar la carpeta dist/
```

### Variables de Entorno en Producción

Asegúrate de configurar:
- `VITE_API_URL` - URL de tu backend
- `VITE_DEMO_MODE` - `false` para producción

## 🔄 Migrar de Demo a Producción

1. **Configurar Backend:**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Actualizar .env:**
   ```env
   VITE_DEMO_MODE=false
   VITE_API_URL=http://localhost:3000
   ```

3. **Reiniciar Frontend:**
   ```bash
   pnpm run dev
   ```

## 🐛 Troubleshooting

### El login no funciona en modo demo
- Verifica que `VITE_DEMO_MODE=true` en `.env`
- Reinicia el servidor de desarrollo

### No se muestran los datos
- Revisa la consola del navegador (F12)
- Verifica que los servicios estén usando el modo correcto

### Errores de CORS
- Solo aplica en modo real
- Configura CORS en el backend NestJS

## 📝 Licencia

Este proyecto es privado y confidencial.

## 👥 Soporte

Para soporte técnico o consultas:
- Revisa la documentación en `/docs`
- Contacta al equipo de desarrollo

---

**Última actualización:** Octubre 2025  
**Versión:** 2.0.0 (Modo Demo Integrado)