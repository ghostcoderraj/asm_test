import { describe, expect, it } from "vitest"
import { formatMobile, toE164 } from "@/lib/phone"

describe("phone numbers", () => {
  it("converts a 10-digit Indian mobile number to E.164", () => {
    expect(toE164("9876543210")).toBe("+919876543210")
    expect(toE164("98765 43210")).toBe("+919876543210")
  })

  it("accepts a number that already includes 91", () => {
    expect(toE164("+91 9876543210")).toBe("+919876543210")
  })

  it("rejects numbers that are not Indian mobiles", () => {
    expect(toE164("12345")).toBeNull()
    expect(toE164("5876543210")).toBeNull()
  })

  it("formats a stored number for display", () => {
    expect(formatMobile("+919876543210")).toBe("+91 98765 43210")
  })
})
