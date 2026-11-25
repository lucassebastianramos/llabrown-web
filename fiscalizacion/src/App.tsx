import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Escuelas from "./pages/Escuelas";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Map from "./pages/Map";
import Importar from "./pages/Importar";
import ImportarMesas from "./pages/ImportarMesas";
import ImportarGenericos from "./pages/ImportarGenericos";
import Fiscales from "./pages/Fiscales";
import Incidencias from "./pages/Incidencias";
import Resultados from "./pages/Resultados";
import Resultados2025 from "./pages/Resultados2025";
import ComparadorResultados from "./pages/ComparadorResultados";
import Backup from "./pages/Backup";
import PrivateRoute from "./components/auth/PrivateRoute";
import Configuracion from "./pages/Configuracion";
import EscuelaPerfil from "./pages/EscuelaPerfil";
import MiMesa from "./pages/MiMesa";
import Barrios from "./pages/Barrios";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/fiscalizacion">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/importar" element={<Importar />} />
          <Route element={<PrivateRoute />}>
            <Route path="/*" element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="escuelas" element={<Escuelas />} />
              <Route path="escuelas/:id" element={<EscuelaPerfil />} />
              <Route path="map" element={<Map />} />
              <Route path="barrios" element={<Barrios />} />
              <Route path="fiscales" element={<Fiscales />} />
              <Route path="incidencias" element={<Incidencias />} />
              <Route path="backup" element={<Backup />} />
              <Route path="importar-mesas" element={<ImportarMesas />} />
              <Route path="importar-genericos" element={<ImportarGenericos />} />
              <Route path="resultados" element={<Resultados />} />
              <Route path="resultados-2025" element={<Resultados2025 />} />
              <Route path="comparar-resultados" element={<ComparadorResultados />} />
              <Route path="configuracion" element={<Configuracion />} />
              <Route path="mi-mesa" element={<MiMesa />} />
            </Route>
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
