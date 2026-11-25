export type Circuito = { code: string; name: string };

export const CIRCUITOS_BROWN: Circuito[] = [
  { code: '17', name: 'Adrogué' },
  { code: '18', name: 'José Mármol' },
  { code: '18A', name: 'San José' },
  { code: '19', name: 'Rafael Calzada' },
  { code: '20', name: 'Burzaco' },
  { code: '20A', name: 'Malvinas Argentinas' },
  { code: '21', name: 'Longchamps' },
  { code: '21A', name: 'Ministro Rivadavia' },
  { code: '22', name: 'Glew' },
  { code: '22A', name: 'Claypole' },
  { code: '22B', name: 'San Francisco Solano' },
  { code: '22C', name: 'San Francisco de Asís (Barrio Don Orione)' },
];

export const circuitoLabel = (code: string) => {
  const found = CIRCUITOS_BROWN.find((c) => c.code.toLowerCase() === String(code).trim().toLowerCase());
  return found ? `${found.code} ${found.name}` : code;
};
