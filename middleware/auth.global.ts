export default defineNuxtRouteMiddleware(async (to) => {
  const { data } = await useFetch('/api/auth/session')
  const isAuthenticated = !!data.value?.authenticated

  if (!isAuthenticated && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})