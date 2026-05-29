import { tokenizeTextForMatching } from "../shared/textTokenizer";
import type { TextMatch } from "../shared/types";

interface SimilarcharGroup {
  simChars: string[];
  cost: number;
}

interface WeightedDistanceResult {
  distance: number;
  comparisonCount: number;
}

const FUZZY_MATCH_THRESHOLD = 0.3;

const SIMILAR_CHARACTERS: Record<string, SimilarcharGroup[]> = {
  A: [
    { simChars: ["4", "@"], cost: 0.2 },
    { simChars: ["А", "а", "Α", "α"], cost: 0.1 },
  ],
  B: [
    { simChars: ["8"], cost: 0.2 },
    { simChars: ["В", "в"], cost: 0.1 },
  ],
  C: [{ simChars: ["С", "с", "Ϲ", "ϲ"], cost: 0.1 }],
  E: [
    { simChars: ["3"], cost: 0.2 },
    { simChars: ["Е", "е", "Ε", "ε"], cost: 0.1 },
  ],
  G: [{ simChars: ["9", "6"], cost: 0.2 }],
  H: [{ simChars: ["Н", "Η"], cost: 0.1 }],
  I: [
    { simChars: ["1", "!", "l"], cost: 0.2 },
    { simChars: ["І", "і", "Ι", "ι"], cost: 0.1 },
  ],
  J: [{ simChars: ["Ј"], cost: 0.1 }],
  K: [{ simChars: ["К", "к", "Κ", "κ"], cost: 0.1 }],
  L: [{ simChars: ["1", "|"], cost: 0.2 }],
  M: [{ simChars: ["М", "м", "Μ", "μ"], cost: 0.1 }],
  N: [{ simChars: ["Н", "Ν"], cost: 0.1 }],
  O: [
    { simChars: ["0"], cost: 0.2 },
    { simChars: ["О", "о", "Ο", "ο"], cost: 0.1 },
  ],
  P: [{ simChars: ["Р", "р", "Ρ", "ρ"], cost: 0.1 }],
  R: [{ simChars: ["2"], cost: 0.2 }],
  S: [
    { simChars: ["5", "$"], cost: 0.2 },
    { simChars: ["Ѕ", "ѕ"], cost: 0.1 },
  ],
  T: [
    { simChars: ["7", "+"], cost: 0.2 },
    { simChars: ["Т", "т", "Τ", "τ"], cost: 0.1 },
  ],
  X: [{ simChars: ["Х", "х", "Χ", "χ"], cost: 0.1 }],
  Y: [{ simChars: ["У", "у", "Υ", "υ"], cost: 0.1 }],
  Z: [
    { simChars: ["2"], cost: 0.2 },
    { simChars: ["З", "Ζ"], cost: 0.1 },
  ],
};

/**
 * Implementasi Weighted Levenshtein Distance.
 *
 * Ketentuan spek:
 * - Dipakai untuk fuzzy matching.
 * - Substitusi karakter mirip visual diberi penalti lebih kecil.
 * - Contoh: O/0, A/4, I/1.
 * - Harus memakai threshold agar tidak terlalu banyak false positive.
 */
function getSimilarityCost(source: string, target: string): number | undefined {
  const sourceChar = source.toUpperCase();
  const targetChar = target.toUpperCase();
  const charGroups = SIMILAR_CHARACTERS[sourceChar];

  if (charGroups === undefined) {
    return undefined;
  }

  for (const charGroup of charGroups) {
    for (const simChar of charGroup.simChars) {
      if (simChar.toUpperCase() === targetChar) {
        return charGroup.cost;
      }
    }
  }

  return undefined;
}

function weightedSimilarity(first: string, second: string): number {
  if (first.toUpperCase() === second.toUpperCase()) {
    return 0;
  }

  return (getSimilarityCost(first, second) ?? getSimilarityCost(second, first) ?? 1 );
}

function calculateWeightedDistance(
  firstWord: string,
  secondWord: string,
): WeightedDistanceResult {
  const firstLength = firstWord.length;
  const secondLength = secondWord.length;
  const dp: number[][] = Array.from({ length: firstLength + 1 }, () => new Array(secondLength + 1).fill(0));
  let comparisonCount = 0;

  for (let row = 0; row <= firstLength; row++) {
    dp[row][0] = row;
  }

  for (let column = 0; column <= secondLength; column++) {
    dp[0][column] = column;
  }

  for (let row = 1; row <= firstLength; row++) {
    for (let column = 1; column <= secondLength; column++) {
      comparisonCount++;

      const substitutionCost = weightedSimilarity(firstWord[row - 1],secondWord[column - 1],);

      dp[row][column] = Math.min(
        dp[row - 1][column] + 1,
        dp[row][column - 1] + 1,
        dp[row - 1][column - 1] + substitutionCost,
      );
    }
  }

  return {distance: dp[firstLength][secondLength],comparisonCount,};
}

function canReachThreshold(keyword: string, candidate: string): boolean {
  const maxLength = Math.max(keyword.length, candidate.length);

  if (maxLength === 0) {
    return true;
  }

  const minimumPossibleDistance = Math.abs(keyword.length - candidate.length);
  return minimumPossibleDistance / maxLength <= FUZZY_MATCH_THRESHOLD;
}

export function fuzzySearch(
  text: string,
  keywords: string[],
  targetId: number,
): TextMatch[] {
  const results: TextMatch[] = [];
  const tokens = tokenizeTextForMatching(text);

  if (tokens.length === 0 || keywords.length === 0) {
    return results;
  }

  for (const keyword of keywords) {
    const keywordTokens = tokenizeTextForMatching(keyword);

    if (keyword.length === 0 || keywordTokens.length === 0) {
      continue;
    }

    const maxWindowWordCount = Math.min(tokens.length,keywordTokens.length + 1,);

    for (let windowWordCount = 1;windowWordCount <= maxWindowWordCount;windowWordCount++) {
      for (let windowStart = 0;windowStart <= tokens.length - windowWordCount;windowStart++) {
        const windowEnd = windowStart + windowWordCount - 1;
        const startIndex = tokens[windowStart].startIndex;
        const endIndex = tokens[windowEnd].endIndex;
        const candidateText = text.slice(startIndex, endIndex);

        if (!canReachThreshold(keyword, candidateText)) {
          continue;
        }

        const weightedDistance = calculateWeightedDistance(keyword,candidateText,);
        const normalizedDistance =weightedDistance.distance /Math.max(keyword.length, candidateText.length);

        if (normalizedDistance <= FUZZY_MATCH_THRESHOLD) {
          results.push({
            targetId,
            algorithm: "FUZZY",
            keyword,
            matchedText: candidateText,
            startIndex,
            endIndex,
            comparisonCount: weightedDistance.comparisonCount,
          });
        }
      }
    }
  }

  return results;
}
