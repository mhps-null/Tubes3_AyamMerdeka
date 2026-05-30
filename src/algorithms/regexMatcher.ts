import type { TextMatch } from "../shared/types";

export function regexSearch(text: string, targetId: number): TextMatch[] {
  const matches: TextMatch[] = [];

  const pattern = /\b[a-z]+[0-9]{2,3}\b/g;

  let result = pattern.exec(text);

  while (result !== null) {
    const matchedText = result[0];
    const startIndex = result.index;
    const endIndex = startIndex + matchedText.length;

    matches.push({
      targetId,
      algorithm: "REGEX",
      keyword: matchedText,
      matchedText,
      startIndex,
      endIndex,
    });

    result = pattern.exec(text);
  }

  return matches;
}
