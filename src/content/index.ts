import { collectTextScanTargets } from "./domScanner";
import { loadKeywords } from "./keywordLoader";
import { scanPageTargets } from "./scanner";
import { resolveMatchesForHighlight } from "./matchResolver";
import { clearExistingHighlights, highlightMatches } from "./highlighter";
import { attachTooltipListeners, clearTooltip } from "./tooltip";
import { buildStoredPageScanStatistics } from "../shared/statistics";
import { saveScanStatistics } from "./statisticsStorage";

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

async function rescanPage(reason: string): Promise<void> {
  if (isScanning) {
    logInfo("Scan skipped because another scan is running.");
    return;
  }

  isScanning = true;

  try {
    const body = getDocumentBody();

    if (body === null) {
      logInfo("document.body not found. Detector skipped.");
      return;
    }

    clearExistingHighlights();
    clearTooltip();

    logInfo("Content script loaded.");
    logInfo("Scan reason:", reason);
    logInfo("Current page title:", document.title);
    logInfo("Current page URL:", window.location.href);

    const keywords = await loadKeywords();
    const textTargets = collectTextScanTargets(body);

    logInfo("Keywords loaded:", keywords);
    logInfo("Text scan targets found:", textTargets.length);
    logInfo(
      "Text scan target samples:",
      textTargets.slice(0, 5).map((target) => ({
        id: target.id,
        tag: target.parentElement.tagName.toLowerCase(),
        text: target.text.trim(),
        normalizedText: target.normalizedText.trim(),
      })),
    );

    const scanResult = scanPageTargets(textTargets, keywords);

    logInfo("Scan summaries:", scanResult.summaries);
    logInfo("Total matches found:", scanResult.matches.length);
    logInfo("Match samples:", scanResult.matches.slice(0, 10));

    const matchesForHighlight = resolveMatchesForHighlight(scanResult.matches);

    logInfo("Resolved matches for highlight:", matchesForHighlight.length);
    logInfo("Resolved match samples:", matchesForHighlight.slice(0, 10));

    const highlightedTargetCount = highlightMatches(
      textTargets,
      matchesForHighlight,
      scanResult.summaries,
    );

    attachTooltipListeners();

    const storedStatistics = buildStoredPageScanStatistics(
      scanResult.matches,
      scanResult.summaries,
    );

    await saveScanStatistics(storedStatistics);

    logInfo("Highlighted text targets:", highlightedTargetCount);
    logInfo("Scan statistics saved:", storedStatistics);
  } finally {
    isScanning = false;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== RESCAN_MESSAGE_TYPE) {
    return false;
  }

  rescanPage("manual-rescan")
    .then(() => {
      sendResponse({
        ok: true,
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
