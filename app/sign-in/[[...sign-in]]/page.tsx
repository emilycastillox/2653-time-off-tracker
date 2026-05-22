import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center mb-8 absolute top-12">
        <h1 className="text-2xl font-bold text-gray-900">2653 Legacy Place</h1>
        <p className="text-gray-500 text-sm mt-1">Time-Off Request Portal</p>
      </div>
      <SignIn />
    </div>
  )
}
