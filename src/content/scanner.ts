import { ahoCorasickSearch } from "../algorithms/ahoCorasick";
import { boyerMooreSearch } from "../algorithms/boyerMoore";
import { fuzzySearch } from "../algorithms/weightedLevenshtein";
import { kmpSearch } from "../algorithms/kmp";
import { rabinKarpSearch } from "../algorithms/rabinKarp";
import { regexSearch } from "../algorithms/regexMatcher";
import { normalizeTextForMatching } from "../shared/textNormalizer";
import type {
  AlgorithmScanSummary,
  PageScanResult,
  TextMatch,
  TextScanTarget,
} from "../shared/types";

function getCurrentTimeMs(): number {
  return performance.now();
}

function mapTargetsById(
  targets: TextScanTarget[],
): Map<number, TextScanTarget> {
  const targetMap = new Map<number, TextScanTarget>();

  for (const target of targets) {
    targetMap.set(target.id, target);
  }

  return targetMap;
}

function attachOriginalMatchedText(
  matches: TextMatch[],
  targets: TextScanTarget[],
): TextMatch[] {
  const targetMap = mapTargetsById(targets);

  return matches.map((match) => {
    const target = targetMap.get(match.targetId);

    if (target === undefined) {
      return match;
    }

    const originalMatchedText = target.text.slice(
      match.startIndex,
      match.endIndex,
    );

    return {
      ...match,
      matchedText: originalMatchedText,
    };
  });
}

function normalizeKeywords(keywords: string[]): string[] {
  return keywords.map((keyword) => normalizeTextForMatching(keyword));
}

function scanWithKmp(
  targets: TextScanTarget[],
  keywords: string[],
): {
  matches: TextMatch[];
  summary: AlgorithmScanSummary;
} {
  const startTime = getCurrentTimeMs();

  const matches = targets.flatMap((target) =>
    keywords.flatMap((keyword) =>
      kmpSearch(target.normalizedText, keyword, target.id),
    ),
  );

  const endTime = getCurrentTimeMs();

  return {
    matches: attachOriginalMatchedText(matches, targets),
    summary: {
      algorithm: "KMP",
      matchCount: matches.length,
      executionTimeMs: endTime - startTime,
    },
  };
}

function scanWithBoyerMoore(
  targets: TextScanTarget[],
  keywords: string[],
): {
  matches: TextMatch[];
  summary: AlgorithmScanSummary;
} {
  const startTime = getCurrentTimeMs();

  const matches = targets.flatMap((target) =>
    keywords.flatMap((keyword) =>
      boyerMooreSearch(target.normalizedText, keyword, target.id),
    ),
  );

  const endTime = getCurrentTimeMs();

  return {
    matches: attachOriginalMatchedText(matches, targets),
    summary: {
      algorithm: "BOYER_MOORE",
      matchCount: matches.length,
      executionTimeMs: endTime - startTime,
    },
  };
}

function scanWithRegex(targets: TextScanTarget[]): {
  matches: TextMatch[];
  summary: AlgorithmScanSummary;
} {
  const startTime = getCurrentTimeMs();

  const matches = targets.flatMap((target) =>
    regexSearch(target.normalizedText, target.id),
  );

  const endTime = getCurrentTimeMs();

  return {
    matches: attachOriginalMatchedText(matches, targets),
    summary: {
      algorithm: "REGEX",
      matchCount: matches.length,
      executionTimeMs: endTime - startTime,
    },
  };
}

function scanWithFuzzy(
  targets: TextScanTarget[],
  keywords: string[],
): {
  matches: TextMatch[];
  summary: AlgorithmScanSummary;
} {
  const startTime = getCurrentTimeMs();

  const matches = targets.flatMap((target) =>
    fuzzySearch(target.normalizedText, keywords, target.id),
  );

  const endTime = getCurrentTimeMs();

  return {
    matches: attachOriginalMatchedText(matches, targets),
    summary: {
      algorithm: "FUZZY",
      matchCount: matches.length,
      executionTimeMs: endTime - startTime,
    },
  };
}

function scanWithAhoCorasick(
  targets: TextScanTarget[],
  keywords: string[],
): {
  matches: TextMatch[];
  summary: AlgorithmScanSummary;
} {
  const startTime = getCurrentTimeMs();

  const matches = targets.flatMap((target) =>
    ahoCorasickSearch(target.normalizedText, keywords, target.id),
  );

  const endTime = getCurrentTimeMs();

  return {
    matches: attachOriginalMatchedText(matches, targets),
    summary: {
      algorithm: "AHO_CORASICK",
      matchCount: matches.length,
      executionTimeMs: endTime - startTime,
    },
  };
}

function scanWithRabinKarp(
  targets: TextScanTarget[],
  keywords: string[],
): {
  matches: TextMatch[];
  summary: AlgorithmScanSummary;
} {
  const startTime = getCurrentTimeMs();

  const matches = targets.flatMap((target) =>
    keywords.flatMap((keyword) =>
      rabinKarpSearch(target.normalizedText, keyword, target.id),
    ),
  );

  const endTime = getCurrentTimeMs();

  return {
    matches: attachOriginalMatchedText(matches, targets),
    summary: {
      algorithm: "RABIN_KARP",
      matchCount: matches.length,
      executionTimeMs: endTime - startTime,
    },
  };
}

export function scanPageTargets(
  targets: TextScanTarget[],
  keywords: string[],
): PageScanResult {
  const normalizedKeywords = normalizeKeywords(keywords);

  const kmpResult = scanWithKmp(targets, normalizedKeywords);
  const boyerMooreResult = scanWithBoyerMoore(targets, normalizedKeywords);
  const regexResult = scanWithRegex(targets);
  const fuzzyResult = scanWithFuzzy(targets, normalizedKeywords);
  const ahoCorasickResult = scanWithAhoCorasick(targets, normalizedKeywords);
  const rabinKarpResult = scanWithRabinKarp(targets, normalizedKeywords);

  return {
    matches: [
      ...kmpResult.matches,
      ...boyerMooreResult.matches,
      ...regexResult.matches,
      ...fuzzyResult.matches,
      ...ahoCorasickResult.matches,
      ...rabinKarpResult.matches,
    ],
    summaries: [
      kmpResult.summary,
      boyerMooreResult.summary,
      regexResult.summary,
      fuzzyResult.summary,
      ahoCorasickResult.summary,
      rabinKarpResult.summary,
    ],
  };
}
