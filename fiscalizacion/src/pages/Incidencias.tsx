import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check, X } from 'lucide-react';

interface IncidenciaItem {
  id: string;
  tipo: string;
  estado: string;
  descripcion: string;
  escuelaId: string | null;
  escuela?: { id: string; nombre: string } | null;
  createdAt?: string;
}

const TIPOS = [
  { value: 'ausencia_fiscal', label: 'Ausencia de fiscal' },
  { value: 'problema_tecnico', label: 'Problema técnico' },
  { value: 'irregularidad', label: 'Irregularidad' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'otro', label: 'Otro' },
];

const ESTADOS = [
  { value: 'abierta', label: 'Abierta' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resuelta', label: 'Resuelta' },
  { value: 'cerrada', label: 'Cerrada' },
];

export default function Incidencias() {
  const [items, setItems] = useState<IncidenciaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<{ tipo?: string; estado?: string }>({});
  const [creating, setCreating] = useState(false);
  const [newItem, setNewItem] = useState<Partial<IncidenciaItem>>({ tipo: 'consulta', estado: 'abierta' });
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [escuelas, setEscuelas] = useState<Array<{ id: string; nombre: string }>>([]);

  useEffect(() => {
    fetchIncidencias(1);
  }, [filters]);

  const fetchIncidencias = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.tipo) params.set('tipo', String(filters.tipo));
      if (filters.estado) params.set('estado', String(filters.estado));
      params.set('page', String(p));
      params.set('pageSize', '12');
      const response = await fetch(apiUrl(`/api/incidencias?${params.toString()}`), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Error ${response.status}`);
      }
      const data = await response.json();
      setItems(data.items || []);
      setPage(data.page || p);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching incidencias:', error);
      toast.error(error?.message || 'Error al cargar las incidencias');
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchEscuelas = async () => {
    try {
      const res = await fetch(apiUrl('/api/escuelas'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Error ${res.status}`);
      }
      const data = await res.json();
      const opts = (data || []).map((e: any) => ({ id: e.id, nombre: e.nombre }));
      setEscuelas(opts);
    } catch (e: any) {
      console.error('Error fetching escuelas:', e);
      toast.error(e?.message || 'No se pudieron cargar escuelas');
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      const res = await fetch(apiUrl('/api/incidencias'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          tipo: newItem.tipo,
          estado: newItem.estado,
          descripcion: newItem.descripcion || '',
          escuelaId: newItem.escuelaId || null,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'No se pudo crear');
      }
      toast.success('Incidencia creada');
      setNewItem({ tipo: 'consulta', estado: 'abierta' });
      fetchIncidencias(1);
    } catch (e: any) {
      console.error('Create incidencia error:', e);
      toast.error(e?.message || 'Error al crear incidencia');
    } finally {
      setCreating(false);
    }
  };

  const updateEstado = async (id: string, estado: string) => {
    try {
      const res = await fetch(apiUrl(`/api/incidencias/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Error al actualizar');
      }
      fetchIncidencias(page);
    } catch (e: any) {
      console.error('Update incidencia error:', e);
      toast.error(e?.message || 'No se pudo actualizar');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Gestión de Incidencias</h1>

      <Card>
        <CardContent className="pt-6 grid gap-2 md:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Tipo</div>
            <Select value={filters.tipo ?? 'all'} onValueChange={(v) => setFilters((f) => ({ ...f, tipo: v === 'all' ? undefined : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Estado</div>
            <Select value={filters.estado ?? 'all'} onValueChange={(v) => setFilters((f) => ({ ...f, estado: v === 'all' ? undefined : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ESTADOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="secondary" onClick={() => fetchIncidencias(1)}>Aplicar</Button>
            {!loading && (
              <Button variant="outline" onClick={() => fetchIncidencias(page)}>Reintentar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nueva incidencia</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-2 items-end">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Tipo</div>
            <Select value={newItem.tipo as any} onValueChange={(v) => setNewItem((s) => ({ ...s, tipo: v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Estado</div>
            <Select value={newItem.estado as any} onValueChange={(v) => setNewItem((s) => ({ ...s, estado: v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTADOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Escuela (opcional)</div>
            <div className="flex gap-2">
              <Popover open={schoolOpen} onOpenChange={(o) => { setSchoolOpen(o); if (o && escuelas.length === 0) fetchEscuelas(); }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {newItem.escuelaId ? (escuelas.find(e => e.id === newItem.escuelaId)?.nombre || 'Seleccionada') : 'Seleccionar escuela...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[300px]">
                  <Command>
                    <CommandInput placeholder="Buscar escuela..." />
                    <CommandList>
                      <CommandEmpty>Sin resultados</CommandEmpty>
                      <CommandGroup>
                        {escuelas.map((e) => (
                          <CommandItem
                            key={e.id}
                            value={e.nombre}
                            onSelect={() => { setNewItem((s) => ({ ...s, escuelaId: e.id })); setSchoolOpen(false); }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${newItem.escuelaId === e.id ? 'opacity-100' : 'opacity-0'}`} />
                            {e.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {newItem.escuelaId && (
                <Button variant="ghost" size="icon" onClick={() => setNewItem((s) => ({ ...s, escuelaId: undefined }))}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Descripción</div>
            <Input value={newItem.descripcion || ''} onChange={(e) => setNewItem((s) => ({ ...s, descripcion: e.target.value }))} placeholder="Detalle" />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Creando...' : 'Crear incidencia'}</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No hay incidencias para los filtros seleccionados.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((inc) => (
            <Card key={inc.id}>
              <CardHeader>
                <CardTitle className="text-base">#{inc.id.slice(0, 8)} • {ESTADOS.find(e => e.value === inc.estado)?.label || inc.estado}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm"><span className="text-muted-foreground">Tipo:</span> {TIPOS.find(t => t.value === inc.tipo)?.label || inc.tipo}</div>
                {inc.escuela && (
                  <div className="text-sm"><span className="text-muted-foreground">Escuela:</span> {inc.escuela.nombre}</div>
                )}
                <div className="text-sm whitespace-pre-wrap">{inc.descripcion}</div>
                <div className="pt-2 flex gap-2">
                  <Select value={inc.estado} onValueChange={(v) => updateEstado(inc.id, v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => fetchIncidencias(page - 1)}>Anterior</Button>
          <div className="text-sm self-center">Página {page} de {totalPages}</div>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => fetchIncidencias(page + 1)}>Siguiente</Button>
        </div>
      )}
    </div>
  );
}