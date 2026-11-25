import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  AlertTriangle,
  Users,
  School,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { CIRCUITOS_BROWN } from '@/lib/circuitos';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalEscuelas: number;
  escuelasConFG: number;
  incidenciasAbiertas: number;
  fiscalesBackup: number;
  totalFiscales: number;
  porcentajeCobertura: number;
  totalMesas: number;
  mesasCubiertas: number;
  porcentajeMesasCubiertas: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEscuelas: 0,
    escuelasConFG: 0,
    incidenciasAbiertas: 0,
    fiscalesBackup: 0,
    totalFiscales: 0,
    porcentajeCobertura: 0,
    totalMesas: 0,
    mesasCubiertas: 0,
    porcentajeMesasCubiertas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [circuits, setCircuits] = useState<Array<{ circuito: string; escuelas: number; porcentajeFG: number; mesas: number; porcentajeMesas: number }>>([]);
  const { profile, isFiscalMesa, isFiscalGeneral, isEncargadoSeccion, isCoordinador } = useAuth();

  useEffect(() => {
    fetchDashboardData();
    fetchCircuitCoverage();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/dashboard'), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchCircuitCoverage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/dashboard?by=circuit'), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      const data = await response.json();
      setCircuits(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-assigned";
    if (percentage >= 70) return "text-warning";
    return "text-incident";
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) return "success";
    if (percentage >= 70) return "warning";
    return "destructive";
  };

  // Role-based visibility
  const showGlobal = isCoordinador;
  const showCircuitGrid = isCoordinador || isEncargadoSeccion || isFiscalGeneral;
  const showResources = isCoordinador || isEncargadoSeccion;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground">
          Resumen del estado de la fiscalización electoral en Almirante Brown
        </p>
        {profile && (
          <div className="mt-3 p-3 border rounded bg-card text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Bienvenido/a:</span>
              <span>{profile.nombre} {profile.apellido}</span>
              <span className="text-muted-foreground">({profile.email})</span>
              <Badge variant="secondary">{profile.role === 'encargado_seccion' ? 'Encargado de circuito' : profile.role.replace('_',' ')}</Badge>
            </div>
            {profile.circuitos && profile.circuitos.length > 0 && (
              <div className="mt-2">
                <span className="text-muted-foreground">Zonas habilitadas:</span>{' '}
                {profile.circuitos.map((c, i) => (
                  <span key={c} className="inline-block mr-2">
                    {c} {CIRCUITOS_BROWN.find(x => x.code === c)?.name || ''}
                    {i < profile.circuitos!.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/resultados">
            <Button size="sm">Ver Resultados 2023</Button>
          </Link>
          <Link to="/resultados-2025">
            <Button size="sm" variant="secondary">Ver Resultados 2025</Button>
          </Link>
          <Link to="/comparar-resultados">
            <Button size="sm" variant="outline">Comparar 2023 vs 2025</Button>
          </Link>
        </div>
      </div>

      {/* KPIs Principales (global) */}
      {showGlobal && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escuelas Totales</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEscuelas}</div>
              <p className="text-xs text-muted-foreground">
                Establecimientos electorales
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cobertura FG</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(stats.porcentajeCobertura)}`}>
                {stats.porcentajeCobertura}%
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {stats.escuelasConFG} de {stats.totalEscuelas} escuelas
                </p>
                <Badge variant={getStatusBadge(stats.porcentajeCobertura) as any} className="text-xs">
                  {stats.porcentajeCobertura >= 90 ? "Excelente" : 
                  stats.porcentajeCobertura >= 70 ? "Bueno" : "Crítico"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cobertura de Mesas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(stats.porcentajeMesasCubiertas)}`}>
                {stats.porcentajeMesasCubiertas}%
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {stats.mesasCubiertas} de {stats.totalMesas} mesas
                </p>
                <Badge variant={getStatusBadge(stats.porcentajeMesasCubiertas) as any} className="text-xs">
                  {stats.porcentajeMesasCubiertas >= 90 ? "Excelente" : 
                  stats.porcentajeMesasCubiertas >= 70 ? "Bueno" : "Crítico"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incidencias Abiertas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.incidenciasAbiertas > 0 ? 'text-incident' : 'text-assigned'}`}>
                {stats.incidenciasAbiertas}
              </div>
              <p className="text-xs text-muted-foreground">
                Requieren atención inmediata
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Para roles no globales, mostrar un resumen compacto */}
      {!showGlobal && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Incidencias Abiertas</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${stats.incidenciasAbiertas > 0 ? 'text-incident' : 'text-assigned'}`}>{stats.incidenciasAbiertas}</div></CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cobertura FG</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.porcentajeCobertura}%</div></CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cobertura Mesas</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.porcentajeMesasCubiertas}%</div></CardContent>
          </Card>
        </div>
      )}

      {/* Recursos: oculto para FG/FM */}
      {showResources && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Recursos Disponibles</CardTitle>
              <CardDescription>
                Personal y recursos para la fiscalización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm">Total Fiscales</span>
                </div>
                <div className="text-sm font-medium">{stats.totalFiscales}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-success" />
                  <span className="text-sm">Backup Disponible</span>
                </div>
                <div className="text-sm font-medium">{stats.fiscalesBackup}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-warning" />
                  <span className="text-sm">Cobertura Total</span>
                </div>
                <div className="text-sm font-medium">{stats.porcentajeCobertura}%</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cobertura por circuito (limitado por backend a allowed circuitos) */}
      {showCircuitGrid && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Cobertura por circuito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {circuits.map((c) => (
                <div key={c.circuito} className="border rounded p-2">
                  <div className="font-medium">Circuito {c.circuito} {CIRCUITOS_BROWN.find(x => x.code === c.circuito)?.name || ''}</div>
                  <div>Escuelas: {c.escuelas}</div>
                  <div>FG: {c.porcentajeFG}%</div>
                  <div>Mesas: {c.porcentajeMesas}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call-to-action para fiscal de mesa */}
      {isFiscalMesa && (
        <div className="flex gap-2">
          <Link to="/mi-mesa"><Button>Ir a Mi Mesa</Button></Link>
        </div>
      )}
    </div>
  );
}