import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

interface Profile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa';
  circuitos?: string[];
}

type Role = Profile['role'];

// Simple client-side auth using JWT in localStorage.
// session: booleanish flag derived from token presence for route guarding.
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewRole, setViewRole] = useState<Role | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    setToken(stored);
    const storedView = localStorage.getItem('viewRole') as Role | null;
    setViewRole(storedView || null);

    if (stored) {
      fetch(apiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setProfile(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signOut = () => {
    localStorage.removeItem('token');
    setToken(null);
    setProfile(null);
  };

  const effectiveRole: Role | null = profile?.role === 'coordinador' && viewRole ? viewRole : profile?.role || null;

  const setView = (r: Role | null) => {
    if (r) localStorage.setItem('viewRole', r);
    else localStorage.removeItem('viewRole');
    setViewRole(r);
  };

  return {
    user: profile,
    session: token, // PrivateRoute treats truthy as authenticated
    profile,
    loading,
    signOut,
    // role flags based on effective role
    isCoordinador: effectiveRole === 'coordinador',
    isEncargadoSeccion: effectiveRole === 'encargado_seccion',
    isFiscalGeneral: effectiveRole === 'fiscal_general',
    isFiscalMesa: effectiveRole === 'fiscal_mesa',
    circuitos: profile?.circuitos || [],
    // view-as API
    effectiveRole,
    originalRole: profile?.role || null,
    setViewRole: setView,
  };
}