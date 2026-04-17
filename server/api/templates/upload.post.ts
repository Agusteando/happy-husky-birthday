import { pool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { employeeId, imageBase64, cropMeta } = await readBody(event)
  
  const metaStr = JSON.stringify(cropMeta)

  await pool.query(`
    INSERT INTO templates (id, image_url, crop_meta)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      image_url = VALUES(image_url),
      crop_meta = VALUES(crop_meta)
  `, [employeeId, imageBase64, metaStr])

  return { success: true }
})