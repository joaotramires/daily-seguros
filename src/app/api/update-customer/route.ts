import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing customer id' }, { status: 400 })
  }

  // Whitelist: only safe profile fields can be updated via this route
  const ALLOWED = ['name', 'phone', 'city', 'fcm_token']
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => ALLOWED.includes(k))
  )
  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('customers')
    .update(safeUpdates)
    .eq('id', id)

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
