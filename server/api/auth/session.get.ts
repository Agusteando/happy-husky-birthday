export default defineEventHandler((event) => {
  const session = getCookie(event, 'hhb_session')
  return { authenticated: !!session }
})