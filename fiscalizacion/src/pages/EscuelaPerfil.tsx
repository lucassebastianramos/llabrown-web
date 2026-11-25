import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';
import { circuitoLabel } from '@/lib/circuitos';

type User = { id: string; nombre: string; apellido: string; role: string };
type Mesa = { id: string; nro: string; fiscalId?: string | null; fiscal?: User | null };

type Escuela = {
  id: string;
  nombre: string;
  domicilio: string;
  circuito: string;
  seccion: number;
  lat?: number | null;
  lng?: number | null;
  fg_id?: string | null;
  fg?: User | null;
  incidencias_count?: number;
  mesas?: Mesa[];
};

export default function EscuelaPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [escuela, setEscuela] = useState<Escuela | null>(null);
  const [fiscales, setFiscales] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      load(id);
      loadFiscales();
    }
  }, [id]);

  const load = async (eid: string) => {
    try {
      const res = await fetch(apiUrl(`/api/escuelas/${eid}`), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar la escuela');
      setEscuela(data);
    } catch (e: any) {
      toast.error(e?.message || 'Error al cargar la escuela');
    } finally {
      setLoading(false);
    }
  };

  const loadFiscales = async () => {
    try {
      const res = await fetch(apiUrl('/api/fiscales'), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      setFiscales(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fiscalesGeneral = useMemo(() => fiscales.filter((f) => f.role === 'fiscal_general'), [fiscales]);
  const fiscalesMesaDeEscuela = useMemo(() => {
    if (!escuela) return [] as User[];
    return fiscales.filter((f: any) => {
      const asign = Array.isArray((f as any).asignaciones) ? (f as any).asignaciones : [];
      const hasMesaRole = f.role === 'fiscal_mesa' || asign.some((a: any) => a.role === 'fiscal_mesa');
      const belongsToEscuela = asign.some((a: any) => a.role === 'fiscal_mesa' && a.escuelaId === escuela.id) || (f as any).escuelaId === escuela.id;
      return hasMesaRole && belongsToEscuela;
    });
  }, [fiscales, escuela]);

  const setFG = async (fgId: string | null) => {
    if (!escuela) return;
    setSaving(true);
    try {
      const resp = await fetch(apiUrl(`/api/escuelas/${escuela.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ fgId }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || 'No se pudo actualizar FG');
      toast.success('Fiscal general actualizado');
      await load(escuela.id);
    } catch (e: any) {
      toast.error(e?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const setMesaFiscal = async (mesaId: string, fiscalId: string | null) => {
    setSaving(true);
    try {
      const resp = await fetch(apiUrl(`/api/mesas/${mesaId}/fiscal`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ fiscalId }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || 'No se pudo asignar fiscal a mesa');
      toast.success('Mesa actualizada');
      if (escuela) await load(escuela.id);
    } catch (e: any) {
      toast.error(e?.message || 'Error al actualizar mesa');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !escuela) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-1/3 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 bg-muted rounded animate-pulse" />
          <div className="h-40 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{escuela.nombre}</h1>
          <div className="text-muted-foreground text-sm">{escuela.domicilio}</div>
          <div className="text-xs mt-1">
            Circuito {escuela.circuito} {circuitoLabel(escuela.circuito)} · Sección {escuela.seccion}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Fiscal General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {escuela.fg ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{escuela.fg.nombre} {escuela.fg.apellido}</div>
                  <div className="text-xs text-muted-foreground">ID: {escuela.fg.id}</div>
                </div>
                <Badge variant="secondary">Asignado</Badge>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Sin fiscal general asignado</div>
            )}
            <div className="flex items-center gap-2">
              <Select onValueChange={(v) => setFG(v === 'none' ? null : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Asignar fiscal general" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={'none'}>Quitar FG</SelectItem>
                  {fiscalesGeneral.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nombre} {f.apellido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" disabled={saving} onClick={() => setFG(null)}>Quitar</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mesas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(!escuela.mesas || escuela.mesas.length === 0) && (
              <div className="text-sm text-muted-foreground">Esta escuela no tiene mesas cargadas.</div>
            )}
            {escuela.mesas && escuela.mesas.length > 0 && (
              <div className="space-y-2">
                {escuela.mesas
                  .slice()
                  .sort((a, b) => Number(a.nro) - Number(b.nro))
                  .map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 border rounded p-2">
                    <div>
                      <div className="font-medium">Mesa {m.nro}</div>
                      <div className="text-xs text-muted-foreground">{m.fiscal ? `${m.fiscal.nombre} ${m.fiscal.apellido}` : 'Sin fiscal asignado'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(v) => setMesaFiscal(m.id, v === 'none' ? null : v)}>
                        <SelectTrigger className="w-[220px]">
                          <SelectValue placeholder="Asignar fiscal de mesa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={'none'}>Quitar asignación</SelectItem>
                          {fiscalesMesaDeEscuela.map((f) => (
                            <SelectItem key={f.id} value={f.id}>{f.nombre} {f.apellido}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('/fiscales')}>Ver y crear fiscales</Button>
          <Button variant="outline" onClick={() => navigate('/importar-mesas')}>Importar mesas</Button>
        </CardContent>
      </Card>
    </div>
  );
}
