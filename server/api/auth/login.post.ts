import { OAuth2Client } from 'google-auth-library'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  const { token } = await readBody(event)
  const config = useRuntimeConfig()
  const clientId = config.public.googleClientId || process.env.GOOGLE_CLIENT_ID
  const secret = process.env.GOOGLE_CLIENT_ID || 'hhb_secret_key' // Fallback for signing
  
  const client = new OAuth2Client(clientId)
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    })
    const payload = ticket.getPayload()
    
    // Create a robust, signed session token instead of irreversible bcrypt
    const sessionData = JSON.stringify({ sub: payload!.sub, email: payload!.email, name: payload!.name })
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(sessionData)
    const signature = hmac.digest('hex')
    
    const sessionToken = Buffer.from(`${sessionData}::${signature}`).toString('base64')

    setCookie(event, 'hhb_session', sessionToken, { httpOnly: true, secure: true, maxAge: 60*60*24*7 })
    
    return { success: true }
  } catch (e) {
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }
})