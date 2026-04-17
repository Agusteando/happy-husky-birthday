import { OAuth2Client } from 'google-auth-library'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { token } = await readBody(event)
  const config = useRuntimeConfig()
  const clientId = config.public.googleClientId || process.env.GOOGLE_CLIENT_ID
  
  const client = new OAuth2Client(clientId)
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    })
    const payload = ticket.getPayload()
    
    // Secure Session Hash via bcrypt to validate locally
    const sessionId = await bcrypt.hash(payload!.sub, 10)
    setCookie(event, 'hhb_session', sessionId, { httpOnly: true, secure: true, maxAge: 60*60*24 })
    
    return { success: true }
  } catch (e) {
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }
})