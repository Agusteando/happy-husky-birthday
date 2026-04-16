import { pool } from '../../utils/db'
import { fetchSigniaEmployees, extractBirthdayFromCurp } from '../../utils/signia'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  const signiaData = await fetchSigniaEmployees()
  const [overridesRow]: any = await pool.query('SELECT * FROM overrides')
  const [externalsRow]: any = await pool.query('SELECT * FROM external_users')

  const overrideMap = new Map()
  overridesRow.forEach((o: any) => overrideMap.set(o.id, o))

  let merged = signiaData.map((emp: any) => {
    const ov = overrideMap.get(emp.id) || {}
    if (ov.baja) return null // Drop users given baja

    const birthday = ov.birthday ? dayjs(ov.birthday).format('YYYY-MM-DD') : extractBirthdayFromCurp(emp.curp)

    return {
      ...emp,
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
      is_external: true
    })
  })

  // Sort by birthday month/day
  return merged.sort((a, b) => {
    if (!a.birthday) return 1
    if (!b.birthday) return -1
    return dayjs(a.birthday).format('MM-DD').localeCompare(dayjs(b.birthday).format('MM-DD'))
  })
})