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
    if (yy < 25 && year < 1925) year = 2000 + yy // Fallback logic
  }
  return `${year}-${mm}-${dd}`
}