import type {
  AlgorithmScanSummary,
  KeywordScanStatistic,
  StoredPageScanStatistics,
} from "../shared/types";

const SCAN_STATISTICS_STORAGE_KEY = "judolDetectorScanStatistics";

function getElementById(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (element === null) {
    throw new Error(`Element with id "${id}" not found.`);
  }

  return element;
}

function formatExecutionTime(timeMs: number): string {
  return `${timeMs.toFixed(3)} ms`;
}

function renderAlgorithmStats(summaries: AlgorithmScanSummary[]): void {
  const container = getElementById("algorithm-stats");
  container.innerHTML = "";

  if (summaries.length === 0) {
    container.textContent = "Belum ada statistik algoritma.";
    return;
  }

  for (const summary of summaries) {
    const row = document.createElement("div");
    row.className = "stat";

    const label = document.createElement("span");
    label.textContent = summary.algorithm;

    const value = document.createElement("strong");
    value.textContent = `${summary.matchCount} match | ${formatExecutionTime(
      summary.executionTimeMs,
    )}`;

    row.appendChild(label);
    row.appendChild(value);
    container.appendChild(row);
  }
}

function renderKeywordStats(keywordStats: KeywordScanStatistic[]): void {
  const container = getElementById("keyword-stats");
  container.innerHTML = "";

  if (keywordStats.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Belum ada keyword terdeteksi.";
    container.appendChild(empty);
    return;
  }

  const maxCount = Math.max(...keywordStats.map((item) => item.count));

  for (const item of keywordStats.slice(0, 10)) {
    const percentage = maxCount === 0 ? 0 : (item.count / maxCount) * 100;

    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("div");
    label.className = "bar-label";

    const keyword = document.createElement("span");
    keyword.textContent = item.keyword;

    const count = document.createElement("strong");
    count.textContent = String(item.count);

    const track = document.createElement("div");
    track.className = "bar-track";

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${percentage}%`;

    label.appendChild(keyword);
    label.appendChild(count);
    track.appendChild(fill);
    row.appendChild(label);
    row.appendChild(track);
    container.appendChild(row);
  }
}

function renderStatistics(statistics: StoredPageScanStatistics): void {
  getElementById("total-matches").textContent = String(statistics.totalMatches);
  getElementById("page-title").textContent = statistics.pageTitle;
  getElementById("page-url").textContent = statistics.pageUrl;
  getElementById("updated-at").textContent = `Updated: ${new Date(
    statistics.updatedAt,
  ).toLocaleString()}`;

  renderAlgorithmStats(statistics.algorithmStatistics);
  renderKeywordStats(statistics.keywordStatistics);
}

function renderEmptyState(): void {
  getElementById("total-matches").textContent = "0";
  getElementById("page-title").textContent = "Belum ada data scan.";
  getElementById("page-url").textContent = "Buka halaman web lalu refresh.";
  getElementById("updated-at").textContent = "-";

  renderAlgorithmStats([]);
  renderKeywordStats([]);
}

chrome.storage.local.get([SCAN_STATISTICS_STORAGE_KEY], (result) => {
  const statistics = result[SCAN_STATISTICS_STORAGE_KEY] as
    | StoredPageScanStatistics
    | undefined;

  if (statistics === undefined) {
    renderEmptyState();
    return;
  }

  renderStatistics(statistics);
});

export {};
