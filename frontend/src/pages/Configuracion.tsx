import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, 
  User, 
  Bell, 
  Lock, 
  Database, 
  Palette,
  Globe,
  HardDrive,
  Users,
  Shield
} from 'lucide-react';

export default function Configuracion() {
  const { user } = useAuth();

  const configSections = [
    {
      icon: User,
      title: 'Perfil de Usuario',
      description: 'Gestiona tu información personal y preferencias',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      items: ['Información básica', 'Foto de perfil', 'Preferencias'],
    },
    {
      icon: Bell,
      title: 'Notificaciones',
      description: 'Configura cómo y cuándo recibir notificaciones',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      items: ['Email', 'Push', 'SMS'],
    },
    {
      icon: Lock,
      title: 'Seguridad y Privacidad',
      description: 'Controla la seguridad de tu cuenta',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      items: ['Cambiar contraseña', 'Autenticación 2FA', 'Sesiones activas'],
    },
    {
      icon: Database,
      title: 'Datos y Backup',
      description: 'Gestiona tus datos y respaldos',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      items: ['Exportar datos', 'Importar datos', 'Backup automático'],
    },
    {
      icon: Palette,
      title: 'Apariencia',
      description: 'Personaliza la interfaz del sistema',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      items: ['Tema claro/oscuro', 'Color principal', 'Tamaño de fuente'],
    },
    {
      icon: Globe,
      title: 'Idioma y Región',
      description: 'Configura idioma y zona horaria',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      items: ['Idioma', 'Zona horaria', 'Formato de fecha'],
    },
  ];

  const adminSections = [
    {
      icon: Users,
      title: 'Gestión de Usuarios',
      description: 'Administra usuarios y permisos',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      admin: true,
    },
    {
      icon: Shield,
      title: 'Roles y Permisos',
      description: 'Configura roles y accesos del sistema',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      admin: true,
    },
    {
      icon: HardDrive,
      title: 'Sistema',
      description: 'Configuración avanzada del sistema',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      admin: true,
    },
  ];

  const isAdmin = user?.role?.name === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Configuración
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las preferencias y configuraciones del sistema
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user?.name} {user?.last_name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="bg-primary/10">
                  {user?.role?.displayName || 'Usuario'}
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  ✓ Cuenta Activa
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Configuración General</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${section.bgColor}`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {section.description}
                  </p>
                  {section.items && (
                    <ul className="space-y-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button variant="ghost" size="sm" className="w-full mt-3">
                    Configurar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Admin Settings */}
      {isAdmin && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Configuración de Administrador
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adminSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${section.bgColor}`}>
                        <Icon className={`h-6 w-6 ${section.color}`} />
                      </div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {section.description}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Gestionar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Database className="h-5 w-5" />
              <span className="text-sm">Exportar Datos</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Lock className="h-5 w-5" />
              <span className="text-sm">Cambiar Contraseña</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Bell className="h-5 w-5" />
              <span className="text-sm">Preferencias</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Palette className="h-5 w-5" />
              <span className="text-sm">Tema</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Versión</p>
              <p className="text-lg font-semibold">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Último Backup</p>
              <p className="text-lg font-semibold">Hoy</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Almacenamiento</p>
              <p className="text-lg font-semibold">23%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="text-lg font-semibold text-green-600">● Online</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
