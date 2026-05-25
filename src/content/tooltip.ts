import {
  DETECTOR_ELEMENT_ATTRIBUTE,
  HIGHLIGHT_CLASS_NAME,
  TOOLTIP_ID,
} from "./domConstants";

const TOOLTIP_OFFSET_PX = 12;

function removeExistingTooltip(): void {
  const existingTooltip = document.getElementById(TOOLTIP_ID);

  if (existingTooltip !== null) {
    existingTooltip.remove();
  }
}

function createTooltipRow(label: string, value: string): HTMLDivElement {
  const row = document.createElement("div");

  const labelElement = document.createElement("strong");
  labelElement.textContent = `${label}: `;

  const valueElement = document.createElement("span");
  valueElement.textContent = value;

  row.appendChild(labelElement);
  row.appendChild(valueElement);

  return row;
}

function createTooltipElement(target: HTMLElement): HTMLDivElement {
  const tooltip = document.createElement("div");

  tooltip.id = TOOLTIP_ID;
  tooltip.className = "judol-detector-tooltip";
  tooltip.setAttribute(DETECTOR_ELEMENT_ATTRIBUTE, "tooltip");

  const keyword = target.dataset.keyword ?? "-";
  const algorithm = target.dataset.algorithm ?? "-";
  const occurrenceCount = target.dataset.occurrenceCount ?? "1";
  const executionTimeMs = target.dataset.executionTimeMs ?? "0";

  tooltip.appendChild(createTooltipRow("Keyword", keyword));
  tooltip.appendChild(createTooltipRow("Algorithm", algorithm));
  tooltip.appendChild(createTooltipRow("Occurrences", occurrenceCount));
  tooltip.appendChild(createTooltipRow("Execution", `${executionTimeMs} ms`));

  return tooltip;
}

function positionTooltip(tooltip: HTMLElement, event: MouseEvent): void {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const tooltipRect = tooltip.getBoundingClientRect();

  let left = event.clientX + TOOLTIP_OFFSET_PX;
  let top = event.clientY + TOOLTIP_OFFSET_PX;

  if (left + tooltipRect.width > viewportWidth) {
    left = event.clientX - tooltipRect.width - TOOLTIP_OFFSET_PX;
  }

  if (top + tooltipRect.height > viewportHeight) {
    top = event.clientY - tooltipRect.height - TOOLTIP_OFFSET_PX;
  }

  tooltip.style.left = `${Math.max(0, left)}px`;
  tooltip.style.top = `${Math.max(0, top)}px`;
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
