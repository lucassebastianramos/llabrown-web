/**
 * Servicio para integración y búsqueda automática en el Digesto Oficial
 * del Honorable Concejo Deliberante (HCD) de Almirante Brown.
 * Portal oficial: https://a.brown.gob.ar/hcd/digesto
 */

export function extractNumeroOrdenanza(expediente?: string): number | null {
  if (!expediente) return null;
  // Match standard numbers in strings like "HCD-EXP-0142/2025", "Ordenanza 12540", "142/25"
  const matches = expediente.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  
  // First number sequence is the ordinance / expediente number
  const num = parseInt(matches[0], 10);
  return isNaN(num) || num <= 0 ? null : num;
}

export function getDigestoSearchUrl(expediente?: string, titulo?: string): string {
  const num = extractNumeroOrdenanza(expediente);
  if (num) {
    // Direct search by ordinance / expediente number in HCD portal
    return `https://a.brown.gob.ar/hcd/digesto/buscarpornumero?form%5Bnumero%5D=${num}`;
  }

  if (expediente && expediente.trim().length > 0) {
    // Direct search by keyword in HCD portal
    return `https://a.brown.gob.ar/hcd/digesto/buscarporpalabra?form%5Bq%5D=${encodeURIComponent(expediente.trim())}`;
  }

  if (titulo && titulo.trim().length > 0) {
    // Clean first 4 words of title for broad keyword search
    const cleanWords = titulo
      .replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 3)
      .join(' ');
    if (cleanWords) {
      return `https://a.brown.gob.ar/hcd/digesto/buscarporpalabra?form%5Bq%5D=${encodeURIComponent(cleanWords)}`;
    }
  }

  return 'https://a.brown.gob.ar/hcd/digesto';
}
