import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(req: NextRequest) {
  const { claimId, description, status } = await req.json()

  if (!claimId) {
    return NextResponse.json({ error: 'Missing claimId' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const updates: Record<string, unknown> = {}
  if (description) updates.description = description
  if (status) {
    updates.status = status
    if (status === 'resolved') updates.resolved_at = new Date().toISOString()
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase.from('claims').update(updates).eq('id', claimId)

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
