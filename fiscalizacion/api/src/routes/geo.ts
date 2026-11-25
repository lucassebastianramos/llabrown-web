import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Helper to find the first existing path from candidates
const firstExisting = (paths: string[]) => paths.find((p) => fs.existsSync(p));

// Serve circuit boundaries filtered to Almirante Brown
router.get('/geo/circuitos', async (_req, res) => {
  try {
    // Prefer a precise, curated GeoJSON if present
    const tryPrecise = [
      // When running from api/ as CWD
      path.resolve(process.cwd(), 'data', 'circuitos_brown_precisos.clean.geojson'),
      path.resolve(process.cwd(), 'data', 'circuitos_brown_precisos.geojson'),
      // Legacy paths
      path.resolve(process.cwd(), 'api', 'data', 'circuitos_brown_precisos.clean.geojson'),
      path.resolve(process.cwd(), 'api', 'data', 'circuitos_brown_precisos.geojson'),
      // Parent workspace (running in api/, files in repo root)
      path.resolve(process.cwd(), '..', 'api', 'data', 'circuitos_brown_precisos.clean.geojson'),
      path.resolve(process.cwd(), '..', 'api', 'data', 'circuitos_brown_precisos.geojson'),
      path.resolve(process.cwd(), '..', 'data', 'circuitos_brown_precisos.clean.geojson'),
      path.resolve(process.cwd(), '..', 'data', 'circuitos_brown_precisos.geojson'),
    ];

    const precisePath = firstExisting(tryPrecise);

    if (precisePath) {
      const rawPrecise = fs.readFileSync(precisePath, 'utf-8');
      let parsed: any | null = null;
      // 1) Try plain JSON
      try { parsed = JSON.parse(rawPrecise); } catch {}

      // 2) Try to extract from Leaflet/Folium embed
      if (!parsed) {
        const m = rawPrecise.match(/geo_json_div_[^\s]*?_add\(\s*(\{[\s\S]*?\})\s*\)\s*;?/);
        if (m && m[1]) {
          try { parsed = JSON.parse(m[1]); } catch {}
        }
      }

      // 3) Try to slice first FeatureCollection block
      if (!parsed) {
        const fcIdx = rawPrecise.indexOf('"FeatureCollection"');
        if (fcIdx >= 0) {
          const start = rawPrecise.lastIndexOf('{', fcIdx);
          if (start >= 0) {
            let depth = 0, inStr = false, esc = false, end = -1;
            for (let i = start; i < rawPrecise.length; i++) {
              const ch = rawPrecise[i];
              if (inStr) {
                if (esc) { esc = false; }
                else if (ch === '\\') { esc = true; }
                else if (ch === '"') { inStr = false; }
              } else {
                if (ch === '"') inStr = true;
                else if (ch === '{') depth++;
                else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
              }
            }
            if (end > start) {
              const slice = rawPrecise.slice(start, end + 1);
              try { parsed = JSON.parse(slice); } catch {}
            }
          }
        }
      }

      const feats = Array.isArray(parsed?.features) ? parsed.features : [];
      if (feats.length > 0) {
        return res.json(parsed);
      }
    }

    // Fallback: provincial GeoJSON filtered to Brown
    const tryProvincial = [
      path.resolve(process.cwd(), '..', 'circuitos-electorales-pba', 'circuito-electorales-pba.geojson'),
      path.resolve(process.cwd(), 'circuitos-electorales-pba', 'circuito-electorales-pba.geojson'),
      path.resolve(process.cwd(), '..', '..', 'circuitos-electorales-pba', 'circuito-electorales-pba.geojson'),
    ];
    const provincialPath = firstExisting(tryProvincial);
    if (!provincialPath) {
      return res.status(404).json({ error: 'GeoJSON no encontrado' });
    }
    const raw = fs.readFileSync(provincialPath, 'utf-8');
    const gj = JSON.parse(raw);
    const features = Array.isArray(gj?.features) ? gj.features : [];
    const filtered = features.filter((f: any) => {
      const props = f?.properties || {};
      const dep = String(props.departamen || props.departamento || '').toLowerCase();
      const cab = String(props.cabecera || '').toLowerCase();
      const partido = String(props.partido || '').toLowerCase();
      return dep.includes('brown') || dep.includes('almirante') || cab.includes('brown') || partido.includes('brown');
    });
    const out = { type: 'FeatureCollection', name: 'circuitos-brown', features: filtered };
    res.json(out);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Error cargando GeoJSON' });
  }
});

export default router;
