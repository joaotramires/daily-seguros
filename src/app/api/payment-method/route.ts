import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { customerId, type, label, sub, isDefault } = await req.json()

  if (!customerId || !type || !label) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('payment_methods')
    .insert({ customer_id: customerId, type, label, sub: sub || '', is_default: isDefault ?? false })
    .select('id, type, label, sub, is_default')
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ paymentMethod: data })
}

export async function PATCH(req: NextRequest) {
  const { customerId, pmId } = await req.json()

  if (!customerId || !pmId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Verify the target payment method belongs to this customer before setting default
  const { data: pm } = await supabase
    .from('payment_methods')
    .select('customer_id')
    .eq('id', pmId)
    .single()

  if (!pm || pm.customer_id !== customerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabase.from('payment_methods').update({ is_default: false }).eq('customer_id', customerId)
  await supabase.from('payment_methods').update({ is_default: true }).eq('id', pmId).eq('customer_id', customerId)

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { pmId, customerId } = await req.json()

  if (!pmId || !customerId) {
    return NextResponse.json({ error: 'Missing pmId or customerId' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Verify ownership before deleting
  const { data: pm } = await supabase
    .from('payment_methods')
    .select('customer_id')
    .eq('id', pmId)
    .single()

  if (!pm || pm.customer_id !== customerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('payment_methods').delete().eq('id', pmId)

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
