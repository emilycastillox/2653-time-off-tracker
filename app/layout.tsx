import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: '2653 Time-Off Tracker',
  description: 'Internal time-off request management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in">
      <html lang="en">
        <body className="min-h-screen bg-gray-50 text-gray-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
