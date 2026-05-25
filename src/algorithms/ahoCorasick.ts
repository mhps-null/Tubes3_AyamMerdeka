import type { TextMatch } from "../shared/types";

/**
 * TODO: Implementasi Aho-Corasick from scratch.
 *
 * Bonus specification:
 * - Digunakan sebagai algoritma alternatif untuk multi-pattern matching.
 * - Cocok untuk mencari banyak keyword sekaligus dari keywords.txt.
 *
 * API ini sengaja dibuat menerima array keywords agar berbeda dari KMP/BM
 * yang biasanya mencari satu pattern per iterasi.
 */
export function ahoCorasickSearch(
  _text: string,
  _keywords: string[],
  _targetId: number,
): TextMatch[] {
  return [];
}
