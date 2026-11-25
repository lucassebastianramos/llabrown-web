import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

export default function ImportarMesas() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [createUsers, setCreateUsers] = useState(false);

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

      const token = localStorage.getItem('token');
      const url = apiUrl(`/api/import/mesas${createUsers ? '?createUsers=1' : ''}`);
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        toast.success("Mesas importadas correctamente");
        if (data) {
          const parts = [
            `Filas: ${data.rowsProcessed ?? '-'}`,
            `Mesas creadas: ${data.mesasCreated ?? 0}`,
            `Mesas actualizadas: ${data.mesasUpdated ?? 0}`,
            `Asignaciones: ${data.asignaciones ?? 0}`,
          ];
          if (data.usersCreated != null) parts.push(`Usuarios creados: ${data.usersCreated}`);
          if (data.usersSkippedWithoutIdentity != null) parts.push(`Filas sin identidad (omitidas): ${data.usersSkippedWithoutIdentity}`);
          if (data.matchedByDni != null) parts.push(`Match DNI: ${data.matchedByDni}`);
          if (data.matchedByNombreApellido != null) parts.push(`Match Nombre/Apellido: ${data.matchedByNombreApellido}`);
          if (data.matchedByNombreApellidoSwapped != null) parts.push(`Match Invertido: ${data.matchedByNombreApellidoSwapped}`);
          if (data.matchedByCelular != null) parts.push(`Match Celular: ${data.matchedByCelular}`);
          toast.message('Resumen de importación', { description: parts.join(' | ') });
        }
      } else {
        const payload = await response.json().catch(() => null);
        const msg = payload?.error || `Error al importar mesas (HTTP ${response.status})`;
        toast.error(msg);
      }
    } catch (error: any) {
      const msg = (error?.message || '').toLowerCase().includes('network')
        ? 'Error de red/cierre de conexión durante la importación. Reintentá y verificá el tamaño del archivo.'
        : 'Error al importar mesas';
      toast.error(msg);
    } finally {
      setLoading(false);
      setShowOverlay(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Importar Excel de Mesas por Establecimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-2">
            Formato esperado: DISTRITO, ESTABLECIMIENTO, DOMICILIO, CIRCUITO ELECTORAL, MESA NRO, DNI, NRO CELULAR, NOMBRES, APELLIDOS, REFERENTE A CARGO
          </div>
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="mb-4" />
          {preview.length > 0 && (
            <div className="mb-4 max-h-64 overflow-auto border rounded p-2 bg-muted">
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(preview.slice(0, 10), null, 2)}</pre>
              <div className="text-xs text-muted-foreground">Mostrando primeras 10 filas</div>
            </div>
          )}
          <div className="flex items-center gap-2 mb-4">
            <input id="createUsers" type="checkbox" className="h-4 w-4" checked={createUsers} onChange={(e) => setCreateUsers(e.target.checked)} />
            <label htmlFor="createUsers" className="text-sm">Crear usuarios faltantes como Fiscal de Mesa</label>
          </div>
          <Button onClick={handleImport} disabled={loading || !file}>
            {loading ? "Importando..." : "Importar Mesas"}
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