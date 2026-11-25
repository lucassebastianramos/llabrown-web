import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useMemo, useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { PARTY_COLORS } from '@/lib/colors';

const COLORS = PARTY_COLORS;

type Slice = { label: keyof typeof COLORS | string; value: number };

type ResultadoSet = {
  diputadosProvinciales: Slice[];
  concejales: Slice[];
};

type Circuito = {
  code: string;
  nombre: string;
} & ResultadoSet;

const brownTotal: ResultadoSet = {
  diputadosProvinciales: [
    { label: 'FP', value: 54.22 },
    { label: 'FIT', value: 5.79 },
    { label: 'Blanco', value: 2.86 },
    { label: 'LLA', value: 28.39 },
    { label: 'Otros', value: 8.74 },
  ],
  concejales: [
    { label: 'FP', value: 54.17 },
    { label: 'FIT', value: 5.77 },
    { label: 'Blanco', value: 2.99 },
    { label: 'LLA', value: 28.37 },
    { label: 'Otros', value: 8.7 },
  ],
};

const circuitos: Circuito[] = [
  {
    code: '17', nombre: 'Adrogué',
    diputadosProvinciales: [
      { label: 'FP', value: 30.99 },
      { label: 'Otros', value: 12.26 },
      { label: 'FIT', value: 5.50 },
      { label: 'Blanco', value: 3.67 },
      { label: 'LLA', value: 47.58 },
    ],
    concejales: [
      { label: 'FP', value: 30.76 },
      { label: 'Otros', value: 12.48 },
      { label: 'FIT', value: 5.54 },
      { label: 'Blanco', value: 3.81 },
      { label: 'LLA', value: 47.40 },
    ],
  },
  {
    code: '18', nombre: 'José Mármol',
    diputadosProvinciales: [
      { label: 'FP', value: 49.30 },
      { label: 'Otros', value: 11.73 },
      { label: 'FIT', value: 5.84 },
      { label: 'Blanco', value: 3.14 },
      { label: 'LLA', value: 30.00 },
    ],
    concejales: [
      { label: 'FP', value: 49.28 },
      { label: 'Otros', value: 11.79 },
      { label: 'FIT', value: 5.83 },
      { label: 'Blanco', value: 3.13 },
      { label: 'LLA', value: 29.97 },
    ],
  },
  {
    code: '18A', nombre: 'San José',
    diputadosProvinciales: [
      { label: 'FP', value: 57.61 },
      { label: 'Otros', value: 11.04 },
      { label: 'FIT', value: 5.43 },
      { label: 'Blanco', value: 2.62 },
      { label: 'LLA', value: 23.29 },
    ],
    concejales: [
      { label: 'FP', value: 57.57 },
      { label: 'Otros', value: 11.10 },
      { label: 'FIT', value: 5.47 },
      { label: 'Blanco', value: 2.59 },
      { label: 'LLA', value: 23.27 },
    ],
  },
  {
    code: '19', nombre: 'Rafael Calzada',
    diputadosProvinciales: [
      { label: 'FP', value: 55.77 },
      { label: 'Otros', value: 10.94 },
      { label: 'FIT', value: 5.61 },
      { label: 'Blanco', value: 2.32 },
      { label: 'LLA', value: 25.36 },
    ],
    concejales: [
      { label: 'FP', value: 55.66 },
      { label: 'Otros', value: 11.05 },
      { label: 'FIT', value: 5.57 },
      { label: 'Blanco', value: 2.41 },
      { label: 'LLA', value: 25.30 },
    ],
  },
  {
    code: '20', nombre: 'Burzaco',
    diputadosProvinciales: [
      { label: 'FP', value: 49.02 },
      { label: 'Otros', value: 11.35 },
      { label: 'FIT', value: 5.85 },
      { label: 'Blanco', value: 3.03 },
      { label: 'LLA', value: 30.75 },
    ],
    concejales: [
      { label: 'FP', value: 48.89 },
      { label: 'Otros', value: 11.44 },
      { label: 'FIT', value: 5.86 },
      { label: 'Blanco', value: 3.13 },
      { label: 'LLA', value: 30.68 },
    ],
  },
  {
    code: '20A', nombre: 'Malvinas Argentinas',
    diputadosProvinciales: [
      { label: 'FP', value: 55.10 },
      { label: 'Otros', value: 11.18 },
      { label: 'FIT', value: 4.92 },
      { label: 'Blanco', value: 2.86 },
      { label: 'LLA', value: 25.95 },
    ],
    concejales: [
      { label: 'FP', value: 55.00 },
      { label: 'Otros', value: 11.12 },
      { label: 'FIT', value: 4.89 },
      { label: 'Blanco', value: 3.05 },
      { label: 'LLA', value: 25.94 },
    ],
  },
  {
    code: '21', nombre: 'Longchamps',
    diputadosProvinciales: [
      { label: 'FP', value: 52.66 },
      { label: 'Otros', value: 11.17 },
      { label: 'FIT', value: 5.83 },
      { label: 'Blanco', value: 2.60 },
      { label: 'LLA', value: 27.74 },
    ],
    concejales: [
      { label: 'FP', value: 52.48 },
      { label: 'Otros', value: 11.24 },
      { label: 'FIT', value: 5.83 },
      { label: 'Blanco', value: 2.77 },
      { label: 'LLA', value: 27.68 },
    ],
  },
  {
    code: '21A', nombre: 'Ministro Rivadavia',
    diputadosProvinciales: [
      { label: 'FP', value: 58.36 },
      { label: 'Otros', value: 9.96 },
      { label: 'FIT', value: 4.93 },
      { label: 'Blanco', value: 2.61 },
      { label: 'LLA', value: 24.14 },
    ],
    concejales: [
      { label: 'FP', value: 57.24 },
      { label: 'Otros', value: 10.97 },
      { label: 'FIT', value: 4.90 },
      { label: 'Blanco', value: 2.71 },
      { label: 'LLA', value: 24.18 },
    ],
  },
  {
    code: '22', nombre: 'Glew',
    diputadosProvinciales: [
      { label: 'FP', value: 53.00 },
      { label: 'Otros', value: 11.13 },
      { label: 'FIT', value: 6.29 },
      { label: 'Blanco', value: 2.58 },
      { label: 'LLA', value: 27.01 },
    ],
    concejales: [
      { label: 'FP', value: 53.00 },
      { label: 'Otros', value: 11.13 },
      { label: 'FIT', value: 6.20 },
      { label: 'Blanco', value: 2.70 },
      { label: 'LLA', value: 26.97 },
    ],
  },
  {
    code: '22A', nombre: 'Claypole',
    diputadosProvinciales: [
      { label: 'FP', value: 54.16 },
      { label: 'Otros', value: 10.51 },
      { label: 'FIT', value: 6.62 },
      { label: 'Blanco', value: 2.30 },
      { label: 'LLA', value: 26.40 },
    ],
    concejales: [
      { label: 'FP', value: 53.69 },
      { label: 'Otros', value: 10.81 },
      { label: 'FIT', value: 6.50 },
      { label: 'Blanco', value: 2.48 },
      { label: 'LLA', value: 26.52 },
    ],
  },
  {
    code: '22B', nombre: 'San Francisco Solano',
    diputadosProvinciales: [
      { label: 'FP', value: 56.09 },
      { label: 'Otros', value: 9.73 },
      { label: 'FIT', value: 6.51 },
      { label: 'Blanco', value: 3.30 },
      { label: 'LLA', value: 24.37 },
    ],
    concejales: [
      { label: 'FP', value: 55.84 },
      { label: 'Otros', value: 9.64 },
      { label: 'FIT', value: 6.43 },
      { label: 'Blanco', value: 3.72 },
      { label: 'LLA', value: 24.37 },
    ],
  },
  {
    code: '22C', nombre: 'San Francisco de Asís (Barrio Don Orione)',
    diputadosProvinciales: [
      { label: 'FP', value: 57.54 },
      { label: 'Otros', value: 10.37 },
      { label: 'FIT', value: 5.59 },
      { label: 'Blanco', value: 2.87 },
      { label: 'LLA', value: 23.62 },
    ],
    concejales: [
      { label: 'FP', value: 57.40 },
      { label: 'Otros', value: 10.45 },
      { label: 'FIT', value: 5.61 },
      { label: 'Blanco', value: 2.88 },
      { label: 'LLA', value: 23.67 },
    ],
  },
];

const ChartBlock = ({ title, data, sortByValue = false }: { title: string; data: Slice[]; sortByValue?: boolean }) => {
  const dataOrdered = useMemo(() => (sortByValue ? [...data].sort((a, b) => b.value - a.value) : data), [data, sortByValue]);
  const total = useMemo(() => data.reduce((acc, s) => acc + s.value, 0), [data]);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm font-medium">{title}</div>
      <div className="w-full h-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={dataOrdered} dataKey="value" nameKey="label" innerRadius={40} outerRadius={70} paddingAngle={1}>
              {dataOrdered.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.label] || '#64748b'} />
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

export default function Resultados2025() {
  const [vista, setVista] = useState<'diputados' | 'concejales'>('diputados');
  const [search, setSearch] = useState('');
  const [ordenar, setOrdenar] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return circuitos.filter(c => !t || (`${c.code} ${c.nombre}`).toLowerCase().includes(t));
  }, [search]);

  const exportPNG = async () => {
    if (!containerRef.current) return;
    const dataUrl = await toPng(containerRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `resultados-2025-${vista}.png`;
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
    pdf.save(`resultados-2025-${vista}.pdf`);
  };

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Resultados 2025 · Almirante Brown</h1>
        <p className="text-muted-foreground">Por circuito electoral · Diputados Provinciales y Concejales</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md border">
            <button className={`px-3 py-1 text-sm ${vista === 'diputados' ? 'bg-primary text-white' : ''}`} onClick={() => setVista('diputados')}>Diputados Provinciales</button>
            <button className={`px-3 py-1 text-sm ${vista === 'concejales' ? 'bg-primary text-white' : ''}`} onClick={() => setVista('concejales')}>Concejales</button>
          </div>
          <input className="px-3 py-2 border rounded text-sm" placeholder="Buscar circuito..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ordenar} onChange={(e) => setOrdenar(e.target.checked)} />
            Ordenar leyenda por %
          </label>
          <div className="text-sm text-muted-foreground">Mostrando {filtered.length} / {circuitos.length}</div>
          <div className="ml-auto flex gap-2">
            <button className="px-3 py-2 border rounded text-sm" onClick={exportPNG}>Exportar PNG</button>
            <button className="px-3 py-2 border rounded text-sm" onClick={exportPDF}>Exportar PDF</button>
          </div>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle>Brown distrito total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vista === 'diputados' ? (
              <ChartBlock title="Diputados Provinciales" data={brownTotal.diputadosProvinciales} sortByValue={ordenar} />
            ) : (
              <ChartBlock title="Concejales" data={brownTotal.concejales} sortByValue={ordenar} />
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
                  <ChartBlock title="Diputados Provinciales" data={c.diputadosProvinciales} sortByValue={ordenar} />
                ) : (
                  <ChartBlock title="Concejales" data={c.concejales} sortByValue={ordenar} />
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
