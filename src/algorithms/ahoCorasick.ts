import type { TextMatch } from "../shared/types";

interface AhoCorasickNode {
  children: Map<string, number>;
  failureLink: number;
  outputs: string[];
}

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
function createNode(): AhoCorasickNode {
  return {
    children: new Map<string, number>(),
    failureLink: 0,
    outputs: [],
  };
}

function insertKeyword(nodes: AhoCorasickNode[], keyword: string): void {
  let currentNode = 0;

  for (let i = 0; i < keyword.length; i++) {
    let char = keyword[i];
    let nextNode = nodes[currentNode].children.get(char);

    if (nextNode !== undefined) {
      currentNode = nextNode;
      continue;
    }

    let newNodeIndex = nodes.length;
    
    nodes.push(createNode());
    nodes[currentNode].children.set(char, newNodeIndex);
    currentNode = newNodeIndex;
  }

  nodes[currentNode].outputs.push(keyword);
}

function buildAutomaton(keywords: string[]): AhoCorasickNode[] {
  let nodes: AhoCorasickNode[] = [createNode()];

  for (let keyword of keywords) {
    if (keyword.length > 0) {
      insertKeyword(nodes, keyword);
    }
  }

  let queue: number[] = [];

  for (let childNode of nodes[0].children.values()) {
    nodes[childNode].failureLink = 0;
    queue.push(childNode);
  }

  let head = 0;

  while (head < queue.length) {
    let currentNode = queue[head];
    head++;

    for (let [character, childNode] of nodes[currentNode].children) {
      let fallbackNode = nodes[currentNode].failureLink;

      while (fallbackNode !== 0 && !nodes[fallbackNode].children.has(character)) {
        fallbackNode = nodes[fallbackNode].failureLink;
      }

      let nextfallbackNode = nodes[fallbackNode].children.get(character);
      nodes[childNode].failureLink = nextfallbackNode === undefined ? 0 : nextfallbackNode;
      let fallbackOutputs = nodes[nodes[childNode].failureLink].outputs;
      nodes[childNode].outputs.push(...fallbackOutputs);

      queue.push(childNode);
    }
  }

  return nodes;
}

export function ahoCorasickSearch(
  text: string,
  keywords: string[],
  targetId: number,
): TextMatch[] {
  const results: TextMatch[] = [];

  if (text.length === 0 || keywords.length === 0) {
    return results;
  }

  let nodes = buildAutomaton(keywords);
  let currentNode = 0;
  let comparisonCount = 0;

  for (let textIndex = 0; textIndex < text.length; textIndex++) {
    let character = text[textIndex];

    while (currentNode !== 0 && !nodes[currentNode].children.has(character)) {
      currentNode = nodes[currentNode].failureLink;
      comparisonCount++;
    }

    let nextNode = nodes[currentNode].children.get(character);
    comparisonCount++;

    if (nextNode === undefined) {
      currentNode = 0;
    }else {
      currentNode = nextNode;
    }

    for (let keyword of nodes[currentNode].outputs) {
      let endIndex = textIndex + 1;
      let startIndex = endIndex - keyword.length;

      results.push({
        targetId,
        keyword,
        algorithm: "AHO_CORASICK",
        matchedText: text.substring(startIndex, endIndex),
        startIndex,
        endIndex,
        comparisonCount,
      });
    }
  }

  return results;
}
