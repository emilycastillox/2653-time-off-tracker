import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return { error: new NextResponse('Unauthorized', { status: 401 }) }
  const role = (sessionClaims as Record<string, unknown> & { metadata?: { role?: string } })?.metadata?.role
  if (role !== 'admin') return { error: new NextResponse('Forbidden', { status: 403 }) }
  return { error: null }
}

// Edit any approved entry. Only the fields the admin can change are updated;
// status / created_by_admin / employee_position are left untouched. No email.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const body = await request.json()
  const {
    employee_name,
    employee_id = null,
    request_type,
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
    .update({
      employee_name,
      employee_id,
      request_type,
      reason,
      start_date,
      end_date,
      num_days,
      time_start,
      time_end,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Supabase update error:', error)
    return new NextResponse('Database error', { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const supabase = createServerClient()
  const { error } = await supabase.from('requests').delete().eq('id', id)

  if (error) {
    console.error('Supabase delete error:', error)
    return new NextResponse('Database error', { status: 500 })
  }

  return NextResponse.json({ success: true })
}
