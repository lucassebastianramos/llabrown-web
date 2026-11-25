import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Jornada {
  status: 'pendiente' | 'abierta' | 'cerrada';
  electores?: number | null;
  openedAt?: string | null;
  closedAt?: string | null;
  votantes?: number[];
}

interface MiMesaData {
  mesa: { id: string; nro: string; escuela: { id: string; nombre: string } };
  jornada: Jornada | null;
  votantesCount: number;
  faltantes: number | null;
  resultados?: any;
  actas?: Array<{ id: string; filename: string; path: string; uploadedAt: string }>;
}

export default function MiMesa() {
  const { session, isFiscalMesa } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MiMesaData | null>(null);
  const [electores, setElectores] = useState<number | ''>('');
  const [numero, setNumero] = useState<number | ''>('');
  const [numeroUncheck, setNumeroUncheck] = useState<number | ''>('');
  const [alianzas, setAlianzas] = useState<Array<{ id: string; nombre: string }>>([]);
  const [res, setRes] = useState<Record<string, number | ''>>({});
  const canInteract = isFiscalMesa;

  const fetchAll = async () => {
    setLoading(true);
    const [j, a] = await Promise.all([
      fetch(apiUrl(`/api/mesas/me/jornada`), { headers: { Authorization: `Bearer ${session}` } }).then((r) => (r.ok ? r.json() : null)),
      fetch(apiUrl(`/api/mesas/alianzas`)).then((r) => (r.ok ? r.json() : [])),
    ]);
    if (j) {
      setData(j);
      if (j?.jornada?.electores && j.jornada.electores > 0) setElectores(j.jornada.electores);
    }
    setAlianzas(Array.isArray(a) ? a : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // initialize resultados inputs
    const next: Record<string, number | ''> = {};
    alianzas.forEach((al) => {
      // try populate from existing resultados JSON
      const current = (data?.resultados?.resultados || {})[al.nombre];
      next[al.nombre] = typeof current === 'number' ? current : '';
    });
    setRes(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alianzas, data?.resultados]);

  const openDay = async () => {
    if (!data?.mesa?.id) return;
    const r = await fetch(apiUrl(`/api/mesas/${data.mesa.id}/jornada/open`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${session}` },
    });
    if (!r.ok) return toast.error('No se pudo abrir la jornada');
    toast.success('Jornada abierta');
    fetchAll();
  };

  const saveElectores = async () => {
    if (!data?.mesa?.id || electores === '' || Number(electores) <= 0) return;
    const r = await fetch(apiUrl(`/api/mesas/${data.mesa.id}/jornada/electores`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
      body: JSON.stringify({ electores: Number(electores) }),
    });
    if (!r.ok) return toast.error('No se pudo guardar electores');
    toast.success('Electores guardado');
    fetchAll();
  };

  const checkin = async () => {
    if (!data?.mesa?.id || numero === '' || Number(numero) <= 0) return;
    const r = await fetch(apiUrl(`/api/mesas/${data.mesa.id}/jornada/checkin`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
      body: JSON.stringify({ numero: Number(numero) }),
    });
    if (!r.ok) return toast.error('No se pudo marcar votante');
    setNumero('');
    fetchAll();
  };

  const uncheck = async () => {
    if (!data?.mesa?.id || numeroUncheck === '' || Number(numeroUncheck) <= 0) return;
    const r = await fetch(apiUrl(`/api/mesas/${data.mesa.id}/jornada/uncheck`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
      body: JSON.stringify({ numero: Number(numeroUncheck) }),
    });
    if (!r.ok) return toast.error('No se pudo desmarcar votante');
    setNumeroUncheck('');
    fetchAll();
  };

  const closeDay = async () => {
    if (!data?.mesa?.id) return;
    const r = await fetch(apiUrl(`/api/mesas/${data.mesa.id}/jornada/close`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${session}` },
    });
    if (!r.ok) return toast.error('No se pudo cerrar la jornada');
    toast.success('Jornada cerrada');
    fetchAll();
  };

  const submitResultados = async () => {
    if (!data?.mesa?.id) return;
    const payload: Record<string, number> = {};
    Object.entries(res).forEach(([k, v]) => (payload[k] = Number(v) || 0));
    const r = await fetch(apiUrl(`/api/mesas/${data.mesa.id}/resultados`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
      body: JSON.stringify({ resultados: payload }),
    });
    if (!r.ok) return toast.error('No se pudo guardar resultados');
    toast.success('Resultados guardados');
    fetchAll();
  };

  const uploadActa = async (file: File) => {
    if (!data?.mesa?.id) return;
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(apiUrl(`/api/mesas/${data.mesa.id}/acta`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${session}` },
      body: fd,
    });
    if (!r.ok) return toast.error('No se pudo subir el acta');
    toast.success('Acta subida');
    fetchAll();
  };

  const totalResultados = useMemo(() => Object.values(res).reduce((a, v) => Number(a) + (Number(v) || 0), 0 as number), [res]);
  const elect: number = typeof electores === 'number' ? electores : Number(data?.jornada?.electores || 0);
  const excede = elect > 0 && totalResultados > elect;

  const canOpen = useMemo(() => data && (data.jornada?.status ?? 'pendiente') !== 'abierta', [data]);
  const canClose = useMemo(() => data && data.jornada?.status === 'abierta', [data]);

  if (!isFiscalMesa) {
    return <div className="p-6">Solo disponible para fiscales de mesa</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mi Mesa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <div>Cargando...</div>}
          {!loading && data && (
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Escuela</div>
                <div className="font-medium">{data.mesa.escuela.nombre}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Mesa</div>
                <div className="font-medium">{data.mesa.nro}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Estado</div>
                <div className="font-medium capitalize">{data.jornada?.status || 'pendiente'}</div>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-sm">Electores de la mesa</label>
                  <Input type="number" value={electores} onChange={(e) => setElectores(e.target.value === '' ? '' : Number(e.target.value))} placeholder="ej. 350" />
                </div>
                <Button disabled={!canInteract} onClick={saveElectores}>Guardar</Button>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-sm">Marcar votante (n° de padrón)</label>
                  <Input type="number" value={numero} onChange={(e) => setNumero(e.target.value === '' ? '' : Number(e.target.value))} placeholder="ej. 27" />
                </div>
                <Button disabled={!canInteract || !data.jornada || data.jornada.status !== 'abierta'} onClick={checkin}>Marcar</Button>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-sm">Desmarcar votante (n° de padrón)</label>
                  <Input type="number" value={numeroUncheck} onChange={(e) => setNumeroUncheck(e.target.value === '' ? '' : Number(e.target.value))} placeholder="ej. 27" />
                </div>
                <Button variant="secondary" disabled={!canInteract || !data.jornada || data.jornada.status !== 'abierta'} onClick={uncheck}>Desmarcar</Button>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" disabled={!canInteract || !canOpen} onClick={openDay}>Abrir 07:00</Button>
                <Button variant="destructive" disabled={!canInteract || !canClose} onClick={closeDay}>Cerrar 18:00</Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-md bg-muted">
                  <div className="text-sm text-muted-foreground">Votantes</div>
                  <div className="text-2xl font-bold">{data.votantesCount ?? 0}</div>
                </div>
                <div className="p-3 rounded-md bg-muted">
                  <div className="text-sm text-muted-foreground">Faltantes</div>
                  <div className="text-2xl font-bold">{data.faltantes ?? '-'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium">Resultados por alianza</div>
                <div className="text-sm text-muted-foreground">Total: {totalResultados}{excede ? ' (excede electores)' : ''}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {alianzas.map((al) => (
                    <div key={al.id}>
                      <label className="text-sm">{al.nombre}</label>
                      <Input
                        type="number"
                        value={res[al.nombre] ?? ''}
                        onChange={(e) => setRes((p) => ({ ...p, [al.nombre]: e.target.value === '' ? '' : Number(e.target.value) }))}
                      />
                    </div>
                  ))}
                </div>
                <Button disabled={excede} onClick={submitResultados}>Guardar Resultados</Button>
                {excede && <div className="text-sm text-red-600">La suma de votos no puede superar los electores de la mesa</div>}
              </div>

              <div className="space-y-2">
                <div className="font-medium">Subir acta (foto o PDF)</div>
                <Input type="file" accept="image/*,application/pdf" onChange={(e) => e.target.files && e.target.files[0] && uploadActa(e.target.files[0])} />
                <div className="text-sm text-muted-foreground">Archivos subidos</div>
                <ul className="list-disc pl-6">
                  {(data.actas || []).map((a) => (
                    <li key={a.id}>
                      <a href={apiUrl(`/api${a.path}`)} target="_blank" className="underline text-blue-600">{a.filename}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
