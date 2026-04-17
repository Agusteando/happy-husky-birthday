import { pool } from '../../utils/db'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  const { employeeId, authorName, message } = await readBody(event)
  const id = crypto.randomUUID()

  await pool.query(`
    INSERT INTO birthday_messages (id, employee_id, author_name, message)
    VALUES (?, ?, ?, ?)
  `, [id, employeeId, authorName, message])

  return { id, employeeId, author_name: authorName, message }
})