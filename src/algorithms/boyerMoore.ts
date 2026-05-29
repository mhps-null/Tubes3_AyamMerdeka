import type { TextMatch } from "../shared/types";

/**
 * TODO: Implementasi Boyer-Moore from scratch.
 *
 * Ketentuan spek:
 * - Tidak boleh pakai includes(), indexOf(), atau built-in search function.
 * - Harus punya last occurrence table.
 * - Harus melakukan shifting process.
 * - Harus menghitung comparison count.
 */

function buildLast(pattern: string): Map<string, number> {
  const last = new Map<string, number>(); // Last occurrence table menggunakan map agar efisien
  
  // Mencatat kemunculan terakhir setiap karakter dalam pattern
  for (let i = 0; i < pattern.length; i++) {
    last.set(pattern[i], i);
  }
  
  return last;
}

export function boyerMooreSearch(
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

  const last = buildLast(keyword);
  
  let i = m - 1; // Iterator teks (mulai dari kanan pattern)
  let j = m - 1; // Iterator keyword (selalu mulai dari indeks terakhir)
  let comparisons = 0; 

  while (i < n) {
    comparisons++; 

    if (keyword[j] === text[i]) {
      if (j === 0) {
        const startIndex = i;
        const endIndex = i + m;
        
        // Ambil teks yang cocok
        const matchedText = text.substring(startIndex, endIndex);

        results.push({
          targetId: targetId,
          keyword: keyword,
          algorithm: "BOYER_MOORE",
          matchedText: matchedText,
          startIndex: startIndex,
          endIndex: endIndex,
          comparisons: comparisons,
        } as TextMatch);

        // Lanjut cek dengan menggeser batas kanan teks dan reset iterator keyword
        i = i + (2 * m) - 1;
        j = m - 1;
      } else {
        // Cocok, lanjutkan ke karakter berikutnya (ke kiri)
        i--;
        j--;
      }
    } else {
      // Tidak cocok
      // i = indeks teks missmatch ; lo = last occurence ; j = indeks keyword missmatch
      // Kasus 1: lo < j, maka (lo + 1) <= j, geser sejauh (j-lo)
      // Kasus 2: lo >= j, maka (lo + 1) > j, geser sejauh 1
      // Kasus 3: lo = -1, maka (lo + 1) = 0 > j, geser sejauh m
      const charInText = text[i];
      const lo = last.has(charInText) ? last.get(charInText)! : -1;
      i = i + m - Math.min(j, 1 + lo);
      j = m - 1; 
    }
  }

  return results;
}