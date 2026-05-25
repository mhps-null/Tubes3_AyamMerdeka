import { collectTextScanTargets } from "./domScanner";
import { loadKeywords } from "./keywordLoader";
import { scanPageTargets } from "./scanner";
import { resolveMatchesForHighlight } from "./matchResolver";
import { clearExistingHighlights, highlightMatches } from "./highlighter";
import { attachTooltipListeners, clearTooltip } from "./tooltip";
import { buildStoredPageScanStatistics } from "../shared/statistics";
import { saveScanStatistics } from "./statisticsStorage";
import { DETECTOR_ELEMENT_ATTRIBUTE, STYLE_ELEMENT_ID } from "./domConstants";

/**
 * Content Script Entry Point
 *
 * File ini menjadi koordinator utama proses deteksi.
 * Detail DOM scanner, keyword loader, algoritma, highlighter,
 * tooltip, dan statistik dipisah ke modul masing-masing.
 */

const EXTENSION_LOG_PREFIX = "[Judol Detector AyamMerdeka]";

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

function injectHighlightStyle(): void {
  const styleId = STYLE_ELEMENT_ID;

  if (document.getElementById(styleId) !== null) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.setAttribute(DETECTOR_ELEMENT_ATTRIBUTE, "style");
  style.textContent = `
  .judol-detector-highlight {
    background-color: yellow;
    color: inherit;
    border-radius: 3px;
    padding: 0 2px;
    cursor: help;
  }

  .judol-detector-tooltip {
    position: fixed;
    z-index: 2147483647;
    background: #111;
    color: #fff;
    font-size: 12px;
    line-height: 1.4;
    padding: 8px 10px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    pointer-events: none;
    max-width: 260px;
  }
`;

  document.documentElement.appendChild(style);
}

async function runDetector(): Promise<void> {
  const body = getDocumentBody();

  if (body === null) {
    logInfo("document.body not found. Detector skipped.");
    return;
  }

  clearExistingHighlights();
  clearTooltip();
  injectHighlightStyle();

  logInfo("Content script loaded.");
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
}

runDetector().catch((error: unknown) => {
  logError("Failed to run detector.", error);
});

export {};
