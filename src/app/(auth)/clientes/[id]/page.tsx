'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClienteForm } from '@/components/cliente/ClienteForm'
import type { Client, ClientFormData } from '@/types/client'

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [docCount, setDocCount] = useState(0)
  const [apptCount, setApptCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    if (!id) return
    const supabase = createClient()
    const { data } = await supabase.from('client').select('*').eq('id', id).single()
    if (data) {
      setClient(data)
      // Count related documents and appointments
      const { count: docs } = await supabase.from('document').select('*', { count: 'exact', head: true }).eq('client_id', id)
      const { count: appts } = await supabase.from('appointment').select('*', { count: 'exact', head: true }).eq('client_id', id)
      setDocCount(docs || 0)
      setApptCount(appts || 0)
    }
    setLoading(false)
  }

  const handleEdit = async (data: ClientFormData) => {
    const supabase = createClient()
    const { error } = await supabase.from('client').update({
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
    }).eq('id', id)
    if (error) throw error
    setEditing(false)
    await loadData()
    router.refresh()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 bg-gray-100 rounded w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">Cliente não encontrado</p>
        <Link href="/clientes" className="text-sm text-sky-600 hover:text-sky-700 mt-2 inline-block">
          Voltar para clientes
        </Link>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ClienteForm
            initialData={{
              name: client.name,
              doc_type: client.doc_type,
              cpf: client.cpf || '',
              rg: client.rg || '',
              cnpj: client.cnpj || '',
              ie: client.ie || '',
              phone: client.phone,
              cep: client.cep || '',
              address: client.address || '',
              neighborhood: client.neighborhood || '',
              city: client.city || '',
              notes: client.notes || '',
            }}
            onSave={handleEdit}
            onCancel={() => setEditing(false)}
            saveLabel="Atualizar"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              client.doc_type === 'pj'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {client.doc_type === 'pj' ? 'PJ' : 'PF'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Cliente desde {new Date(client.created_at || '').toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-sm font-medium text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
          >
            Editar
          </button>
          <Link
            href="/clientes"
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Voltar
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pedidos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{docCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Agendamentos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{apptCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{client.phone}</p>
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Dados do Cliente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Nome:</span>
            <p className="font-medium text-gray-900">{client.name}</p>
          </div>
          <div>
            <span className="text-gray-500">Telefone:</span>
            <p className="font-medium text-gray-900">{client.phone}</p>
          </div>
          {client.cep && (
            <div>
              <span className="text-gray-500">CEP:</span>
              <p className="font-medium text-gray-900">{client.cep}</p>
            </div>
          )}
          {client.address && (
            <div className="sm:col-span-2">
              <span className="text-gray-500">Endereço:</span>
              <p className="font-medium text-gray-900">
                {client.address}
                {client.neighborhood ? ` - ${client.neighborhood}` : ''}
                {client.city ? ` - ${client.city}` : ''}
              </p>
            </div>
          )}
          {client.doc_type === 'pf' && (
            <>
              {client.cpf && (
                <div>
                  <span className="text-gray-500">CPF:</span>
                  <p className="font-medium text-gray-900">{client.cpf}</p>
                </div>
              )}
              {client.rg && (
                <div>
                  <span className="text-gray-500">RG:</span>
                  <p className="font-medium text-gray-900">{client.rg}</p>
                </div>
              )}
            </>
          )}
          {client.doc_type === 'pj' && (
            <>
              {client.cnpj && (
                <div>
                  <span className="text-gray-500">CNPJ:</span>
                  <p className="font-medium text-gray-900">{client.cnpj}</p>
                </div>
              )}
              {client.ie && (
                <div>
                  <span className="text-gray-500">IE:</span>
                  <p className="font-medium text-gray-900">{client.ie}</p>
                </div>
              )}
            </>
          )}
          {client.notes && (
            <div className="sm:col-span-2">
              <span className="text-gray-500">Observações:</span>
              <p className="font-medium text-gray-900 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico Placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico</h2>
        {docCount === 0 && apptCount === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Nenhum pedido, orçamento ou agendamento para este cliente ainda.
          </p>
        ) : (
          <p className="text-sm text-gray-500">Os pedidos e agendamentos aparecerão aqui nos próximos sprints.</p>
        )}
      </div>
    </div>
  )
}
