import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get('id')
  if (!customerId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: policies }, { data: customer }, { data: claims }, { data: paymentMethods }] = await Promise.all([
    supabase.from('policies').select('id, product, monthly_premium').eq('customer_id', customerId).eq('status', 'active'),
    supabase.from('customers').select('name, email, phone, loyalty_months').eq('id', customerId).single(),
    supabase.from('claims').select('id, description, status, created_at').eq('customer_id', customerId).order('created_at', { ascending: false }),
    supabase.from('payment_methods').select('id, type, label, sub, is_default').eq('customer_id', customerId).order('created_at'),
  ])

  return NextResponse.json({
    policies: policies || [],
    loyaltyMonths: customer?.loyalty_months ?? 0,
    profile: customer ? { name: customer.name, email: customer.email, phone: customer.phone || '' } : null,
    claims: claims || [],
    paymentMethods: paymentMethods || [],
  })
}
