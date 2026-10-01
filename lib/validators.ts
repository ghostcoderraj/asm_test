import { z } from "zod"

export const targetExamSchema = z.enum(["STET", "BPSC", "BOTH"])
export const targetPaperSchema = z.enum(["PAPER_I", "PAPER_II", "BOTH"])
export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"])
export const questionStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"])

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(80),
    mobile: z.string().trim().min(10, "Enter a valid mobile number."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    confirmPassword: z.string(),
    targetExam: targetExamSchema,
    targetPaper: targetPaperSchema.optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((value) => value.targetExam === "BPSC" || Boolean(value.targetPaper), {
    path: ["targetPaper"],
    message: "Choose Paper I, Paper II, or both papers.",
  })

export const questionSchema = z.object({
  question_text: z.string().trim().min(5, "Enter the question."),
  option_a: z.string().trim().min(1, "Option A is required."),
  option_b: z.string().trim().min(1, "Option B is required."),
  option_c: z.string().trim().min(1, "Option C is required."),
  option_d: z.string().trim().min(1, "Option D is required."),
  correct_option: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().trim().optional(),
  exam: targetExamSchema,
  topic_id: z.string().uuid("Choose a topic."),
  subtopic: z.string().trim().optional(),
  difficulty: difficultySchema,
  source: z.string().trim().optional(),
  year: z.string().trim().optional(),
  paper: z.enum(["PAPER_I", "PAPER_II", "BOTH"]).optional(),
  question_type: z.enum(["PREVIOUS_YEAR", "PYQ_BASED", "PRACTICE"]).optional(),
  status: questionStatusSchema,
})

export const testSchema = z.object({
  title: z.string().trim().min(3, "Enter a title."),
  description: z.string().trim().optional(),
  exam: targetExamSchema,
  paper: targetPaperSchema,
  duration_minutes: z.coerce.number().int().min(1).max(300),
  total_questions: z.coerce.number().int().min(1).max(200),
  is_free: z.boolean(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  selection_mode: z.enum(["FIXED", "RANDOM"]),
})

export const ticketSchema = z.object({
  category: z.enum(["LOGIN", "PAYMENT", "TEST", "QUESTION", "RESULT", "TECHNICAL", "PREMIUM", "OTHER"]),
  subject: z.string().trim().min(4, "Enter a subject.").max(140),
  description: z.string().trim().min(10, "Describe the issue.").max(4000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  test_id: z.string().trim().optional(),
  question_id: z.string().trim().optional(),
  payment_id: z.string().trim().optional(),
})

export function safeNext(value: string | null | undefined) {
  if (!value) return null
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null
  return value
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && uuidPattern.test(value))
}
