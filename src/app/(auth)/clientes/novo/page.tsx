'use client'

import { useRouter } from 'next/navigation'
import { ClienteForm } from '@/components/cliente/ClienteForm'
import { createClient } from '@/lib/supabase/client'
import type { ClientFormData } from '@/types/client'

export default function NovoClientePage() {
  const router = useRouter()

  const handleSave = async (data: ClientFormData) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('client').insert({
      name: data.name,
      doc_type: data.doc_type,
      cpf: data.cpf || null,
      rg: data.rg || null,
      cnpj: data.cnpj || null,
      ie: data.ie || null,
      phone: data.phone,
      cep: data.cep || null,
      address: data.address || null,
      neighborhood: data.neighborhood || null,
      city: data.city || null,
      notes: data.notes || null,
      created_by: user?.id,
    })

    if (error) throw error
    router.push('/clientes')
    router.refresh()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
        <p className="text-sm text-gray-500 mt-1">Cadastre um novo cliente</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ClienteForm onSave={handleSave} saveLabel="Cadastrar Cliente" />
      </div>
    </div>
  )
}
