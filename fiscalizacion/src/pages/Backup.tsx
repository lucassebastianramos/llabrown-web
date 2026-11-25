import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const ENTITIES = [
  { key: 'users', label: 'Usuarios' },
  { key: 'escuelas', label: 'Escuelas' },
  { key: 'mesas', label: 'Mesas' },
  { key: 'asignaciones', label: 'Asignaciones' },
  { key: 'incidencias', label: 'Incidencias' },
] as const;

// Campos sugeridos por entidad (pueden ajustarse según el esquema)
const ENTITY_FIELDS: Record<string, string[]> = {
  users: ['id', 'nombre', 'apellido', 'email', 'dni', 'celular', 'role', 'createdAt'],
  escuelas: ['id', 'nombre', 'domicilio', 'circuito', 'seccion', 'lat', 'lng', 'fgId'],
  mesas: ['id', 'nro', 'escuelaId', 'fiscalId'],
  asignaciones: ['id', 'userId', 'escuelaId', 'role'],
  incidencias: ['id', 'tipo', 'estado', 'descripcion', 'escuelaId', 'createdAt'],
};

interface HistoryItem {
  date: string;
  type: 'snapshot' | 'csv';
  entity: string;
  filename: string;
  params?: Record<string, any>;
}

export default function Backup() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [configEntity, setConfigEntity] = useState<string>('users');
  const [fieldsByEntity, setFieldsByEntity] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {};
    Object.keys(ENTITY_FIELDS).forEach((k) => {
      init[k] = {};
    });
    return init;
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('backupHistory') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('backupHistory', JSON.stringify(history));
  }, [history]);

  const buildQuery = (selectedFields?: string[]) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (selectedFields && selectedFields.length) params.set('fields', selectedFields.join(','));
    return params.toString();
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      setDownloading(filename);
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!res.ok) throw new Error('Error de descarga');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success('Descarga iniciada');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo descargar');
    } finally {
      setDownloading(null);
    }
  };

  const handleSnapshot = async () => {
    const qs = buildQuery();
    const filename = `snapshot-${new Date().toISOString().slice(0,10)}.json`;
    await downloadFile(apiUrl(`/api/backup/snapshot${qs ? `?${qs}` : ''}`), filename);
    const item: HistoryItem = { date: new Date().toISOString(), type: 'snapshot', entity: 'all', filename, params: { from, to } };
    setHistory((h) => [item, ...h].slice(0, 10));
  };

  const getSelectedFields = (entity: string) => {
    const map = fieldsByEntity[entity] || {};
    return Object.entries(map).filter(([, v]) => v).map(([k]) => k);
  };

  const handleCSV = async (entity: string) => {
    const selectedFields = getSelectedFields(entity);
    const qs = buildQuery(selectedFields);
    const filename = `${entity}-${new Date().toISOString().slice(0,10)}.csv`;
    await downloadFile(apiUrl(`/api/backup/export/${entity}${qs ? `?${qs}` : ''}`), filename);
    const item: HistoryItem = { date: new Date().toISOString(), type: 'csv', entity, filename, params: { from, to, fields: selectedFields } };
    setHistory((h) => [item, ...h].slice(0, 10));
  };

  const toggleField = (entity: string, field: string, value: boolean | 'indeterminate') => {
    setFieldsByEntity((prev) => ({
      ...prev,
      [entity]: { ...prev[entity], [field]: !!value },
    }));
  };

  const selectAllFields = (entity: string) => {
    setFieldsByEntity((prev) => ({
      ...prev,
      [entity]: Object.fromEntries((ENTITY_FIELDS[entity] || []).map((f) => [f, true])),
    }));
  };

  const clearFields = (entity: string) => {
    setFieldsByEntity((prev) => ({ ...prev, [entity]: {} }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Respaldo de Datos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3 items-end">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Desde (ISO o YYYY-MM-DD)</div>
            <input type="date" className="w-full border rounded px-2 py-1" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Hasta (ISO o YYYY-MM-DD)</div>
            <input type="date" className="w-full border rounded px-2 py-1" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setFrom(''); setTo(''); Object.keys(ENTITY_FIELDS).forEach((k) => clearFields(k)); }}>Limpiar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campos a exportar (CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Entidad</div>
              <Select value={configEntity} onValueChange={setConfigEntity}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTITIES.map((e) => (
                    <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => selectAllFields(configEntity)}>Seleccionar todos</Button>
              <Button variant="ghost" onClick={() => clearFields(configEntity)}>Limpiar</Button>
            </div>
            <div className="text-sm text-muted-foreground">Seleccionados: {getSelectedFields(configEntity).length}</div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {(ENTITY_FIELDS[configEntity] || []).map((f) => (
              <label key={f} className="flex items-center gap-2 border rounded px-2 py-1">
                <Checkbox checked={!!fieldsByEntity[configEntity]?.[f]} onCheckedChange={(v) => toggleField(configEntity, f, v)} />
                <span className="text-sm">{f}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Snapshot completo (JSON)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Descarga un volcado completo en JSON con usuarios, escuelas, mesas, asignaciones e incidencias. Respeta el rango de fechas cuando aplique.</p>
            <Button onClick={handleSnapshot} disabled={!!downloading}>
              {downloading?.endsWith('.json') ? 'Generando...' : 'Descargar snapshot.json'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exportaciones CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Seleccioná la entidad y opcionalmente los campos. Si no elegís campos, se exportan todos.</p>
            <div className="flex flex-wrap gap-2">
              {ENTITIES.map((e) => (
                <Button key={e.key} variant="secondary" onClick={() => handleCSV(e.key)} disabled={!!downloading}>
                  {downloading?.startsWith(e.key) ? `Exportando ${e.label}...` : `${e.label} (${getSelectedFields(e.key).length || 'todos'})`}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de exportaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.slice(0, 10).map((h, idx) => (
              <div key={idx} className="text-sm flex items-center gap-2">
                <span className="text-muted-foreground">{new Date(h.date).toLocaleString()}</span>
                <span>•</span>
                <span className="uppercase text-xs px-2 py-0.5 rounded bg-muted">{h.type}</span>
                <span>{h.type === 'csv' ? h.entity : 'snapshot'}</span>
                <span className="text-muted-foreground">{h.filename}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {downloading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background border rounded px-6 py-4 shadow-lg">
            <div className="animate-pulse text-sm">Procesando {downloading}...</div>
          </div>
        </div>
      )}
    </div>
  );
}
