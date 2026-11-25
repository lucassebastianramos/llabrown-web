import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, MapPin, User, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { apiUrl } from "@/lib/api";

interface Escuela {
  id: string;
  nombre: string;
  domicilio: string;
  circuito: string;
  seccion: number;
  lat?: number | null;
  lng?: number | null;
  fg_id?: string | null;
  fg_nombre?: string;
  fg_apellido?: string;
  fg_celular?: string;
  incidencias_count?: number;
  mesas?: { id: string; nro: string; fiscalId?: string | null }[];
}

export default function Escuelas() {
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeccion, setFilterSeccion] = useState<string>("");
  const [filterMesasSinFiscal, setFilterMesasSinFiscal] = useState<boolean>(false);
  const [filterSinGeo, setFilterSinGeo] = useState<boolean>(false);
  const [filterSinFG, setFilterSinFG] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState(false);
  const [mesasOpen, setMesasOpen] = useState(false);
  const [selectedEscuela, setSelectedEscuela] = useState<Escuela | null>(null);

  // Form state for editing
  const [formNombre, setFormNombre] = useState("");
  const [formDomicilio, setFormDomicilio] = useState("");
  const [formCircuito, setFormCircuito] = useState("");
  const [formSeccion, setFormSeccion] = useState<string>("");
  const [formFgId, setFormFgId] = useState<string>("");
  const [formLat, setFormLat] = useState<string>("");
  const [formLng, setFormLng] = useState<string>("");

  // Fiscales cache for selects/dialogs
  const [fiscales, setFiscales] = useState<any[]>([]);

  useEffect(() => {
    fetchEscuelas();
    fetchFiscales();
  }, []);

  const fetchEscuelas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/escuelas'), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      const data = await response.json();
      setEscuelas(data);
      return data as Escuela[];
    } catch (error) {
      console.error("Error fetching escuelas:", error);
      toast.error("Error al cargar las escuelas");
    } finally {
      setLoading(false);
    }
  };

  const fetchFiscales = async () => {
    try {
      const resp = await fetch(apiUrl('/api/fiscales'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!resp.ok) throw new Error('Error al cargar fiscales');
      const data = await resp.json();
      setFiscales(data);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteEscuela = async (id: string) => {
    if (!window.confirm('¿Eliminar esta escuela? Esta acción no se puede deshacer.')) return;
    try {
      const resp = await fetch(apiUrl(`/api/escuelas/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resp.status === 204 || resp.ok) {
        toast.success('Escuela eliminada');
        await fetchEscuelas();
      } else {
        const data = await resp.json().catch(() => ({} as any));
        throw new Error(data?.error || 'No se pudo eliminar la escuela');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al eliminar la escuela');
    }
  };

  const getSchoolStatus = (escuela: Escuela) => {
    if (escuela.incidencias_count && escuela.incidencias_count > 0) {
      return "incident";
    }
    if (escuela.fg_id) {
      return "assigned";
    }
    return "vacant";
  };

  const fiscalesGeneral = useMemo(
    () => fiscales.filter((f) => f.role === 'fiscal_general'),
    [fiscales]
  );

  const fiscalesMesaDeEscuela = useMemo(
    () => (selectedEscuela ? fiscales.filter((f: any) => {
      const asign = Array.isArray((f as any).asignaciones) ? (f as any).asignaciones : [];
      const hasMesaRole = f.role === 'fiscal_mesa' || asign.some((a: any) => a.role === 'fiscal_mesa');
      const belongsToEscuela = asign.some((a: any) => a.role === 'fiscal_mesa' && a.escuelaId === selectedEscuela.id) || f.escuelaId === selectedEscuela.id;
      return hasMesaRole && belongsToEscuela;
    }) : []),
    [fiscales, selectedEscuela]
  );

  const openEdit = (e: Escuela) => {
    setSelectedEscuela(e);
    setFormNombre(e.nombre);
    setFormDomicilio(e.domicilio);
    setFormCircuito(e.circuito);
    setFormSeccion(String(e.seccion));
    setFormFgId(e.fg_id ?? "");
    setFormLat(e.lat !== undefined && e.lat !== null ? String(e.lat) : "");
    setFormLng(e.lng !== undefined && e.lng !== null ? String(e.lng) : "");
    setEditOpen(true);
  };

  const openMesas = (e: Escuela) => {
    setSelectedEscuela(e);
    setMesasOpen(true);
  };

  const saveEscuela = async () => {
    if (!selectedEscuela) return;
    try {
      const latNum = formLat.trim() === "" ? null : (isNaN(parseFloat(formLat)) ? null : parseFloat(formLat));
      const lngNum = formLng.trim() === "" ? null : (isNaN(parseFloat(formLng)) ? null : parseFloat(formLng));
      const body = {
        nombre: formNombre.trim(),
        domicilio: formDomicilio.trim(),
        circuito: formCircuito.trim(),
        seccion: Number(formSeccion),
        fgId: formFgId || null,
        lat: latNum,
        lng: lngNum,
      };
      const resp = await fetch(apiUrl(`/api/escuelas/${selectedEscuela.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error('No se pudo guardar');
      toast.success('Escuela actualizada');
      setEditOpen(false);
      setSelectedEscuela(null);
      await fetchEscuelas();
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar la escuela');
    }
  };

  const filteredEscuelas = escuelas.filter(escuela => {
    const matchesSearch = escuela.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         escuela.domicilio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeccion = filterSeccion === "" || escuela.seccion.toString() === filterSeccion;
    const matchesMesas = !filterMesasSinFiscal || (
      Array.isArray(escuela.mesas) && escuela.mesas.length > 0 && escuela.mesas.some((m) => !m.fiscalId)
    );
    const hasGeo = typeof escuela.lat === 'number' && typeof escuela.lng === 'number';
    const matchesGeo = !filterSinGeo || !hasGeo; // if filtering, keep only without geo
    const matchesSinFG = !filterSinFG || !escuela.fg_id;
    return matchesSearch && matchesSeccion && matchesMesas && matchesGeo && matchesSinFG;
  });

  const secciones = [...new Set(escuelas.map(e => e.seccion))].sort();

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Escuelas</h1>
            <p className="text-muted-foreground">
              Administra los establecimientos electorales y sus fiscales generales
            </p>
            <div className="mt-2 text-sm text-muted-foreground">
              {(() => {
                const total = escuelas.length;
                const withCoords = escuelas.filter(e => typeof e.lat === 'number' && typeof e.lng === 'number').length;
                return (
                  <span>
                    Con coordenadas: <span className="font-medium text-foreground">{withCoords}</span> / {total}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterSeccion}
                onChange={(e) => setFilterSeccion(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">Todas las secciones</option>
                {secciones.map(seccion => (
                  <option key={seccion} value={seccion}>Sección {seccion}</option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-input rounded-md bg-background text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="accent-foreground"
                  checked={filterMesasSinFiscal}
                  onChange={(e) => setFilterMesasSinFiscal(e.target.checked)}
                />
                Faltante fiscal de mesa
              </label>
              <label className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-input rounded-md bg-background text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="accent-foreground"
                  checked={filterSinFG}
                  onChange={(e) => setFilterSinFG(e.target.checked)}
                />
                Sin fiscal general
              </label>
              <label className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-input rounded-md bg-background text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="accent-foreground"
                  checked={filterSinGeo}
                  onChange={(e) => setFilterSinGeo(e.target.checked)}
                />
                Solo sin geolocalizar
              </label>
              <div className="text-sm text-muted-foreground">
                Resultados: <span className="font-medium text-foreground">{filteredEscuelas.length}</span>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Escuela
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      toast.info('Geocodificando escuelas faltantes...');
                      const resp = await fetch(apiUrl('/api/escuelas/geocode-missing'), {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                      });
                      const data = await resp.json();
                      console.log('Geocode result', data);
                      if (!resp.ok) throw new Error(data?.error || 'Error en geocodificación');
                      toast.success(`Geocodificadas: ${data.updated} / ${data.total}`);
                      await fetchEscuelas();
                    } catch (e) {
                      console.error(e);
                      toast.error('No se pudo geocodificar');
                    }
                  }}
                >
                  Geocodificar faltantes
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Escuelas */}
          <div className="grid gap-4">
            {filteredEscuelas.map((escuela) => (
              <Card key={escuela.id} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        <Link to={`/escuelas/${escuela.id}`} className="hover:underline">
                          {escuela.nombre}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {escuela.domicilio}
                      </div>
                    </div>
                    <StatusBadge status={getSchoolStatus(escuela)} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Circuito {escuela.circuito}</Badge>
                        <Badge variant="outline">Sección {escuela.seccion}</Badge>
                        {typeof escuela.lat === 'number' && typeof escuela.lng === 'number' ? (
                          <Badge variant="default">Con mapa</Badge>
                        ) : (
                          <Badge variant="secondary">Sin mapa</Badge>
                        )}
                      </div>
                      {Array.isArray(escuela.mesas) && escuela.mesas.length > 0 && (
                        <div className="text-sm">
                          {(() => {
                            const total = escuela.mesas!.length;
                            const cubiertas = escuela.mesas!.filter((m) => !!m.fiscalId).length;
                            const fully = cubiertas === total;
                            return (
                              <Badge variant={fully ? 'default' : 'secondary'}>
                                Mesas: {cubiertas}/{total}
                              </Badge>
                            );
                          })()}
                        </div>
                      )}
                      {escuela.incidencias_count && escuela.incidencias_count > 0 && (
                        <div className="text-sm text-incident">
                          {escuela.incidencias_count} incidencia(s) activa(s)
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Fiscal General:</span>
                      </div>
                      {escuela.fg_id ? (
                        <div className="text-sm">
                          <div>{escuela.fg_nombre} {escuela.fg_apellido}</div>
                          {escuela.fg_celular && (
                            <div className="text-muted-foreground">{escuela.fg_celular}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Sin asignar</div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Link to={`/escuelas/${escuela.id}`} className="inline-flex">
                        <Button variant="default" size="sm">Ver perfil</Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => openEdit(escuela)}>
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openMesas(escuela)}>
                        Ver Mesas
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteEscuela(escuela.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEscuelas.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron escuelas</h3>
                <p className="text-muted-foreground text-center">
                  No hay escuelas que coincidan con los filtros actuales.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialogos: Editar Escuela */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Escuela</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Nombre</label>
              <Input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Domicilio</label>
              <Input value={formDomicilio} onChange={(e) => setFormDomicilio(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Circuito</label>
              <Input value={formCircuito} onChange={(e) => setFormCircuito(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Sección</label>
              <Input value={formSeccion} onChange={(e) => setFormSeccion(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Latitud (manual)</label>
              <Input type="number" step="any" value={formLat} onChange={(e) => setFormLat(e.target.value)} placeholder="Ej: -34.7976" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Longitud (manual)</label>
              <Input type="number" step="any" value={formLng} onChange={(e) => setFormLng(e.target.value)} placeholder="Ej: -58.3902" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Fiscal General</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                value={formFgId}
                onChange={(e) => setFormFgId(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {fiscalesGeneral.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre} {f.apellido} ({f.dni || 's/dni'})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEscuela}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogos: Ver Mesas */}
      <Dialog open={mesasOpen} onOpenChange={setMesasOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fiscales de Mesa {selectedEscuela ? `- ${selectedEscuela.nombre}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            {selectedEscuela && Array.isArray(selectedEscuela.mesas) && selectedEscuela.mesas.length > 0 ? (
              <>
                {(() => {
                  const mesas = selectedEscuela.mesas!;
                  const total = mesas.length;
                  const sinFiscal = mesas.filter(m => !m.fiscalId);
                  const cubiertas = total - sinFiscal.length;
                  return (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={cubiertas === total ? 'default' : 'secondary'}>Mesas: {cubiertas}/{total}</Badge>
                      {sinFiscal.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground mr-2">Sin fiscal:</span>
                          {sinFiscal.map(m => (
                            <Badge key={m.id} variant="outline" className="mr-1">Mesa {m.nro}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="text-sm font-medium mt-2">Mesas y asignación</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedEscuela.mesas.map((m) => (
                    <div key={m.id} className="border rounded p-2 text-sm flex items-center justify-between gap-2">
                      <div className="font-medium">Mesa {m.nro}</div>
                      <div className="flex items-center gap-2">
                        <select
                          className="px-2 py-1 border rounded"
                          defaultValue={m.fiscalId || ''}
                          onChange={async (e) => {
                            const fiscalId = e.target.value || null;
                            try {
                              const resp = await fetch(apiUrl(`/api/mesas/${m.id}/fiscal`), {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({ fiscalId }),
                              });
                              const payload = await resp.json().catch(() => null);
                              if (!resp.ok) throw new Error(payload?.error || 'No se pudo asignar el fiscal');
                              toast.success('Fiscal asignado a la mesa');
                            } catch (err) {
                              console.error(err);
                              toast.error((err as any)?.message || 'Error al asignar fiscal');
                            } finally {
                              await fetchFiscales();
                              const updated = await fetchEscuelas();
                              if (updated && selectedEscuela) {
                                const refreshed = updated.find((e: Escuela) => e.id === selectedEscuela.id);
                                if (refreshed) setSelectedEscuela(refreshed);
                              }
                            }
                          }}
                        >
                          <option value="">— Sin asignar —</option>
                          {fiscalesMesaDeEscuela.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.nombre} {f.apellido} ({f.mesaNro || 's/mesa'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No hay mesas cargadas para esta escuela.
              </div>
            )}

            {/* Lista de fiscales de mesa visibles (si existen) */}
            {fiscalesMesaDeEscuela.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Fiscales de mesa</div>
                {fiscalesMesaDeEscuela.map((f) => (
                  <div key={f.id} className="border rounded-md p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{f.nombre} {f.apellido}</div>
                      <div className="text-sm text-muted-foreground">DNI: {f.dni || '—'} · Cel: {f.celular || '—'}</div>
                    </div>
                    <Badge variant="outline">Mesa {f.mesaNro || '—'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setMesasOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}