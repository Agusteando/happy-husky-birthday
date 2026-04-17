// Legacy fetchSigniaEmployees removed, now dynamically fetched via exact parameters in index.get.ts

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

export const resolveSigniaUrl = (url?: string): string | null => {
  if (!url) return null;
  console.log(`[DEBUG-HHB] Image Resolver - Original string: ${url}`);
  
  let resolved = url;
  
  if (url.startsWith('/storage') || url.startsWith('storage/')) {
    const path = url.startsWith('/') ? url : `/${url}`;
    resolved = `https://signia.casitaapps.com${path}`;
  } else if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
    resolved = url.replace(/^https?:\/\/localhost(:\d+)?/, 'https://signia.casitaapps.com');
  }
  
  if (resolved !== url) {
    console.log(`[DEBUG-HHB] Image Resolver - Resolved out URL: ${resolved}`);
  }
  
  return resolved;
}