/**
 * PopSpace-inspired Sigmoid Proximity Audio Math
 */
export const MAX_AUDIO_RANGE = 750; // px radius on canvas

export function computeProximityVolume(distance: number): number {
  if (distance <= 0) return 1;
  if (distance >= MAX_AUDIO_RANGE) return 0;

  const normalized = distance / MAX_AUDIO_RANGE;
  // PopSpace steep sigmoid falloff curve
  const volume = 1 / (Math.pow(normalized + 0.4, 20) + 1);

  // Clamp strictly between 0 and 1
  return Math.max(0, Math.min(1, Number(volume.toFixed(3))));
}

export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}
