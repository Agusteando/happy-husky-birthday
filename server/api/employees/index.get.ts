import { pool } from '../../utils/db'
import { fetchSigniaEmployees, extractBirthdayFromCurp, resolveSigniaUrl } from '../../utils/signia'
import dayjs from 'dayjs'

// PRIVACY RULE: Never expose, display, or export employee birth year to the client. Normalizing strictly to MM-DD.
const formatPrivacyBday = (date: string | null) => {
  if (!date) return null;
  return dayjs(date).format('MM-DD');
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const plantelCode = query.plantelCode as string
  const plantelNameFallback = query.plantelNameFallback as string

  let signiaData: any[] = []

  if (plantelCode && plantelCode !== 'EXT') {
    if (plantelCode === 'ALL') {
      signiaData = await fetchSigniaEmployees()
    } else {
      signiaData = await fetchSigniaEmployees(plantelCode)
    }
  }

  const [overridesRow]: any = await pool.query('SELECT * FROM overrides')
  const [externalsRow]: any = await pool.query('SELECT * FROM external_users')

  const overrideMap = new Map()
  overridesRow.forEach((o: any) => overrideMap.set(o.id, o))

  let merged = signiaData.map((emp: any) => {
    const ov = overrideMap.get(emp.id) || {}
    if (ov.baja) return null 

    const rawBirthday = ov.birthday || extractBirthdayFromCurp(emp.curp)

    return {
      ...emp,
      picture: resolveSigniaUrl(emp.picture),
      email: ov.email || emp.email,
      birthday: formatPrivacyBday(rawBirthday),
      high_rank: ov.high_rank === 1,
      event_id: ov.event_id || null,
      is_external: false
    }
  }).filter(Boolean)

  externalsRow.forEach((ext: any) => {
    if (ext.baja) return
    
    if (plantelCode === 'ALL' || plantelCode === 'EXT' || ext.plantel === plantelNameFallback || ext.plantel === plantelCode) {
      merged.push({
        id: ext.id,
        name: ext.name,
        plantel: { name: ext.plantel, label: ext.plantel },
        email: ext.email,
        birthday: formatPrivacyBday(ext.birthday),
        high_rank: ext.high_rank === 1,
        event_id: ext.event_id || null,
        picture: resolveSigniaUrl(ext.picture) || null,
        is_external: true
      })
    }
  })

  return merged.sort((a, b) => {
    if (!a.birthday) return 1
    if (!b.birthday) return -1
    return a.birthday.localeCompare(b.birthday)
  })
})