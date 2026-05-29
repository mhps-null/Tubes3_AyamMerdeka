import {
  buildAhoCorasickAutomaton,
  searchAhoCorasickAutomaton,
} from "../algorithms/ahoCorasick";
import { boyerMooreSearch } from "../algorithms/boyerMoore";
import {
  fuzzySearchPrepared,
  prepareFuzzyKeywords,
} from "../algorithms/weightedLevenshtein";
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

function createMatchedTargetIdSet(matches: TextMatch[]): Set<number> {
  const matchedTargetIds = new Set<number>();

  for (const match of matches) {
    matchedTargetIds.add(match.targetId);
  }

  return matchedTargetIds;
}

function filterUnmatchedTargets(
  targets: TextScanTarget[],
  matches: TextMatch[],
): TextScanTarget[] {
  const matchedTargetIds = createMatchedTargetIdSet(matches);

  return targets.filter((target) => !matchedTargetIds.has(target.id));
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

  if (targets.length === 0 || keywords.length === 0) {
    const endTime = getCurrentTimeMs();

    return {
      matches: [],
      summary: {
        algorithm: "FUZZY",
        matchCount: 0,
        executionTimeMs: endTime - startTime,
      },
    };
  }

  const preparedKeywords = prepareFuzzyKeywords(keywords);

  const matches = targets.flatMap((target) =>
    fuzzySearchPrepared(target.normalizedText, preparedKeywords, target.id),
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
  const automaton = buildAhoCorasickAutomaton(keywords);

  const matches = targets.flatMap((target) =>
    searchAhoCorasickAutomaton(target.normalizedText, automaton, target.id),
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
  const ahoCorasickResult = scanWithAhoCorasick(targets, normalizedKeywords);
  const rabinKarpResult = scanWithRabinKarp(targets, normalizedKeywords);
  const fuzzyTargets = filterUnmatchedTargets(targets, [
    ...kmpResult.matches,
    ...boyerMooreResult.matches,
    ...regexResult.matches,
    ...ahoCorasickResult.matches,
    ...rabinKarpResult.matches,
  ]);
  const fuzzyResult = scanWithFuzzy(fuzzyTargets, normalizedKeywords);

  return {
    matches: [
      ...kmpResult.matches,
      ...boyerMooreResult.matches,
      ...regexResult.matches,
      ...ahoCorasickResult.matches,
      ...rabinKarpResult.matches,
      ...fuzzyResult.matches,
    ],
    summaries: [
      kmpResult.summary,
      boyerMooreResult.summary,
      regexResult.summary,
      ahoCorasickResult.summary,
      rabinKarpResult.summary,
      fuzzyResult.summary,
    ],
  };
}
