import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';

type Summary = Record<string, any>;

function Uploader({ endpoint, acceptCsv = true, title, headerHint }: { endpoint: string; acceptCsv?: boolean; title: string; headerHint?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) { setFile(null); setPreview([]); return; }
    const okExt = /\.(xlsx|xls)$/i.test(f.name) || (acceptCsv && /\.(csv)$/i.test(f.name));
    if (!okExt) {
      toast.error('Formato inválido. Subí un Excel (.xlsx/.xls) o CSV (.csv)');
      setFile(null); setPreview([]); return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const buf = evt.target?.result as ArrayBuffer;
      if (/\.csv$/i.test(f.name)) {
        const text = new TextDecoder('utf-8').decode(new Uint8Array(buf));
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
        const header = lines[0]?.split(',') || [];
        const rows = lines.slice(1, 21).map((ln) => Object.fromEntries((ln.split(',').map((v) => v.trim())).map((v, i) => [header[i] ?? `col_${i}`, v])));
        setPreview(rows);
      } else {
        const workbook = XLSX.read(new Uint8Array(buf), { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet).slice(0, 20);
        setPreview(json as any[]);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (!file) return toast.error('Seleccioná un archivo');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch(apiUrl(endpoint), { method: 'POST', body: formData });
      const data: Summary | null = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || 'Error al importar');
      setSummary(data || {});
      const keys = Object.keys(data || {}).filter((k) => k !== 'message');
      toast.success(`${data?.message || 'Importación OK'}${keys.length ? ' · ' + keys.map(k => `${k}: ${(data as any)[k]}`).join(' · ') : ''}`);
    } catch (e: any) {
      toast.error(e?.message || 'Error al importar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {headerHint && <div className="text-sm text-muted-foreground mb-2">{headerHint}</div>}
        <input type="file" accept={acceptCsv ? '.xlsx,.xls,.csv' : '.xlsx,.xls'} onChange={handleFileChange} className="mb-4" />
        {preview.length > 0 && (
          <div className="mb-4 max-h-64 overflow-auto border rounded p-2 bg-muted">
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(preview, null, 2)}</pre>
          </div>
        )}
        <Button onClick={handleImport} disabled={!file || loading}>{loading ? 'Importando...' : 'Importar'}</Button>

        {summary && (
          <div className="mt-4 border rounded p-3 bg-muted/50">
            <div className="font-medium mb-2">Resumen</div>
            <ul className="text-sm space-y-1">
              {Object.entries(summary).map(([k, v]) => (
                <li key={k}><span className="text-muted-foreground">{k}:</span> {String(v)}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ImportarGenericos() {
  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <Tabs defaultValue="mesas">
        <TabsList>
          <TabsTrigger value="mesas">Fiscales de Mesa</TabsTrigger>
          <TabsTrigger value="fg">Fiscales Generales</TabsTrigger>
          <TabsTrigger value="establecimientos">Establecimientos</TabsTrigger>
        </TabsList>
        <TabsContent value="mesas">
          <Uploader
            endpoint="/api/import/genericos/mesas"
            title="Importar Fiscales de Mesa Genéricos"
            headerHint="XLSX: Apellido, Nombre, Referente, Validado, establecimiento, Circuito, Partido, Seccion · CSV: Seccion, Partido, Circuito, Nombre, Apellido, Referente, Validado"
          />
        </TabsContent>
        <TabsContent value="fg">
          <Uploader
            endpoint="/api/import/genericos/fg"
            title="Importar Fiscales Generales Genéricos"
            headerHint="XLSX: Apellido, Nombre, Referente, Validado, establecimiento, Circuito, Partido, Seccion · CSV: Seccion, Partido, Circuito, Nombre, Apellido, Referente, Validado"
          />
        </TabsContent>
        <TabsContent value="establecimientos">
          <Uploader
            endpoint="/api/import/genericos/establecimientos"
            title="Importar Establecimientos Genéricos"
            headerHint="Columnas: id, establecimiento, direccion, mesas, mesas_numero, circuito_loc, circuito, partido, seccion, Fiscal Gral, Fiscales Mesa, completo, cubierto"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
