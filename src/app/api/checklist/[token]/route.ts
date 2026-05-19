import { createServerAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServerAdminClient()

  const { data, error } = await supabase
    .from('checklist')
    .select('id, items, status')
    .eq('public_token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServerAdminClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('checklist')
    .update({
      items: body.items,
      status: body.status,
      completed_at: body.completed_at,
    })
    .eq('public_token', token)
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
