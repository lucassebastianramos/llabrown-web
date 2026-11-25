import fetch from 'node-fetch';

export type GeocodeResult = { lat: number; lng: number } | null;

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function normalizeDomicilio(raw: string): { streetLine: string | null } {
  let s = (raw || '').trim();
  if (!s) return { streetLine: null };
  // Uppercase to normalize common abbreviations
  s = s.toUpperCase();
  // Remove section/circuit codes like ", 19" or ", 0021A"
  s = s.replace(/,\s*(\d{1,3}|00\d{2}[A-Z]?)(A)?\b/g, '');
  // Replace Spanish abbreviations
  const repl: Array<[RegExp, string]> = [
    [/\bAV\.?\b/g, 'AVENIDA'],
    [/\bAVDA\.?\b/g, 'AVENIDA'],
    [/\bPDTE\.?\b/g, 'PRESIDENTE'],
    [/\bPTE\.?\b/g, 'PRESIDENTE'],
    [/\bGRAL\.?\b/g, 'GENERAL'],
    [/\bALM?TE\.?\b/g, 'ALMIRANTE'],
    [/\bCNEL\.?\b/g, 'CORONEL'],
    [/\bDR\.?\b/g, 'DOCTOR'],
    [/\bSGTO\.?\b/g, 'SARGENTO'],
    [/\bCMDTE\.?\b/g, 'COMANDANTE'],
    [/\bPCIA\.?\b/g, 'PROVINCIA'],
    [/\bN°\b/g, ''],
    [/\bS\/N\b/g, ''],
  ];
  for (const [re, to] of repl) s = s.replace(re, to);
  // Cut anything after " E/" or " E /" or " Y " (entre calles)
  const parts = s.split(/\sE\s*\/|\sY\s/);
  s = (parts[0] ?? s);
  // Collapse multiple spaces and punctuation artifacts
  s = s.replace(/[.,]+/g, ' ').replace(/\s+/g, ' ').trim();
  // Try to capture "STREET NUMBER" if present; otherwise just street name
  const m = s.match(/^(.+?)\s(\d{1,6})\b/);
  if (m) {
    return { streetLine: `${m[1]} ${m[2]}`.trim() };
  }
  // No number, use the street only
  return { streetLine: s || null };
}

async function geocodeOnce(q: string): Promise<GeocodeResult> {
  if (!q.trim()) return null;
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'ar');
  url.searchParams.set('addressdetails', '0');
  try {
    const resp = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'es-AR,es;q=0.9',
        'User-Agent': 'fiscaliza-brown/1.0 (contact: brown@local)'
      }
    });
    if (!resp.ok) return null;
    const raw = (await resp.json()) as any[];
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const item: any = raw[0];
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  } catch (e) {
    console.error('Geocode error', e);
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  return geocodeOnce(address);
}

export async function geocodeAddressVariants(opts: { domicilio?: string | null; nombre?: string | null }): Promise<GeocodeResult> {
  const domRaw = (opts.domicilio || '').trim();
  const nom = (opts.nombre || '').trim();
  const { streetLine } = normalizeDomicilio(domRaw);
  const localities = [
    'Adrogué',
    'Burzaco',
    'Glew',
    'Longchamps',
    'Malvinas Argentinas',
    'Claypole',
    'San José',
    'Rafael Calzada',
    'Ministro Rivadavia',
    'José Mármol',
  ];

  // First try structured query (street/county/state/country) if we have a street line
  if (streetLine) {
    // Try without city first
    const tryStructured = async (city?: string) => {
      const sUrl = new URL(NOMINATIM_URL);
      sUrl.searchParams.set('street', streetLine!);
      if (city) sUrl.searchParams.set('city', city);
      sUrl.searchParams.set('county', 'Almirante Brown');
      sUrl.searchParams.set('state', 'Buenos Aires');
      sUrl.searchParams.set('country', 'Argentina');
      sUrl.searchParams.set('format', 'json');
      sUrl.searchParams.set('limit', '1');
      try {
        const resp = await fetch(sUrl.toString(), {
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'es-AR,es;q=0.9',
            'User-Agent': 'fiscaliza-brown/1.0 (contact: brown@local)'
          }
        });
        if (resp.ok) {
          const arr = (await resp.json()) as any[];
          if (Array.isArray(arr) && arr.length) {
            const lat = parseFloat(arr[0].lat);
            const lng = parseFloat(arr[0].lon);
            if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
          }
        }
      } catch { /* ignore structured failure */ }
      return null;
    };

    const s0 = await tryStructured();
    if (s0) return s0;
    for (const city of localities) {
      const res = await tryStructured(city);
      if (res) return res;
      await new Promise(r => setTimeout(r, 250));
    }
  }

  // Fallbacks with free text
  const bases: string[] = [];
  if (streetLine) {
    bases.push(`${streetLine}, Almirante Brown, Buenos Aires, Argentina`);
    for (const city of localities) {
      bases.push(`${streetLine}, ${city}, Almirante Brown, Buenos Aires, Argentina`);
    }
    bases.push(`${streetLine}, Provincia de Buenos Aires, Argentina`);
  } else if (domRaw) {
    bases.push(`${domRaw}, Almirante Brown, Buenos Aires, Argentina`);
  }
  if (nom) {
    bases.push(`${nom}, Almirante Brown, Buenos Aires, Argentina`);
    bases.push(`Escuela ${nom}, Almirante Brown, Buenos Aires, Argentina`);
  }
  for (const q of bases) {
    const res = await geocodeOnce(q);
    if (res) return res;
    await new Promise(r => setTimeout(r, 300));
  }
  return null;
}
