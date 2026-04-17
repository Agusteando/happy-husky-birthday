export default defineNuxtConfig({
  devtools: { enabled: true },
  nitro: {
    preset: 'vercel'
  },
  runtimeConfig: {
    public: {
      googleClientId: process.env.GOOGLE_CLIENT_ID || ''
    }
  },
  app: {
    head: {
      title: 'Happy Husky Birthday | IECS-IEDIS',
      script: [
        { src: 'https://accounts.google.com/gsi/client', async: true, defer: true }
      ]
    }
  }
})