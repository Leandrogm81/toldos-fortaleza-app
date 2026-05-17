'use client'

import { useState, useCallback, useEffect } from 'react'
import { formatCpf, formatCnpj, formatPhone, formatCep, formatDate, formatCurrency } from '@/lib/utils/format'
import { fetchAddressByCep } from '@/lib/utils/cep'
import { SignaturePad, SignatureModal } from './SignaturePad'
import { ClienteBusca } from '@/components/cliente/ClienteBusca'
import type { PedidoFormData, Product } from '@/types/pedido'
import { initialPedidoData, initialProduct } from '@/types/pedido'
import type { Client } from '@/types/client'

interface PedidoFormProps {
  data: PedidoFormData
  onChange: (data: PedidoFormData) => void
  logoSrc: string | null
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveLogo: () => void
  mode?: 'pedido' | 'orcamento'
  validade?: string
  onValidadeChange?: (val: string) => void
  onClientSelect?: (client: Client) => void
}

export function PedidoForm({ data, onChange, logoSrc, onLogoChange, onRemoveLogo, mode = 'pedido', validade, onValidadeChange, onClientSelect }: PedidoFormProps) {
  const [clientType, setClientType] = useState<'pf' | 'pj'>('pf')
  const [paymentOption, setPaymentOption] = useState<'avista' | 'parcelado' | 'personalizado'>('avista')
  const [installments, setInstallments] = useState(2)
  const [deliveryTimeType, setDeliveryTimeType] = useState<'days' | 'date'>('days')
  const [includeSignature, setIncludeSignature] = useState(false)
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [isCompanySignatureModalOpen, setIsCompanySignatureModalOpen] = useState(false)
  const [isFetchingCep, setIsFetchingCep] = useState(false)

  // Detect clientType from data
  useEffect(() => {
    if (data.clientCnpj) setClientType('pj')
    else if (data.clientCpf) setClientType('pf')
  }, [data.clientCnpj, data.clientCpf])

  // Update pedido-level fields
  const updateField = useCallback(
    (name: keyof PedidoFormData, value: any) => {
      onChange({ ...data, [name]: value })
    },
    [data, onChange]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      let formattedValue: string = value

      // Apply masks
      if (name === 'clientCpf') formattedValue = formatCpf(value)
      else if (name === 'clientCnpj') formattedValue = formatCnpj(value)
      else if (name === 'clientPhone') formattedValue = formatPhone(value)
      else if (name === 'clientCep') formattedValue = formatCep(value)
      else if (name === 'date') formattedValue = formatDate(value)
      else if (name === 'deliveryTime') {
        if (deliveryTimeType === 'date') {
          if (value) {
            const [year, month, day] = value.split('-')
            formattedValue = `${day}/${month}/${year}`
          } else {
            formattedValue = ''
          }
        } else {
          const dayValue = value.replace(/\D/g, '')
          formattedValue = dayValue ? `${dayValue} dias` : ''
        }
        updateField(name as keyof PedidoFormData, formattedValue)
        return
      } else if (name === 'productValue') {
        const result = formatCurrency(value)
        onChange({ ...data, productValue: result.display, productValueText: result.text })
        return
      }

      updateField(name as keyof PedidoFormData, formattedValue)
    },
    [data, onChange, updateField, deliveryTimeType]
  )

  const handleCepBlur = useCallback(async () => {
    const digits = data.clientCep.replace(/\D/g, '')
    if (digits.length !== 8) return

    setIsFetchingCep(true)
    const result = await fetchAddressByCep(data.clientCep)
    if (result) {
      onChange({
        ...data,
        clientAddress: result.logradouro || data.clientAddress,
        clientNeighborhood: result.bairro || data.clientNeighborhood,
        clientCity: result.localidade ? `${result.localidade}/${result.uf}` : data.clientCity,
      })
    }
    setIsFetchingCep(false)
  }, [data, onChange])

  // Products
  const handleProductChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updatedProducts = data.products.map((product, i) =>
      i === index ? { ...product, [name]: value } : product
    )
    updateField('products', updatedProducts)
  }

  const handleAddProduct = () => {
    updateField('products', [...data.products, { ...initialProduct }])
  }

  const handleRemoveProduct = (index: number) => {
    if (data.products.length <= 1) return
    updateField('products', data.products.filter((_, i) => i !== index))
  }

  // Payment auto-calculation
  useEffect(() => {
    const valueString = data.productValue.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()
    const numericValue = parseFloat(valueString)

    if (paymentOption === 'avista') {
      if (isNaN(numericValue) || numericValue <= 0) {
        updateField('paymentMethod', '')
        return
      }
      const halfValue = numericValue / 2
      const formattedHalf = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(halfValue)
      updateField('paymentMethod', `Sinal de ${formattedHalf} na confirmação do pedido e o valor restante de ${formattedHalf} na entrega.`)
    } else if (paymentOption === 'parcelado') {
      if (isNaN(numericValue) || numericValue <= 0) {
        updateField('paymentMethod', '')
        return
      }
      const installmentValue = numericValue / installments
      const formattedInstallment = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installmentValue)
      updateField('paymentMethod', `Em ${installments}x de ${formattedInstallment}`)
    }
  }, [paymentOption, installments, data.productValue])

  // Signatures
  const handleSaveSignature = (dataUrl: string) => {
    updateField('signatureDataUrl', dataUrl)
    setIsSignatureModalOpen(false)
  }

  const handleRemoveSignature = () => {
    updateField('signatureDataUrl', '')
  }

  const handleSaveCompanySignature = (dataUrl: string) => {
    updateField('companySignatureDataUrl', dataUrl)
    setIsCompanySignatureModalOpen(false)
  }

  const handleRemoveCompanySignature = () => {
    updateField('companySignatureDataUrl', '')
  }

  // Quick delivery days
  const handleQuickDays = (days: number) => {
    updateField('deliveryTime', `${days} dias`)
  }

  const formatDisplayDateForInput = (dateStr: string): string => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return ''
    const [day, month, year] = dateStr.split('/')
    return `${year}-${month}-${day}`
  }

  const handleClientSelect = (client: Client) => {
    onClientSelect?.(client)
    setClientType(client.doc_type)
    onChange({
      ...data,
      clientName: client.name,
      clientPhone: client.phone || '',
      clientCep: client.cep || '',
      clientAddress: client.address || '',
      clientNeighborhood: client.neighborhood || '',
      clientCity: client.city || '',
      clientCpf: client.cpf || '',
      clientRg: client.rg || '',
      clientCnpj: client.cnpj || '',
      clientIe: client.ie || '',
    })
  }

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {/* Logo */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Detalhes da Empresa</h2>
        <div className="space-y-2">
          <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-700">Logotipo</label>
          <div className="flex items-center gap-2">
            <input
              id="logo-upload"
              type="file"
              accept="image/png, image/jpeg, image/svg+xml"
              onChange={onLogoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
            {logoSrc && (
              <button type="button" onClick={onRemoveLogo} className="p-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                X
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Date */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Dados Gerais</h2>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <input
            id="date"
            name="date"
            type="tel"
            value={data.date}
            onChange={handleInputChange}
            placeholder="DD/MM/AAAA"
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        {mode === 'orcamento' && (
          <div className="mt-3">
            <label htmlFor="validade" className="block text-sm font-medium text-gray-700 mb-1">Validade do Orçamento</label>
            <input
              id="validade"
              type="text"
              value={validade || ''}
              onChange={(e) => onValidadeChange?.(e.target.value)}
              placeholder="Ex: 15 dias ou DD/MM/AAAA"
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        )}
      </div>

      {/* Client */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Contratante</h2>
        <div className="space-y-4">
          {/* PF/PJ Toggle */}
          <div className="flex items-center gap-4">
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="clientType" value="pf" checked={clientType === 'pf'} onChange={(e) => setClientType(e.target.value as any)} className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500" />
              <span className="ml-2 text-sm text-gray-700">Pessoa Física</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="clientType" value="pj" checked={clientType === 'pj'} onChange={(e) => setClientType(e.target.value as any)} className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500" />
              <span className="ml-2 text-sm text-gray-700">Pessoa Jurídica</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo / Razão Social</label>
            <ClienteBusca
              onSelect={handleClientSelect}
              value={data.clientName}
              onChange={(val) => onChange({ ...data, clientName: val })}
              placeholder="Digite para buscar cliente ou cadastrar novo..."
            />
          </div>

          <div>
            <label htmlFor="clientCep" className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
            <input id="clientCep" name="clientCep" type="tel" value={data.clientCep} onChange={handleInputChange} onBlur={handleCepBlur} placeholder="Ex: 09251-040" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>

          <div>
            <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input id="clientAddress" name="clientAddress" type="text" value={data.clientAddress} onChange={handleInputChange} placeholder="Ex: Avenida Araucária, 997" disabled={isFetchingCep} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="clientNeighborhood" className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input id="clientNeighborhood" name="clientNeighborhood" type="text" value={data.clientNeighborhood} onChange={handleInputChange} placeholder="Parque Novo Oratório" disabled={isFetchingCep} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-gray-200" />
            </div>
            <div>
              <label htmlFor="clientCity" className="block text-sm font-medium text-gray-700 mb-1">Cidade / Estado</label>
              <input id="clientCity" name="clientCity" type="text" value={data.clientCity} onChange={handleInputChange} placeholder="Santo André/SP" disabled={isFetchingCep} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-gray-200" />
            </div>
          </div>

          <div>
            <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input id="clientPhone" name="clientPhone" type="tel" value={data.clientPhone} onChange={handleInputChange} placeholder="(11) 2036-0010" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>

          {clientType === 'pf' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="clientCpf" className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input id="clientCpf" name="clientCpf" type="tel" value={data.clientCpf} onChange={handleInputChange} placeholder="000.000.000-00" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="clientRg" className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                <input id="clientRg" name="clientRg" type="text" value={data.clientRg} onChange={handleInputChange} placeholder="00.000.000-0" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="clientCnpj" className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <input id="clientCnpj" name="clientCnpj" type="tel" value={data.clientCnpj} onChange={handleInputChange} placeholder="00.000.000/0000-00" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="clientIe" className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
                <input id="clientIe" name="clientIe" type="text" value={data.clientIe} onChange={handleInputChange} placeholder="000.000.000.000" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Produtos</h2>
        {data.products.map((product, index) => (
          <div key={index} className="space-y-4 border border-gray-200 p-4 rounded-lg mb-4 relative">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-700">Produto {index + 1}</h4>
              {data.products.length > 1 && (
                <button type="button" onClick={() => handleRemoveProduct(index)} className="p-1 text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center" aria-label={`Remover Produto ${index + 1}`}>
                  X
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <input name="item" type="text" value={product.item} onChange={(e) => handleProductChange(index, e)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estrutura e Acabamento</label>
              <input name="structure" type="text" value={product.structure} onChange={(e) => handleProductChange(index, e)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <input name="material" type="text" value={product.material} onChange={(e) => handleProductChange(index, e)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acessórios</label>
              <input name="accessories" type="text" value={product.accessories} onChange={(e) => handleProductChange(index, e)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medida</label>
              <input name="measure" type="text" value={product.measure} onChange={(e) => handleProductChange(index, e)} placeholder="Ex: 5,60X1,40" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
          </div>
        ))}
        <button type="button" onClick={handleAddProduct} className="mt-2 w-full px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
          + Adicionar Produto
        </button>
      </div>

      {/* Value and Payment */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Valor e Pagamento</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="productValue" className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
            <input id="productValue" name="productValue" type="tel" value={data.productValue} onChange={handleInputChange} placeholder="Ex: 2000,00" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="productValueText" className="block text-sm font-medium text-gray-700 mb-1">Valor por Extenso</label>
            <input id="productValueText" name="productValueText" type="text" value={data.productValueText} readOnly placeholder="Gerado automaticamente" className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="paymentOption" value="avista" checked={paymentOption === 'avista'} onChange={(e) => setPaymentOption(e.target.value as any)} className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500" />
                <span className="ml-2 text-sm text-gray-700">À vista</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="paymentOption" value="parcelado" checked={paymentOption === 'parcelado'} onChange={(e) => setPaymentOption(e.target.value as any)} className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500" />
                <span className="ml-2 text-sm text-gray-700">Parcelado</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="paymentOption" value="personalizado" checked={paymentOption === 'personalizado'} onChange={(e) => setPaymentOption(e.target.value as any)} className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500" />
                <span className="ml-2 text-sm text-gray-700">Personalizado</span>
              </label>
            </div>

            {paymentOption === 'parcelado' && (
              <div className="mb-4">
                <label htmlFor="installments" className="block text-sm font-medium text-gray-700">Número de Parcelas</label>
                <select id="installments" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
                  {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => (
                    <option key={num} value={num}>{num}x</option>
                  ))}
                </select>
              </div>
            )}

            {paymentOption === 'personalizado' ? (
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Descrição Personalizada</label>
                <input id="paymentMethod" name="paymentMethod" type="text" value={data.paymentMethod} onChange={handleInputChange} placeholder="Ex: Sinal de R$1.000..." className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              </div>
            ) : (
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Descrição do Pagamento</label>
                <input id="paymentMethod" name="paymentMethod" type="text" value={data.paymentMethod} readOnly className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
              </div>
            )}
          </div>

          {/* Delivery Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega</label>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center">
                <input type="radio" name="deliveryType" value="days" checked={deliveryTimeType === 'days'} onChange={(e) => { setDeliveryTimeType(e.target.value as any); updateField('deliveryTime', ''); }} className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500" />
                <span className="ml-2 text-sm text-gray-700">Em dias</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="deliveryType" value="date" checked={deliveryTimeType === 'date'} onChange={(e) => { setDeliveryTimeType(e.target.value as any); updateField('deliveryTime', ''); }} className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500" />
                <span className="ml-2 text-sm text-gray-700">Data específica</span>
              </label>
            </div>

            {deliveryTimeType === 'days' && (
              <div className="mt-2">
                <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1">Número de Dias</label>
                <input id="deliveryTime" name="deliveryTime" type="number" value={data.deliveryTime.replace(/\s*dias/i, '')} onChange={handleInputChange} placeholder="Ex: 20" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                <div className="mt-2 flex gap-2 flex-wrap">
                  {[20, 25, 30].map((days) => (
                    <button key={days} type="button" onClick={() => handleQuickDays(days)} className="px-3 py-1 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200">
                      {days} dias
                    </button>
                  ))}
                </div>
              </div>
            )}

            {deliveryTimeType === 'date' && (
              <div className="mt-2">
                <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700">Data Específica</label>
                <input type="date" id="deliveryDate" name="deliveryTime" value={formatDisplayDateForInput(data.deliveryTime)} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Opções Adicionais</h2>

        <div className="relative flex items-start mb-4">
          <div className="flex items-center h-5">
            <input id="includeSignature" name="includeSignature" type="checkbox" checked={includeSignature} onChange={(e) => setIncludeSignature(e.target.checked)} className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-gray-300 rounded" />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="includeSignature" className="font-medium text-gray-700">Incluir assinatura do cliente</label>
            <p id="signature-description" className="text-gray-500">Adiciona um campo para a assinatura do cliente no final do pedido.</p>
          </div>
        </div>

        {/* Client Signature */}
        {includeSignature && (
          <div className="p-4 border border-gray-200 rounded-lg mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assinatura Digital (Cliente)</label>
            {data.signatureDataUrl ? (
              <div className="flex flex-col items-start gap-3">
                <div className="p-2 border rounded-md bg-gray-50">
                  <img src={data.signatureDataUrl} alt="Assinatura" className="h-16" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsSignatureModalOpen(true)} className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">Alterar</button>
                  <button type="button" onClick={handleRemoveSignature} className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">Remover</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setIsSignatureModalOpen(true)} className="w-full px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200">Coletar Assinatura do Cliente</button>
            )}
          </div>
        )}

        {/* Company Signature */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Assinatura do Responsável (Contratado)</label>
          {data.companySignatureDataUrl ? (
            <div className="flex flex-col items-start gap-3">
              <div className="p-2 border rounded-md bg-gray-50">
                <img src={data.companySignatureDataUrl} alt="Assinatura do Responsável" className="h-16" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsCompanySignatureModalOpen(true)} className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">Alterar</button>
                <button type="button" onClick={handleRemoveCompanySignature} className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">Remover</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setIsCompanySignatureModalOpen(true)} className="w-full px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200">Coletar Assinatura do Responsável</button>
          )}
        </div>
      </div>

      {/* Signature Modals */}
      <SignatureModal isOpen={isSignatureModalOpen} onClose={() => setIsSignatureModalOpen(false)} onSave={handleSaveSignature} />
      <SignatureModal isOpen={isCompanySignatureModalOpen} onClose={() => setIsCompanySignatureModalOpen(false)} onSave={handleSaveCompanySignature} />
    </form>
  )
}
