import type { TextScanTarget } from "../shared/types";
import { normalizeTextForMatching } from "../shared/textNormalizer";

const IGNORED_TAG_NAMES = new Set([
  "script",
  "style",
  "noscript",
  "textarea",
  "input",
  "select",
  "option",
  "svg",
  "canvas",
]);

function hasVisibleText(text: string | null): boolean {
  return text !== null && text.trim().length > 0;
}

function shouldIgnoreParentElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();

  return IGNORED_TAG_NAMES.has(tagName);
}

function getAcceptedParentElement(node: Text): Element | null {
  const parentElement = node.parentElement;

  if (parentElement === null) {
    return null;
  }

  if (shouldIgnoreParentElement(parentElement)) {
    return null;
  }

  return parentElement;
}

function createTextScanTarget(id: number, node: Text): TextScanTarget | null {
  if (!hasVisibleText(node.textContent)) {
    return null;
  }

  const parentElement = getAcceptedParentElement(node);

  if (parentElement === null) {
    return null;
  }

  const text = node.textContent ?? "";

  return {
    id,
    node,
    parentElement,
    text,
    normalizedText: normalizeTextForMatching(text),
  };
}

export function collectTextScanTargets(root: Node): TextScanTarget[] {
  const targets: TextScanTarget[] = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let currentNode = walker.nextNode();
  let id = 0;

  while (currentNode !== null) {
    const textNode = currentNode as Text;
    const target = createTextScanTarget(id, textNode);

    if (target !== null) {
      targets.push(target);
      id += 1;
    }

    currentNode = walker.nextNode();
  }

  return targets;
}
