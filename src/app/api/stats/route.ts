import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ count: memberCount }, { data: donations }] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('policies').select('monthly_premium').eq('status', 'active'),
  ])

  const totalDonation = (donations || []).reduce(
    (sum, p) => sum + Number(p.monthly_premium) * 0.05, 0
  )

  return NextResponse.json({
    memberCount: memberCount ?? 0,
    totalDonation: Math.round(totalDonation * 100) / 100,
  })
}
