import { reactive } from 'vue'

const PIPELINE_VERSION = 'v8_spec_vision_meta';

// Estructura de caché para almacenar la imagen base64 y los metadatos deterministas
interface CacheEntry {
  base64: string;
  meta: any;
}

const memoryCache = new Map<string, CacheEntry>();

const initDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (typeof window === 'undefined') return reject('SSR');
  const req = indexedDB.open('HHBAvatarDB', 2);
  req.onupgradeneeded = (e: any) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('avatars')) {
      db.createObjectStore('avatars', { keyPath: 'id' });
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const getCached = async (id: string): Promise<CacheEntry | null> => {
  if (memoryCache.has(id)) {
    console.log(`[DEBUG-HHB] Vision API - Cache hit (Memoria) para: ${id}`);
    return memoryCache.get(id)!;
  }
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('avatars', 'readonly');
      const store = tx.objectStore('avatars');
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result?.data && req.result?.data?.base64) {
          console.log(`[DEBUG-HHB] Vision API - Cache hit (IndexedDB) para: ${id}`);
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

const setCached = async (id: string, entry: CacheEntry): Promise<void> => {
  memoryCache.set(id, entry);
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('avatars', 'readwrite');
      const store = tx.objectStore('avatars');
      store.put({ id, data: entry, ts: Date.now() });
      tx.oncomplete = () => resolve();
    });
  } catch (e) {
    // Se ignora silenciosamente cualquier fallo de escritura local
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

// --- SISTEMA DE COLAS Y CONCURRENCIA LIMITADA ---
type Job = () => Promise<void>;
const queue: Job[] = [];
let activeJobs = 0;
const MAX_CONCURRENCY = 3;

const processQueue = () => {
  console.log(`[DEBUG-HHB] Estado de la cola Vision: Activos=${activeJobs}/${MAX_CONCURRENCY}, Pendientes=${queue.length}`);
  while (activeJobs < MAX_CONCURRENCY && queue.length > 0) {
    const job = queue.shift();
    if (job) {
      activeJobs++;
      job().finally(() => {
        activeJobs--;
        processQueue();
      });
    }
  }
};

const enqueueJob = (job: Job) => {
  queue.push(job);
  processQueue();
};

export const usePremiumAvatar = () => {
  const processAvatar = (originalImageUrl: string) => {
    const state = reactive({
      displaySrc: originalImageUrl || '',
      originalSrc: originalImageUrl || '',
      processedSrc: null as string | null,
      meta: null as any,
      isProcessing: false,
      isProcessed: false,
      error: null as string | null
    });

    if (!originalImageUrl) return state;

    const run = async () => {
      const cacheKey = `${originalImageUrl}::${PIPELINE_VERSION}`;
      
      try {
        state.isProcessing = true;
        
        // Verificación prioritaria de caché para no encolar elementos ya resueltos
        const cached = await getCached(cacheKey);
        if (cached) {
          state.processedSrc = cached.base64;
          state.displaySrc = cached.base64;
          state.meta = cached.meta;
          state.isProcessed = true;
          state.isProcessing = false;
          return;
        }

        // Si es un trabajo nuevo, se añade a la cola global de procesamiento
        enqueueJob(async () => {
          try {
            console.log(`[DEBUG-HHB] Vision API - Solicitud de red iniciada para: ${originalImageUrl}`);
            
            const formData = new FormData();
            formData.append('imageUrl', originalImageUrl);

            const res = await window.fetch('https://vision.casitaapps.com/analyze', {
              method: 'POST',
              body: formData
            });

            if (!res.ok) {
              throw new Error(`El servicio de visión rechazó la solicitud (${res.status}).`);
            }

            const data = await res.json();
            if (!data || !data.ok || !data.cropBox) {
              throw new Error('Respuesta inválida o incompleta del motor de visión.');
            }

            const imgUrl = data.imageKey ? `https://vision.casitaapps.com/image/${data.imageKey}` : originalImageUrl;
            const img = await loadImage(imgUrl);

            const cb = {
              xMin: Math.max(0, Math.min(1, data.cropBox.xMin || 0)),
              yMin: Math.max(0, Math.min(1, data.cropBox.yMin || 0)),
              xMax: Math.max(0, Math.min(1, data.cropBox.xMax || 1)),
              yMax: Math.max(0, Math.min(1, data.cropBox.yMax || 1))
            };

            if (cb.xMax <= cb.xMin || cb.yMax <= cb.yMin) {
              throw new Error('Las dimensiones de recorte están invertidas o son cero.');
            }

            const sx = Math.floor(cb.xMin * img.width);
            const sy = Math.floor(cb.yMin * img.height);
            const sWidth = Math.max(1, Math.floor((cb.xMax - cb.xMin) * img.width));
            const sHeight = Math.max(1, Math.floor((cb.yMax - cb.yMin) * img.height));

            const maxRes = 256;
            const scale = Math.min(1, maxRes / sWidth, maxRes / sHeight);
            const cW = Math.max(1, Math.floor(sWidth * scale));
            const cH = Math.max(1, Math.floor(sHeight * scale));

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

              let visiblePixels = 0;
              for (let i = 0; i < mainData.data.length; i += 4) {
                const maskIntensity = usesAlpha ? maskData.data[i + 3] : maskData.data[i];
                mainData.data[i + 3] = Math.floor((mainData.data[i + 3] * maskIntensity) / 255);
                if (mainData.data[i + 3] > 15) visiblePixels++;
              }

              const visibleRatio = visiblePixels / (cW * cH);
              if (visibleRatio < 0.15) {
                throw new Error('La máscara eliminó demasiada información de la imagen (Safety Check).');
              }

              ctx.putImageData(mainData, 0, 0);
            }

            const base64 = canvas.toDataURL('image/png');
            
            // Guardamos tanto la textura renderizada como la telemetría métrica de Vision
            const cacheEntry = { base64, meta: data };
            await setCached(cacheKey, cacheEntry);
            
            state.processedSrc = base64;
            state.displaySrc = base64;
            state.meta = data;
            state.isProcessed = true;
            
            console.log(`[DEBUG-HHB] Vision API - Procesamiento y encolado finalizado con éxito.`);

          } catch (error: any) {
            console.warn(`[DEBUG-HHB] Vision API - Fallo de procesamiento, reteniendo original: ${error.message}`);
            state.error = error.message;
          } finally {
            state.isProcessing = false;
          }
        });

      } catch (error: any) {
        state.isProcessing = false;
      }
    };

    run();

    return state;
  };

  return { processAvatar };
};