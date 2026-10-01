export const importFields = [
  "question",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_answer",
  "exam",
  "subject",
  "topic",
  "subtopic",
  "difficulty",
  "explanation",
  "source",
  "year",
  "paper",
  "question_type",
  "status",
] as const

export type ImportField = (typeof importFields)[number]
export type ImportRow = Record<ImportField, string>

const aliases: Record<string, ImportField> = {
  question: "question",
  question_text: "question",
  option_a: "option_a",
  optiona: "option_a",
  option_b: "option_b",
  optionb: "option_b",
  option_c: "option_c",
  optionc: "option_c",
  option_d: "option_d",
  optiond: "option_d",
  correct_answer: "correct_answer",
  correct_option: "correct_answer",
  answer: "correct_answer",
  exam: "exam",
  subject: "subject",
  topic: "topic",
  subtopic: "subtopic",
  difficulty: "difficulty",
  explanation: "explanation",
  source: "source",
  year: "year",
  paper: "paper",
  question_type: "question_type",
  type: "question_type",
  pyq_based: "question_type",
  status: "status",
}

export function mapImportRow(raw: Record<string, unknown>): ImportRow {
  const row = emptyImportRow()
  for (const [key, value] of Object.entries(raw)) {
    const field = aliases[normalizeHeader(key)]
    if (!field) continue
    row[field] = cleanImportValue(field, value)
  }
  return row
}

export function cleanImportValue(field: ImportField, value: unknown) {
  const text = value == null ? "" : String(value).trim()
  if (field === "year") return text.match(/\d{4}/)?.[0] ?? ""
  if (field === "paper") return normalizePaper(text)
  if (field === "question_type") return normalizeQuestionType(text)
  if (field === "status") return normalizeStatus(text)
  return text
}

export function normalizePaper(value: string) {
  const paper = value.trim().toUpperCase().replace(/[\s-]+/g, "_")
  if (!paper || paper === "BOTH") return paper === "BOTH" ? "BOTH" : ""
  if (paper === "PAPER_I" || paper === "I" || paper === "1") return "PAPER_I"
  if (paper === "PAPER_II" || paper === "II" || paper === "2") return "PAPER_II"
  return paper
}

export function normalizeQuestionType(value: string) {
  const type = value.trim().toUpperCase().replace(/[\s-]+/g, "_")
  if (!type) return ""
  if (type === "PYQ" || type === "PREVIOUS_YEAR" || type === "PREVIOUSYEAR") return "PREVIOUS_YEAR"
  if (type === "PYQ_BASED" || type === "PYQBASED") return "PYQ_BASED"
  if (type === "PRACTICE") return "PRACTICE"
  return type
}

export function normalizeStatus(value: string) {
  const status = value.trim().toUpperCase()
  if (status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED") return status
  return ""
}

export function summarizeImportRows(rows: ImportRow[]) {
  const groups = new Map<string, { topic: string; exam: string; paper: string; total: number; previousYear: number; pyqBased: number; practice: number }>()
  for (const row of rows) {
    const key = `${row.topic}\n${row.exam}\n${row.paper}`
    const group = groups.get(key) ?? {
      topic: row.topic || "Unknown topic",
      exam: row.exam || "STET",
      paper: row.paper || "BOTH",
      total: 0,
      previousYear: 0,
      pyqBased: 0,
      practice: 0,
    }
    group.total += 1
    if (row.question_type === "PREVIOUS_YEAR") group.previousYear += 1
    else if (row.question_type === "PYQ_BASED") group.pyqBased += 1
    else group.practice += 1
    groups.set(key, group)
  }
  return [...groups.values()]
}

export function missingImportHeaders(headers: string[]) {
  const present = new Set(headers.map(normalizeHeader))
  return ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "exam", "topic", "difficulty"].filter(
    (field) => !present.has(field) && ![...present].some((header) => aliases[header] === field),
  )
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_")
}

function emptyImportRow(): ImportRow {
  return {
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "",
    exam: "",
    subject: "MUSIC",
    topic: "",
    subtopic: "",
    difficulty: "",
    explanation: "",
    source: "",
    year: "",
    paper: "",
    question_type: "",
    status: "",
  }
}
