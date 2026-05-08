import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get('id')
  if (!customerId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: policies }, { data: customer }, { data: claims }, { data: paymentMethods }, { data: referralData }] = await Promise.all([
    supabase.from('policies').select('id, product, monthly_premium, starts_at, created_at, answers').eq('customer_id', customerId).eq('status', 'active'),
    supabase.from('customers').select('name, email, phone, loyalty_months, referral_code').eq('id', customerId).single(),
    supabase.from('claims').select('id, description, status, created_at').eq('customer_id', customerId).order('created_at', { ascending: false }),
    supabase.from('payment_methods').select('id, type, label, sub, is_default').eq('customer_id', customerId).order('created_at'),
    supabase.from('referrals').select('reward_eligible_at, reward_forfeited').eq('referrer_id', customerId).eq('converted', true),
  ])

  // Calculate loyalty months from oldest active policy start date
  const activePolicies = policies || []
  const oldest = activePolicies
    .filter(p => p.starts_at)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0]
  const loyaltyMonths = oldest
    ? Math.floor((Date.now() - new Date(oldest.starts_at).getTime()) / (30.44 * 24 * 60 * 60 * 1000))
    : customer?.loyalty_months ?? 0

  const now = new Date()
  const refs = referralData || []
  const earnedRefs  = refs.filter(r => !r.reward_forfeited && r.reward_eligible_at && new Date(r.reward_eligible_at) <= now)
  const pendingRefs = refs.filter(r => !r.reward_forfeited && r.reward_eligible_at && new Date(r.reward_eligible_at) > now)
  const nextEligibleAt = pendingRefs.length > 0
    ? pendingRefs.map(r => r.reward_eligible_at).sort()[0]
    : null

  return NextResponse.json({
    policies: activePolicies,
    loyaltyMonths,
    profile: customer ? { name: customer.name, email: customer.email, phone: customer.phone || '' } : null,
    referralCode: customer?.referral_code ?? null,
    claims: claims || [],
    paymentMethods: paymentMethods || [],
    referralStats: {
      earned:  earnedRefs.length,
      pending: pendingRefs.length,
      forfeited: refs.filter(r => r.reward_forfeited).length,
      nextEligibleAt,
    },
  })
}
