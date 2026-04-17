import { reactive } from 'vue'

const PIPELINE_VERSION = 'v7_spec_vision';
const memoryCache = new Map<string, string>();

const initDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (typeof window === 'undefined') return reject('SSR');
  const req = indexedDB.open('HHBAvatarDB', 1);
  req.onupgradeneeded = (e: any) => {
    e.target.result.createObjectStore('avatars', { keyPath: 'id' });
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const getCached = async (id: string): Promise<string | null> => {
  if (memoryCache.has(id)) {
    console.log(`[DEBUG-HHB] Vision API - Cache hit (Memory) for: ${id}`);
    return memoryCache.get(id)!;
  }
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('avatars', 'readonly');
      const store = tx.objectStore('avatars');
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result?.data) {
          console.log(`[DEBUG-HHB] Vision API - Cache hit (IndexedDB) for: ${id}`);
          memoryCache.set(id, req.result.data);
          resolve(req.result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

const setCached = async (id: string, data: string): Promise<void> => {
  memoryCache.set(id, data);
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('avatars', 'readwrite');
      const store = tx.objectStore('avatars');
      store.put({ id, data, ts: Date.now() });
      tx.oncomplete = () => resolve();
    });
  } catch (e) {
    // Se ignora silenciosamente cualquier fallo de escritura en IndexedDB para no bloquear el hilo principal
  }
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Fallo al cargar recurso: ${url}`));
    img.src = url;
  });
};

export const usePremiumAvatar = () => {
  
  const processAvatar = (originalImageUrl: string) => {
    const state = reactive({
      displaySrc: originalImageUrl || '',
      originalSrc: originalImageUrl || '',
      processedSrc: null as string | null,
      isProcessing: false,
      isProcessed: false,
      error: null as string | null
    });

    if (!originalImageUrl) return state;

    const run = async () => {
      const cacheKey = `${originalImageUrl}::${PIPELINE_VERSION}`;
      
      try {
        state.isProcessing = true;
        
        // Verificación de caché L1 (Memoria) y L2 (IndexedDB)
        const cached = await getCached(cacheKey);
        if (cached) {
          state.processedSrc = cached;
          state.displaySrc = cached;
          state.isProcessed = true;
          return;
        }

        console.log(`[DEBUG-HHB] Vision API - Solicitud de red iniciada para: ${originalImageUrl}`);
        
        // Se utiliza estrictamente FormData nativo.
        // El servidor rechaza JSON puro con un Error 400 Bad Request.
        const formData = new FormData();
        formData.append('imageUrl', originalImageUrl);

        // Se usa window.fetch deliberadamente (en lugar de $fetch de Nuxt) sin definir cabeceras de Content-Type.
        // Esto permite que el navegador asigne automáticamente 'multipart/form-data' con el boundary correcto.
        const res = await window.fetch('https://vision.casitaapps.com/analyze', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error(`[DEBUG-HHB] Vision API - Respuesta de error HTTP ${res.status}:`, errBody);
          throw new Error(`El servicio de visión rechazó la solicitud (${res.status}).`);
        }

        const data = await res.json();
        if (!data || !data.ok || !data.cropBox) {
          throw new Error('Respuesta inválida o incompleta del motor de visión.');
        }

        console.log(`[DEBUG-HHB] Vision API - Geometría de recorte recibida:`, data.cropBox);

        const imgUrl = data.imageKey ? `https://vision.casitaapps.com/image/${data.imageKey}` : originalImageUrl;
        const img = await loadImage(imgUrl);

        // Clamping sub-píxel para asegurar rangos estrictos [0.0 - 1.0]
        const cb = {
          xMin: Math.max(0, Math.min(1, data.cropBox.xMin || 0)),
          yMin: Math.max(0, Math.min(1, data.cropBox.yMin || 0)),
          xMax: Math.max(0, Math.min(1, data.cropBox.xMax || 1)),
          yMax: Math.max(0, Math.min(1, data.cropBox.yMax || 1))
        };

        if (cb.xMax <= cb.xMin || cb.yMax <= cb.yMin) {
          throw new Error('Las dimensiones de recorte están invertidas o son cero.');
        }

        // Conversión estricta a enteros para manipulación precisa del Canvas
        const sx = Math.floor(cb.xMin * img.width);
        const sy = Math.floor(cb.yMin * img.height);
        const sWidth = Math.max(1, Math.floor((cb.xMax - cb.xMin) * img.width));
        const sHeight = Math.max(1, Math.floor((cb.yMax - cb.yMin) * img.height));

        const maxRes = 256;
        const scale = Math.min(1, maxRes / sWidth, maxRes / sHeight);
        const cW = Math.max(1, Math.floor(sWidth * scale));
        const cH = Math.max(1, Math.floor(sHeight * scale));

        if (!isFinite(sx) || !isFinite(sy) || !isFinite(sWidth) || !isFinite(sHeight) || !isFinite(cW) || !isFinite(cH)) {
           throw new Error('El cálculo de dimensiones de Canvas generó un valor no finito.');
        }

        console.log(`[DEBUG-HHB] Vision API - Geometría Segura | sx:${sx} sy:${sy} sW:${sWidth} sH:${sHeight} cW:${cW} cH:${cH}`);

        const canvas = document.createElement('canvas');
        canvas.width = cW;
        canvas.height = cH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Falló la inicialización del contexto 2D del Canvas principal.');

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cW, cH);

        if (data.maskAvailable && data.maskUrl) {
          const maskImg = await loadImage(data.maskUrl);
          const mc = document.createElement('canvas');
          mc.width = cW;
          mc.height = cH;
          const mCtx = mc.getContext('2d', { willReadFrequently: true });
          if (!mCtx) throw new Error('Falló la inicialización del contexto 2D de la máscara.');

          // Mapear los límites de la máscara en relación a los mismos ratios del recorte exacto
          const msx = Math.floor(cb.xMin * maskImg.width);
          const msy = Math.floor(cb.yMin * maskImg.height);
          const msWidth = Math.max(1, Math.floor((cb.xMax - cb.xMin) * maskImg.width));
          const msHeight = Math.max(1, Math.floor((cb.yMax - cb.yMin) * maskImg.height));

          mCtx.drawImage(maskImg, msx, msy, msWidth, msHeight, 0, 0, cW, cH);

          const mainData = ctx.getImageData(0, 0, cW, cH);
          const maskData = mCtx.getImageData(0, 0, cW, cH);

          let usesAlpha = false;
          for (let i = 3; i < maskData.data.length; i += 4) {
            if (maskData.data[i] < 255) { usesAlpha = true; break; }
          }
          console.log(`[DEBUG-HHB] Vision API - Modalidad de máscara detectada: ${usesAlpha ? 'Canal Alpha (Transparente)' : 'Escala de Grises (Sólido)'}`);

          let visiblePixels = 0;
          for (let i = 0; i < mainData.data.length; i += 4) {
            const maskIntensity = usesAlpha ? maskData.data[i + 3] : maskData.data[i];
            mainData.data[i + 3] = Math.floor((mainData.data[i + 3] * maskIntensity) / 255);
            if (mainData.data[i + 3] > 15) visiblePixels++;
          }

          const visibleRatio = visiblePixels / (cW * cH);
          console.log(`[DEBUG-HHB] Vision API - Proporción de píxeles visibles: ${visibleRatio.toFixed(3)}`);

          if (visibleRatio < 0.15) {
            throw new Error('La máscara eliminó demasiada información de la imagen (Safety Check).');
          }

          ctx.putImageData(mainData, 0, 0);
        }

        const base64 = canvas.toDataURL('image/png');
        await setCached(cacheKey, base64);
        
        // La actualización reactiva del canal dispara automáticamente los crossfades en la UI
        state.processedSrc = base64;
        state.displaySrc = base64;
        state.isProcessed = true;
        
        console.log(`[DEBUG-HHB] Vision API - Reemplazo de avatar procesado con éxito y emitido a reactividad.`);

      } catch (error: any) {
        console.warn(`[DEBUG-HHB] Vision API - Fallo de procesamiento, reteniendo original: ${error.message}`);
        state.error = error.message;
        // En caso de fallo deliberadamente mantenemos displaySrc apuntando a la imagen original de fallback
      } finally {
        state.isProcessing = false;
      }
    };

    run();

    return state;
  };

  return { processAvatar };
};