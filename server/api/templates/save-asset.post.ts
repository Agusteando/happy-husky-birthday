import { pool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, name, imageUrl, isDefault, targetPlantel, targetEmployee, allowRandom, cropMeta } = body
  
  const metaStr = cropMeta ? JSON.stringify(cropMeta) : null

  // Restricción: Si se asigna como por defecto, removemos las demás asignaciones por defecto globales
  if (isDefault) {
    await pool.query('UPDATE asset_templates SET is_default = FALSE')
  }

  await pool.query(`
    INSERT INTO asset_templates (id, name, image_url, is_default, target_plantel, target_employee, allow_random, crop_meta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      image_url = VALUES(image_url),
      is_default = VALUES(is_default),
      target_plantel = VALUES(target_plantel),
      target_employee = VALUES(target_employee),
      allow_random = VALUES(allow_random),
      crop_meta = VALUES(crop_meta)
  `, [
    id, 
    name || 'Nueva Plantilla', 
    imageUrl, 
    isDefault ? 1 : 0, 
    targetPlantel || null, 
    targetEmployee || null, 
    allowRandom ? 1 : 0, 
    metaStr
  ])

  return { success: true }
})