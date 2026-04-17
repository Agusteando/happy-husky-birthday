import { ref } from 'vue'

const avatarCache = new Map<string, string>()

export const usePremiumAvatar = () => {
  const processAvatar = async (url: string): Promise<string> => {
    if (!url) return '/main.png'
    if (avatarCache.has(url)) return avatarCache.get(url)!

    console.log(`[DEBUG-HHB] Vision API - Requesting analysis for URL: ${url}`);

    try {
      const formData = new FormData()
      formData.append('imageUrl', url)

      const response = await fetch('https://vision.casitaapps.com/analyze', {
        method: 'POST',
        body: formData
      }).catch(e => {
        console.error('[DEBUG-HHB] Vision API - Network error', e)
        return null
      })

      if (!response || !response.ok) {
        const errText = response ? await response.text() : 'No response'
        console.error(`[DEBUG-HHB] Vision API - Failed. Status: ${response?.status}, Body:`, errText)
        throw new Error('Vision API analysis failed')
      }

      const data = await response.json()
      console.log(`[DEBUG-HHB] Vision API - Success. Keys returned:`, Object.keys(data))
      
      const cropBox = data.cropBox || { x: 0, y: 0, width: 256, height: 256 }
      const maskUrl = data.maskUrl || data.mask || null

      // Load original image safely
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })

      const sx = cropBox.x
      const sy = cropBox.y
      const sWidth = cropBox.width
      const sHeight = cropBox.height

      const TARGET_SIZE = 256
      const size = Math.max(sWidth, sHeight)
      
      const canvas = document.createElement('canvas')
      canvas.width = TARGET_SIZE
      canvas.height = TARGET_SIZE
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return url

      const dw = (sWidth / size) * TARGET_SIZE
      const dh = (sHeight / size) * TARGET_SIZE
      const dx = (TARGET_SIZE - dw) / 2
      const dy = (TARGET_SIZE - dh) / 2

      ctx.clearRect(0, 0, TARGET_SIZE, TARGET_SIZE)
      ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh)
      
      const imgData = ctx.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE)

      if (maskUrl) {
        const maskImg = new Image()
        maskImg.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          maskImg.onload = resolve
          maskImg.onerror = reject
          maskImg.src = (maskUrl.startsWith('http') || maskUrl.startsWith('data:')) ? maskUrl : `data:image/png;base64,${maskUrl}`
        })

        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = TARGET_SIZE
        maskCanvas.height = TARGET_SIZE
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!
        maskCtx.clearRect(0, 0, TARGET_SIZE, TARGET_SIZE)
        maskCtx.drawImage(maskImg, sx, sy, sWidth, sHeight, dx, dy, dw, dh)
        const maskData = maskCtx.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE)

        let usesAlpha = false
        for (let i = 0; i < maskData.data.length; i += 4) {
          const a = maskData.data[i + 3]
          if (a < 255 && a > 0) {
            usesAlpha = true
            break
          }
          if (a === 0 && (maskData.data[i] > 0 || maskData.data[i+1] > 0 || maskData.data[i+2] > 0)) {
            usesAlpha = true
          }
        }
        
        if (!usesAlpha) {
          for (let i = 0; i < maskData.data.length; i += 4) {
            if (maskData.data[i + 3] === 0) {
              usesAlpha = true
              break
            }
          }
        }

        for (let i = 0; i < imgData.data.length; i += 4) {
          let maskValue
          if (usesAlpha) {
            maskValue = maskData.data[i + 3]
          } else {
            const r = maskData.data[i]
            const g = maskData.data[i + 1]
            const b = maskData.data[i + 2]
            maskValue = r * 0.299 + g * 0.587 + b * 0.114
          }
          
          const originalAlpha = imgData.data[i + 3]
          imgData.data[i + 3] = Math.round((originalAlpha * maskValue) / 255)
        }
      }

      ctx.putImageData(imgData, 0, 0)
      const base64 = canvas.toDataURL('image/png')
      avatarCache.set(url, base64)
      return base64

    } catch (e) {
      console.warn('[DEBUG-HHB] PremiumAvatar pipeline failed for', url, 'returning original. Error:', e)
      avatarCache.set(url, url)
      return url
    }
  }

  return { processAvatar }
}