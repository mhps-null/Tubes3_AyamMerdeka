import type { TextMatch } from "../shared/types";

/**
 * TODO: Implementasi Weighted Levenshtein Distance.
 *
 * Ketentuan spek:
 * - Dipakai untuk fuzzy matching.
 * - Substitusi karakter mirip visual diberi penalti lebih kecil.
 * - Contoh: O/0, A/4, I/1.
 * - Harus memakai threshold agar tidak terlalu banyak false positive.
 */
export function fuzzySearch(
  _text: string,
  _keywords: string[],
  _targetId: number,
): TextMatch[] {
  return [];
}
