import { pool } from '../../utils/db'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  const sessionToken = getCookie(event, 'hhb_session')
  let userEmail = 'Desconocido'
  let userName = 'Desconocido'
  
  if (sessionToken) {
    try {
      const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8')
      const [sessionData] = decoded.split('::')
      const user = JSON.parse(sessionData)
      userEmail = user.email
      userName = user.name
    } catch(e) {}
  }

  const { employee_id, employee_name, reason } = await readBody(event)

  await pool.query(`
    INSERT INTO overrides (id, baja) VALUES (?, 1)
    ON DUPLICATE KEY UPDATE baja = 1
  `, [employee_id])

  await pool.query(`
    UPDATE external_users SET baja = 1 WHERE id = ?
  `, [employee_id])

  const auditId = crypto.randomUUID()
  await pool.query(`
    INSERT INTO removals_audit (id, employee_id, employee_name, removed_by_user_email, removed_by_user_name, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [auditId, employee_id, employee_name || '', userEmail, userName, reason || ''])

  return { success: true }
})