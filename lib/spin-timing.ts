/** Shared playback timing for the recorded selection cue. */
export const SPIN_REVEAL_MS = 8500;

export function spinTiming(elapsedMs: number) {
  const progress = Math.max(0, Math.min(1, elapsedMs / SPIN_REVEAL_MS));
  return { progress: 1 - Math.pow(1 - progress, 2), complete: elapsedMs >= SPIN_REVEAL_MS };
}
