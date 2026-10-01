export type MatchTopic = { id: string; name: string; exam: string; slug: string | null; display_order: number; paper?: string | null }
export type MatchSubtopic = { id: string; topic_id: string; name: string }

type MatchOptions = { paper?: string; subtopicNames?: string[]; topicOrder?: number }

export function topicOrderFromFileName(value: string) {
  const match = value.match(/topic[_\s-]*0*(\d{1,2})(?!\d)/i)
  if (!match) return undefined
  const order = Number(match[1])
  return order >= 1 && order <= 30 ? order : undefined
}

export function paperFromFileName(value: string) {
  if (/paper[_\s-]*ii(?![a-z0-9])/i.test(value) || /paper[_\s-]*2(?!\d)/i.test(value)) return "PAPER_II"
  if (/paper[_\s-]*i(?![a-z0-9])/i.test(value) || /paper[_\s-]*1(?!\d)/i.test(value)) return "PAPER_I"
  return ""
}

export function normTopic(value: string) {
  return value.normalize("NFC").replace(/[\u200b\u200c\u200d\ufeff]/g, "").trim().toLowerCase().replace(/\s+/g, " ")
}

function prefer(topics: MatchTopic[]) {
  return [...topics].sort((a, b) => Number(b.slug != null) - Number(a.slug != null) || a.display_order - b.display_order)[0]
}

function withoutIndex(name: string) {
  return name.trim().replace(/^(?:topic\s*)?\d{1,2}[.)\-–—:\s]+/i, "").trim()
}

function paperOk(topic: MatchTopic, paper: string | undefined) {
  if (!paper || paper === "BOTH" || !topic.paper || topic.paper === "BOTH") return true
  return topic.paper === paper
}

function scoreSubtopics(subtopics: MatchSubtopic[], names: string[], eligibleIds: Set<string>) {
  const scores = new Map<string, number>()
  for (const part of names) {
    const topicIds = [...new Set(subtopics.filter((subtopic) => normTopic(subtopic.name) === part && eligibleIds.has(subtopic.topic_id)).map((subtopic) => subtopic.topic_id))]
    if (topicIds.length !== 1) continue
    scores.set(topicIds[0], (scores.get(topicIds[0]) ?? 0) + 1)
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1])
  if (!ranked.length || (ranked.length > 1 && ranked[0][1] === ranked[1][1])) return undefined
  return ranked[0][0]
}

export function matchImportTopic(
  topics: MatchTopic[],
  subtopics: MatchSubtopic[],
  name: string,
  exam: string,
  options: MatchOptions = {},
) {
  const eligible = topics.filter((topic) => (topic.exam === exam || topic.exam === "BOTH" || exam === "BOTH") && paperOk(topic, options.paper))
  const eligibleIds = new Set(eligible.map((topic) => topic.id))
  const exact = (value: string) => eligible.filter((topic) => normTopic(topic.name) === normTopic(value))
  const direct = exact(name)
  if (direct.length) return prefer(direct)
  const stripped = withoutIndex(name)
  if (stripped && normTopic(stripped) !== normTopic(name)) {
    const numbered = exact(stripped)
    if (numbered.length) return prefer(numbered)
  }
  if (options.topicOrder) {
    const byFile = eligible.filter((topic) => topic.display_order === options.topicOrder)
    if (byFile.length === 1) return byFile[0]
  }

  const parts = name.split(/[,，]/).map(normTopic).filter(Boolean)
  const fromTitle = scoreSubtopics(subtopics, parts.length > 1 ? parts : [normTopic(name)].filter(Boolean), eligibleIds)
  if (fromTitle && (parts.length < 2 || (scoreCount(subtopics, parts, eligibleIds, fromTitle) >= 2))) {
    return eligible.find((topic) => topic.id === fromTitle)
  }
  const fromRows = scoreSubtopics(
    subtopics,
    [...new Set((options.subtopicNames ?? []).map(normTopic).filter(Boolean))],
    eligibleIds,
  )
  return fromRows ? eligible.find((topic) => topic.id === fromRows) : undefined
}

function scoreCount(subtopics: MatchSubtopic[], names: string[], eligibleIds: Set<string>, topicId: string) {
  return names.filter((part) => {
    const topicIds = [...new Set(subtopics.filter((subtopic) => normTopic(subtopic.name) === part && eligibleIds.has(subtopic.topic_id)).map((subtopic) => subtopic.topic_id))]
    return topicIds.length === 1 && topicIds[0] === topicId
  }).length
}
