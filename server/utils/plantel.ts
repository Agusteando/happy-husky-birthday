/**
 * Capa de normalización robusta para las sedes (planteles).
 * Vincula los nombres exactos de la interfaz de usuario con los valores ERP crudos.
 */
export const plantelUItoAPI: Record<string, string[]> = {
  'Primaria Metepec': ['primaria metepec', 'pri metepec'],
  'Primaria Toluca': ['primaria toluca', 'pri toluca'],
  'Secundaria Metepec': ['secundaria metepec', 'sec metepec'],
  'Secundaria Toluca': ['secundaria toluca', 'sec toluca'],
  'Casita Metepec': ['casita metepec', 'cas metepec'],
  'Casita Toluca': ['casita toluca', 'cas toluca'],
  'Desarrollo Metepec': ['desarrollo metepec', 'des metepec'],
  'Preescolar Toluca': ['preescolar toluca', 'pre toluca'],
  'Preescolar Metepec': ['preescolar metepec', 'pre metepec'],
  'Externo': ['externo']
};

export function normalizeAndMatchPlantel(apiValue: string, filterLabel: string): boolean {
  if (!apiValue || !filterLabel) return false;
  
  const apiNorm = apiValue.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  if (filterLabel === 'Externo') return apiNorm.includes('externo');

  const mapping = plantelUItoAPI[filterLabel] || [];
  for (const phrase of mapping) {
    if (apiNorm.includes(phrase)) return true;
  }
  
  // Respaldo final: Verificación de coincidencia exacta
  return apiValue === filterLabel;
}