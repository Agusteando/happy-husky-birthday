import { fetchSigniaEmployees, resolveSigniaUrl } from '../../utils/signia'

export default defineEventHandler(async () => {
  const signiaData = await fetchSigniaEmployees()
  
  const validFaces = signiaData
    .map((e: any) => resolveSigniaUrl(e.picture))
    .filter(Boolean)
  
  return validFaces.sort(() => 0.5 - Math.random()).slice(0, 5)
})