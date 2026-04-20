import { google } from 'googleapis'
import { getGoogleAuth } from '../../utils/google'
import dayjs from 'dayjs'

// PRIVACY RULE: Client only sends MM-DD. We attach the current year internally strictly for Calendar integration.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const auth = getGoogleAuth()
  const calendar = google.calendar({ version: 'v3', auth })
  
  const currentYear = dayjs().year()
  const fullDate = `${currentYear}-${body.date}` // 2024-MM-DD
  const start = dayjs(fullDate).format('YYYY-MM-DD')
  const end = dayjs(fullDate).add(1, 'day').format('YYYY-MM-DD')

  const res = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    requestBody: {
      summary: body.title,
      description: 'Generado desde Happy Husky Birthday',
      start: { date: start },
      end: { date: end },
      recurrence: ['RRULE:FREQ=YEARLY']
    }
  })

  return { eventId: res.data.id }
})