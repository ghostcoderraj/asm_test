export type AnswerMark = {
  selected: string | null
  correct: string
}

export type ScoreSummary = {
  total: number
  correct: number
  wrong: number
  unanswered: number
  score: number
  percentage: number
  accuracy: number
}

export function scoreAttempt(answers: AnswerMark[]): ScoreSummary {
  let correct = 0
  let wrong = 0
  let unanswered = 0

  for (const answer of answers) {
    if (!answer.selected) unanswered += 1
    else if (answer.selected === answer.correct) correct += 1
    else wrong += 1
  }

  const total = answers.length
  const attempted = correct + wrong
  return {
    total,
    correct,
    wrong,
    unanswered,
    score: correct,
    percentage: total === 0 ? 0 : round1((correct / total) * 100),
    accuracy: attempted === 0 ? 0 : round1((correct / attempted) * 100),
  }
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}
