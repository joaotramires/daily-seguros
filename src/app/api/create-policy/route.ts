import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { customerId, product, monthlyPremium, answers } = await req.json()

  if (!customerId || !product || !monthlyPremium) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Cancel any existing active policy for this customer+product before creating the new one
  await supabase
    .from('policies')
    .update({ status: 'cancelled' })
    .eq('customer_id', customerId)
    .eq('product', product)
    .eq('status', 'active')

  const { data, error } = await supabase
    .from('policies')
    .insert({
      customer_id: customerId,
      product,
      status: 'active',
      monthly_premium: monthlyPremium,
      annual_premium: monthlyPremium * 12,
      answers: answers || {},
      starts_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ policyId: data.id })
}
