import { LayoutDashboard, Calendar, Users, Settings, TrendingUp, Package } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getUserRole, canAccessRoute } from "@/lib/permissions";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Eventos", icon: Calendar, path: "/eventos" },
  { title: "Clientes", icon: Users, path: "/clientes" },
  { title: "Estadísticas", icon: TrendingUp, path: "/estadisticas" },
  { title: "Almacén", icon: Package, path: "/almacen" },
  { title: "Configuración", icon: Settings, path: "/configuracion" },
];

export function Sidebar() {
  const { user } = useAuth();
  const userRole = getUserRole(user);

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(item => canAccessRoute(userRole, item.path));

  return (
    <aside className="h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col sticky top-0">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Sistema de Control</h1>
            <p className="text-xs text-muted-foreground">Panel de Control</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent hover:translate-x-1",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                  : "text-sidebar-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-gradient-card rounded-lg p-4 border border-primary/20">
          <h3 className="text-sm font-semibold text-foreground mb-2">¿Necesitas ayuda?</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Contacta con soporte para resolver tus dudas
          </p>
          <button className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Contactar
          </button>
        </div>
      </div>
    </aside>
  );
}