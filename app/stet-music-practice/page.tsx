import type { Metadata } from "next"
import { Landing } from "@/app/stet-music-mock-test/page"

export const metadata: Metadata = {
  title: "STET Music Practice",
  description: "Topic-wise STET Music practice and weak-topic revision from Anand Sangeet Mahavidyalaya.",
}

export default function Page() {
  return <Landing title="STET Music Practice" exam="STET Music" practiceHref="/register" />
}
