import { pool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, email, birthday, high_rank, event_id, baja, evaId, pathId, ingressioId, noiId } = body

  // Update External API if strictly allowed fields are present
  if (evaId !== undefined || pathId !== undefined || ingressioId !== undefined || noiId !== undefined) {
    try {
      const matchPayload = email ? { email } : { id };
      console.log(`[DEBUG-HHB] API Update - Sending PATCH to Signia for match:`, matchPayload);
      
      const requestBody = {
        match: matchPayload,
        ...(evaId !== undefined && { evaId }),
        ...(pathId !== undefined && { pathId }),
        ...(ingressioId !== undefined && { ingressioId }),
        ...(noiId !== undefined && { noiId })
      };
      
      const response = await $fetch('https://signia.casitaapps.com/api/export/employees/update', {
        method: 'PATCH',
        body: requestBody
      });
      
      console.log(`[DEBUG-HHB] API Update - Signia response:`, response);
    } catch (e) {
      console.error('[DEBUG-HHB] API Update - Signia PATCH failed:', e)
    }
  }

  // Handle local overrides table upsert
  await pool.query(`
    INSERT INTO overrides (id, email, birthday, high_rank, event_id, baja)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      email = COALESCE(VALUES(email), email),
      birthday = COALESCE(VALUES(birthday), birthday),
      high_rank = COALESCE(VALUES(high_rank), high_rank),
      event_id = COALESCE(VALUES(event_id), event_id),
      baja = COALESCE(VALUES(baja), baja)
  `, [
    id, 
    email || null, 
    birthday || null, 
    high_rank !== undefined ? (high_rank ? 1 : 0) : null, 
    event_id || null, 
    baja !== undefined ? (baja ? 1 : 0) : null
  ])

  // If this is an external user, update the external_users table as well
  await pool.query(`
    UPDATE external_users 
    SET email = COALESCE(?, email), birthday = COALESCE(?, birthday), 
        high_rank = COALESCE(?, high_rank), event_id = COALESCE(?, event_id), baja = COALESCE(?, baja)
    WHERE id = ?
  `, [
    email || null, birthday || null, 
    high_rank !== undefined ? (high_rank ? 1 : 0) : null, 
    event_id || null, baja !== undefined ? (baja ? 1 : 0) : null, 
    id
  ])

  return { success: true }
})