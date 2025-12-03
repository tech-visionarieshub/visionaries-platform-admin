/**
 * Normaliza el nombre de empresa removiendo emojis y caracteres especiales
 * Reutilizable para clientes, egresos y proyectos
 */
export function normalizeEmpresa(empresa: string): string {
  if (!empresa || empresa.trim() === '') return '';
  
  // Remover emojis y caracteres especiales Unicode
  const sinEmojis = empresa.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  
  // Remover espacios múltiples
  return sinEmojis.replace(/\s+/g, ' ').trim();
}

/**
 * Normaliza empresa para matching (case-insensitive, sin espacios extras)
 * Útil para comparar empresas en búsquedas
 */
export function normalizeEmpresaForMatching(empresa: string): string {
  return normalizeEmpresa(empresa).toLowerCase();
}


