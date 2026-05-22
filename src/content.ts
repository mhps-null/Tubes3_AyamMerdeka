console.log("[Judol Detector] Content script loaded.");

async function loadKeywords(): Promise<string[]> {
  const keywordUrl = chrome.runtime.getURL("keywords/keywords.txt");
  const response = await fetch(keywordUrl);

  if (!response.ok) {
    throw new Error(`Failed to load keywords.txt: ${response.status}`);
  }

  const text = await response.text();

  return text
    .split(/\r?\n/)
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

function shouldIgnoreElement(element: Element): boolean {
  const ignoredTags = new Set([
    "script",
    "style",
    "noscript",
    "textarea",
    "input",
    "select",
    "option",
    "svg",
    "canvas"
  ]);

  return ignoredTags.has(element.tagName.toLowerCase());
}

function collectTextNodes(root: Node): Text[] {
  const textNodes: Text[] = [];

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const text = node.textContent;

        if (!text || text.trim().length === 0) {
          return NodeFilter.FILTER_REJECT;
        }

        const parent = node.parentElement;

        if (!parent || shouldIgnoreElement(parent)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let currentNode = walker.nextNode();

  while (currentNode !== null) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  return textNodes;
}

async function main(): Promise<void> {
  const keywords = await loadKeywords();

  if (!document.body) {
    console.warn("[Judol Detector] document.body not found.");
    return;
  }

  const textNodes = collectTextNodes(document.body);

  console.log("[Judol Detector] Keywords loaded:", keywords);
  console.log("[Judol Detector] Text nodes found:", textNodes.length);
  console.log(
    "[Judol Detector] Text node samples:",
    textNodes.slice(0, 5).map((node) => node.textContent?.trim())
  );
}

main().catch((error) => {
  console.error("[Judol Detector] Failed to initialize:", error);
});

export {};