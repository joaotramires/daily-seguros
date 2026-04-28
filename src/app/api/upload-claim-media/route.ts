import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  const claimId = formData.get('claimId') as string

  if (!files.length) return NextResponse.json({ urls: [] })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const urls: string[] = []
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'bin'
    const path = `${claimId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('claim-media')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (!error && data) {
      const { data: urlData } = supabase.storage.from('claim-media').getPublicUrl(data.path)
      urls.push(urlData.publicUrl)
    }
  }

  return NextResponse.json({ urls })
}
