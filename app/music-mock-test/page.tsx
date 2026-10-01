import type { Metadata } from "next"
import { Landing } from "@/app/stet-music-mock-test/page"

export const metadata: Metadata = {
  title: "Music Mock Test",
  description: "Music mock tests for STET and BPSC from Anand Sangeet Mahavidyalaya.",
}

export default function Page() {
  return <Landing title="Music Mock Test" exam="STET and BPSC Music" practiceHref="/register" />
}
