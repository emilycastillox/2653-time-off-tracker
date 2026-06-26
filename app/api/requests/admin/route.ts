import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Admin-created, pre-approved time off. No email is sent — these aren't tied to an
// employee login and represent time off that was already arranged in person.
export async function POST(request: NextRequest) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const role = (sessionClaims as Record<string, unknown> & { metadata?: { role?: string } })?.metadata?.role
  if (role !== 'admin') return new NextResponse('Forbidden', { status: 403 })

  const user = await currentUser()
  const reviewerName = user?.fullName || user?.emailAddresses[0]?.emailAddress || 'Admin'

  const body = await request.json()
  const {
    employee_name,
    employee_id = null,
    request_type = 'time_off',
    reason,
    start_date,
    end_date,
    num_days,
    time_start = null,
    time_end = null,
  } = body

  if (!employee_name || !reason || !start_date || !end_date || !num_days) {
    return new NextResponse('Missing required fields', { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('requests')
    .insert({
      employee_name,
      employee_position: null,
      employee_id,
      request_type,
      reason,
      start_date,
      end_date,
      location: '2653 Legacy Place',
      num_days,
      time_start,
      time_end,
      status: 'approved',
      created_by_admin: true,
      clerk_user_id: null,
      employee_email: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerName,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    return new NextResponse('Database error', { status: 500 })
  }

  return NextResponse.json(data)
}
