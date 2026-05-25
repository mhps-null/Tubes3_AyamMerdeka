import type {
  AlgorithmScanSummary,
  TextMatch,
  TextScanTarget,
} from "../shared/types";

export const HIGHLIGHT_CLASS_NAME = "judol-detector-highlight";

function createHighlightElement(
  match: TextMatch,
  text: string,
  occurrenceCount: number,
  executionTimeMs: number,
): HTMLSpanElement {
  const span = document.createElement("span");

  span.className = HIGHLIGHT_CLASS_NAME;
  span.textContent = text;

  span.dataset.keyword = match.keyword;
  span.dataset.algorithm = match.algorithm;
  span.dataset.occurrenceCount = String(occurrenceCount);
  span.dataset.executionTimeMs = executionTimeMs.toFixed(3);
  span.dataset.startIndex = String(match.startIndex);
  span.dataset.endIndex = String(match.endIndex);

  return span;
}

function createAlgorithmSummaryMap(
  summaries: AlgorithmScanSummary[],
): Map<string, AlgorithmScanSummary> {
  const map = new Map<string, AlgorithmScanSummary>();

  for (const summary of summaries) {
    map.set(summary.algorithm, summary);
  }

  return map;
}

function createOccurrenceCountMap(matches: TextMatch[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const match of matches) {
    const key = `${match.algorithm}:${match.keyword}`;
    const currentCount = map.get(key) ?? 0;
    map.set(key, currentCount + 1);
  }

  return map;
}

function getOccurrenceCount(
  match: TextMatch,
  occurrenceCountMap: Map<string, number>,
): number {
  return occurrenceCountMap.get(`${match.algorithm}:${match.keyword}`) ?? 1;
}

function getExecutionTimeMs(
  match: TextMatch,
  summaryMap: Map<string, AlgorithmScanSummary>,
): number {
  return summaryMap.get(match.algorithm)?.executionTimeMs ?? 0;
}

function groupMatchesByTargetId(
  matches: TextMatch[],
): Map<number, TextMatch[]> {
  const groupedMatches = new Map<number, TextMatch[]>();

  for (const match of matches) {
    const currentMatches = groupedMatches.get(match.targetId) ?? [];
    currentMatches.push(match);
    groupedMatches.set(match.targetId, currentMatches);
  }

  return groupedMatches;
}

function getNonOverlappingMatches(matches: TextMatch[]): TextMatch[] {
  const sortedMatches = [...matches].sort(
    (first, second) => first.startIndex - second.startIndex,
  );

  const filteredMatches: TextMatch[] = [];
  let lastEndIndex = -1;

  for (const match of sortedMatches) {
    if (match.startIndex < lastEndIndex) {
      continue;
    }

    filteredMatches.push(match);
    lastEndIndex = match.endIndex;
  }

  return filteredMatches;
}

function highlightTargetMatches(
  target: TextScanTarget,
  matches: TextMatch[],
  occurrenceCountMap: Map<string, number>,
  summaryMap: Map<string, AlgorithmScanSummary>,
): void {
  const parentNode = target.node.parentNode;

  if (parentNode === null) {
    return;
  }

  const validMatches = getNonOverlappingMatches(matches);

  if (validMatches.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();
  let cursor = 0;

  for (const match of validMatches) {
    if (match.startIndex > cursor) {
      fragment.appendChild(
        document.createTextNode(target.text.slice(cursor, match.startIndex)),
      );
    }

    const originalMatchedText = target.text.slice(
      match.startIndex,
      match.endIndex,
    );

    const occurrenceCount = getOccurrenceCount(match, occurrenceCountMap);
    const executionTimeMs = getExecutionTimeMs(match, summaryMap);

    fragment.appendChild(
      createHighlightElement(
        match,
        originalMatchedText,
        occurrenceCount,
        executionTimeMs,
      ),
    );

    cursor = match.endIndex;
  }

  if (cursor < target.text.length) {
    fragment.appendChild(document.createTextNode(target.text.slice(cursor)));
  }

  parentNode.replaceChild(fragment, target.node);
}

export function clearExistingHighlights(): void {
  const highlightedElements = document.querySelectorAll(
    `.${HIGHLIGHT_CLASS_NAME}`,
  );

  for (const element of highlightedElements) {
    const parentNode = element.parentNode;

    if (parentNode === null) {
      continue;
    }

    const textNode = document.createTextNode(element.textContent ?? "");
    parentNode.replaceChild(textNode, element);
    parentNode.normalize();
  }
}

export function highlightMatches(
  targets: TextScanTarget[],
  matches: TextMatch[],
  summaries: AlgorithmScanSummary[],
): number {
  const targetsById = new Map<number, TextScanTarget>();

  for (const target of targets) {
    targetsById.set(target.id, target);
  }

  const matchesByTargetId = groupMatchesByTargetId(matches);
  const occurrenceCountMap = createOccurrenceCountMap(matches);
  const summaryMap = createAlgorithmSummaryMap(summaries);

  let highlightedTargetCount = 0;

  for (const [targetId, targetMatches] of matchesByTargetId) {
    const target = targetsById.get(targetId);

    if (target === undefined) {
      continue;
    }

    highlightTargetMatches(
      target,
      targetMatches,
      occurrenceCountMap,
      summaryMap,
    );
    highlightedTargetCount += 1;
  }

  return highlightedTargetCount;
}
