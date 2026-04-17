import { fetchSigniaEmployees, resolveSigniaUrl } from '../../utils/signia'

export default defineEventHandler(async () => {
  // Pass no arguments to fetch all active employees, giving the 3D scene a diverse randomized array of hero faces
  const signiaData = await fetchSigniaEmployees()
  
  const validFaces = signiaData
    .map((e: any) => resolveSigniaUrl(e.picture))
    .filter(Boolean)
  
  return validFaces.sort(() => 0.5 - Math.random()).slice(0, 5)
})