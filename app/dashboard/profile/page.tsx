import { ChangePasswordForm, ProfileForm } from "@/components/auth/forms"
import { requireUser } from "@/lib/auth"
import { formatMobile } from "@/lib/phone"

export default async function ProfilePage() {
  const profile = await requireUser()
  return (
    <div className="mx-auto grid w-full max-w-lg gap-4">
      <h1 className="font-heading text-3xl">Profile</h1>
      <ProfileForm fullName={profile.full_name} targetExam={profile.target_exam} targetPaper={profile.target_paper} mobile={formatMobile(profile.mobile_number)} />
      <ChangePasswordForm />
    </div>
  )
}
