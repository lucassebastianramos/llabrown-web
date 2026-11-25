// @ts-nocheck
import { MapContainer, TileLayer, Marker, GeoJSON, Rectangle, Popup } from 'react-leaflet';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { apiUrl } from '@/lib/api';
import { STATUS_COLORS } from '@/lib/colors';
import { CIRCUITOS_BROWN } from '@/lib/circuitos';
import { useAuth } from '@/hooks/useAuth';

type Mesa = { id: string; nro: string; fiscalId?: string | null };

type Escuela = {
  id: string;
  nombre: string;
  domicilio: string;
  circuito: string;
  seccion: number;
  lat?: number | null;
  lng?: number | null;
  fg_id?: string | null;
  fg_nombre?: string | null;
  fg_apellido?: string | null;
  fg_celular?: string | null;
  incidencias_count?: number;
  mesas?: Mesa[];
};

type Asignacion = { id: string; escuelaId: string; role: string };

type User = {
  id: string;
  nombre: string;
  apellido: string;
  role: string;
  asignaciones?: Asignacion[];
};

const Map = () => {
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [encargados, setEncargados] = useState<User[]>([]);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState({ ok: true, partial_mesas: true, no_fg: true, incident: true });
  const { circuitos: allowed } = useAuth();
  const [coverage, setCoverage] = useState<Array<{ circuito: string; escuelas: number; porcentajeFG: number; mesas: number; porcentajeMesas: number }>>([]);
  const [showHeat, setShowHeat] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [geojson, setGeojson] = useState<any | null>(null);
  const [circuitFilter, setCircuitFilter] = useState('');
  const [heatMode, setHeatMode] = useState<'coverage' | 'electores'>('coverage');

  // Persist/restore UI controls
  useEffect(() => {
    try {
      const raw = localStorage.getItem('map.ui');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.search === 'string') setSearch(parsed.search);
        if (parsed?.visible && typeof parsed.visible === 'object') {
          setVisible((v: any) => ({
            ok: typeof parsed.visible.ok === 'boolean' ? parsed.visible.ok : v.ok,
            partial_mesas: typeof parsed.visible.partial_mesas === 'boolean' ? parsed.visible.partial_mesas : v.partial_mesas,
            no_fg: typeof parsed.visible.no_fg === 'boolean' ? parsed.visible.no_fg : v.no_fg,
            incident: typeof parsed.visible.incident === 'boolean' ? parsed.visible.incident : v.incident,
          }));
        }
        if (typeof parsed?.showHeat === 'boolean') setShowHeat(parsed.showHeat);
        if (typeof parsed?.showBoundaries === 'boolean') setShowBoundaries(parsed.showBoundaries);
        if (typeof parsed?.circuitFilter === 'string') setCircuitFilter(parsed.circuitFilter);
        if (parsed?.heatMode === 'electores' || parsed?.heatMode === 'coverage') setHeatMode(parsed.heatMode);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('map.ui', JSON.stringify({ search, visible, showHeat, showBoundaries, circuitFilter, heatMode }));
    } catch {}
  }, [search, visible, showHeat, showBoundaries, circuitFilter, heatMode]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const [respEsc, respEnc] = await Promise.all([
          fetch(apiUrl('/api/escuelas'), {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }),
          fetch(apiUrl('/api/fiscales?role=encargado_seccion'), {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }),
        ]);
        const dataEsc = await respEsc.json();
        const dataEnc = await respEnc.json().catch(() => []);
        setEscuelas(dataEsc);
        setEncargados(Array.isArray(dataEnc) ? dataEnc : []);
      } catch (e) {
        console.error('Error cargando datos para el mapa', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl('/api/dashboard?by=circuit'), { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const data = await res.json();
        setCoverage(Array.isArray(data) ? data : []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // Load GeoJSON from API, already filtered to Brown
    const token = localStorage.getItem('token');
    fetch(apiUrl('/api/geo/circuitos'), { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then((r) => (r.ok ? r.json() : null))
      .then((gj) => setGeojson(gj))
      .catch(() => setGeojson(null));
  }, []);

  const center: [number, number] = [-34.7972, -58.3916];

  const getStatus = (e: Escuela): 'incident' | 'no_fg' | 'partial_mesas' | 'ok' => {
    const hasIncident = (e.incidencias_count ?? 0) > 0;
    const hasFG = !!e.fg_id;
    const mesas = Array.isArray(e.mesas) ? e.mesas : [];
    const total = mesas.length;
    const cubiertas = mesas.filter((m) => !!m.fiscalId).length;
    const missingMesa = total > 0 && cubiertas < total;

    if (hasIncident) return 'incident';
    if (!hasFG) return 'no_fg';
    if (missingMesa) return 'partial_mesas';
    return 'ok';
  };

  const statusColor = (status: ReturnType<typeof getStatus>) => {
    switch (status) {
      case 'incident':
        return STATUS_COLORS.incident;
      case 'no_fg':
        return STATUS_COLORS.no_fg;
      case 'partial_mesas':
        return STATUS_COLORS.partial_mesas;
      case 'ok':
      default:
        return STATUS_COLORS.ok;
    }
  };

  const encargadosPorEscuela = useMemo(() => {
    const obj: Record<string, User[]> = {};
    for (const u of encargados) {
      const asign = Array.isArray(u.asignaciones) ? u.asignaciones : [];
      for (const a of asign) {
        if (a.role === 'encargado_seccion') {
          if (!obj[a.escuelaId]) obj[a.escuelaId] = [];
          obj[a.escuelaId].push(u);
        }
      }
    }
    return obj;
  }, [encargados]);

  const getIcon = (color: string) =>
    L.divIcon({
      className: 'custom-marker',
      html: `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 1px ${color}"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

  const visibleEscuelas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return escuelas.filter((e) => {
      if (typeof e.lat !== 'number' || typeof e.lng !== 'number') return false;
      if (allowed?.length && !allowed.includes(String(e.circuito))) return false;
      if (circuitFilter && String(e.circuito) !== String(circuitFilter)) return false;
      if (term) {
        const hay = `${e.nombre} ${e.domicilio}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      const st = getStatus(e);
      return visible[st];
    });
  }, [escuelas, search, visible, allowed, circuitFilter]);

  const colorScale = (p: number) => p >= 90 ? '#22c55e' : p >= 70 ? '#eab308' : '#ef4444';

  // Electores heat scale from GeoJSON properties
  const electoresBreaks = useMemo(() => {
    const feats = Array.isArray(geojson?.features) ? geojson.features : [];
    const norm = (s: any) => String(s || '').toUpperCase().replace(/^0+/, '');
    const filtered = feats.filter((f: any) => {
      const code = norm(f?.properties?.code ?? f?.properties?.circuito);
      if (!code) return false;
      if (allowed?.length && !allowed.includes(code)) return false;
      return true;
    });
    const values = filtered.map((f: any) => Number(f?.properties?.electores) || 0).filter((n: number) => Number.isFinite(n));
    if (values.length === 0) return null;
    const sorted = values.slice().sort((a, b) => a - b);
    const q = (p: number) => sorted[Math.max(0, Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p)))] || 0;
    return { q20: q(0.2), q40: q(0.4), q60: q(0.6), q80: q(0.8), min: sorted[0], max: sorted[sorted.length - 1] };
  }, [geojson, allowed]);

  const electoresColor = (v: number) => {
    if (!electoresBreaks) return '#e2e8f0';
    const { q20, q40, q60, q80 } = electoresBreaks;
    if (v <= q20) return '#d1fae5'; // light green
    if (v <= q40) return '#86efac';
    if (v <= q60) return '#22c55e';
    if (v <= q80) return '#16a34a';
    return '#166534'; // dark green
  };

  // Placeholder rectangles per circuito center; in future, replace with real boundaries
  const circuitoCenters: Record<string, [number, number]> = {
    '17': [-34.791, -58.387], '18': [-34.799, -58.375], '18A': [-34.812, -58.374], '19': [-34.787, -58.367],
    '20': [-34.824, -58.383], '20A': [-34.836, -58.373], '21': [-34.836, -58.410], '21A': [-34.858, -58.450],
    '22': [-34.902, -58.359], '22A': [-34.847, -58.353], '22B': [-34.818, -58.331], '22C': [-34.870, -58.340],
  };

  const rectangles = useMemo(() => {
    return coverage
      .filter(c => !allowed?.length || allowed.includes(String(c.circuito)))
      .filter(c => !circuitFilter || String(c.circuito) === String(circuitFilter))
      .map((c) => {
        const center = circuitoCenters[String(c.circuito)];
        if (!center) return null;
        const size = 0.01; // degrees
        const bounds: [[number, number], [number, number]] = [[center[0] - size, center[1] - size], [center[0] + size, center[1] + size]];
        return { circuito: c.circuito, bounds, color: colorScale(c.porcentajeFG), fg: c.porcentajeFG, mesas: c.porcentajeMesas };
      }).filter(Boolean) as any[];
  }, [coverage, allowed, circuitFilter]);

  const styleForCircuit = (code: string) => {
    const row = coverage.find((c) => String(c.circuito) === String(code));
    const p = row ? row.porcentajeFG : 0;
    const col = colorScale(p);
    return { color: col, weight: 1, fillColor: col, fillOpacity: 0.25 } as any;
  };

  const filteredGeojson = useMemo(() => {
    if (!geojson) return null;
    const norm = (s: any) => String(s || '').toUpperCase().replace(/^0+/, '');
    let features = Array.isArray(geojson.features) ? geojson.features : [];
    // Normalize and optionally filter by allowed circuits and circuitFilter
    features = features
      .map((f: any) => {
        const codeRaw = f?.properties?.code ?? f?.properties?.circuito;
        const code = norm(codeRaw);
        return { ...f, properties: { ...f.properties, code } };
      })
      .filter((f: any) => {
      const code = String(f?.properties?.code || '');
      if (!code) return false;
      if (allowed?.length && !allowed.includes(code)) return false;
      if (circuitFilter && code !== String(circuitFilter)) return false;
      return true;
    });
    return { ...geojson, features };
  }, [geojson, allowed, circuitFilter]);

  const circuitoLabel = (code: string | number) => {
    const s = String(code);
    const found = CIRCUITOS_BROWN.find((c) => String(c.code) === s);
    return found ? `${s} ${found.name}` : `#${s}`;
  };

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <div className="absolute top-3 left-3 z-[1000] bg-white/90 rounded-md shadow p-3 text-xs space-y-2 min-w-[220px]">
        <input
          type="text"
          placeholder="Buscar escuela..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1 border rounded"
        />
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={visible.ok} onChange={(e) => setVisible(v => ({ ...v, ok: e.target.checked }))} />
            <span className="inline-flex items-center gap-1"><span style={{ background: STATUS_COLORS.ok }} className="inline-block w-2.5 h-2.5 rounded-full" /> OK</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={visible.partial_mesas} onChange={(e) => setVisible(v => ({ ...v, partial_mesas: e.target.checked }))} />
            <span className="inline-flex items-center gap-1"><span style={{ background: STATUS_COLORS.partial_mesas }} className="inline-block w-2.5 h-2.5 rounded-full" /> Faltan mesas</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={visible.no_fg} onChange={(e) => setVisible(v => ({ ...v, no_fg: e.target.checked }))} />
            <span className="inline-flex items-center gap-1"><span style={{ background: STATUS_COLORS.no_fg }} className="inline-block w-2.5 h-2.5 rounded-full" /> Sin FG</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={visible.incident} onChange={(e) => setVisible(v => ({ ...v, incident: e.target.checked }))} />
            <span className="inline-flex items-center gap-1"><span style={{ background: STATUS_COLORS.incident }} className="inline-block w-2.5 h-2.5 rounded-full" /> Incidencias</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
            <span>Mostrar cobertura por circuito</span>
          </label>
          <div className="flex items-center gap-2">
            <span>Heat:</span>
            <select className="px-2 py-1 border rounded text-xs" value={heatMode} onChange={(e) => setHeatMode(e.target.value as any)}>
              <option value="coverage">Cobertura (FG)</option>
              <option value="electores">Electores (GeoJSON)</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={showBoundaries} onChange={(e) => setShowBoundaries(e.target.checked)} />
            <span>Mostrar límites de circuito</span>
          </label>
          <div>
            <select className="w-full px-2 py-1 border rounded text-xs" value={circuitFilter} onChange={(e) => setCircuitFilter(e.target.value)}>
              <option value="">Todos los circuitos</option>
              {CIRCUITOS_BROWN.map(c => (
                <option key={c.code} value={c.code}>{c.code} {c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground">Mostrando {visibleEscuelas.length}</div>
      </div>

      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showBoundaries && filteredGeojson ? (
          <GeoJSON
            key={`circuitos-bounds-${circuitFilter || 'all'}-${heatMode}`}
            data={filteredGeojson}
            style={(feature: any) => {
              if (showHeat) {
                if (heatMode === 'coverage') {
                  const code = String(feature?.properties?.code || '');
                  const known = CIRCUITOS_BROWN.some(x => String(x.code) === code);
                  if (known) return styleForCircuit(code);
                } else if (heatMode === 'electores') {
                  const v = Number(feature?.properties?.electores) || 0;
                  const col = electoresColor(v);
                  return { color: col, weight: 1, fillColor: col, fillOpacity: 0.25 } as any;
                }
              }
              return { color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.08 } as any;
            }}
            onEachFeature={(feature: any, layer: any) => {
              const code = feature?.properties?.code;
              const row = coverage.find((c) => String(c.circuito) === String(code));
              const fg = row?.porcentajeFG ?? 0;
              const mesas = row?.porcentajeMesas ?? 0;
              const elect = Number(feature?.properties?.electores) || 0;
              const tip = heatMode === 'electores'
                ? `Circuito ${circuitoLabel(code)}: Electores ${elect.toLocaleString('es-AR')}`
                : `Circuito ${circuitoLabel(code)}: FG ${fg}% · Mesas ${mesas}%`;
              layer.bindTooltip(tip, { sticky: true });
              layer.on('mouseover', () => {
                if (showHeat) {
                  if (heatMode === 'coverage' && row) {
                    const col = colorScale(row.porcentajeFG);
                    layer.setStyle({ weight: 2, fillOpacity: 0.35, color: col, fillColor: col });
                  } else if (heatMode === 'electores') {
                    const v = Number(feature?.properties?.electores) || 0;
                    const col = electoresColor(v);
                    layer.setStyle({ weight: 2, fillOpacity: 0.35, color: col, fillColor: col });
                  } else {
                    layer.setStyle({ weight: 2, fillOpacity: 0.12 });
                  }
                }
              });
              layer.on('mouseout', () => {
                if (showHeat) {
                  if (heatMode === 'coverage' && CIRCUITOS_BROWN.some(x => String(x.code) === String(code))) {
                    const st = styleForCircuit(String(code));
                    layer.setStyle(st);
                  } else if (heatMode === 'electores') {
                    const v = Number(feature?.properties?.electores) || 0;
                    const col = electoresColor(v);
                    layer.setStyle({ color: col, weight: 1, fillColor: col, fillOpacity: 0.25 });
                  } else {
                    layer.setStyle({ color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.08 } as any);
                  }
                } else {
                  layer.setStyle({ color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.08 } as any);
                }
              });
            }}
          />
        ) : null}
        {showHeat && !geojson && rectangles.length > 0 ? (
          rectangles.map((r) => (
            <Rectangle key={r.circuito} bounds={r.bounds} pathOptions={{ color: r.color, weight: 1, fillColor: r.color, fillOpacity: 0.25 }} />
          ))
        ) : null}
        {visibleEscuelas.map((e) => {
          const status = getStatus(e);
          const color = statusColor(status);
          const mesas = Array.isArray(e.mesas) ? e.mesas : [];
          const total = mesas.length;
          const cubiertas = mesas.filter((m) => !!m.fiscalId).length;
          const gmaps = `https://www.google.com/maps?q=${e.lat},${e.lng}`;
          return (
            <Marker
              key={e.id}
              position={[e.lat as number, e.lng as number]}
              icon={getIcon(color)}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[220px]">
                  <div className="font-medium text-sm">{e.nombre}</div>
                  <div className="text-muted-foreground">{e.domicilio}</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span>Circuito {e.circuito} · Sección {e.seccion}</span>
                  </div>
                  {e.fg_id ? (
                    <div>FG: {e.fg_nombre} {e.fg_apellido}</div>
                  ) : (
                    <div className="text-muted-foreground">Sin fiscal general</div>
                  )}
                  {total > 0 && (
                    <div>Mesas: {cubiertas}/{total}</div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <a
                      className="text-primary hover:underline"
                      href={`/escuelas/${e.id}`}
                      onClick={(ev) => { ev.preventDefault(); navigate(`/escuelas/${e.id}`); }}
                    >
                      Ver perfil
                    </a>
                    <a className="text-muted-foreground hover:underline" href={gmaps} target="_blank" rel="noreferrer">Maps</a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div
        style={{ position: 'absolute', bottom: 12, left: 12 }}
        className="bg-white/90 rounded-md shadow p-2 text-xs space-y-1"
      >
        <div className="font-medium">Leyenda</div>
        <div className="flex items-center gap-2"><span style={{ background: STATUS_COLORS.ok }} className="inline-block w-3 h-3 rounded-full" /> OK (FG y mesas cubiertas)</div>
        <div className="flex items-center gap-2"><span style={{ background: STATUS_COLORS.partial_mesas }} className="inline-block w-3 h-3 rounded-full" /> FG asignado, faltan mesas</div>
        <div className="flex items-center gap-2"><span style={{ background: STATUS_COLORS.no_fg }} className="inline-block w-3 h-3 rounded-full" /> Sin fiscal general</div>
        <div className="flex items-center gap-2"><span style={{ background: STATUS_COLORS.incident }} className="inline-block w-3 h-3 rounded-full" /> Con incidencias</div>
        <div className="mt-2 font-medium">Cobertura por circuito</div>
        <div className="space-y-0.5 max-h-40 overflow-auto pr-2">
          {coverage
            .filter(c => !allowed?.length || allowed.includes(String(c.circuito)))
            .filter(c => !circuitFilter || String(c.circuito) === String(circuitFilter))
            .map((c) => (
            <div key={c.circuito} className="flex items-center justify-between gap-2">
              <span>{circuitoLabel(c.circuito)}</span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: colorScale(c.porcentajeFG) }} />
                <span>FG {c.porcentajeFG}%</span>
                <span className="text-muted-foreground">Mesas {c.porcentajeMesas}%</span>
              </span>
            </div>
          ))}
        </div>
        {heatMode === 'electores' && electoresBreaks ? (
          <div className="mt-2">
            <div className="font-medium">Electores (quintiles)</div>
            <div className="flex items-center gap-1 mt-1">
              {[
                electoresBreaks.min,
                electoresBreaks.q20,
                electoresBreaks.q40,
                electoresBreaks.q60,
                electoresBreaks.q80,
                electoresBreaks.max,
              ].map((v, i, arr) => (
                i < arr.length - 1 ? (
                  <div key={i} className="flex items-center">
                    <span className="inline-block w-4 h-3" style={{ background: electoresColor((v + arr[i+1]) / 2) }} />
                  </div>
                ) : null
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Map;