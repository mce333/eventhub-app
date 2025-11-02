import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  User, 
  Bell, 
  Lock, 
  Globe,
  Users,
  Shield,
  ChevronRight,
  LogOut
} from 'lucide-react';

export default function Configuracion() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const configSections = [
    {
      title: 'Cuenta',
      items: [
        { icon: User, label: 'Perfil de Usuario', sublabel: user?.name || 'Usuario', action: () => {} },
        { icon: Lock, label: 'Seguridad y Privacidad', sublabel: '', action: () => {} },
      ]
    },
    {
      title: 'Preferencias',
      items: [
        { icon: Bell, label: 'Notificaciones', sublabel: '', action: () => {} },
        { icon: Globe, label: 'Idioma', sublabel: 'Español', action: () => {} },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { icon: Users, label: 'Gestión de Usuarios', sublabel: '', action: () => {} },
        { icon: Shield, label: 'Permisos y Roles', sublabel: '', action: () => {} },
      ]
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-8 overflow-auto bg-muted/20">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header with back button */}
            <div className="flex items-center gap-4 mb-8">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
                <p className="text-sm text-muted-foreground">Gestiona tu cuenta y preferencias</p>
              </div>
            </div>

            {/* User Info Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{user?.name} {user?.last_name}</h2>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">{user?.role?.displayName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings Sections */}
            {configSections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase px-3">
                  {section.title}
                </h3>
                <Card>
                  <CardContent className="p-0">
                    {section.items.map((item, itemIdx) => (
                      <button
                        key={itemIdx}
                        onClick={item.action}
                        className={
                          `w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors ${
                            itemIdx !== section.items.length - 1 ? 'border-b' : ''
                          }`
                        }
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{item.label}</p>
                          {item.sublabel && (
                            <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* Logout Section */}
            <Card>
              <CardContent className="p-0">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-4 hover:bg-destructive/10 transition-colors text-destructive"
                >
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">Cerrar Sesión</p>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>

            {/* Version Info */}
            <div className="text-center pt-6 pb-4">
              <p className="text-xs text-muted-foreground">Sistema de Control de Eventos</p>
              <p className="text-xs text-muted-foreground">Versión 1.0.0</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
