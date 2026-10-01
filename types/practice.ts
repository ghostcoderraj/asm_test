export type PracticeTopicCard = {
  id: string
  name: string
  slug: string
  display_order: number
  preview: string[]
}

export type PracticeWeak = {
  subtopic_id: string
  subtopic_name: string
  subtopic_slug: string
  topic_id: string
  topic_name: string
  topic_slug: string
  wrong: number
  accuracy: number
  band: string
}

export type PracticeHome = {
  topics: PracticeTopicCard[]
  weak: PracticeWeak[]
  pyq_count: number
  pyq_based_count: number
  pyq_years: number[]
  incorrect_count: number
  saved_count: number
  mixed_count: number
}

export type PracticeSubtopic = {
  id: string
  name: string
  slug: string
  display_order: number
  pyq_count: number
  pyq_based_count: number
  practice_count: number
  total_count: number
}

export type PracticeTopic = {
  id: string
  name: string
  slug: string
  description: string | null
  subtopics: PracticeSubtopic[]
  total_count: number
}
