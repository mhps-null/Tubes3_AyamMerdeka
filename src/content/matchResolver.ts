import type { MatchingAlgorithm, TextMatch } from "../shared/types";

const ALGORITHM_PRIORITY: Record<MatchingAlgorithm, number> = {
  KMP: 1,
  BOYER_MOORE: 2,
  AHO_CORASICK: 3,
  RABIN_KARP: 4,
  REGEX: 5,
  FUZZY: 6,
  OCR: 7,
};

function getMatchLength(match: TextMatch): number {
  return match.endIndex - match.startIndex;
}

function compareMatches(first: TextMatch, second: TextMatch): number {
  if (first.targetId !== second.targetId) {
    return first.targetId - second.targetId;
  }

  if (first.startIndex !== second.startIndex) {
    return first.startIndex - second.startIndex;
  }

  const firstLength = getMatchLength(first);
  const secondLength = getMatchLength(second);

  if (firstLength !== secondLength) {
    return secondLength - firstLength;
  }

  return (
    ALGORITHM_PRIORITY[first.algorithm] - ALGORITHM_PRIORITY[second.algorithm]
  );
}

function isOverlapping(first: TextMatch, second: TextMatch): boolean {
  return (
    first.startIndex < second.endIndex && second.startIndex < first.endIndex
  );
}

function groupMatchesByTargetId(
  matches: TextMatch[],
): Map<number, TextMatch[]> {
  const groupedMatches = new Map<number, TextMatch[]>();

  for (const match of matches) {
    const currentMatches = groupedMatches.get(match.targetId) ?? [];
    currentMatches.push(match);
    groupedMatches.set(match.targetId, currentMatches);
  }

  return groupedMatches;
}

function resolveTargetMatches(matches: TextMatch[]): TextMatch[] {
  const sortedMatches = [...matches].sort(compareMatches);
  const resolvedMatches: TextMatch[] = [];

  for (const match of sortedMatches) {
    const hasOverlap = resolvedMatches.some((resolvedMatch) =>
      isOverlapping(match, resolvedMatch),
    );

    if (!hasOverlap) {
      resolvedMatches.push(match);
    }
  }

  return resolvedMatches.sort(
    (first, second) => first.startIndex - second.startIndex,
  );
}

export function resolveMatchesForHighlight(matches: TextMatch[]): TextMatch[] {
  const groupedMatches = groupMatchesByTargetId(matches);
  const resolvedMatches: TextMatch[] = [];

  for (const targetMatches of groupedMatches.values()) {
    resolvedMatches.push(...resolveTargetMatches(targetMatches));
  }

  return resolvedMatches.sort(compareMatches);
}
