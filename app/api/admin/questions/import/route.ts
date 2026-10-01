import { requireAdmin } from "@/lib/auth"
import { fail, ok } from "@/lib/errors"
import { parseQuestionFile } from "@/lib/import/parse"
import { saveImportedQuestions } from "@/lib/import/save"
import { auditAdminAction } from "@/lib/security/audit"
import { clientAddress, rateLimit, sameOrigin } from "@/lib/security/guard"
import { acceptedQuestionFile, importRowLimit } from "@/lib/security/upload"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json(fail("FORBIDDEN"), { status: 403 })
  const admin = await requireAdmin()
  if (!rateLimit(`import:${admin.id}:${clientAddress(request.headers)}`, 20, 60 * 60 * 1000)) {
    return Response.json(fail("INVALID_INPUT", "Too many imports. Please wait and try again."), { status: 429 })
  }
  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return Response.json(fail("INVALID_INPUT", "Choose a file."), { status: 400 })
  if (file.size > 5_000_000) return Response.json(fail("INVALID_INPUT", "Keep the file under 5 MB."), { status: 400 })
  const rejected = await acceptedQuestionFile(file)
  if (rejected) return Response.json(fail("INVALID_INPUT", rejected), { status: 400 })

  const parsed = await parseQuestionFile(file)
  if (parsed.rows.length > importRowLimit()) {
    return Response.json(fail("TOO_MANY_ROWS"), { status: 400 })
  }
  if (parsed.missing.length > 0) {
    return Response.json(fail("INVALID_INPUT", `Missing columns: ${parsed.missing.join(", ")}`), { status: 400 })
  }

  let summary
  try {
    summary = await saveImportedQuestions(createAdminClient(), parsed.rows, {
      commit: form.get("commit") === "true",
      publish: form.get("publish") === "true",
      fileName: file.name,
      sheet: parsed.sheet,
    })
  } catch {
    await auditAdminAction({ actorId: admin.id, action: "import_questions", resource: file.name, result: "failed" })
    return Response.json(fail("UNEXPECTED_ERROR", "The file was read, but the questions could not be saved."), { status: 400 })
  }
  if (form.get("commit") === "true") {
    await auditAdminAction({ actorId: admin.id, action: "import_questions", resource: file.name, result: "ok" })
  }

  const committed = form.get("commit") === "true"
  const topics = summary.topics
  const topicLabel = topics.map((topic) => topic.savedAs || topic.topic).filter(Boolean).join(", ")
  return Response.json({
    ...ok(
      committed
        ? `${summary.new_rows} new questions imported${topicLabel ? ` for ${topicLabel}` : ""}.${summary.invalid ? " Invalid rows were skipped." : ""}`
        : summary.invalid
          ? "Preview ready. Invalid rows will not be imported."
          : "Preview ready. These rows can be imported.",
    ),
    summary,
    sheet: parsed.sheet,
    topics,
  })
}
