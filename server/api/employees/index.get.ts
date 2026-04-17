import { pool } from '../../utils/db'
import { fetchSigniaEmployees, extractBirthdayFromCurp, resolveSigniaUrl } from '../../utils/signia'
import { normalizeAndMatchPlantel, plantelUItoAPI } from '../../utils/plantel'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const plantelFilter = query.plantel as string

  console.log(`[DEBUG-HHB] Local Filter - Searching for UI plantel: "${plantelFilter}"`);
  console.log(`[DEBUG-HHB] Local Filter - Mapped tokens:`, plantelUItoAPI[plantelFilter] || 'Fallback logic');

  const signiaData = await fetchSigniaEmployees()
  const [overridesRow]: any = await pool.query('SELECT * FROM overrides')
  const [externalsRow]: any = await pool.query('SELECT * FROM external_users')

  const overrideMap = new Map()
  overridesRow.forEach((o: any) => overrideMap.set(o.id, o))

  let merged = signiaData.map((emp: any) => {
    const ov = overrideMap.get(emp.id) || {}
    if (ov.baja) return null 

    const birthday = ov.birthday ? dayjs(ov.birthday).format('YYYY-MM-DD') : extractBirthdayFromCurp(emp.curp)

    return {
      ...emp,
      picture: resolveSigniaUrl(emp.picture),
      email: ov.email || emp.email,
      birthday,
      high_rank: ov.high_rank === 1,
      event_id: ov.event_id || null,
      is_external: false
    }
  }).filter(Boolean)

  externalsRow.forEach((ext: any) => {
    if (ext.baja) return
    merged.push({
      id: ext.id,
      name: ext.name,
      plantel: { name: ext.plantel },
      email: ext.email,
      birthday: ext.birthday ? dayjs(ext.birthday).format('YYYY-MM-DD') : null,
      high_rank: ext.high_rank === 1,
      event_id: ext.event_id || null,
      picture: resolveSigniaUrl(ext.picture) || null,
      is_external: true
    })
  })

  if (plantelFilter) {
    merged = merged.filter((emp: any) => {
      const pName = emp.plantel?.name || emp.plantel || ''
      if (plantelFilter === 'Externo') return emp.is_external || normalizeAndMatchPlantel(pName, 'Externo')
      return normalizeAndMatchPlantel(pName, plantelFilter)
    })

    console.log(`[DEBUG-HHB] Local Filter - Result: Found ${merged.length} employees matching "${plantelFilter}"`);
    if (merged.length === 0) {
      const samplePlantels = [...new Set(signiaData.map((e: any) => e.plantel?.name || e.plantel || 'N/A'))].slice(0, 15);
      console.log(`[DEBUG-HHB] Local Filter - Empty Result Explanation - No match found. Available sample plantel names in API data:`, samplePlantels);
    }
  }

  return merged.sort((a, b) => {
    if (!a.birthday) return 1
    if (!b.birthday) return -1
    return dayjs(a.birthday).format('MM-DD').localeCompare(dayjs(b.birthday).format('MM-DD'))
  })
})