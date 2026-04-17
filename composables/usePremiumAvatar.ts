import { reactive } from 'vue'

const PIPELINE_VERSION = 'v9_face_circle';

interface CacheEntry {
  base64: string;
  faceBase64?: string;
  meta: any;
}

const memoryCache = new Map<string, CacheEntry>();

const initDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (typeof window === 'undefined') return reject('SSR');
  const req = indexedDB.open('HHBAvatarDB', 3);
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
    // Falla local ignorada
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

type Job = () => Promise<void>;
const queue: Job[] = [];
let activeJobs = 0;
const MAX_CONCURRENCY = 3;

const processQueue = () => {
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
      processedFaceSrc: null as string | null,
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
        
        const cached = await getCached(cacheKey);
        if (cached) {
          state.processedSrc = cached.base64;
          state.processedFaceSrc = cached.faceBase64 || cached.base64;
          state.displaySrc = cached.base64;
          state.meta = cached.meta;
          state.isProcessed = true;
          state.isProcessing = false;
          return;
        }

        enqueueJob(async () => {
          try {
            const formData = new FormData();
            formData.append('imageUrl', originalImageUrl);

            const res = await window.fetch('https://vision.casitaapps.com/analyze', {
              method: 'POST',
              body: formData
            });

            if (!res.ok) throw new Error(`El servicio rechazó la solicitud (${res.status}).`);

            const data = await res.json();
            if (!data || !data.ok || !data.cropBox) throw new Error('Respuesta incompleta de Visión.');

            const imgUrl = data.imageKey ? `https://vision.casitaapps.com/image/${data.imageKey}` : originalImageUrl;
            const img = await loadImage(imgUrl);

            const cb = {
              xMin: Math.max(0, Math.min(1, data.cropBox.xMin || 0)),
              yMin: Math.max(0, Math.min(1, data.cropBox.yMin || 0)),
              xMax: Math.max(0, Math.min(1, data.cropBox.xMax || 1)),
              yMax: Math.max(0, Math.min(1, data.cropBox.yMax || 1))
            };

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
            const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cW, cH);

            if (data.maskAvailable && data.maskUrl) {
              const maskImg = await loadImage(data.maskUrl);
              const mc = document.createElement('canvas');
              mc.width = cW;
              mc.height = cH;
              const mCtx = mc.getContext('2d', { willReadFrequently: true })!;

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

              for (let i = 0; i < mainData.data.length; i += 4) {
                const maskIntensity = usesAlpha ? maskData.data[i + 3] : maskData.data[i];
                mainData.data[i + 3] = Math.floor((mainData.data[i + 3] * maskIntensity) / 255);
              }
              ctx.putImageData(mainData, 0, 0);
            }

            const base64 = canvas.toDataURL('image/png');
            let faceBase64 = base64;

            // Capa 2: Extracción Circular específica para rostros 3D usando FaceBox
            if (data.faceBox) {
              const faceCanvas = document.createElement('canvas');
              faceCanvas.width = cW;
              faceCanvas.height = cH;
              const fCtx = faceCanvas.getContext('2d')!;

              const fxMin = Math.max(0, data.faceBox.xMin);
              const fxMax = Math.min(1, data.faceBox.xMax);
              const fyMin = Math.max(0, data.faceBox.yMin);
              const fyMax = Math.min(1, data.faceBox.yMax);

              const fcX = ((fxMin + fxMax) / 2 - cb.xMin) / (cb.xMax - cb.xMin) * cW;
              const fcY = ((fyMin + fyMax) / 2 - cb.yMin) / (cb.yMax - cb.yMin) * cH;
              
              const fWidth = (fxMax - fxMin) / (cb.xMax - cb.xMin) * cW;
              const fHeight = (fyMax - fyMin) / (cb.yMax - cb.yMin) * cH;
              
              // Radio amplio para incluir cara, orejas y cabello
              const radius = Math.max(fWidth, fHeight) * 0.75; 

              fCtx.beginPath();
              fCtx.arc(fcX, fcY, radius, 0, Math.PI * 2);
              fCtx.fillStyle = 'white';
              fCtx.fill();

              fCtx.globalCompositeOperation = 'source-in';
              fCtx.drawImage(canvas, 0, 0);
              
              faceBase64 = faceCanvas.toDataURL('image/png');
            }

            const cacheEntry = { base64, faceBase64, meta: data };
            await setCached(cacheKey, cacheEntry);
            
            state.processedSrc = base64;
            state.processedFaceSrc = faceBase64;
            state.displaySrc = base64;
            state.meta = data;
            state.isProcessed = true;

          } catch (error: any) {
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