import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { customerId, policyId, description, mediaUrls, incidentDate } = await req.json()

  if (!customerId || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (policyId && incidentDate) {
    const { data: policy } = await supabase
      .from('policies')
      .select('starts_at')
      .eq('id', policyId)
      .eq('customer_id', customerId)
      .single()
    if (policy && new Date(incidentDate) < new Date(policy.starts_at)) {
      const formatted = new Date(policy.starts_at).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
      return NextResponse.json(
        { error: `Tu cobertura comienza el ${formatted}. No podemos gestionar incidentes anteriores a esa fecha.` },
        { status: 422 }
      )
    }
  }

  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 30)

  const { data, error } = await supabase
    .from('claims')
    .insert({
      customer_id: customerId,
      policy_id: policyId || null,
      description,
      resolution_deadline: deadline.toISOString(),
      ...(incidentDate ? { incident_date: incidentDate } : {}),
      ...(mediaUrls?.length ? { media_urls: mediaUrls } : {}),
    })
    .select('id')
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ claimId: data.id })
}
