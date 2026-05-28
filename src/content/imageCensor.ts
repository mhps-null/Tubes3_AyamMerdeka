import type { ImageScanTarget } from "../shared/types";

const IMAGE_BLUR_CLASS = "judol-image-blur-target";

export function censorImageTarget(target: ImageScanTarget): void {
  target.node.classList.add(IMAGE_BLUR_CLASS);
}

export function clearImageCensors(): void {
  const blurredImages = document.querySelectorAll(`img.${IMAGE_BLUR_CLASS}`);
  
  for (const img of blurredImages) {
    img.classList.remove(IMAGE_BLUR_CLASS);
  }
}