'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function AdminNav() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="mr-4">
            <p className="text-sm font-semibold text-gray-900">2653 Legacy Place</p>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
          <nav className="flex gap-1">
            <Link
              href="/admin/requests"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              All Requests
            </Link>
            <Link
              href="/admin/approved"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Approved Time Off
            </Link>
          </nav>
        </div>
        <UserButton />
      </div>
    </header>
  )
}
