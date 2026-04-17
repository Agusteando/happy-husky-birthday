import crypto from 'crypto'

export default defineEventHandler((event) => {
  const sessionToken = getCookie(event, 'hhb_session')
  if (!sessionToken) return { authenticated: false }

  try {
    const secret = process.env.GOOGLE_CLIENT_ID || 'hhb_secret_key'
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8')
    const [sessionData, signature] = decoded.split('::')

    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(sessionData)
    const expectedSignature = hmac.digest('hex')

    if (signature === expectedSignature) {
      return { authenticated: true, user: JSON.parse(sessionData) }
    }
  } catch (e) {
    // Fall through
  }

  return { authenticated: false }
})