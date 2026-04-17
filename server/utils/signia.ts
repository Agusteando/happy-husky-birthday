export const fetchSigniaEmployees = async () => {
  const data: any = await $fetch('https://signia.casitaapps.com/api/export/employees?isActive=true').catch(() => [])
  return data
}

export const extractBirthdayFromCurp = (curp?: string): string | null => {
  if (!curp || curp.length < 18) return null
  const yy = parseInt(curp.substring(4, 6))
  const mm = curp.substring(6, 8)
  const dd = curp.substring(8, 10)
  const centuryChar = curp.charAt(16)
  
  let year = 1900 + yy
  if (/[A-Z]/.test(centuryChar)) {
    year = 2000 + yy
  } else if (/[0-9]/.test(centuryChar)) {
    year = 1900 + yy
    if (yy < 25 && year < 1925) year = 2000 + yy
  }
  return `${year}-${mm}-${dd}`
}

/**
 * Resolves absolute URLs for Signia assets.
 * Fixes the issue where the API occasionally returns localhost or relative storage paths.
 */
export const resolveSigniaUrl = (url?: string): string | null => {
  if (!url) return null;
  if (url.includes('signia.casitaapps.com')) return url;
  
  // Match relative storage paths and replace root domain
  const match = url.match(/\/storage\/.*/);
  if (match) {
    return `https://signia.casitaapps.com${match[0]}`;
  }
  return url;
}