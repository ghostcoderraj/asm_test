import { TestEditor } from "@/components/admin/test-editor"
import { requireAdmin } from "@/lib/auth"

export default async function NewTestPage() {
  await requireAdmin()
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <h1 className="font-heading text-3xl">Create test</h1>
      <TestEditor />
    </div>
  )
}
