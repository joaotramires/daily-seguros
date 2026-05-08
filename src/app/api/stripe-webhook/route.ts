import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const { policyId } = session.metadata || {}
      if (policyId) {
        // Preserve carencia starts_at if it's already set to a future date
        const { data: existing } = await supabase
          .from('policies').select('starts_at').eq('id', policyId).single()
        const now = new Date()
        const existingStart = existing?.starts_at ? new Date(existing.starts_at) : null
        const startsAt = existingStart && existingStart > now
          ? existing!.starts_at
          : now.toISOString()

        await supabase.from('policies').update({
          status: 'active',
          stripe_subscription_id: (session.subscription ?? session.payment_intent) as string,
          starts_at: startsAt,
        }).eq('id', policyId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('policies').update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      // Mark policy cancelled if Stripe marks the subscription as past_due or unpaid
      if (sub.status === 'past_due' || sub.status === 'unpaid') {
        await supabase.from('policies').update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string | null
      if (subId) {
        // Log for now — notify María via the admin page; future: push notification
        console.error(`Payment failed for subscription ${subId}`, { customer: invoice.customer })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
