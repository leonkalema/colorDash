import { DISTRACTOR_COLOR } from '../constants/gameConstants';

export function getDistractorColor(targetColor, difficulty) {
  if (difficulty.similarColors) {
    // Generate similar shades of red for hard mode
    const baseColor = parseInt(targetColor.slice(1), 16);
    const variation = Math.floor(Math.random() * 40) - 20;
    const r = ((baseColor >> 16) + variation) & 0xFF;
    const g = ((baseColor >> 8) & 0xFF) + Math.floor(variation/2);
    const b = (baseColor & 0xFF) + Math.floor(variation/2);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return DISTRACTOR_COLOR; // Default gray for easy/medium
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}