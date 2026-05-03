import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { name, email, phone, city, platform, referred_by } = await req.json()

  if (!name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const normalizedEmail = email.toLowerCase().trim()

  const { data, error } = await supabase
    .from('customers')
    .upsert({
      name,
      email: normalizedEmail,
      phone: phone || null,
      city: city || 'Madrid',
      ...(platform ? { platform } : {}),
      ...(referred_by ? { referred_by } : {}),
    }, { onConflict: 'email' })
    .select('id')
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ customerId: data.id })
}
