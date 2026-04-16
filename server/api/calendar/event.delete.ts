import { google } from 'googleapis'
import { getGoogleAuth } from '../../utils/google'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const auth = getGoogleAuth()
  const calendar = google.calendar({ version: 'v3', auth })
  
  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    eventId: body.event_id
  })

  return { success: true }
})