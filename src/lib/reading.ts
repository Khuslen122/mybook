/** Average adult reading speed, words per minute. */
export const WPM = 230;

/** Estimated reading time in minutes for a given word count. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / WPM));
}

/** Compact human duration, e.g. "45m", "3h", "3h 30m". */
export function fmtDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h < 10 && m >= 30 ? `${h}h ${m}m` : `${h}h`;
}
