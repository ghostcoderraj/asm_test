import { describe, expect, it } from "vitest"
import { mapImportRow, missingImportHeaders } from "@/lib/import/headers"

describe("question import headers", () => {
  it("accepts the expected column names", () => {
    expect(missingImportHeaders(["question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "exam", "topic", "difficulty"])).toEqual([])
  })

  it("maps friendly headers onto the import fields", () => {
    const row = mapImportRow({ Question: "What is teen taal?", "Correct Answer": "D", Topic: "Tala & Laya" })
    expect(row.question).toBe("What is teen taal?")
    expect(row.correct_answer).toBe("D")
    expect(row.topic).toBe("Tala & Laya")
  })

  it("reads a topic sheet's paper, type, and year", () => {
    const row = mapImportRow({
      question: "एक सप्तक में श्रुतियाँ संख्याएँ कितनी होती है?",
      paper: "PAPER-I",
      question_type: "PYQ-BASED",
      year: "2024",
      status: "DRAFT",
    })
    expect(row.paper).toBe("PAPER_I")
    expect(row.question_type).toBe("PYQ_BASED")
    expect(row.year).toBe("2024")
    expect(row.status).toBe("DRAFT")
  })
})
