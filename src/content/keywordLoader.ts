export async function loadKeywords(): Promise<string[]> {
  const keywordFileUrl = chrome.runtime.getURL("keywords/keywords.txt");
  const response = await fetch(keywordFileUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to load keywords.txt. Status: ${response.status}`
    );
  }

  const rawText = await response.text();

  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}