import type { TextMatch } from "../shared/types";

function computeBorder(pattern: string): number[] {
  const m = pattern.length;
  const b: number[] = new Array(m).fill(0); // border/failure function array
  
  let i = 1; // iterator teks (pattern itu sendiri)
  let j = 0; // panjang prefix yang cocok

  while (i < m) {
    if (pattern[j] === pattern[i]) {
      // Cocok, maka perpanjang border
      b[i] = j + 1;
      i++;
      j++;
    } else if (j > 0) {
      // Tidak cocok, kembali ke subborder untuk coba memperpanjang
      j = b[j - 1];
    } else {
      // Tidak cocok dan tidak ada border yang bisa diperpanjang, lanjut ke karakter berikutnya
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
        // Ditemukan kecocokan penuh
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

        // Menangani overlap match, menggeser keyword sesuai border
        j = b[j]; 
        i++;
      } else {
        // Cocok, lanjutkan ke karakter berikutnya
        i++;
        j++;
      }
    } else if (j > 0) {
      // Tidak cocok, geser keyword sesuai border dan mulai pengecekan pada indeks yang sudah ditentukan
      j = b[j - 1];
    } else {
      // Tidak cocok, lanjut ke karakter berikutnya
      i++;
    }
  }

  return results;
}