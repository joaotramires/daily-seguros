import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(req: NextRequest) {
  const { customerId, field, value } = await req.json()

  if (!customerId || !field || value === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const allowed = ['name', 'email', 'phone']
  if (!allowed.includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('customers')
    .update({ [field]: value })
    .eq('id', customerId)

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
