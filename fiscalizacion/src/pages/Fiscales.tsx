import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFiscales, Fiscal, createFiscalGeneral, updateFiscal as updateFiscalSvc, getAsignaciones as getAsignacionesSvc, setAsignaciones as setAsignacionesSvc, createFiscal as createFiscalSvc, getBackupFiscales } from '@/services/fiscales.service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { CIRCUITOS_BROWN } from '@/lib/circuitos';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiUrl } from '@/lib/api';
import RoleGate from '@/components/auth/RoleGate';

export default function FiscalesPageWrapper() {
  return (
    <RoleGate allowed={['coordinador', 'encargado_seccion', 'fiscal_general']}>
      <Fiscales />
    </RoleGate>
  );
}

function Fiscales() {
  const [roleFilter, setRoleFilter] = useState<string>('');
  const { data: fiscales, isLoading, isError, error, refetch } = useQuery<Fiscal[], Error>({
    queryKey: ['fiscales', roleFilter],
    queryFn: () => getFiscales(roleFilter || undefined),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Fiscal | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', apellido: '', dni: '', celular: '', email: '', role: 'fiscal_general', escuelaId: '' as string | null, password: '' });

  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', celular: '', email: '', password: '', escuelaId: '' });

  const [assignRole, setAssignRole] = useState<'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa'>('encargado_seccion');
  const [assignEscuelaIds, setAssignEscuelaIds] = useState<string[]>([]);
  const [selectedEscuelas, setSelectedEscuelas] = useState<Record<string, boolean>>({});
  const [circuitoFilter, setCircuitoFilter] = useState<string>('');
  const [schoolSearch, setSchoolSearch] = useState('');

  const [quick, setQuick] = useState({ nombre: '', apellido: '', email: '', password: '', role: 'fiscal_general' as 'fiscal_general' | 'fiscal_mesa' });
  const [backupInfo, setBackupInfo] = useState<{ count: number; users: any[] } | null>(null);

  const [assigningBackupId, setAssigningBackupId] = useState<string | null>(null);
  const [backupSelection, setBackupSelection] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const resp = await fetch(apiUrl('/api/escuelas'), {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        });
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          throw new Error(text || `Error ${resp.status}`);
        }
        const data = await resp.json();
        setEscuelas(data);
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || 'No se pudieron cargar escuelas');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const info = await getBackupFiscales();
        setBackupInfo(info);
      } catch {}
    })();
  }, []);

  const escuelasSinFG = useMemo(() => escuelas.filter((e) => !e.fg_id), [escuelas]);

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return (fiscales || [])
      .filter(f => !roleFilter || f.role === roleFilter || (f.asignaciones || []).some(a => a.role === roleFilter))
      .filter(f =>
        f.nombre.toLowerCase().includes(t) ||
        f.apellido.toLowerCase().includes(t) ||
        (f.dni || '').toLowerCase().includes(t) ||
        (f.celular || '').toLowerCase().includes(t)
      );
  }, [fiscales, searchTerm, roleFilter]);

  const toggleEscuela = (id: string) => setSelectedEscuelas((s) => ({ ...s, [id]: !s[id] }));

  const escuelasFiltradasParaSeleccion = useMemo(() => {
    const term = schoolSearch.trim().toLowerCase();
    return (escuelas || [])
      .filter((e: any) => !circuitoFilter || String(e.circuito) === circuitoFilter)
      .filter((e: any) => !term || `${e.nombre} ${e.domicilio}`.toLowerCase().includes(term));
  }, [escuelas, circuitoFilter, schoolSearch]);

  const selectAllVisible = () => {
    const next: Record<string, boolean> = { ...selectedEscuelas };
    for (const e of escuelasFiltradasParaSeleccion) next[e.id] = true;
    setSelectedEscuelas(next);
  };
  const clearSelection = () => setSelectedEscuelas({});

  const downloadPlantillaByEscuelas = async () => {
    const selectedIds = Object.entries(selectedEscuelas).filter(([, v]) => v).map(([k]) => k);
    if (selectedIds.length === 0) return toast.error('Seleccioná al menos una escuela');
    const headers = ['DISTRITO','SECCION','ESTABLECIMIENTO','DOMICILIO','CIRCUITO ELECTORAL','CARGO','DNI','APELLIDO','NOMBRE','NRO CELULAR','REFERENTE A CARGO'];
    const toLine = (arr: string[]) => arr.map((v) => {
      const s = v ?? '';
      const needs = /[",\n]/.test(s);
      const esc = s.replace(/"/g, '""');
      return needs ? `"${esc}"` : esc;
    }).join(',');
    const lines = [toLine(headers)];
    const escuelasList = (escuelas || []).filter((e: any) => selectedIds.includes(e.id));
    for (const e of escuelasList) {
      lines.push(toLine(['ALMIRANTE BROWN', String(e.seccion ?? ''), e.nombre ?? '', e.domicilio ?? '', String(e.circuito ?? ''), '', '', '', '', '', '']));
    }
    const csv = lines.join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `plantilla_seleccion.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadPlantillaByCircuitos = async () => {
    const code = circuitoFilter;
    const qs = code ? `?circuitos=${encodeURIComponent(code)}` : '';
    const url = apiUrl(`/api/escuelas/template${qs}`);
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
    if (!res.ok) { toast.error('No se pudo descargar'); return; }
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `plantilla_${code || 'todas'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onCreate = async () => {
    try {
      if (!form.nombre || !form.apellido || !form.email || !form.password || !form.escuelaId) {
        toast.error('Completa los campos obligatorios');
        return;
      }
      await createFiscalGeneral(form);
      toast.success('Fiscal general creado y asignado');
      setDialogOpen(false);
      setForm({ nombre: '', apellido: '', dni: '', celular: '', email: '', password: '', escuelaId: '' });
      await refetch();
    } catch (e: any) {
      toast.error(e.message || 'No se pudo crear el fiscal');
    }
  };

  const quickCreate = async () => {
    try {
      if (!quick.nombre || !quick.apellido || !quick.email || !quick.password) {
        toast.error('Completa nombre, apellido, email y password');
        return;
      }
      await createFiscalSvc({ nombre: quick.nombre, apellido: quick.apellido, email: quick.email, password: quick.password, role: quick.role });
      toast.success('Fiscal creado (sin escuela)');
      setQuick({ nombre: '', apellido: '', email: '', password: '', role: 'fiscal_general' });
      await refetch();
    } catch (e: any) {
      toast.error(e.message || 'No se pudo crear');
    }
  };

  const openEdit = (f: Fiscal) => {
    setSelected(f);
    setEditForm({ nombre: f.nombre, apellido: f.apellido, dni: f.dni || '', celular: f.celular || '', email: '', role: f.role as any, escuelaId: f.escuelaId || null, password: '' });
    setEditOpen(true);
  };

  const openAssign = async (f: Fiscal) => {
    setSelected(f);
    setAssignRole('encargado_seccion');
    try {
      const current = await getAsignacionesSvc(f.id);
      setAssignEscuelaIds(current.filter(a => a.role === 'encargado_seccion').map(a => a.escuelaId));
    } catch {}
    setAssignOpen(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    try {
      const payload: any = { ...editForm };
      if (!payload.password) delete payload.password;
      await updateFiscalSvc(selected.id, payload);
      toast.success('Fiscal actualizado');
      setEditOpen(false);
      setSelected(null);
      await refetch();
    } catch (e: any) {
      toast.error(e.message || 'No se pudo actualizar');
    }
  };

  const saveAssign = async () => {
    if (!selected) return;
    try {
      await setAsignacionesSvc(selected.id, assignRole, assignEscuelaIds);
      toast.success('Asignaciones actualizadas');
      setAssignOpen(false);
      setSelected(null);
      await refetch();
    } catch (e: any) {
      toast.error(e.message || 'No se pudieron actualizar las asignaciones');
    }
  };

  const assignBackupToEscuela = async (userId: string) => {
    const escuelaId = backupSelection[userId];
    if (!escuelaId) { toast.error('Elegí una escuela'); return; }
    try {
      setAssigningBackupId(userId);
      await setAsignacionesSvc(userId, 'fiscal_general', [escuelaId]);
      toast.success('Asignado como FG');
      // Refresh lists
      await refetch();
      try { const info = await getBackupFiscales(); setBackupInfo(info); } catch {}
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo asignar');
    } finally {
      setAssigningBackupId(null);
    }
  };

  if (isLoading) return <div>Cargando fiscales...</div>;
  if (isError) return <div>Error al cargar los fiscales: {error.message}</div>;

  const displayAsignEscuelas = (f: Fiscal) => {
    const asign = f.asignaciones || [];
    if (!asign.length) return '—';
    const names = asign.map(a => {
      const e = escuelas.find((x: any) => x.id === a.escuelaId);
      return e ? `${e.nombre}` : a.escuelaId;
    });
    return names.join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, apellido, DNI o celular" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          {/* Replace native select with radix Select to avoid empty value issues */}
          <Select value={roleFilter || 'all'} onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="coordinador">Coordinador</SelectItem>
              <SelectItem value="encargado_seccion">Encargado de circuito</SelectItem>
              <SelectItem value="fiscal_general">Fiscal General</SelectItem>
              <SelectItem value="fiscal_mesa">Fiscal de Mesa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          {backupInfo && (
            <div className="text-xs text-muted-foreground">Backup sin escuela: {backupInfo.count}</div>
          )}
          <Button onClick={() => setDialogOpen(true)}>Añadir FG a escuelas sin asignar</Button>
        </div>
      </div>

      {/* Quick create backup fiscal */}
      <div className="border rounded-md p-3 flex flex-wrap items-center gap-2 bg-card/50">
        <div className="text-sm font-medium mr-2">Crear fiscal sin escuela:</div>
        <input className="px-2 py-1 border rounded text-sm" placeholder="Nombre" value={quick.nombre} onChange={(e) => setQuick({ ...quick, nombre: e.target.value })} />
        <input className="px-2 py-1 border rounded text-sm" placeholder="Apellido" value={quick.apellido} onChange={(e) => setQuick({ ...quick, apellido: e.target.value })} />
        <input className="px-2 py-1 border rounded text-sm" placeholder="Email" value={quick.email} onChange={(e) => setQuick({ ...quick, email: e.target.value })} />
        <input className="px-2 py-1 border rounded text-sm" type="password" placeholder="Password" value={quick.password} onChange={(e) => setQuick({ ...quick, password: e.target.value })} />
        <select className="px-2 py-1 border rounded text-sm" value={quick.role} onChange={(e) => setQuick({ ...quick, role: e.target.value as any })}>
          <option value="fiscal_general">Fiscal General</option>
          <option value="fiscal_mesa">Fiscal de Mesa</option>
        </select>
        <Button size="sm" onClick={quickCreate}>Crear</Button>
      </div>

      {/* Backup pool section */}
      {backupInfo && backupInfo.users && backupInfo.users.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Fiscales sin escuela (backup): {backupInfo.count}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground">Asigná rápidamente un FG desde el backup a una escuela sin FG.</div>
            <div className="max-h-72 overflow-auto divide-y rounded border">
              {backupInfo.users.map((u) => (
                <div key={u.id} className="flex items-center gap-2 p-2 text-sm">
                  <div className="flex-1 truncate">{u.nombre} {u.apellido} {u.dni ? `• DNI ${u.dni}` : ''} <span className="text-xs text-muted-foreground">({u.role === 'fiscal_mesa' ? 'FM' : 'FG'})</span></div>
                  <select className="px-2 py-1 border rounded" value={backupSelection[u.id] || ''} onChange={(e) => setBackupSelection((s) => ({ ...s, [u.id]: e.target.value }))}>
                    <option value="">Elegir escuela sin FG</option>
                    {escuelasSinFG.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                  <Button size="sm" disabled={!backupSelection[u.id] || assigningBackupId === u.id} onClick={() => assignBackupToEscuela(u.id)}>
                    {assigningBackupId === u.id ? 'Asignando...' : 'Asignar FG'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Circuito</div>
            <Select value={circuitoFilter || 'all'} onValueChange={(v) => setCircuitoFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {CIRCUITOS_BROWN.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.code} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" onClick={downloadPlantillaByCircuitos}>Descargar plantilla por circuito</Button>
          <Button onClick={downloadPlantillaByEscuelas}>Descargar plantilla (selección)</Button>
        </div>

        {/* Selección de escuelas para plantilla */}
        <div className="border rounded-md p-3 space-y-2 bg-card/50">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">Seleccionar escuelas</div>
            <div className="flex items-center gap-2 text-xs">
              <Button size="sm" variant="outline" onClick={selectAllVisible}>Seleccionar visibles</Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>Limpiar</Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Buscar escuela..." value={schoolSearch} onChange={(e) => setSchoolSearch(e.target.value)} className="max-w-sm" />
            <div className="text-xs text-muted-foreground">Marcadas: {Object.values(selectedEscuelas).filter(Boolean).length}</div>
          </div>
          <div className="max-h-56 overflow-auto border rounded">
            {escuelasFiltradasParaSeleccion.map((e: any) => (
              <label key={e.id} className="flex items-center gap-2 px-2 py-1 text-sm border-b last:border-b-0">
                <input type="checkbox" checked={!!selectedEscuelas[e.id]} onChange={() => toggleEscuela(e.id)} />
                <span className="flex-1 truncate">{e.nombre} — {e.domicilio}</span>
                <span className="text-xs text-muted-foreground">C {e.circuito}</span>
              </label>
            ))}
            {escuelasFiltradasParaSeleccion.length === 0 && (
              <div className="p-2 text-xs text-muted-foreground">Sin resultados</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((fiscal) => (
          <Card key={fiscal.id} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{fiscal.nombre} {fiscal.apellido}</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openAssign(fiscal)}>Escuelas</Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(fiscal)}>Editar</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              <p><span className="text-muted-foreground">DNI:</span> {fiscal.dni || '—'}</p>
              <p><span className="text-muted-foreground">Celular:</span> {fiscal.celular || '—'}</p>
              <p><span className="text-muted-foreground">Rol:</span> {fiscal.role === 'encargado_seccion' ? 'Encargado de circuito' : fiscal.role.replace('_', ' ')}</p>
              <p><span className="text-muted-foreground">Escuelas:</span> {displayAsignEscuelas(fiscal)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogo crear FG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Fiscal General y asignar a escuela</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nombre*" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              <Input placeholder="Apellido*" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
              <Input placeholder="Celular" value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="email" placeholder="Email*" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input type="password" placeholder="Password*" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <select className="w-full px-3 py-2 border rounded-md bg-background" value={form.escuelaId} onChange={(e) => setForm({ ...form, escuelaId: e.target.value })}>
                <option value="">Seleccionar escuela sin FG*</option>
                {escuelasSinFG.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.nombre} — {e.domicilio}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={onCreate}>Crear y asignar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo editar fiscal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Fiscal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <select className="w-full px-3 py-2 border rounded-md bg-background" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}>
                <option value="coordinador">Coordinador</option>
                <option value="encargado_seccion">Encargado de circuito</option>
                <option value="fiscal_general">Fiscal General</option>
                <option value="fiscal_mesa">Fiscal de Mesa</option>
              </select>
              <select className="w-full px-3 py-2 border rounded-md bg-background" value={editForm.escuelaId ?? ''} onChange={(e) => setEditForm({ ...editForm, escuelaId: e.target.value || null })}>
                <option value="">Sin escuela (solo afecta escuelaId antiguo)</option>
                {escuelas.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.nombre} — {e.domicilio}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nombre" value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} />
              <Input placeholder="Apellido" value={editForm.apellido} onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="DNI" value={editForm.dni} onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })} />
              <Input placeholder="Celular" value={editForm.celular} onChange={(e) => setEditForm({ ...editForm, celular: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="email" placeholder="Email (opcional)" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              <Input type="password" placeholder="Password (dejar vacío para no cambiar)" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo asignaciones */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar escuelas al usuario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Rol de asignación</label>
              <select className="w-full px-3 py-2 border rounded-md bg-background" value={assignRole} onChange={(e) => setAssignRole(e.target.value as any)}>
                <option value="coordinador">Coordinador</option>
                <option value="encargado_seccion">Encargado de circuito</option>
                <option value="fiscal_general">Fiscal General</option>
                <option value="fiscal_mesa">Fiscal de Mesa</option>
              </select>
            </div>
            <div className="max-h-64 overflow-auto border rounded-md p-2">
              {escuelas.map((e: any) => (
                <label key={e.id} className="flex items-center gap-2 py-1">
                  <input type="checkbox" checked={assignEscuelaIds.includes(e.id)} onChange={(ev) => {
                    const checked = ev.target.checked;
                    setAssignEscuelaIds((prev) => checked ? [...prev, e.id] : prev.filter(x => x !== e.id));
                  }} />
                  <span>{e.nombre} — {e.domicilio}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button onClick={saveAssign}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}