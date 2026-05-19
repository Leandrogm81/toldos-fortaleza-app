import { createServerAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServerAdminClient()

  const { data, error } = await supabase
    .from('document')
    .select('id, type, status, date, doc_data, logo_data_url, signature_data_url, company_signature_data_url, public_token')
    .eq('public_token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
