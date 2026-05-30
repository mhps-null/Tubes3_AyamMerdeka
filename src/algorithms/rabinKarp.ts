import type { TextMatch } from "../shared/types";

const HASH_BASE = 257;
const HASH_MODULUS = 1_000_000_007;


function buildInitialHash(text: string, length: number): number {
  let hash = 0;

  for (let i = 0; i < length; i++) {
    hash = (hash * HASH_BASE + text.charCodeAt(i)) % HASH_MODULUS;
  }
  return hash;
}

function buildHighestBasePower(patternLength: number): number {
  let highestBasePower = 1;
  for (let i = 1; i < patternLength; i++) {
    highestBasePower = (highestBasePower * HASH_BASE) % HASH_MODULUS;
  }
  return highestBasePower;
}

function rollHash(
  currentHash: number,
  currentChar: string,
  futureChar: string,
  highestBasePower: number,
): number {
  let outgoingValue = (currentChar.charCodeAt(0) * highestBasePower) % HASH_MODULUS;
  let withoutOutgoing = (currentHash - outgoingValue + HASH_MODULUS) % HASH_MODULUS;

  return (
    (withoutOutgoing * HASH_BASE + futureChar.charCodeAt(0)) % HASH_MODULUS
  );
}

function isExactMatch(
  text: string,
  keyword: string,
  startIndex: number,
): { matches: boolean; comparisons: number } {
  let comparisons = 0;

  for (let patternIndex = 0; patternIndex < keyword.length; patternIndex++) {
    comparisons++;

    if (text[startIndex + patternIndex] !== keyword[patternIndex]) {
      return { matches: false, comparisons };
    }
  }

  return { matches: true, comparisons };
}

export function rabinKarpSearch(
  text: string,
  keyword: string,
  targetId: number,
): TextMatch[] {
  let results: TextMatch[] = [];
  let textLength = text.length;
  let keywordLength = keyword.length;

  if (keywordLength === 0 || textLength < keywordLength) {
    return results;
  }

  let keywordHash = buildInitialHash(keyword, keywordLength);
  let windowHash = buildInitialHash(text, keywordLength);
  let highestBasePower = buildHighestBasePower(keywordLength);
  let comparisonCount = 0;

  for (let windowStart = 0;windowStart <= textLength - keywordLength;windowStart++
  ) {
    if (windowHash === keywordHash) {
      let verification = isExactMatch(text, keyword, windowStart);
      comparisonCount += verification.comparisons;

      if (verification.matches) {
        const endIndex = windowStart + keywordLength;

        results.push({
          targetId,
          keyword,
          algorithm: "RABIN_KARP",
          matchedText: text.substring(windowStart, endIndex),
          startIndex: windowStart,
          endIndex,
          comparisonCount,
        });
      }
    }

    if (windowStart < textLength - keywordLength) {
      windowHash = rollHash(
        windowHash,
        text[windowStart],
        text[windowStart + keywordLength],
        highestBasePower,
      );
    }
  }

  return results;
}
