export interface Fiscal {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  celular: string;
  role: string;
  escuelaId: string | null;
  asignaciones?: { escuelaId: string; role: string }[];
}

import { apiUrl } from '@/lib/api';

export const getFiscales = async (role?: string): Promise<Fiscal[]> => {
  const url = role ? apiUrl(`/api/fiscales?role=${encodeURIComponent(role)}`) : apiUrl('/api/fiscales');
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Error al cargar los fiscales');
  }

  return response.json();
};

export const getAsignaciones = async (userId: string) => {
  const resp = await fetch(apiUrl(`/api/fiscales/${userId}/asignaciones`), {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  if (!resp.ok) throw new Error('No se pudieron obtener las asignaciones');
  return resp.json() as Promise<{ id: string; escuelaId: string; role: string }[]>;
};

export const setAsignaciones = async (userId: string, role: 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa', escuelaIds: string[]) => {
  const resp = await fetch(apiUrl(`/api/fiscales/${userId}/asignaciones`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ role, escuelaIds })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error || 'No se pudieron guardar las asignaciones');
  }
  return resp.json();
};

export const createFiscal = async (data: {
  nombre: string;
  apellido: string;
  dni?: string;
  celular?: string;
  email: string;
  password: string;
  role: 'fiscal_general' | 'fiscal_mesa' | 'encargado_seccion' | 'coordinador';
  escuelaId?: string | null;
}) => {
  const resp = await fetch(apiUrl('/api/fiscales'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ ...data, escuelaId: data.escuelaId ?? null }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error || 'No se pudo crear el fiscal');
  }
  return resp.json();
};

export const createFiscalGeneral = async (data: {
  nombre: string;
  apellido: string;
  dni: string;
  celular: string;
  email: string;
  password: string;
  escuelaId: string;
}) => {
  const resp = await fetch(apiUrl('/api/fiscales'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ ...data, role: 'fiscal_general' }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error || 'No se pudo crear el fiscal general');
  }
  return resp.json();
};

export const updateFiscal = async (
  id: string,
  data: Partial<{
    nombre: string;
    apellido: string;
    dni: string;
    celular: string;
    role: 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa';
    escuelaId: string | null;
    email: string;
    password: string;
  }>
) => {
  const resp = await fetch(apiUrl(`/api/fiscales/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error || 'No se pudo actualizar el fiscal');
  }
  return resp.json();
};

export const getBackupFiscales = async (): Promise<{ count: number; users: Array<{ id: string; nombre: string; apellido: string; dni?: string; role: string }> }> => {
  const resp = await fetch(apiUrl('/api/fiscales/backup'), {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error || 'No se pudo obtener el backup');
  }
  return resp.json();
};