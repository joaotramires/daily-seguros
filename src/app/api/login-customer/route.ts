import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ found: false })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('customers')
    .select('id, name')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (data) {
    return NextResponse.json({ found: true, customerId: data.id, name: data.name })
  }
  return NextResponse.json({ found: false })
}
