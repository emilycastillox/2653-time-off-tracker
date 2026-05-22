import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/mailgun'

export async function POST(request: NextRequest) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const role = (sessionClaims as Record<string, unknown> & { metadata?: { role?: string } })?.metadata?.role
  if (role !== 'admin') return new NextResponse('Forbidden', { status: 403 })

  const user = await currentUser()
  const reviewerName = user?.fullName || user?.emailAddresses[0]?.emailAddress || 'Admin'

  const body = await request.json()
  const { requestId, action } = body

  if (!requestId || !['approved', 'denied'].includes(action)) {
    return new NextResponse('Invalid request', { status: 400 })
  }

  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!existing) return new NextResponse('Request not found', { status: 404 })

  const { error } = await supabase
    .from('requests')
    .update({
      status: action,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerName,
    })
    .eq('id', requestId)

  if (error) {
    console.error('Supabase update error:', error)
    return new NextResponse('Database error', { status: 500 })
  }

  try {
    if (action === 'approved') {
      await sendEmail(
        existing.employee_email,
        'Your Time-Off Request Has Been Approved',
        `Hi ${existing.employee_name}, your request for ${existing.start_date} – ${existing.end_date} has been approved. Enjoy your time off!`
      )
    } else {
      await sendEmail(
        existing.employee_email,
        'Your Time-Off Request Has Been Denied',
        `Hi ${existing.employee_name}, your request for ${existing.start_date} – ${existing.end_date} has been denied. Please reach out to management with any questions.`
      )
    }
  } catch (e) {
    console.error('Mailgun error (non-fatal):', e)
  }

  return NextResponse.json({ success: true })
}
