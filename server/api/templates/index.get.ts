import { pool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const employeeId = query.employeeId as string
  const plantel = query.plantel as string

  if (!employeeId) return { template: null, allTemplates: [], messages: [] }

  const [assetsRow]: any = await pool.query('SELECT * FROM asset_templates ORDER BY created_at DESC')
  const [oldRow]: any = await pool.query('SELECT * FROM templates WHERE id = ?', [employeeId])
  const [messages]: any = await pool.query('SELECT * FROM birthday_messages WHERE employee_id = ? ORDER BY created_at ASC', [employeeId])

  const allTemplates = assetsRow.map((a: any) => ({
    id: a.id,
    name: a.name,
    imageUrl: a.image_url,
    isDefault: !!a.is_default,
    targetPlantel: a.target_plantel,
    targetEmployee: a.target_employee,
    allowRandom: !!a.allow_random,
    cropMeta: a.crop_meta ? JSON.parse(a.crop_meta) : { x: 50, y: 50 }
  }))

  let resolved = null

  // 1. Asignación directa al colaborador
  resolved = allTemplates.find((t: any) => t.targetEmployee === employeeId)
  
  // 2. Soporte Legacy sin regresiones (Plantillas antiguas)
  if (!resolved && oldRow.length > 0) {
    resolved = {
      id: 'legacy_' + employeeId,
      imageUrl: oldRow[0].image_url,
      cropMeta: oldRow[0].crop_meta ? JSON.parse(oldRow[0].crop_meta) : { x: 50, y: 50 },
      isLegacy: true
    }
  }

  // 3. Asignación a nivel de Sede (Plantel)
  if (!resolved && plantel) {
    resolved = allTemplates.find((t: any) => t.targetPlantel === plantel)
  }

  // 4. Plantilla Global por defecto
  if (!resolved) {
    resolved = allTemplates.find((t: any) => t.isDefault)
  }

  // 5. Motor Aleatorio de Pool permitido
  if (!resolved) {
    const randoms = allTemplates.filter((t: any) => t.allowRandom)
    if (randoms.length > 0) {
      resolved = randoms[Math.floor(Math.random() * randoms.length)]
    }
  }

  return {
    template: resolved || null,
    allTemplates,
    messages
  }
})