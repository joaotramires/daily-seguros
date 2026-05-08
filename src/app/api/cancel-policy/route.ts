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
    .from('policies')
    .select('customer_id, stripe_subscription_id')
    .eq('id', policyId)
    .single()

  if (policy?.stripe_subscription_id) {
    await stripe.subscriptions.cancel(policy.stripe_subscription_id)
  }

  await supabase.from('policies').update({
    status: 'cancelled', cancelled_at: new Date().toISOString(),
  }).eq('id', policyId)

  // Forfeit pending referral rewards if customer has no remaining active policies
  if (policy?.customer_id) {
    const { data: remaining } = await supabase
      .from('policies')
      .select('id')
      .eq('customer_id', policy.customer_id)
      .eq('status', 'active')

    if (!remaining || remaining.length === 0) {
      const now = new Date().toISOString()
      const { data: customer } = await supabase
        .from('customers')
        .select('email')
        .eq('id', policy.customer_id)
        .single()

      // Forfeit rewards where this customer is the referred party
      if (customer?.email) {
        await supabase
          .from('referrals')
          .update({ reward_forfeited: true })
          .eq('referred_email', customer.email)
          .eq('converted', true)
          .eq('reward_forfeited', false)
          .gt('reward_eligible_at', now)
      }

      // Forfeit rewards where this customer is the referrer
      await supabase
        .from('referrals')
        .update({ reward_forfeited: true })
        .eq('referrer_id', policy.customer_id)
        .eq('converted', true)
        .eq('reward_forfeited', false)
        .gt('reward_eligible_at', now)
    }
  }

  return NextResponse.json({ success: true })
}
