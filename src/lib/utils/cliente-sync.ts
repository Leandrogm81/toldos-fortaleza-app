import { createClient } from '@/lib/supabase/client'

export async function upsertClientFromForm(data: {
  clientName: string
  clientPhone: string
  clientCep?: string
  clientAddress?: string
  clientNeighborhood?: string
  clientCity?: string
  clientCpf?: string
  clientCnpj?: string
  clientRg?: string
  clientIe?: string
}): Promise<string | null> {
  if (!data.clientName?.trim() || !data.clientPhone?.trim()) return null

  const supabase = createClient()

  // Check if client already exists by name + phone
  const { data: existing } = await supabase
    .from('client')
    .select('id')
    .eq('name', data.clientName.trim())
    .eq('phone', data.clientPhone.trim())
    .limit(1)
    .single()

  if (existing) return existing.id

  // Create new client
  const isPJ = !!(data.clientCnpj?.trim())
  const { data: created } = await supabase
    .from('client')
    .insert({
      name: data.clientName.trim(),
      phone: data.clientPhone.trim(),
      doc_type: isPJ ? 'pj' : 'pf',
      cpf: data.clientCpf?.trim() || null,
      rg: data.clientRg?.trim() || null,
      cnpj: data.clientCnpj?.trim() || null,
      ie: data.clientIe?.trim() || null,
      cep: data.clientCep?.trim() || null,
      address: data.clientAddress?.trim() || null,
      neighborhood: data.clientNeighborhood?.trim() || null,
      city: data.clientCity?.trim() || null,
    })
    .select('id')
    .single()

  return created?.id || null
}
