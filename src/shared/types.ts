export type MatchingAlgorithm =
  | "REGEX"
  | "KMP"
  | "BOYER_MOORE"
  | "FUZZY"
  | "AHO_CORASICK"
  | "RABIN_KARP"
  | "OCR";

export interface TextScanTarget {
  id: number;
  node: Text;
  parentElement: Element;
  text: string;
  normalizedText: string;
}

export interface TextMatch {
  targetId: number;
  algorithm: MatchingAlgorithm;
  keyword: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  comparisonCount?: number;
}

export interface AlgorithmScanSummary {
  algorithm: MatchingAlgorithm;
  matchCount: number;
  executionTimeMs: number;
}

export interface PageScanResult {
  matches: TextMatch[];
  summaries: AlgorithmScanSummary[];
}

export interface KeywordScanStatistic {
  keyword: string;
  count: number;
}

export interface StoredPageScanStatistics {
  pageTitle: string;
  pageUrl: string;
  totalMatches: number;
  keywordStatistics: KeywordScanStatistic[];
  algorithmStatistics: AlgorithmScanSummary[];
  updatedAt: string;
}

export interface ImageScanTarget {
  id: number;
  node: HTMLImageElement;
  src: string;
}