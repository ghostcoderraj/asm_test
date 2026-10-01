import { ImportForm } from "@/components/admin/import-form"
import { PublishDrafts } from "@/components/admin/publish-drafts"
import { requireAdmin } from "@/lib/auth"

export default async function ImportPage() {
  await requireAdmin()
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <h1 className="font-heading text-3xl">Import questions</h1>
      <p className="text-sm text-muted-foreground">
        Name the file like STET_Paper_II_Music_Topic_02_….xlsx and keep one topic in each file. The question sheet is imported. A notes sheet is ignored.
        Each row needs question, option_a, option_b, option_c, option_d, correct_answer (A–D), exam (STET), paper (PAPER_I or PAPER_II), subject (MUSIC), topic, subtopic, and difficulty (EASY, MEDIUM, or HARD).
        question_type is PRACTICE, PYQ_BASED, or PREVIOUS_YEAR. A previous-year row also needs a real year, such as 2024. Those rows can be used in a previous-year mock.
        Publish on import is already ticked. If it was left off, publish the drafts below.
      </p>
      <a className="text-sm text-primary underline" href="/samples/questions-template.csv">Download CSV template</a>
      <PublishDrafts label="Publish all draft questions" />
      <ImportForm />
    </div>
  )
}
