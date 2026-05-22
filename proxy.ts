import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])
const isProtectedRoute = createRouteMatcher(['/admin(.*)', '/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  const role = (sessionClaims as Record<string, unknown> & { metadata?: { role?: string } })?.metadata?.role

  if (!userId && isProtectedRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url)
    return NextResponse.redirect(signInUrl)
  }

  if (!userId) return NextResponse.next()

  if (req.nextUrl.pathname === '/') {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/requests', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (isAdminRoute(req) && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (isDashboardRoute(req) && role === 'admin') {
    return NextResponse.redirect(new URL('/admin/requests', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
