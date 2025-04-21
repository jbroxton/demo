import { AuthForm } from "@/components/auth/auth-form"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo and Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-600/20">
            <span className="text-xl font-semibold text-white">S</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500">
            Sign in to your account to continue
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-2xl shadow-gray-100/50">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}