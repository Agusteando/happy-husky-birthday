import { pool } from '../../utils/db'

export default defineEventHandler(async () => {
  const [rows]: any = await pool.query('SELECT * FROM removals_audit ORDER BY removed_at DESC')
  return rows.map((r: any) => ({
    id: r.id,
    employee_id: r.employee_id,
    employee_name: r.employee_name,
    removed_by_user_email: r.removed_by_user_email,
    removed_by_user_name: r.removed_by_user_name,
    removed_at: r.removed_at,
    reason: r.reason
  }))
})