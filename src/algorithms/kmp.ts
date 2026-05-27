import type { TextMatch } from "../shared/types";

/**
 * TODO: Implementasi KMP from scratch.
 *
 * Ketentuan spek:
 * - Tidak boleh pakai includes(), indexOf(), atau built-in search function.
 * - Harus membaca keyword dari keywords.txt secara iteratif.
 * - Harus menghitung comparison count.
 */

function computeBorder(pattern: string): number[] {
  const m = pattern.length;
  const b: number[] = new Array(m).fill(0); // border/failure function array
  
  let i = 1; // iterator teks (pattern itu sendiri)
  let j = 0; // panjang prefix yang cocok

  while (i < m) {
    if (pattern[j] === pattern[i]) {
      b[i] = j + 1;
      i++;
      j++;
    } else if (j > 0) {
      j = b[j - 1];
    } else {
      b[i] = 0;
      i++;
    }
  }

  return b;
}

export function kmpSearch(
  text: string,
  keyword: string,
  targetId: number,
): TextMatch[] {
  const n = text.length;
  const m = keyword.length;
  const results: TextMatch[] = [];

  if (m === 0 || n < m) {
    return results;
  }

  const b = computeBorder(keyword);
  let i = 0; // iterator teks
  let j = 0; // iterator keyword
  let comparisons = 0; 

  while (i < n) {
    comparisons++; 

    // Bandingkan
    if (keyword[j] === text[i]) {
      if (j === m - 1) {
        const startIndex = i - m + 1;
        const endIndex = startIndex + m;
        
        // Ambil teks yang cocok
        const matchedText = text.substring(startIndex, endIndex);

        results.push({
          targetId: targetId,
          keyword: keyword,         
          algorithm: "KMP",
          matchedText: matchedText,
          startIndex: startIndex,
          endIndex: endIndex,
          comparisons: comparisons,
        } as TextMatch);

        j = b[j]; 
        i++;
      } else {
        i++;
        j++;
      }
    } else if (j > 0) {
      j = b[j - 1];
    } else {
      i++;
    }
  }

  return results;
}