import { AuthForm } from "@/components/auth/auth-form"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AuthForm />
      </div>
    </div>
  )
}