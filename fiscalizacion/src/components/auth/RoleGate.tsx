import React from 'react';
import { useAuth } from '@/hooks/useAuth';

type Role = 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa';

interface Props {
  allowed: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGate({ allowed, children, fallback }: Props) {
  const { effectiveRole } = useAuth();
  const ok = effectiveRole ? allowed.includes(effectiveRole as Role) : false;
  if (!ok) return <>{fallback ?? <div className="p-6 text-sm">No autorizado en esta vista</div>}</>;
  return <>{children}</>;
}