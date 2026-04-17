import { pool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const employeeId = query.employeeId as string

  if (!employeeId) return { template: null, messages: [] }

  const [templates]: any = await pool.query('SELECT * FROM templates WHERE id = ?', [employeeId])
  const [messages]: any = await pool.query('SELECT * FROM birthday_messages WHERE employee_id = ? ORDER BY created_at ASC', [employeeId])

  return {
    template: templates[0] || null,
    messages
  }
})