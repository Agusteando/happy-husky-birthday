import { OAuth2Client } from 'google-auth-library'
import bcrypt from 'bcryptjs'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export default defineEventHandler(async (event) => {
  const { token } = await readBody(event)
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
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