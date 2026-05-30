import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type TimeOffRequest = {
  id: string
  employee_name: string
  employee_position: string
  employee_id: string
  request_type: 'time_off' | 'time_restriction'
  reason: string
  start_date: string
  end_date: string
  location: string
  num_days: number
  time_start: string | null
  time_end: string | null
  status: 'pending' | 'approved' | 'denied'
  clerk_user_id: string
  employee_email: string
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}
