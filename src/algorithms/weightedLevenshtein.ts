import {
  tokenizeTextForMatching,
  type TextToken,
} from "../shared/textTokenizer";
import type { TextMatch } from "../shared/types";

interface SimilarcharGroup {
  simChars: string[];
  cost: number;
}

interface WeightedDistanceResult {
  distance: number;
  comparisonCount: number;
}

export interface PreparedFuzzyKeyword {
  keyword: string;
  tokens: TextToken[];
  minWindowWordCount: number;
  maxWindowWordCount: number;
}

const FUZZY_MATCH_THRESHOLD = 0.3;
const FUZZY_WINDOW_WORD_TOLERANCE = 1;

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

  return getSimilarityCost(first, second) ?? getSimilarityCost(second, first) ?? 1;
}

function calculateWeightedDistance(
  firstWord: string,
  secondWord: string,
  maxAllowedDistance: number,
): WeightedDistanceResult {
  const firstLength = firstWord.length;
  const secondLength = secondWord.length;
  let comparisonCount = 0;

  if (firstLength === 0) {
    return { distance: secondLength, comparisonCount };
  }

  if (secondLength === 0) {
    return { distance: firstLength, comparisonCount };
  }

  const bandWidth = Math.max(
    Math.ceil(maxAllowedDistance),
    Math.abs(firstLength - secondLength),
  );

  let previousRow = new Array<number>(secondLength + 1).fill(
    Number.POSITIVE_INFINITY,
  );

  for (let column = 0; column <= Math.min(secondLength, bandWidth); column++) {
    previousRow[column] = column;
  }

  for (let row = 1; row <= firstLength; row++) {
    const currentRow = new Array<number>(secondLength + 1).fill(
      Number.POSITIVE_INFINITY,
    );
    const minColumn = Math.max(1, row - bandWidth);
    const maxColumn = Math.min(secondLength, row + bandWidth);

    if (row <= bandWidth) {
      currentRow[0] = row;
    }

    for (let column = minColumn; column <= maxColumn; column++) {
      comparisonCount++;

      const substitutionCost = weightedSimilarity(
        firstWord[row - 1],
        secondWord[column - 1],
      );

      currentRow[column] = Math.min(
        previousRow[column] + 1,
        currentRow[column - 1] + 1,
        previousRow[column - 1] + substitutionCost,
      );
    }

    previousRow = currentRow;
  }

  return {
    distance: previousRow[secondLength],
    comparisonCount,
  };
}

function canReachThresholdByLength(
  keywordLength: number,
  candidateLength: number,
): boolean {
  const maxLength = Math.max(keywordLength, candidateLength);

  if (maxLength === 0) {
    return true;
  }

  const minimumPossibleDistance = Math.abs(keywordLength - candidateLength);
  return minimumPossibleDistance / maxLength <= FUZZY_MATCH_THRESHOLD;
}

export function prepareFuzzyKeywords(keywords: string[]): PreparedFuzzyKeyword[] {
  const preparedKeywords: PreparedFuzzyKeyword[] = [];

  for (const keyword of keywords) {
    const tokens = tokenizeTextForMatching(keyword);

    if (keyword.length === 0 || tokens.length === 0) {
      continue;
    }

    preparedKeywords.push({
      keyword,
      tokens,
      minWindowWordCount: Math.max(
        1,
        tokens.length - FUZZY_WINDOW_WORD_TOLERANCE,
      ),
      maxWindowWordCount: tokens.length + FUZZY_WINDOW_WORD_TOLERANCE,
    });
  }

  return preparedKeywords;
}

export function fuzzySearchPrepared(
  text: string,
  preparedKeywords: PreparedFuzzyKeyword[],
  targetId: number,
): TextMatch[] {
  const results: TextMatch[] = [];
  const tokens = tokenizeTextForMatching(text);

  if (tokens.length === 0 || preparedKeywords.length === 0) {
    return results;
  }

  for (const preparedKeyword of preparedKeywords) {
    const keyword = preparedKeyword.keyword;
    const maxWindowWordCount = Math.min(
      tokens.length,
      preparedKeyword.maxWindowWordCount,
    );

    for (
      let windowWordCount = preparedKeyword.minWindowWordCount;
      windowWordCount <= maxWindowWordCount;
      windowWordCount++
    ) {
      for (
        let windowStart = 0;
        windowStart <= tokens.length - windowWordCount;
        windowStart++
      ) {
        const windowEnd = windowStart + windowWordCount - 1;
        const startIndex = tokens[windowStart].startIndex;
        const endIndex = tokens[windowEnd].endIndex;
        const candidateLength = endIndex - startIndex;

        if (!canReachThresholdByLength(keyword.length, candidateLength)) {
          continue;
        }

        const candidateText = text.slice(startIndex, endIndex);
        const maxAllowedDistance =
          FUZZY_MATCH_THRESHOLD * Math.max(keyword.length, candidateLength);
        const weightedDistance = calculateWeightedDistance(
          keyword,
          candidateText,
          maxAllowedDistance,
        );
        const normalizedDistance =
          weightedDistance.distance / Math.max(keyword.length, candidateLength);

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

export function fuzzySearch(
  text: string,
  keywords: string[],
  targetId: number,
): TextMatch[] {
  return fuzzySearchPrepared(text, prepareFuzzyKeywords(keywords), targetId);
}
