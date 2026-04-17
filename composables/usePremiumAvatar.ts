import { ref } from 'vue'

const avatarCache = new Map<string, string>()

export const usePremiumAvatar = () => {
  const processAvatar = async (url: string): Promise<string> => {
    if (!url) return '/main.png'
    if (avatarCache.has(url)) return avatarCache.get(url)!

    console.log(`[DEBUG-HHB] Vision API - Requesting analysis for URL: ${url}`);

    try {
      const response = await fetch('https://vision.casitaapps.com/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      }).catch(() => null)

      let cropBox = { x: 0, y: 0, width: 1, height: 1 } 
      let maskBase64 = null

      if (response && response.ok) {
        const data = await response.json()
        const keys = Object.keys(data)
        console.log(`[DEBUG-HHB] Vision API - Success. Raw keys returned:`, keys)
        
        if (data.cropBox) cropBox = data.cropBox
        else if (data.faces && data.faces.length > 0) cropBox = data.faces[0].box || data.faces[0]

        // Extract segmentation mask
        maskBase64 = data.mask || data.alphaMask || data.segmentationMask || null
        console.log(`[DEBUG-HHB] Vision API - cropBox:`, cropBox, `| Mask retrieved:`, !!maskBase64)
      } else {
        console.error(`[DEBUG-HHB] Vision API - Failed or non-200. Status:`, response?.status)
      }

      // Load original image safely
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })

      // Try loading mask image if provided
      let maskImg: HTMLImageElement | null = null
      if (maskBase64) {
        const maskSrc = (maskBase64.startsWith('http') || maskBase64.startsWith('data:')) 
          ? maskBase64 
          : `data:image/png;base64,${maskBase64}`
        
        maskImg = new Image()
        maskImg.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          maskImg!.onload = resolve
          maskImg!.onerror = reject
          maskImg!.src = maskSrc
        }).catch((e) => {
          console.warn(`[DEBUG-HHB] Vision API - Failed to decode mask image buffer`, e)
          maskImg = null
        })
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return url

      canvas.width = 256
      canvas.height = 256

      // Crop mathematics
      const pad = 0.3
      let cX = cropBox.x - (cropBox.width * pad / 2)
      let cY = cropBox.y - (cropBox.height * pad / 2)
      let cW = cropBox.width * (1 + pad)
      let cH = cropBox.height * (1 + pad)

      cX = Math.max(0, cX)
      cY = Math.max(0, cY)
      cW = Math.min(1 - cX, cW)
      cH = Math.min(1 - cY, cH)

      const sx = cX * img.width
      const sy = cY * img.height
      const sw = cW * img.width
      const sh = cH * img.height

      console.log(`[DEBUG-HHB] Canvas - Target Export Size: ${canvas.width}x${canvas.height}`)
      console.log(`[DEBUG-HHB] Canvas - Crop Bounds: sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}`)

      // Init clean transparent slate
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Step 1: Draw the cropped base original image
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

      // Step 2: Apply true segmentation mask for accurate alpha preservation
      if (maskImg) {
        console.log(`[DEBUG-HHB] Canvas - Compositing Mask (Natural size: ${maskImg.width}x${maskImg.height}) using destination-in`)
        ctx.globalCompositeOperation = 'destination-in'
        
        if (maskImg.width === img.width && maskImg.height === img.height) {
          // Mask matches original dimensions, use same crop source coordinates
          ctx.drawImage(maskImg, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
        } else {
          // Mask matches bounded crop dimensions, map directly
          ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height)
        }
        ctx.globalCompositeOperation = 'source-over'
      } else {
        console.log(`[DEBUG-HHB] Canvas - No mask found, falling back to soft circular crop`)
        ctx.globalCompositeOperation = 'destination-in'
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
      }

      const base64 = canvas.toDataURL('image/png', 1.0)
      console.log(`[DEBUG-HHB] Canvas - Export Successful. Base64 length: ${base64.length}, Alpha explicitly preserved.`)
      
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