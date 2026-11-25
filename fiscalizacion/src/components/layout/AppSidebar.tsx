import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Map,
  Users,
  AlertTriangle,
  UserCheck,
  BarChart3,
  Upload,
  Settings,
  Vote,
  LogOut,
  ClipboardList,
  Layers,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const baseNavigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Mapa Electoral", url: "/map", icon: Map },
  { title: "Barrios", url: "/barrios", icon: Layers },
  { title: "Escuelas", url: "/escuelas", icon: Users },
  { title: "Fiscales", url: "/fiscales", icon: UserCheck },
  { title: "Incidencias", url: "/incidencias", icon: AlertTriangle },
  { title: "Backup", url: "/backup", icon: Users },
  { title: "Importar Datos", url: "/importar", icon: Upload },
  { title: "Importar Mesas", url: "/importar-mesas", icon: Upload },
  { title: "Importar Genéricos", url: "/importar-genericos", icon: Upload },
];

export function AppSidebar() {
  const sidebar = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { isFiscalMesa } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  const handleSignOut = () => {
    localStorage.removeItem("token");
    toast.success("Sesión cerrada exitosamente");
    navigate("/auth");
  };

  const items = isFiscalMesa
    ? [{ title: "Mi Mesa", url: "/mi-mesa", icon: ClipboardList }]
    : baseNavigationItems;

  return (
    <Sidebar className={sidebar.open ? "w-64" : "w-16"}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Vote className="w-8 h-8 text-sidebar-primary" />
          {sidebar.open && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">Fiscaliza Brown</span>
              <span className="text-xs text-sidebar-foreground/70">Sistema Electoral</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="w-5 h-5" />
                      {sidebar.open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/configuracion" className={getNavCls}>
                    <Settings className="w-5 h-5" />
                    {sidebar.open && <span>Configuración</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="outline"
          size={sidebar.open ? "default" : "icon"}
          onClick={handleSignOut}
          className="w-full"
        >
          <LogOut className="w-4 h-4" />
          {sidebar.open && <span className="ml-2">Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}