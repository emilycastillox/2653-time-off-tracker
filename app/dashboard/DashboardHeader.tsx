'use client'

import { UserButton, useUser } from '@clerk/nextjs'

export default function DashboardHeader() {
  const { user } = useUser()

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">2653 Legacy Place</h1>
        <p className="text-xs text-gray-500">Time-Off Request Portal</p>
      </div>
      <div className="flex items-center gap-3">
        {user?.fullName && (
          <span className="text-sm text-gray-600">Hello, <span className="font-medium text-gray-900">{user.fullName}</span></span>
        )}
        <UserButton />
      </div>
    </header>
  )
}
