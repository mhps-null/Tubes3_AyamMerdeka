import {
  DETECTOR_ELEMENT_ATTRIBUTE,
  HIGHLIGHT_CLASS_NAME,
  TOOLTIP_ID,
} from "./domConstants";

function removeExistingTooltip(): void {
  const existingTooltip = document.getElementById(TOOLTIP_ID);

  if (existingTooltip !== null) {
    existingTooltip.remove();
  }
}

function createTooltipElement(target: HTMLElement): HTMLDivElement {
  const tooltip = document.createElement("div");

  tooltip.id = TOOLTIP_ID;
  tooltip.setAttribute(DETECTOR_ELEMENT_ATTRIBUTE, "tooltip");
  tooltip.className = "judol-detector-tooltip";

  const keyword = target.dataset.keyword ?? "-";
  const algorithm = target.dataset.algorithm ?? "-";
  const occurrenceCount = target.dataset.occurrenceCount ?? "1";
  const executionTimeMs = target.dataset.executionTimeMs ?? "0";

  tooltip.innerHTML = `
    <div><strong>Keyword:</strong> ${keyword}</div>
    <div><strong>Algorithm:</strong> ${algorithm}</div>
    <div><strong>Occurrences:</strong> ${occurrenceCount}</div>
    <div><strong>Execution:</strong> ${executionTimeMs} ms</div>
  `;

  return tooltip;
}

function positionTooltip(tooltip: HTMLElement, event: MouseEvent): void {
  const offset = 12;

  tooltip.style.left = `${event.clientX + offset}px`;
  tooltip.style.top = `${event.clientY + offset}px`;
}

export function attachTooltipListeners(): void {
  const highlightedElements = document.querySelectorAll<HTMLElement>(
    `.${HIGHLIGHT_CLASS_NAME}`,
  );

  for (const element of highlightedElements) {
    element.addEventListener("mouseenter", (event) => {
      removeExistingTooltip();

      const tooltip = createTooltipElement(element);
      document.body.appendChild(tooltip);
      positionTooltip(tooltip, event);
    });

    element.addEventListener("mousemove", (event) => {
      const tooltip = document.getElementById(TOOLTIP_ID);

      if (tooltip !== null) {
        positionTooltip(tooltip, event);
      }
    });

    element.addEventListener("mouseleave", () => {
      removeExistingTooltip();
    });
  }
}

export function clearTooltip(): void {
  removeExistingTooltip();
}
