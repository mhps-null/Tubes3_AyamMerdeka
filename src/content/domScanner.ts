import {
  DETECTOR_ELEMENT_ATTRIBUTE,
  HIGHLIGHT_CLASS_NAME,
  TOOLTIP_ID,
} from "./domConstants";
import { normalizeTextForMatching } from "../shared/textNormalizer";
import type { TextScanTarget, ImageScanTarget } from "../shared/types";

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
  "template",
]);

function hasVisibleText(text: string | null): boolean {
  return text !== null && text.trim().length > 0;
}

function isIgnoredTag(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();

  return IGNORED_TAG_NAMES.has(tagName);
}

function isDetectorInjectedElement(element: Element): boolean {
  if (element.id === TOOLTIP_ID) {
    return true;
  }

  if (element.classList.contains(HIGHLIGHT_CLASS_NAME)) {
    return true;
  }

  if (element.hasAttribute(DETECTOR_ELEMENT_ATTRIBUTE)) {
    return true;
  }

  return element.closest(`[${DETECTOR_ELEMENT_ATTRIBUTE}]`) !== null;
}

function isElementHidden(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element.hidden) {
    return true;
  }

  if (element.getAttribute("aria-hidden") === "true") {
    return true;
  }

  const style = window.getComputedStyle(element);

  return (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  );
}

function hasHiddenAncestor(element: Element): boolean {
  let currentElement: Element | null = element;

  while (
    currentElement !== null &&
    currentElement !== document.documentElement
  ) {
    if (isElementHidden(currentElement)) {
      return true;
    }

    currentElement = currentElement.parentElement;
  }

  return false;
}

function isEditableElement(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return element.isContentEditable;
}

function shouldIgnoreParentElement(element: Element): boolean {
  return (
    isIgnoredTag(element) ||
    isDetectorInjectedElement(element) ||
    hasHiddenAncestor(element) ||
    isEditableElement(element)
  );
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

export function collectImageTargets(rootNode: HTMLElement): ImageScanTarget[] {
  const images = rootNode.querySelectorAll("img");
  const targets: ImageScanTarget[] = [];
  let imageIdCounter = 1;

  for (const img of images) {
    const src = img.src || img.dataset.src;

    if (!src) continue;

    if (src.toLowerCase().includes(".gif")) continue;

    const rect = img.getBoundingClientRect();
    if (rect.width > 0 && rect.width < 50) continue;
    if (rect.height > 0 && rect.height < 50) continue;

    targets.push({
      id: imageIdCounter++,
      node: img,
      src: src,
    });
  }

  return targets;
}