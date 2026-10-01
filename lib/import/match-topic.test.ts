import { describe, expect, it } from "vitest"
import { matchImportTopic, paperFromFileName, topicOrderFromFileName } from "@/lib/import/match-topic"

const topics = [
  { id: "t4", name: "गान एवं प्रबंध", exam: "STET", slug: "gaan-evam-prabandh", display_order: 4 },
  { id: "t2", name: "श्रुति-स्वर व्यवस्था एवं थाट", exam: "STET", slug: "shruti-swar-vyavastha-thaat", display_order: 2 },
]
const subtopics = [
  ["निबद्ध गान", "अनिबद्ध गान", "प्रबंध गान", "रागालाप", "रूपकालाप", "कलावन्त", "वाग्गेयकार"].map((name, index) => ({
    id: `s${index}`,
    topic_id: "t4",
    name,
  })),
  { id: "s-mixed", topic_id: "t2", name: "मिश्रित पुनरावृत्ति" },
].flat()

describe("matchImportTopic", () => {
  it("keeps an exact syllabus name", () => {
    expect(matchImportTopic(topics, subtopics, "गान एवं प्रबंध", "STET")?.id).toBe("t4")
  })

  it("maps topic 4's sheet title onto गान एवं प्रबंध", () => {
    const sheet =
      "निबद्ध गान, अनिबद्ध गान, प्रबंध गान, रागालाप, रूपकालाप, कलावन्त, वाग्गेयकार, गायक के गुण-दोष, नायक-नायिका"
    expect(matchImportTopic(topics, subtopics, sheet, "STET")?.name).toBe("गान एवं प्रबंध")
  })

  it("does not guess when the name matches nothing", () => {
    expect(matchImportTopic(topics, subtopics, "कुछ और", "STET")).toBeUndefined()
  })

  it("maps Paper II's short title when the sheet paper is Paper II", () => {
    const paperTopics = [
      { id: "p1", name: "वैदिक संगीत", exam: "STET", slug: "vaidik-sangeet", display_order: 6, paper: "PAPER_I" },
      { id: "p2", name: "संगीत की उत्पत्ति, वैदिक कालीन संगीत, वैदिक कालीन स्वर, सामगान", exam: "STET", slug: "p2-sangeet-utpatti", display_order: 1, paper: "PAPER_II" },
    ]
    const paperSubs = [
      { id: "a", topic_id: "p1", name: "वैदिक कालीन संगीत" },
      { id: "b", topic_id: "p1", name: "सामगान" },
      { id: "c", topic_id: "p2", name: "संगीत की उत्पत्ति" },
      { id: "d", topic_id: "p2", name: "वैदिक कालीन संगीत" },
      { id: "e", topic_id: "p2", name: "वैदिक कालीन स्वर" },
      { id: "f", topic_id: "p2", name: "सामगान" },
    ]
    expect(
      matchImportTopic(paperTopics, paperSubs, "संगीत की उत्पत्ति एवं वैदिक संगीत", "STET", {
        paper: "PAPER_II",
        subtopicNames: ["संगीत की उत्पत्ति", "वैदिक कालीन संगीत", "वैदिक कालीन स्वर", "सामगान"],
      })?.id,
    ).toBe("p2")
  })

  it("uses the file name topic number for that paper", () => {
    const paperTopics = [
      { id: "p1", name: "श्रुति-स्वर व्यवस्था एवं थाट", exam: "STET", slug: "paper-i-2", display_order: 2, paper: "PAPER_I" },
      { id: "p2", name: "हिंदुस्तानी एवं कर्नाटक संगीत — उद्भव, विकास, विशेषताएँ, स्वर एवं ताल", exam: "STET", slug: "p2-hindustani-karnatak", display_order: 2, paper: "PAPER_II" },
    ]
    expect(topicOrderFromFileName("STET_Paper_II_Music_Topic_02_Hindustani_Carnatic_100_VERIFIED.xlsx")).toBe(2)
    expect(paperFromFileName("STET_Paper_II_Music_Topic_02_Hindustani_Carnatic_100_VERIFIED.xlsx")).toBe("PAPER_II")
    expect(
      matchImportTopic(paperTopics, [], "हिंदुस्तानी संगीत एवं कर्नाटक संगीत", "STET", { paper: "PAPER_II", topicOrder: 2 })?.id,
    ).toBe("p2")
  })

  it("ignores a leading topic number", () => {
    const topics8 = [{ id: "t8", name: "सांगीतिक शब्दावली", exam: "STET", slug: "sangitik-shabdavali", display_order: 8 }]
    expect(matchImportTopic(topics8, [], "08 सांगीतिक शब्दावली", "STET")?.id).toBe("t8")
  })
})
