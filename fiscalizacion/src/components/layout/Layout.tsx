import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Footer } from "./Footer";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Layout() {
  const { originalRole, effectiveRole, setViewRole } = useAuth();
  const canImpersonate = originalRole === 'coordinador';
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
            <SidebarTrigger className="mr-2" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">
                Sistema de Fiscalización Electoral - Almirante Brown
              </h1>
            </div>
            {canImpersonate && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Vista como:</span>
                <Select value={effectiveRole || undefined} onValueChange={(v) => setViewRole((v as any) || null)}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coordinador">Coordinador (original)</SelectItem>
                    <SelectItem value="encargado_seccion">Encargado de circuito</SelectItem>
                    <SelectItem value="fiscal_general">Fiscal General</SelectItem>
                    <SelectItem value="fiscal_mesa">Fiscal de Mesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}