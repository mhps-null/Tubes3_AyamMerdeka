import type {
  AlgorithmScanSummary,
  KeywordScanStatistic,
  StoredPageScanStatistics,
  TextMatch,
} from "./types";

function countMatchesByKeyword(matches: TextMatch[]): KeywordScanStatistic[] {
  const keywordCountMap = new Map<string, number>();

  for (const match of matches) {
    const currentCount = keywordCountMap.get(match.keyword) ?? 0;
    keywordCountMap.set(match.keyword, currentCount + 1);
  }

  return Array.from(keywordCountMap.entries())
    .map(([keyword, count]) => ({
      keyword,
      count,
    }))
    .sort((first, second) => second.count - first.count);
}

export function buildStoredPageScanStatistics(
  matches: TextMatch[],
  summaries: AlgorithmScanSummary[],
): StoredPageScanStatistics {
  return {
    pageTitle: document.title,
    pageUrl: window.location.href,
    totalMatches: matches.length,
    keywordStatistics: countMatchesByKeyword(matches),
    algorithmStatistics: summaries,
    updatedAt: new Date().toISOString(),
  };
}
