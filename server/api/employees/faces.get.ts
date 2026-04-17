import { fetchSigniaEmployees } from '../../utils/signia'
import { resolveSigniaUrl } from '../../utils/signia'

export default defineEventHandler(async () => {
  // Ultra-fast fetch just to populate the hero stage with faces
  const signiaData = await fetchSigniaEmployees()
  const validFaces = signiaData
    .map((e: any) => resolveSigniaUrl(e.picture))
    .filter(Boolean)
  
  // Return up to 5 random faces
  return validFaces.sort(() => 0.5 - Math.random()).slice(0, 5)
})