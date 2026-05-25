import type { StoredPageScanStatistics } from "../shared/types";

const SCAN_STATISTICS_STORAGE_KEY = "judolDetectorScanStatistics";

export async function saveScanStatistics(
  statistics: StoredPageScanStatistics,
): Promise<void> {
  await chrome.storage.local.set({
    [SCAN_STATISTICS_STORAGE_KEY]: statistics,
  });
}
