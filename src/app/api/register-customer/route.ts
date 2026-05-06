import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { name, email, phone, city, platform, referred_by, consent_gdpr, consent_marketing } = await req.json()

  if (!name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const normalizedEmail = email.toLowerCase().trim()

  // Check if customer already exists
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('email', normalizedEmail)
    .single()

  if (existing) {
    // Existing customer — update non-sensitive fields only, never overwrite consent or referred_by
    await supabase.from('customers').update({
      name,
      phone: phone || null,
      city: city || 'Madrid',
      ...(platform ? { platform } : {}),
    }).eq('id', existing.id)
    return NextResponse.json({ customerId: existing.id })
  }

  // New customer — store all fields including consent
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name,
      email: normalizedEmail,
      phone: phone || null,
      city: city || 'Madrid',
      consent_gdpr:      consent_gdpr      ?? false,
      consent_marketing: consent_marketing ?? false,
      ...(platform    ? { platform }    : {}),
      ...(referred_by ? { referred_by } : {}),
    })
    .select('id')
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create referral record if referred_by code was provided
  if (referred_by && data?.id) {
    const { data: referrer } = await supabase
      .from('customers')
      .select('id')
      .eq('referral_code', referred_by)
      .single()
    if (referrer) {
      await supabase.from('referrals').insert({
        referrer_id:    referrer.id,
        referred_email: normalizedEmail,
        converted:      false,
      })
    }
  }

  return NextResponse.json({ customerId: data.id })
}
