import { pool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const id = `ext-${crypto.randomUUID()}`

  await pool.query(`
    INSERT INTO external_users (id, name, plantel, birthday, email)
    VALUES (?, ?, ?, ?, ?)
  `, [id, body.name, body.plantel, body.birthday || null, body.email || null])

  return { id, success: true }
})