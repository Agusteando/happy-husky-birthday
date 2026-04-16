export default defineEventHandler((event) => {
  deleteCookie(event, 'hhb_session')
  return { success: true }
})