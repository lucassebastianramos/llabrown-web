import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, Shield, Map, Users, AlertTriangle, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in via JWT stored locally
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const features = [
    {
      icon: Map,
      title: "Mapa Interactivo",
      description: "Visualización en tiempo real del estado de todas las escuelas electorales"
    },
    {
      icon: Users,
      title: "Gestión de Fiscales",
      description: "Control jerárquico de fiscales por sección, escuela y mesa"
    },
    {
      icon: AlertTriangle,
      title: "Sistema de Incidencias",
      description: "Reporte y seguimiento de incidencias en tiempo real"
    },
    {
      icon: BarChart3,
      title: "Panel de Control",
      description: "KPIs y métricas de cobertura electoral en tiempo real"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <Vote className="w-20 h-20 text-primary animate-pulse" />
                <Shield className="w-10 h-10 text-primary absolute -bottom-2 -right-2" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">
                Fiscaliza Brown
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Sistema de Fiscalización Electoral para el Distrito de Almirante Brown
              </p>
              <p className="text-base text-muted-foreground/80 max-w-xl mx-auto">
                Control jerárquico, mapa interactivo, gestión de incidencias y seguimiento en tiempo real
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
              >
                Acceder al Sistema
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                asChild
              >
                <a href="/f/fiscalizacion">Inscribirme como Fiscal</a>
              </Button>
              <Button 
                size="lg" 
                variant="ghost"
                asChild
              >
                <a href="/">← Volver a llabrown.com.ar</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Características Principales</h2>
          <p className="text-muted-foreground">
            Herramientas diseñadas para una fiscalización electoral eficiente y transparente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-card hover:shadow-elevated transition-shadow duration-300">
              <CardHeader className="text-center pb-2">
                <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Roles Section */}
      <div className="bg-card/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Roles y Permisos</h2>
            <p className="text-muted-foreground">
              Sistema jerárquico que garantiza el control y la seguridad de la información
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-primary">Coordinador</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Acceso total al sistema</li>
                  <li>• Gestión de todas las escuelas</li>
                  <li>• Asignación de fiscales</li>
                  <li>• Exportación de datos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-primary">Encargado de Sección</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Acceso a su sección</li>
                  <li>• Asignación de FG</li>
                  <li>• Incidencias seccionales</li>
                  <li>• Reportes locales</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-primary">Fiscal General</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Acceso a su escuela</li>
                  <li>• Asignación de fiscales de mesa</li>
                  <li>• Reporte de incidencias</li>
                  <li>• Control de asistencia</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-primary">Fiscal de Mesa</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Confirmar asistencia</li>
                  <li>• Reportar incidencias</li>
                  <li>• Vista de su mesa</li>
                  <li>• Comunicación directa</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer se muestra desde el Layout global */}
    </div>
  );
};

export default Index;
