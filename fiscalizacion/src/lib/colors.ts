// Centralized color palettes

// Party colors
export const PARTY_COLORS: Record<string, string> = {
  'FP': '#00B5E2', // Celeste (FP, ex UxP)
  'U x P': '#00B5E2', // Celeste (UxP)
  'J x C': '#FACC15', // Amarillo (JxC)
  'FIT': '#EF4444',   // Rojo (FIT)
  'LLA': '#8B5CF6',   // Violeta (LLA)
  'Blanco': '#94A3B8',
  'Otros': '#0EA5E9',
};

// Map/status colors
export const STATUS_COLORS = {
  ok: '#16a34a',           // verde
  partial_mesas: '#f59e0b',// ambar
  no_fg: '#dc2626',        // rojo
  incident: '#a21caf',     // violeta
} as const;

export type StatusKey = keyof typeof STATUS_COLORS;
