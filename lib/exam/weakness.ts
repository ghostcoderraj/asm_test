export type WeaknessBand = "STRONG" | "NEEDS_PRACTICE" | "WEAK" | "CRITICAL"

export type WeaknessThresholds = {
  strongMax: number
  needsPracticeMax: number
  weakMax: number
}

export const defaultThresholds: WeaknessThresholds = {
  strongMax: 1,
  needsPracticeMax: 2,
  weakMax: 4,
}

export function weaknessBand(wrong: number, thresholds: WeaknessThresholds = defaultThresholds): WeaknessBand {
  if (wrong <= thresholds.strongMax) return "STRONG"
  if (wrong <= thresholds.needsPracticeMax) return "NEEDS_PRACTICE"
  if (wrong <= thresholds.weakMax) return "WEAK"
  return "CRITICAL"
}

export function shouldRevise(band: WeaknessBand) {
  return band === "WEAK" || band === "CRITICAL"
}
