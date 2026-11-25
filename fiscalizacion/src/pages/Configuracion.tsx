import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';

interface UserItem {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa';
  dni?: string | null;
  celular?: string | null;
}

interface Policy {
  minLen: number; requireUpperLower: boolean; requireNumber: boolean; requireSpecial: boolean; questionsCount: number; enforce2FA: boolean; noReuseLastN: number; forbidPII: boolean;
}

export default function Configuracion() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<UserItem> & { password?: string }>({ role: 'coordinador' });
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/users'), { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicy = async () => {
    try {
      const res = await fetch(apiUrl('/api/auth/policy'));
      const data = await res.json();
      setPolicy(data || null);
    } catch {}
  };

  useEffect(() => { fetchUsers(); fetchPolicy(); }, []);

  const createUser = async () => {
    try {
      setCreating(true);
      if (!form.nombre || !form.apellido || !form.email || !form.password || !form.role) {
        toast.error('Completá los campos obligatorios');
        return;
      }
      const res = await fetch(apiUrl('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo crear');
      toast.success('Usuario creado');
      setForm({ role: 'coordinador' });
      fetchUsers();
    } catch (e: any) {
      toast.error(e?.message || 'Error al crear');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar usuario?')) return;
    try {
      const res = await fetch(apiUrl(`/api/users/${id}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar');
      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (e: any) {
      toast.error(e?.message || 'Error al eliminar');
    }
  };

  const resetPass = async (id: string) => {
    const pw = prompt('Nueva contraseña:');
    if (!pw) return;
    try {
      const res = await fetch(apiUrl(`/api/users/${id}/reset-password`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) throw new Error('No se pudo cambiar');
      toast.success('Contraseña actualizada');
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    }
  };

  const savePolicy = async () => {
    if (!policy) return;
    try {
      setSavingPolicy(true);
      const res = await fetch(apiUrl('/api/auth/policy'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(policy) });
      if (!res.ok) throw new Error('No se pudo guardar política');
      toast.success('Política guardada');
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Configuración de usuarios</h1>

      <Card>
        <CardHeader>
          <CardTitle>Crear usuario</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <Input placeholder="Nombre" value={form.nombre || ''} onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))} />
          <Input placeholder="Apellido" value={form.apellido || ''} onChange={(e) => setForm((s) => ({ ...s, apellido: e.target.value }))} />
          <Input type="email" placeholder="Email" value={form.email || ''} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          <select className="px-3 py-2 border rounded-md bg-background" value={form.role || ''} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as any }))}>
            <option value="coordinador">Coordinador</option>
            <option value="encargado_seccion">Encargado de circuito</option>
            <option value="fiscal_general">Fiscal General</option>
            <option value="fiscal_mesa">Fiscal de Mesa</option>
          </select>
          <Input placeholder="DNI (opcional)" value={form.dni || ''} onChange={(e) => setForm((s) => ({ ...s, dni: e.target.value }))} />
          <Input placeholder="Celular (opcional)" value={form.celular || ''} onChange={(e) => setForm((s) => ({ ...s, celular: e.target.value }))} />
          <Input type="password" placeholder="Contraseña" value={form.password || ''} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
          <div className="md:col-span-3 flex justify-end">
            <Button onClick={createUser} disabled={creating}>{creating ? 'Creando...' : 'Crear'}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay usuarios</div>
          ) : (
            <div className="grid gap-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between border rounded p-2 text-sm">
                  <div>
                    <div className="font-medium">{u.apellido}, {u.nombre}</div>
                    <div className="text-muted-foreground">{u.email} • {u.role.replace('_',' ')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => resetPass(u.id)}>Reset clave</Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(u.id)}>Eliminar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Políticas de seguridad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!policy ? (
            <div className="text-sm text-muted-foreground">Cargando política...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Mínimo de caracteres</div>
                <Input type="number" value={policy.minLen} onChange={(e) => setPolicy(p => ({ ...(p as any), minLen: Number(e.target.value) }))} />
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={policy.requireUpperLower} onChange={(e) => setPolicy(p => ({ ...(p as any), requireUpperLower: e.target.checked }))} /> Mayúsculas y minúsculas</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={policy.requireNumber} onChange={(e) => setPolicy(p => ({ ...(p as any), requireNumber: e.target.checked }))} /> Números</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={policy.requireSpecial} onChange={(e) => setPolicy(p => ({ ...(p as any), requireSpecial: e.target.checked }))} /> Carácter especial</label>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Preguntas requeridas</div>
                <Input type="number" value={policy.questionsCount} onChange={(e) => setPolicy(p => ({ ...(p as any), questionsCount: Number(e.target.value) }))} />
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={policy.enforce2FA} onChange={(e) => setPolicy(p => ({ ...(p as any), enforce2FA: e.target.checked }))} /> 2FA por email</label>
              <div>
                <div className="text-xs text-muted-foreground mb-1">No reutilizar últimas N</div>
                <Input type="number" value={policy.noReuseLastN} onChange={(e) => setPolicy(p => ({ ...(p as any), noReuseLastN: Number(e.target.value) }))} />
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={policy.forbidPII} onChange={(e) => setPolicy(p => ({ ...(p as any), forbidPII: e.target.checked }))} /> Evitar PII</label>
              <div className="md:col-span-3 flex justify-end">
                <Button onClick={savePolicy} disabled={savingPolicy}>{savingPolicy ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
