import { describe, expect, it } from "vitest"
import { shouldRevise, weaknessBand } from "@/lib/exam/weakness"

describe("weak topic bands", () => {
  it("uses the initial thresholds", () => {
    expect(weaknessBand(0)).toBe("STRONG")
    expect(weaknessBand(1)).toBe("STRONG")
    expect(weaknessBand(2)).toBe("NEEDS_PRACTICE")
    expect(weaknessBand(3)).toBe("WEAK")
    expect(weaknessBand(4)).toBe("WEAK")
    expect(weaknessBand(5)).toBe("CRITICAL")
  })

  it("recommends revision from three wrong answers upward", () => {
    expect(shouldRevise("WEAK")).toBe(true)
    expect(shouldRevise("CRITICAL")).toBe(true)
    expect(shouldRevise("NEEDS_PRACTICE")).toBe(false)
  })
})
