'use client'

import { ClienteBusca } from '@/components/cliente/ClienteBusca'
import type { PedidoFormData } from '@/types/pedido'
import type { Client } from '@/types/client'

interface ClientSectionProps {
  data: PedidoFormData
  clientType: 'pf' | 'pj'
  onClientTypeChange: (type: 'pf' | 'pj') => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCepBlur: () => void
  onClientSelect: (client: Client) => void
  onChange: (data: PedidoFormData) => void
  isFetchingCep: boolean
}

export function ClientSection({
  data,
  clientType,
  onClientTypeChange,
  onInputChange,
  onCepBlur,
  onClientSelect,
  onChange,
  isFetchingCep,
}: ClientSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Contratante</h2>
      <div className="space-y-4">
        {/* PF/PJ Toggle */}
        <div className="flex items-center gap-4">
          <label className="flex items-center cursor-pointer">
            <input type="radio" name="clientType" value="pf" checked={clientType === 'pf'} onChange={() => onClientTypeChange('pf')} className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500" />
            <span className="ml-2 text-sm text-gray-700">Pessoa Física</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input type="radio" name="clientType" value="pj" checked={clientType === 'pj'} onChange={() => onClientTypeChange('pj')} className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500" />
            <span className="ml-2 text-sm text-gray-700">Pessoa Jurídica</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo / Razão Social</label>
          <ClienteBusca
            onSelect={onClientSelect}
            value={data.clientName}
            onChange={(val) => onChange({ ...data, clientName: val })}
            placeholder="Digite para buscar cliente ou cadastrar novo..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
          <input name="clientCep" type="tel" value={data.clientCep} onChange={onInputChange} onBlur={onCepBlur} placeholder="Ex: 09251-040" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
          <input name="clientAddress" type="text" value={data.clientAddress} onChange={onInputChange} placeholder="Ex: Avenida Araucária, 997" disabled={isFetchingCep} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input name="clientNeighborhood" type="text" value={data.clientNeighborhood} onChange={onInputChange} placeholder="Parque Novo Oratório" disabled={isFetchingCep} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / Estado</label>
            <input name="clientCity" type="text" value={data.clientCity} onChange={onInputChange} placeholder="Santo André/SP" disabled={isFetchingCep} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-gray-200" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input name="clientPhone" type="tel" value={data.clientPhone} onChange={onInputChange} placeholder="(11) 2036-0010" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>

        {clientType === 'pf' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input name="clientCpf" type="tel" value={data.clientCpf} onChange={onInputChange} placeholder="000.000.000-00" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
              <input name="clientRg" type="text" value={data.clientRg} onChange={onInputChange} placeholder="00.000.000-0" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input name="clientCnpj" type="tel" value={data.clientCnpj} onChange={onInputChange} placeholder="00.000.000/0000-00" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
              <input name="clientIe" type="text" value={data.clientIe} onChange={onInputChange} placeholder="000.000.000.000" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
