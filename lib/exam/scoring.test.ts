import { describe, expect, it } from "vitest"
import { scoreAttempt } from "@/lib/exam/scoring"

describe("score calculation", () => {
  it("matches the published result example", () => {
    const answers = [
      ...Array.from({ length: 72 }, () => ({ selected: "A", correct: "A" })),
      ...Array.from({ length: 24 }, () => ({ selected: "B", correct: "A" })),
      ...Array.from({ length: 4 }, () => ({ selected: null, correct: "A" })),
    ]
    expect(scoreAttempt(answers)).toMatchObject({
      total: 100,
      score: 72,
      correct: 72,
      wrong: 24,
      unanswered: 4,
      percentage: 72,
      accuracy: 75,
    })
  })
})
