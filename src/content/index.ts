import { collectTextScanTargets } from "./domScanner";
import { loadKeywords } from "./keywordLoader";
import { scanPageTargets } from "./scanner";
import { resolveMatchesForHighlight } from "./matchResolver";
import { clearExistingHighlights, highlightMatches } from "./highlighter";
import { attachTooltipListeners, clearTooltip } from "./tooltip";
import { buildStoredPageScanStatistics } from "../shared/statistics";
import { saveScanStatistics } from "./statisticsStorage";
import { collectImageTargets } from "./domScanner";
import { extractTextFromImage } from "./ocrProcessor";
import { censorImageTarget, clearImageCensors } from "./imageCensor";

/**
 * Content Script Entry Point
 *
 * File ini menjadi koordinator utama proses deteksi.
 * Detail DOM scanner, keyword loader, algoritma, highlighter,
 * tooltip, dan statistik dipisah ke modul masing-masing.
 */

const EXTENSION_LOG_PREFIX = "[Judol Detector AyamMerdeka]";
const RESCAN_MESSAGE_TYPE = "JUDOL_DETECTOR_RESCAN_PAGE";
const SETTINGS_STORAGE_KEY = "judolDetectorSettings";
let isScanning = false;
let isOcrActive = false;

function logInfo(message: string, data?: unknown): void {
  if (data === undefined) {
    console.log(`${EXTENSION_LOG_PREFIX} ${message}`);
    return;
  }

  console.log(`${EXTENSION_LOG_PREFIX} ${message}`, data);
}

function logError(message: string, error: unknown): void {
  console.error(`${EXTENSION_LOG_PREFIX} ${message}`, error);
}

function getDocumentBody(): HTMLElement | null {
  return document.body;
}

function applyBlurState(isBlurActive: boolean): void {
  const body = getDocumentBody();
  if (body === null) return;

  if (isBlurActive) {
    body.classList.add("judol-blur-active");
  } else {
    body.classList.remove("judol-blur-active");
  }
}

function loadInitialSettings(): void {
  chrome.storage.local.get([SETTINGS_STORAGE_KEY], (result) => {
    const settings = result[SETTINGS_STORAGE_KEY] as { isBlurActive?: boolean } | undefined;
    const isBlurActive = settings?.isBlurActive ?? true;
    applyBlurState(isBlurActive);
  });
}

function attachClickInterceptor(): void {
  document.addEventListener("click", (event: MouseEvent) => {
    const body = getDocumentBody();
    if (body === null || !body.classList.contains("judol-blur-active")) {
      return;
    }

    const target = event.target as HTMLElement;
    
    if (target.closest(".judol-blur-target")) {
      event.preventDefault();
      event.stopPropagation();

      console.warn("Judol Detector: Tautan diblokir demi keamanan.");
    }
  }, true); 
}

async function runBackgroundOCR(imageTargets: any[], keywords: string[], currentScanResult: any) {
  isOcrActive = true;
  try {
    logInfo(`[Background] Scanning ${imageTargets.length} images`);
  
    for (const imgTarget of imageTargets) {
      logInfo(`[Background] Processing OCR for image ID: ${imgTarget.id}`);
      const ocrText = await extractTextFromImage(imgTarget.src);

      if (!ocrText || ocrText.trim() === "") continue;

      logInfo(`[Background] OCR text from image ${imgTarget.id}:`, ocrText);

      const mockTextNode = document.createTextNode(ocrText);
      const mockTarget = {
        id: -imgTarget.id, 
        node: mockTextNode,
        parentElement: imgTarget.node,
        text: ocrText,
        normalizedText: ocrText.toLowerCase().replace(/\s+/g, ' '),
      };

      const imgScanResult = scanPageTargets([mockTarget], keywords);

      if (imgScanResult.matches.length > 0) {
        logInfo(`[Background] Judol detected in image ${imgTarget.id}! Blurring image`);
        censorImageTarget(imgTarget);
        
        currentScanResult.matches.push(...imgScanResult.matches);

        for (const imgSummary of imgScanResult.summaries) {
          const existingSummary = currentScanResult.summaries.find(
            (s: any) => s.algorithm === imgSummary.algorithm
          );
          
          if (existingSummary) {
            existingSummary.matchCount += imgSummary.matchCount;
            existingSummary.executionTimeMs += imgSummary.executionTimeMs;
          } else {
            currentScanResult.summaries.push(imgSummary);
          }
        }

        const finalResolvedMatches = resolveMatchesForHighlight(currentScanResult.matches);
        const updatedStatistics = buildStoredPageScanStatistics(
          finalResolvedMatches, 
          currentScanResult.summaries,
        );
        
        await saveScanStatistics(updatedStatistics);
      }
    }
  }
  finally {
    logInfo(`[Background] Finished`);
    isOcrActive = false;
    chrome.runtime.sendMessage({ type: "OCR_COMPLETED" }).catch(() => {});
  }
}

async function rescanPage(reason: string): Promise<boolean> {
  if (isScanning) {
    logInfo("Scan skipped because another scan is running.");
    return false;
  }

  isScanning = true;

  try {
    const body = getDocumentBody();

    if (body === null) {
      logInfo("document.body not found. Detector skipped.");
      return false;
    }

    clearExistingHighlights();
    clearTooltip();
    clearImageCensors();

    logInfo("Content script loaded.");
    logInfo("Scan reason:", reason);
    logInfo("Current page title:", document.title);
    logInfo("Current page URL:", window.location.href);

    const keywords = await loadKeywords();
    const textTargets = collectTextScanTargets(body);

    const scanResult = scanPageTargets(textTargets, keywords);
    const matchesForHighlight = resolveMatchesForHighlight(scanResult.matches);

    const highlightedTargetCount = highlightMatches(
      textTargets,
      matchesForHighlight,
      scanResult.summaries,
    );

    logInfo("Highlighted text targets:", highlightedTargetCount);
    
    attachTooltipListeners();

    const initialStatistics = buildStoredPageScanStatistics(
      matchesForHighlight, 
      scanResult.summaries,
    );
    await saveScanStatistics(initialStatistics);

    logInfo("Start OCR");
    const imageTargets = collectImageTargets(body);
    logInfo("Match image targets:", imageTargets.length);

    if (imageTargets.length > 0) {
      runBackgroundOCR(imageTargets, keywords, scanResult).catch(err => {
        console.error("[OCR Background Error]", err);
      });
      return true;
    }
    
    return false;    
  } finally {
    isScanning = false;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CHECK_STATUS") {
    sendResponse({ 
      isScanning: isScanning, 
      isOcrRunning: isOcrActive 
    });
    return false;
  }

  if (message?.type === RESCAN_MESSAGE_TYPE) {
    rescanPage("manual-rescan")
    .then((isOcrRunning) => {
      sendResponse({
        ok: true,
        isOcrRunning: isOcrRunning 
      });
    })
    .catch((error: unknown) => {
      logError("Failed to handle manual rescan.", error);
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return true; 
  }

  return false;
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (SETTINGS_STORAGE_KEY in changes) {
    const newSettings = changes[SETTINGS_STORAGE_KEY].newValue as { isBlurActive?: boolean } | undefined;
    const isBlurActive = newSettings?.isBlurActive ?? true;
    applyBlurState(isBlurActive);
  }
});

loadInitialSettings();
attachClickInterceptor();

rescanPage("initial-load").catch((error: unknown) => {
  logError("Failed to scan page.", error);
});

export {};
