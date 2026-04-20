import { pool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, email, birthday, high_rank, event_id, baja, evaId, pathId, ingressioId, noiId } = body

  if (evaId !== undefined || pathId !== undefined || ingressioId !== undefined || noiId !== undefined) {
    try {
      const matchPayload = email ? { email } : { id };
      const requestBody = {
        match: matchPayload,
        ...(evaId !== undefined && { evaId }),
        ...(pathId !== undefined && { pathId }),
        ...(ingressioId !== undefined && { ingressioId }),
        ...(noiId !== undefined && { noiId })
      };
      
      await $fetch('https://signia.casitaapps.com/api/export/employees/update', {
        method: 'PATCH',
        body: requestBody
      });
    } catch (e) {
      console.error('[DEBUG-HHB] API Update - Signia PATCH failed:', e)
    }
  }

  // Internal Privacy Handling: Re-attach a fake leap year so MySQL DATE stores it correctly, 
  // keeping the real year completely out of our systems for UI-entered dates.
  let safeBirthday = null;
  if (birthday !== undefined) {
    if (birthday === null) safeBirthday = null;
    else safeBirthday = birthday.length === 5 ? `2004-${birthday}` : birthday;
  }

  await pool.query(`
    INSERT INTO overrides (id, email, birthday, high_rank, event_id, baja)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      email = IFNULL(VALUES(email), overrides.email),
      birthday = IFNULL(VALUES(birthday), overrides.birthday),
      high_rank = IFNULL(VALUES(high_rank), overrides.high_rank),
      event_id = IFNULL(VALUES(event_id), overrides.event_id),
      baja = IFNULL(VALUES(baja), overrides.baja)
  `, [
    id, 
    email !== undefined ? email : null, 
    safeBirthday !== undefined ? safeBirthday : null, 
    high_rank !== undefined ? (high_rank ? 1 : 0) : null, 
    event_id !== undefined ? event_id : null, 
    baja !== undefined ? (baja ? 1 : 0) : null
  ])

  await pool.query(`
    UPDATE external_users 
    SET 
      email = IFNULL(?, email), 
      birthday = IFNULL(?, birthday), 
      high_rank = IFNULL(?, high_rank), 
      event_id = IFNULL(?, event_id), 
      baja = IFNULL(?, baja)
    WHERE id = ?
  `, [
    email !== undefined ? email : null, 
    safeBirthday !== undefined ? safeBirthday : null, 
    high_rank !== undefined ? (high_rank ? 1 : 0) : null, 
    event_id !== undefined ? event_id : null, 
    baja !== undefined ? (baja ? 1 : 0) : null, 
    id
  ])

  return { success: true }
})