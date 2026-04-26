import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  const { policyId } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: policy } = await supabase
    .from('policies').select('stripe_subscription_id').eq('id', policyId).single()

  if (policy?.stripe_subscription_id) {
    await stripe.subscriptions.cancel(policy.stripe_subscription_id)
  }

  await supabase.from('policies').update({
    status: 'cancelled', cancelled_at: new Date().toISOString(),
  }).eq('id', policyId)

  return NextResponse.json({ success: true })
}
