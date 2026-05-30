import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const user = await currentUser()
  const employee_email = user?.emailAddresses[0]?.emailAddress
  if (!employee_email) return new NextResponse('No email on account', { status: 400 })

  const body = await request.json()
  const {
    employee_name,
    employee_position,
    employee_id,
    request_type = 'time_off',
    reason,
    start_date,
    end_date,
    num_days,
    time_start = null,
    time_end = null,
  } = body

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
      request_type,
      reason,
      start_date,
      end_date,
      location: '2653 Legacy Place',
      num_days,
      time_start,
      time_end,
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

  return NextResponse.json(data)
}
