export interface TextToken {
  value: string;
  startIndex: number;
  endIndex: number;
}

export function tokenizeTextForMatching(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  const tokenPattern = /[\p{L}\p{N}@!$+|]+/gu;

  let match = tokenPattern.exec(text);

  while (match !== null) {
    tokens.push({
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });

    match = tokenPattern.exec(text);
  }

  return tokens;
}
