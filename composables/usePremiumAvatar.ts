import { ref } from 'vue'

const avatarCache = new Map<string, string>()

export const usePremiumAvatar = () => {
  const processAvatar = async (url: string): Promise<string> => {
    if (!url) return '/main.png'
    if (avatarCache.has(url)) return avatarCache.get(url)!

    try {
      // 1. Fetch normalized cropBox from Vision API
      // Adjusting endpoint dynamically to fit generic vision API standard
      const response = await fetch('https://vision.casitaapps.com/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      }).catch(() => null)

      let cropBox = { x: 0, y: 0, width: 1, height: 1 } // Fallback: use full image

      if (response && response.ok) {
        const data = await response.json()
        // Support common vision API response shapes
        if (data.cropBox) cropBox = data.cropBox
        else if (data.faces && data.faces.length > 0) cropBox = data.faces[0].box || data.faces[0]
      }

      // 2. Load Image via HTML5 safely
      const img = new Image()
      img.crossOrigin = 'anonymous' // Critical for Canvas export
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })

      // 3. Canvas Crop Processing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return url

      // Target avatar size (sharp yet memory efficient)
      canvas.width = 256
      canvas.height = 256

      // Pixel calculation with padding to avoid strict clipping of hair/ears
      const pad = 0.3 // 30% padding around detected face box
      let cX = cropBox.x - (cropBox.width * pad / 2)
      let cY = cropBox.y - (cropBox.height * pad / 2)
      let cW = cropBox.width * (1 + pad)
      let cH = cropBox.height * (1 + pad)

      // Clamp coordinates to image boundaries 0.0 - 1.0
      cX = Math.max(0, cX)
      cY = Math.max(0, cY)
      cW = Math.min(1 - cX, cW)
      cH = Math.min(1 - cY, cH)

      const sx = cX * img.width
      const sy = cY * img.height
      const sw = cW * img.width
      const sh = cH * img.height

      // Ensure crisp background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

      const base64 = canvas.toDataURL('image/png', 0.9)
      avatarCache.set(url, base64)
      return base64

    } catch (e) {
      console.warn('PremiumAvatar processing failed for', url, 'falling back to original. Err:', e)
      avatarCache.set(url, url)
      return url
    }
  }

  return { processAvatar }
}