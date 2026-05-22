import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/mailgun'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const user = await currentUser()
  const employee_email = user?.emailAddresses[0]?.emailAddress
  if (!employee_email) return new NextResponse('No email on account', { status: 400 })

  const body = await request.json()
  const { employee_name, employee_position, employee_id, reason, start_date, end_date, num_days } = body

  if (!employee_name || !employee_position || !employee_id || !reason || !start_date || !end_date || !num_days) {
    return new NextResponse('Missing required fields', { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('requests')
    .insert({
      employee_name,
      employee_position,
      employee_id,
      reason,
      start_date,
      end_date,
      location: '2653 Legacy Place',
      num_days,
      status: 'pending',
      clerk_user_id: userId,
      employee_email,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    return new NextResponse('Database error', { status: 500 })
  }

  const adminEmails = [
    process.env.ADMIN_EMAIL_1,
    process.env.ADMIN_EMAIL_2,
  ].filter(Boolean) as string[]

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (adminEmails.length > 0) {
    try {
      await sendEmail(
        adminEmails,
        `New Time-Off Request from ${employee_name}`,
        `${employee_name} (${employee_position}, ID: ${employee_id}) has submitted a time-off request.\n\nReason: ${reason}\nDates: ${start_date} – ${end_date} (${num_days} days)\nLocation: 2653 Legacy Place\n\nLog in to review: ${appUrl}/admin/requests`
      )
    } catch (e) {
      console.error('Mailgun error (non-fatal):', e)
    }
  }

  return NextResponse.json(data)
}
