let creating: Promise<void> | null = null;

async function setupOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) return;

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.WORKERS || 'WORKERS'],
      justification: 'Menjalankan Tesseract OCR di latar belakang'
    });
    await creating;
    creating = null;
  }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "PROCESS_OCR") {
    
    setupOffscreenDocument().then(() => {
      chrome.runtime.sendMessage(
        { type: "RUN_TESSERACT", url: request.url },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        }
      );
    });

    return true; 
  }
});