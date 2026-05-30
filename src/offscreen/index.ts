import Tesseract from "tesseract.js";

async function getSafeImageData(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
  
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error(`Open valid image: ${blob.type}`);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    
    img.onload = () => {
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_WIDTH) {
        const ratio = MAX_WIDTH / width;
        width = width * ratio;
        height = height * ratio;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Fail to load canvas"));
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/png'); 
      URL.revokeObjectURL(objectUrl);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Fail to load image pixels"));
    };
    
    img.src = objectUrl;
  });
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "RUN_TESSERACT") {
    (async () => {
      let worker;
      try {
        const safeBase64 = await getSafeImageData(request.url);

        worker = await Tesseract.createWorker('eng+ind', 1, {
          workerPath: chrome.runtime.getURL("tesseract/worker.min.js"),
          corePath: chrome.runtime.getURL("tesseract/tesseract-core.wasm.js"),
          langPath: chrome.runtime.getURL("tesseract/lang-data"), 
          workerBlobURL: false, 
          logger: (m) => console.log("[Offscreen OCR]", m.status, Math.round(m.progress * 100) + "%"),
        });

        const result = await worker.recognize(safeBase64);
        await worker.terminate();

        sendResponse({ success: true, text: result.data.text });
      } catch (error: unknown) {
        if (worker) {
          try { await worker.terminate(); } catch (e) {} 
        }
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    })();

    return true; 
  }
});