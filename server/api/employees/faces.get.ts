import { fetchSigniaEmployees, extractBirthdayFromCurp, resolveSigniaUrl } from '../../utils/signia'
import { pool } from '../../utils/db'
import dayjs from 'dayjs'

export default defineEventHandler(async () => {
  const signiaData = await fetchSigniaEmployees()
  
  const [overridesRow]: any = await pool.query('SELECT * FROM overrides')
  const [externalsRow]: any = await pool.query('SELECT * FROM external_users')

  const overrideMap = new Map()
  overridesRow.forEach((o: any) => overrideMap.set(o.id, o))

  const todayStr = dayjs().format('MM-DD')

  const allUsers = signiaData.map((emp: any) => {
    const ov = overrideMap.get(emp.id) || {}
    if (ov.baja) return null

    // PRIVACY RULE: Never expose birth year to client. Normalizing strictly to MM-DD.
    const rawBirthday = ov.birthday || extractBirthdayFromCurp(emp.curp)
    const birthday = rawBirthday ? dayjs(rawBirthday).format('MM-DD') : null

    return {
      id: emp.id,
      name: emp.name,
      picture: resolveSigniaUrl(emp.picture),
      birthday,
      email: ov.email || emp.email,
      high_rank: ov.high_rank === 1,
      event_id: ov.event_id || null,
      plantel: emp.plantel || 'General'
    }
  }).filter(Boolean)

  externalsRow.forEach((ext: any) => {
    if (ext.baja) return
    allUsers.push({
      id: ext.id,
      name: ext.name,
      picture: resolveSigniaUrl(ext.picture),
      birthday: ext.birthday ? dayjs(ext.birthday).format('MM-DD') : null,
      email: ext.email,
      high_rank: ext.high_rank === 1,
      event_id: ext.event_id || null,
      plantel: ext.plantel || 'Externo'
    })
  })

  const todayBirthers = allUsers.filter(u => u.birthday && u.birthday === todayStr)
  const validFaces = allUsers.filter(u => u.picture).sort(() => 0.5 - Math.random()).map(u => u.picture).slice(0, 5)

  return {
    todayBirthers,
    fallbackFaces: validFaces
  }
})