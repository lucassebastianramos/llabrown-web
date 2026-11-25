import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Circle, X } from "lucide-react";

interface StatusBadgeProps {
  status: "assigned" | "incident" | "vacant" | "confirmed";
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "assigned":
        return {
          label: "FG Confirmado",
          variant: "default" as const,
          className: "bg-assigned text-white border-assigned",
          icon: CheckCircle,
        };
      case "incident":
        return {
          label: "Con Incidencia",
          variant: "destructive" as const,
          className: "bg-incident text-white border-incident",
          icon: AlertTriangle,
        };
      case "vacant":
        return {
          label: "Sin Fiscal",
          variant: "secondary" as const,
          className: "bg-vacant text-white border-vacant",
          icon: Circle,
        };
      case "confirmed":
        return {
          label: "Confirmado",
          variant: "default" as const,
          className: "bg-assigned text-white border-assigned",
          icon: CheckCircle,
        };
      default:
        return {
          label: "Desconocido",
          variant: "outline" as const,
          className: "",
          icon: X,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}