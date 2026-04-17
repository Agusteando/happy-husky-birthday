import { pool } from '../../utils/db'
import { extractBirthdayFromCurp, resolveSigniaUrl } from '../../utils/signia'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const plantelCode = query.plantelCode as string

  console.log(`[DEBUG-HHB] Server Adapter - Requested internal code: "${plantelCode}"`);

  let signiaData: any[] = []

  // Skip hitting Signia entirely if looking explicitly for Externals
  if (plantelCode && plantelCode !== 'EXT') {
    // Rely strictly on Signia's natively documented filter strategy
    const signiaUrl = `https://signia.casitaapps.com/api/export/employees?isActive=true&plantelId=${plantelCode}`
    console.log(`[DEBUG-HHB] Server Adapter - Fetching from Signia: ${signiaUrl}`)
    
    try {
      const response = await fetch(signiaUrl)
      if (response.ok) {
        const rawData = await response.json()
        signiaData = Array.isArray(rawData) ? rawData : []
        console.log(`[DEBUG-HHB] Server Adapter - Signia returned ${signiaData.length} records.`)
      } else {
        console.error(`[DEBUG-HHB] Server Adapter - Signia fetch failed. HTTP Status: ${response.status}`)
      }
    } catch (e) {
      console.error(`[DEBUG-HHB] Server Adapter - Signia request execution error:`, e)
    }
  }

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

  // Append local external/guest users
  externalsRow.forEach((ext: any) => {
    if (ext.baja) return
    
    // Only inject them if filter matches EXT or if they match the exact UI label being parsed 
    // Note: external users store the friendly UI name in DB natively.
    if (plantelCode === 'EXT' || ext.plantel === query.plantelNameFallback) {
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
    }
  })

  console.log(`[DEBUG-HHB] Server Adapter - Final merged records returned to client: ${merged.length}`)

  return merged.sort((a, b) => {
    if (!a.birthday) return 1
    if (!b.birthday) return -1
    return dayjs(a.birthday).format('MM-DD').localeCompare(dayjs(b.birthday).format('MM-DD'))
  })
})