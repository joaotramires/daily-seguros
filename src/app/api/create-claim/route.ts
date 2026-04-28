import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { customerId, policyId, description } = await req.json()

  if (!customerId || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 30)

  const { data, error } = await supabase
    .from('claims')
    .insert({
      customer_id: customerId,
      policy_id: policyId || null,
      description,
      resolution_deadline: deadline.toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ claimId: data.id })
}
