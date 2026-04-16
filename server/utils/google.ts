import { GoogleAuth } from 'google-auth-library'

export const getGoogleAuth = () => {
  const keys = JSON.parse(Buffer.from(process.env.GOOGLE_PRIVATE_KEY || '', 'base64').toString('utf-8'))
  return new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: keys.private_key
    },
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/gmail.send'
    ]
  })
}