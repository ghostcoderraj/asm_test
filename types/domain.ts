export type Role = "STUDENT" | "ADMIN" | "SUPER_ADMIN"
export type TargetExam = "STET" | "BPSC" | "BOTH"
export type TargetPaper = "PAPER_I" | "PAPER_II" | "BOTH"

export type Profile = {
  id: string
  full_name: string
  mobile_number: string
  target_exam: TargetExam
  target_paper: TargetPaper | null
  role: Role
  is_active: boolean
  avatar_path: string | null
}

export type Plan = {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  duration_days: number
  features: string[] | null
  is_active?: boolean
}

export type PaperQuestion = {
  id: string
  order: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  selected_answer: "A" | "B" | "C" | "D" | null
  is_marked: boolean
  visited: boolean
  topic_id: string | null
  topic_name: string | null
  subtopic_name?: string | null
  question_type?: string | null
  year?: number | null
  saved?: boolean
  image_path: string | null
  correct_option: "A" | "B" | "C" | "D" | null
  explanation: string | null
  is_correct: boolean | null
}

export type Paper = {
  attempt: {
    id: string
    status: string
    title: string
    exam: string
    kind: string
    started_at: string
    submitted_at: string | null
    duration_seconds: number
    ends_at: string
    total_questions: number
    correct_answers: number | null
    wrong_answers: number | null
    unanswered: number | null
    score: number | null
    percentage: number | null
    accuracy: number | null
    time_taken: number | null
  }
  questions: PaperQuestion[]
}

export type TopicStat = {
  topic_id: string
  topic_name: string
  attempted: number
  correct: number
  wrong: number
  accuracy: number
  band?: string
}

export type StudentDashboard = {
  stats: {
    tests_attempted: number
    average_score: number
    average_accuracy: number
    questions_attempted: number
  }
  free: {
    limit: number
    used: number
    remaining: number
    premium: boolean
  }
  subscription: {
    status: string
    expiry_date: string | null
    plan_name: string | null
  } | null
  weak_topics: TopicStat[]
  recent_attempts: AttemptSummary[]
}

export type AttemptSummary = {
  id: string
  title: string
  exam: string
  status: string
  score: number | null
  percentage: number | null
  correct_answers: number | null
  wrong_answers: number | null
  time_taken: number | null
  submitted_at: string | null
  created_at: string
}

export type ImportSummary = {
  total: number
  valid: number
  invalid: number
  duplicate: number
  new_rows: number
  errors: { row: number; message: string }[]
}

export type ImportTopicPreview = {
  topic: string
  savedAs?: string
  exam: string
  paper: string
  total: number
  previousYear: number
  pyqBased: number
  practice: number
}
