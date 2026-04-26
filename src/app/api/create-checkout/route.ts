import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  const { productId, price, answers, customerId } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get or create Stripe customer
  const { data: customer } = await supabase
    .from('customers').select('stripe_customer_id, email, name').eq('id', customerId).single()

  let stripeCustomerId = customer?.stripe_customer_id
  if (!stripeCustomerId) {
    const sc = await stripe.customers.create({ email: customer?.email, name: customer?.name })
    stripeCustomerId = sc.id
    await supabase.from('customers').update({ stripe_customer_id: sc.id }).eq('id', customerId)
  }

  // Create pending policy
  const { data: policy } = await supabase.from('policies').insert({
    customer_id: customerId, product: productId, status: 'pending',
    monthly_premium: price, annual_premium: price * 12, answers,
  }).select().single()

  // Create Stripe Checkout Session
  const isTravel = productId === 'travel'
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card', 'paypal'],
    mode: isTravel ? 'payment' : 'subscription',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: `Daily Seguro ${productId}` },
        unit_amount: Math.round(price * 100),
        ...(isTravel ? {} : { recurring: { interval: 'month' } }),
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')}/app?success=1`,
    cancel_url:  `${process.env.NEXT_PUBLIC_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')}/app`,
    metadata: { policyId: policy?.id },
  })

  return NextResponse.json({ url: session.url })
}
