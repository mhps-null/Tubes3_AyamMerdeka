export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    const response = await Promise.race([
      new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          { type: "PROCESS_OCR", url: imageUrl },
          (res) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(res);
            }
          }
        );
      }),
      new Promise<any>((resolve) => {
        setTimeout(() => resolve({ success: false, error: "Timeout" }), 15000);
      })
    ]);

    if (!response || !response.success) {
      console.warn(`[OCR Skip] Skipped image:`, response?.error);
      return "";
    }

    return response.text;
  } catch (error) {
    return "";
  }
}