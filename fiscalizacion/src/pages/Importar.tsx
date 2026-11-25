import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

export default function Importar() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overwrite, setOverwrite] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && !/\.(xlsx|xls)$/i.test(f.name)) {
      toast.error("Formato inválido. Subí un Excel (.xlsx o .xls)");
      setFile(null);
      setPreview([]);
      return;
    }
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[];
        if (!rows || rows.length === 0) {
          setPreview([]);
          return;
        }
        const header = (rows[0] as any[]).map((h) => String(h ?? ""));
        const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        const required = [
          'distrito',
          'seccion',
          'establecimiento',
          'domicilio',
          'circuito_electoral',
          'cargo',
          'dni',
          'apellido',
          'nombre',
          'nro_celular',
          'referente_a_cargo',
        ];
        const normalizedHeaders = new Set(header.map((h) => normalize(String(h))));
        const missing = required.filter((k) => !normalizedHeaders.has(normalize(k)));
        if (missing.length) {
          const expected = 'DISTRITO, SECCION, ESTABLECIMIENTO, DOMICILIO, CIRCUITO ELECTORAL, CARGO, DNI, APELLIDO, NOMBRE, NRO CELULAR, REFERENTE A CARGO';
          toast.error(`El Excel no tiene el formato correcto. Faltan: ${missing.join(', ')}. Formato esperado: ${expected}`);
          setPreview([]);
          setFile(null);
          return;
        }
        const json = XLSX.utils.sheet_to_json(sheet);
        setPreview(json);
      };
      reader.readAsArrayBuffer(f);
    }
  };

  const handleImport = async () => {
    if (!file) return toast.error("Selecciona un archivo válido");
    setLoading(true);
    setShowOverlay(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(apiUrl(`/api/import${overwrite ? '?overwrite=1' : ''}`), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        toast.success("Datos importados correctamente");
        if (data) {
          const parts = [
            `Filas: ${data.rowsProcessed ?? '-'}`,
            `Escuelas creadas: ${data.escuelasCreated ?? 0}`,
            `Escuelas existentes: ${data.escuelasMatched ?? 0}`,
            `Usuarios creados: ${data.usersCreated ?? 0}`,
            `Usuarios actualizados: ${data.usersUpdated ?? 0}`,
            `Asignaciones: ${data.asignaciones ?? 0}`,
            `FG asignados: ${data.fgAssigned ?? 0}`,
            `Encargados asignados: ${data.encargadosAsignados ?? 0}`,
          ];
          if (data.overwrite) {
            parts.push(`FG reemplazados: ${data.fgOverwritten ?? 0}`);
            parts.push(`Scrap creados: ${data.scrapsCreated ?? 0}`);
          }
          toast.message('Resumen de importación', { description: parts.join(' | ') });
        }
      } else {
        const payload = await response.json().catch(() => null);
        const msg = payload?.error || "Error al importar datos";
        toast.error(msg);
      }
    } catch (error) {
      toast.error("Error al importar datos");
    } finally {
      setLoading(false);
      setShowOverlay(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Importar Excel de Escuelas y Fiscales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-2">
            Formato esperado: DISTRITO, SECCION, ESTABLECIMIENTO, DOMICILIO, CIRCUITO ELECTORAL, CARGO, DNI, APELLIDO, NOMBRE, NRO CELULAR, REFERENTE A CARGO
          </div>
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="mb-4" />
          <div className="flex items-center gap-2 mb-4">
            <input id="overwrite" type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            <label htmlFor="overwrite" className="text-sm">Sobrescribir FG existentes (mover anteriores a scrap)</label>
          </div>
          {preview.length > 0 && (
            <div className="mb-4 max-h-64 overflow-auto border rounded p-2 bg-muted">
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(preview.slice(0, 10), null, 2)}</pre>
              <div className="text-xs text-muted-foreground">Mostrando primeras 10 filas</div>
            </div>
          )}
          <Button onClick={handleImport} disabled={loading || !file}>
            {loading ? "Importando..." : "Importar"}
          </Button>
        </CardContent>
      </Card>

      {showOverlay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background border rounded px-6 py-4 shadow-lg">
            <div className="animate-pulse text-sm">Procesando importación...</div>
          </div>
        </div>
      )}
    </div>
  );
}
