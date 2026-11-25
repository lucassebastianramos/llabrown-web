import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useMemo, useState } from 'react';
import { PARTY_COLORS } from '@/lib/colors';
import { brownTotal2023, circuitos2023, brownTotal2025, circuitos2025 } from '@/lib/resultados-data';

const COLORS = PARTY_COLORS;

type Slice = { label: keyof typeof COLORS | string; value: number };

const Chart = ({ data }: { data: Slice[] }) => (
  <ResponsiveContainer>
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="label" innerRadius={40} outerRadius={70} paddingAngle={1}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[entry.label] || '#64748b'} />
        ))}
      </Pie>
      <Tooltip formatter={(v: any, name: any) => [`${Number(v).toFixed(2)}%`, name as string]} />
      <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11 }} />
    </PieChart>
  </ResponsiveContainer>
);

export default function ComparadorResultados() {
  const [scope, setScope] = useState<'distrito' | 'circuito'>('distrito');
  const [circuitoCode, setCircuitoCode] = useState<string>('17');

  const listaCircuitos = useMemo(() => circuitos2023.map(c => ({ code: c.code, nombre: c.nombre })), []);

  const data2023 = useMemo(() => {
    if (scope === 'distrito') return brownTotal2023;
    const c = circuitos2023.find(x => x.code === circuitoCode) || circuitos2023[0];
    return { diputadosProvinciales: c.diputadosProvinciales, concejales: c.concejales };
  }, [scope, circuitoCode]);

  const data2025 = useMemo(() => {
    if (scope === 'distrito') return brownTotal2025;
    const c = circuitos2025.find(x => x.code === circuitoCode) || circuitos2025[0];
    return { diputadosProvinciales: c.diputadosProvinciales, concejales: c.concejales };
  }, [scope, circuitoCode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Comparador 2023 vs 2025</h1>
        <div className="inline-flex rounded-md border ml-auto">
          <button className={`px-3 py-1 text-sm ${scope === 'distrito' ? 'bg-primary text-white' : ''}`} onClick={() => setScope('distrito')}>Distrito</button>
          <button className={`px-3 py-1 text-sm ${scope === 'circuito' ? 'bg-primary text-white' : ''}`} onClick={() => setScope('circuito')}>Circuito</button>
        </div>
        {scope === 'circuito' && (
          <select className="px-3 py-2 border rounded text-sm" value={circuitoCode} onChange={(e) => setCircuitoCode(e.target.value)}>
            {listaCircuitos.map(c => (
              <option key={c.code} value={c.code}>Circuito {c.code} · {c.nombre}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle>2023 · Diputados Provinciales</CardTitle></CardHeader>
          <CardContent style={{ height: 260 }}>
            <Chart data={data2023.diputadosProvinciales} />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle>2025 · Diputados Provinciales</CardTitle></CardHeader>
          <CardContent style={{ height: 260 }}>
            <Chart data={data2025.diputadosProvinciales} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle>2023 · Concejales</CardTitle></CardHeader>
          <CardContent style={{ height: 260 }}>
            <Chart data={data2023.concejales} />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle>2025 · Concejales</CardTitle></CardHeader>
          <CardContent style={{ height: 260 }}>
            <Chart data={data2025.concejales} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
