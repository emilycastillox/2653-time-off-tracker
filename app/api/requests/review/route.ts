import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/mailgun'

function formatDate(dateStr: string): string {
  // dateStr is "YYYY-MM-DD" — parse in local time to avoid UTC offset shifting the day
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

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
    const isRestriction = existing.request_type === 'time_restriction'
    const dateLabel = isRestriction
      ? formatDate(existing.start_date)
      : existing.start_date === existing.end_date
        ? formatDate(existing.start_date)
        : `${formatDate(existing.start_date)} – ${formatDate(existing.end_date)}`

    const actionWord = action === 'approved' ? 'approved' : 'denied'
    const subject = action === 'approved'
      ? 'Your Time-Off Request Has Been Approved'
      : 'Your Time-Off Request Has Been Denied'

    const body =
      `Dear ${existing.employee_name},\n\n` +
      `Your time off request for ${dateLabel} has been ${actionWord} by ${reviewerName}.\n\n` +
      `Please reach out to Jess, Tara, or Quynh specifically for any additional questions.\n\n` +
      `— 2653 Legacy Place`

    await sendEmail(existing.employee_email, subject, body)
  } catch (e) {
    console.error('Mailgun error (non-fatal):', e)
  }

  return NextResponse.json({ success: true })
}
