'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCpf, formatCnpj, formatPhone, formatCep } from '@/lib/utils/format'
import { fetchAddressByCep } from '@/lib/utils/cep'
import type { ClientFormData } from '@/types/client'

interface ClienteFormProps {
  initialData?: Partial<ClientFormData>
  onSave: (data: ClientFormData) => Promise<void>
  onCancel?: () => void
  saveLabel?: string
}

export function ClienteForm({ initialData, onSave, onCancel, saveLabel = 'Salvar' }: ClienteFormProps) {
  const [form, setForm] = useState<ClientFormData>({
    name: initialData?.name || '',
    doc_type: initialData?.doc_type || 'pf',
    cpf: initialData?.cpf || '',
    rg: initialData?.rg || '',
    cnpj: initialData?.cnpj || '',
    ie: initialData?.ie || '',
    phone: initialData?.phone || '',
    cep: initialData?.cep || '',
    address: initialData?.address || '',
    neighborhood: initialData?.neighborhood || '',
    city: initialData?.city || '',
    notes: initialData?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [fetchingCep, setFetchingCep] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (name: keyof ClientFormData, value: string) => {
    let formatted = value

    if (name === 'cpf') formatted = formatCpf(value)
    else if (name === 'cnpj') formatted = formatCnpj(value)
    else if (name === 'phone') formatted = formatPhone(value)
    else if (name === 'cep') formatted = formatCep(value)

    setForm((prev) => ({ ...prev, [name]: formatted }))
  }

  const handleCepBlur = async () => {
    const digits = form.cep.replace(/\D/g, '')
    if (digits.length !== 8) return

    setFetchingCep(true)
    const data = await fetchAddressByCep(form.cep)
    if (data) {
      setForm((prev) => ({
        ...prev,
        address: data.logradouro || prev.address,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade ? `${data.localidade}/${data.uf}` : prev.city,
      }))
    }
    setFetchingCep(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!form.name.trim()) {
      setError('Nome é obrigatório')
      setLoading(false)
      return
    }
    if (!form.phone.trim()) {
      setError('Telefone é obrigatório')
      setLoading(false)
      return
    }

    try {
      await onSave(form)
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* PF / PJ Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Pessoa</label>
        <div className="flex items-center gap-4">
          {(['pf', 'pj'] as const).map((type) => (
            <label key={type} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="doc_type"
                value={type}
                checked={form.doc_type === type}
                onChange={() => setForm((prev) => ({ ...prev, doc_type: type }))}
                className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Nome */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nome Completo / Razão Social *
        </label>
        <input
          id="name"
          type="text"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ex: João Silva / Toldos Fortaleza Ltda"
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
        />
      </div>

      {/* Telefone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Telefone *
        </label>
        <input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="(11) 2036-0010"
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
        />
      </div>

      {/* CEP */}
      <div>
        <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1">
          CEP
        </label>
        <div className="relative">
          <input
            id="cep"
            type="tel"
            value={form.cep}
            onChange={(e) => handleChange('cep', e.target.value)}
            onBlur={handleCepBlur}
            placeholder="09251-040"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm disabled:bg-gray-100"
          />
          {fetchingCep && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Digite o CEP e saia do campo para preencher endereço automaticamente</p>
      </div>

      {/* Endereço */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Endereço
          </label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Av. Araucária, 997"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
          />
        </div>
        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">
            Bairro
          </label>
          <input
            id="neighborhood"
            type="text"
            value={form.neighborhood}
            onChange={(e) => handleChange('neighborhood', e.target.value)}
            placeholder="Parque Oratório"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Cidade
          </label>
          <input
            id="city"
            type="text"
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Santo André/SP"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
          />
        </div>
      </div>

      {/* PF fields */}
      {form.doc_type === 'pf' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
              CPF
            </label>
            <input
              id="cpf"
              type="tel"
              value={form.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              placeholder="000.000.000-00"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
            />
          </div>
          <div>
            <label htmlFor="rg" className="block text-sm font-medium text-gray-700 mb-1">
              RG
            </label>
            <input
              id="rg"
              type="text"
              value={form.rg}
              onChange={(e) => handleChange('rg', e.target.value)}
              placeholder="00.000.000-0"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
            />
          </div>
        </div>
      )}

      {/* PJ fields */}
      {form.doc_type === 'pj' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ
            </label>
            <input
              id="cnpj"
              type="tel"
              value={form.cnpj}
              onChange={(e) => handleChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
            />
          </div>
          <div>
            <label htmlFor="ie" className="block text-sm font-medium text-gray-700 mb-1">
              Inscrição Estadual
            </label>
            <input
              id="ie"
              type="text"
              value={form.ie}
              onChange={(e) => handleChange('ie', e.target.value)}
              placeholder="000.000.000.000"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
            />
          </div>
        </div>
      )}

      {/* Observações */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Informações adicionais..."
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:bg-sky-300 transition-colors"
        >
          {loading ? 'Salvando...' : saveLabel}
        </button>
      </div>
    </form>
  )
}
