import { getGoogleAuth } from '../../utils/google'

export default defineEventHandler(async (event) => {
  const { fileName, mimeType, fileSize } = await readBody(event)
  const auth = getGoogleAuth()
  const token = await auth.getAccessToken()

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': fileSize.toString()
    },
    body: JSON.stringify({
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || 'root']
    })
  })

  const uploadUrl = response.headers.get('location')
  if (!uploadUrl) throw createError({ statusCode: 500, message: 'Failed to generate upload URL' })

  return { uploadUrl }
})