import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useMemo, useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { PARTY_COLORS } from '@/lib/colors';
import { brownTotal2023 as brownTotal, circuitos2023 as circuitos } from '@/lib/resultados-data';

const COLORS = PARTY_COLORS;

type Slice = { label: keyof typeof COLORS; value: number };

type ResultadoSet = {
  diputadosProvinciales: Slice[];
  concejales: Slice[];
};

type Circuito = {
  code: string;
  nombre: string;
} & ResultadoSet;

const ChartBlock = ({ title, data }: { title: string; data: Slice[] }) => {
  const total = useMemo(() => data.reduce((acc, s) => acc + s.value, 0), [data]);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm font-medium">{title}</div>
      <div className="w-full h-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={40} outerRadius={70} paddingAngle={1}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.label]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: any, name: any) => [`${Number(v).toFixed(2)}%`, name as string]} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-muted-foreground">Total: {total.toFixed(2)}%</div>
    </div>
  );
};

export default function Resultados() {
  const [vista, setVista] = useState<'diputados' | 'concejales'>('diputados');
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return circuitos.filter(c => {
      if (!t) return true;
      return (`${c.code} ${c.nombre}`).toLowerCase().includes(t);
    });
  }, [search]);

  const exportPNG = async () => {
    if (!containerRef.current) return;
    const dataUrl = await toPng(containerRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `resultados-2023-${vista}.png`;
    a.click();
  };

  const exportPDF = async () => {
    if (!containerRef.current) return;
    const dataUrl = await toPng(containerRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
    const pdf = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const img = new Image();
    img.src = dataUrl;
    await new Promise((res) => { img.onload = res; });
    const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const x = (pageWidth - w) / 2;
    const y = (pageHeight - h) / 2;
    pdf.addImage(dataUrl, 'PNG', x, y, w, h);
    pdf.save(`resultados-2023-${vista}.pdf`);
  };

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Resultados 2023 · Almirante Brown</h1>
        <p className="text-muted-foreground">Por circuito electoral · Diputados Provinciales y Concejales</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md border">
            <button
              className={`px-3 py-1 text-sm ${vista === 'diputados' ? 'bg-primary text-white' : ''}`}
              onClick={() => setVista('diputados')}
            >Diputados Provinciales</button>
            <button
              className={`px-3 py-1 text-sm ${vista === 'concejales' ? 'bg-primary text-white' : ''}`}
              onClick={() => setVista('concejales')}
            >Concejales</button>
          </div>
          <input
            className="px-3 py-2 border rounded text-sm"
            placeholder="Buscar circuito..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="ml-auto flex gap-2">
            <button className="px-3 py-2 border rounded text-sm" onClick={exportPNG}>Exportar PNG</button>
            <button className="px-3 py-2 border rounded text-sm" onClick={exportPDF}>Exportar PDF</button>
          </div>
          <div className="text-sm text-muted-foreground">Mostrando {filtered.length} / {circuitos.length}</div>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle>Brown distrito total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vista === 'diputados' ? (
              <ChartBlock title="Diputados Provinciales" data={brownTotal.diputadosProvinciales} />
            ) : (
              <ChartBlock title="Concejales" data={brownTotal.concejales} />
            )}
            <div className="hidden md:block" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((c) => (
          <Card key={c.code} className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle>
                Circuito {c.code} · {c.nombre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {vista === 'diputados' ? (
                  <ChartBlock title="Diputados Provinciales" data={c.diputadosProvinciales} />
                ) : (
                  <ChartBlock title="Concejales" data={c.concejales} />
                )}
                <div className="hidden sm:block" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
