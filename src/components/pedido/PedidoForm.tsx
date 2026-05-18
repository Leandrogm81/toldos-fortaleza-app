'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCpf, formatCnpj, formatPhone, formatCep, formatDate, formatCurrency } from '@/lib/utils/format'
import { fetchAddressByCep } from '@/lib/utils/cep'
import { SignaturePad, SignatureModal } from './SignaturePad'
import { ClienteBusca } from '@/components/cliente/ClienteBusca'
import { ProductAutocomplete } from './ProductAutocomplete'
import { getConfigForItem, getCoresMaterial, COR_POLICARBONATO } from '@/lib/constants/produtos'
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

  const updateProductField = (index: number, field: keyof Product, value: string) => {
    const updated = data.products.map((p, i) => i === index ? { ...p, [field]: value } : p)
    updateField('products', updated)
  }

  const updateMeasureField = (productIndex: number, measureIndex: number, field: 'comprimento' | 'largura' | 'altura', value: string) => {
    const updated = data.products.map((p, i) => {
      if (i !== productIndex) return p
      const measures = [...(p.measures && p.measures.length > 0 ? p.measures : [{ comprimento: p.comprimento, largura: p.largura, altura: p.altura }])]
      if (measureIndex < measures.length) {
        measures[measureIndex] = { ...measures[measureIndex], [field]: value }
      }
      return { ...p, measures, comprimento: measures[0]?.comprimento || '', largura: measures[0]?.largura || '', altura: measures[0]?.altura || '' }
    })
    updateField('products', updated)
  }

  const addMeasure = (index: number) => {
    const updated = data.products.map((p, i) => {
      if (i !== index) return p
      const measures = [...(p.measures && p.measures.length > 0 ? p.measures : [{ comprimento: p.comprimento, largura: p.largura, altura: p.altura }])]
      measures.push({ comprimento: '', largura: '', altura: '' })
      return { ...p, measures }
    })
    updateField('products', updated)
  }

  const removeMeasure = (productIndex: number, measureIndex: number) => {
    const updated = data.products.map((p, i) => {
      if (i !== productIndex) return p
      const measures = [...(p.measures && p.measures.length > 0 ? p.measures : [{ comprimento: p.comprimento, largura: p.largura, altura: p.altura }])]
      if (measures.length <= 1) return p
      measures.splice(measureIndex, 1)
      return { ...p, measures, comprimento: measures[0]?.comprimento || '', largura: measures[0]?.largura || '', altura: measures[0]?.altura || '' }
    })
    updateField('products', updated)
  }

  // Cálculo de m² com regra do retrátil
  const calcProdutoM2 = (p: Product): number => {
    const cfg = getConfigForItem(p.item)
    const m = p.measures && p.measures.length > 0 ? p.measures[0] : { comprimento: p.comprimento, largura: p.largura, altura: p.altura }
    const comp = parseFloat(m.comprimento.replace(',', '.')) || 0
    const larg = parseFloat(m.largura.replace(',', '.')) || 0
    const alt = parseFloat(m.altura.replace(',', '.')) || 0

    // Retrátil: +35cm no comprimento
    const compCalc = p.item.toLowerCase().includes('retrátil') ? comp + 0.35 : comp

    if (!cfg) return compCalc * (larg || alt)
    if (cfg.measures.length === 2) {
      const [a, b] = cfg.measures
      const v1 = a === 'comprimento' ? compCalc : a === 'largura' ? larg : alt
      const v2 = b === 'comprimento' ? compCalc : b === 'largura' ? larg : alt
      return v1 * v2
    }
    if (cfg.measures.length === 3) return compCalc * larg * alt
    return 0
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

  // Company signature
  const handleSaveCompanySignature = async (dataUrl: string, saveToProfile?: boolean) => {
    updateField('companySignatureDataUrl', dataUrl)
    if (saveToProfile) {
      // Save to profile for future use
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('profile').update({ company_signature_data_url: dataUrl }).eq('id', user.id)
        }
      } catch {}
    }
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
              <ProductAutocomplete type="item" value={product.item} onChange={(val) => updateProductField(index, 'item', val)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estrutura e Acabamento</label>
              <ProductAutocomplete type="estrutura" value={product.structure} onChange={(val) => updateProductField(index, 'structure', val)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <ProductAutocomplete type="material" value={product.material} onChange={(val) => updateProductField(index, 'material', val)} />
            </div>
            {/* Cor do Material */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Material</label>
              {(() => {
                const cores = getCoresMaterial(product.material)
                if (cores.length > 0) {
                  // Policarbonato → select com cores fixas
                  return (
                    <select value={product.cor_material} onChange={(e) => updateProductField(index, 'cor_material', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
                      <option value="">Selecione...</option>
                      {cores.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )
                } else if (product.material.toLowerCase().includes('lona')) {
                  // Lona → campo livre
                  return <input type="text" value={product.cor_material} onChange={(e) => updateProductField(index, 'cor_material', e.target.value)} placeholder="Cor à escolha do cliente" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                }
                return <input type="text" value={product.cor_material} onChange={(e) => updateProductField(index, 'cor_material', e.target.value)} placeholder="Cor do material" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              })()}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acessórios</label>
              <ProductAutocomplete type="acessorio" value={product.accessories} onChange={(val) => updateProductField(index, 'accessories', val)} />
            </div>
            {/* Medidas — esconde se item sem medidas */}
            {(() => {
              const cfg = getConfigForItem(product.item)
              const hasMeasures = !cfg || cfg.measures.length > 0
              if (!hasMeasures) return null
              const showComp = !cfg || cfg.measures.includes('comprimento')
              const showLarg = !cfg || cfg.measures.includes('largura')
              const showAlt = !cfg || cfg.measures.includes('altura')
              const cols = [showComp, showLarg, showAlt].filter(Boolean).length
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medidas</label>
                  {(product.measures && product.measures.length > 0 ? product.measures : [{ comprimento: product.comprimento, largura: product.largura, altura: product.altura }]).map((m, mi) => (
                    <div key={mi} className="mb-2 pb-2 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                      {mi > 0 && <p className="text-xs text-gray-500 mb-1">Medida {mi + 1}</p>}
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                        {showComp && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Comprimento (m)</label>
                            <input type="text" value={m.comprimento} onChange={(e) => updateMeasureField(index, mi, 'comprimento', e.target.value)} placeholder="5,60" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                          </div>
                        )}
                        {showLarg && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Largura (m)</label>
                            <input type="text" value={m.largura} onChange={(e) => updateMeasureField(index, mi, 'largura', e.target.value)} placeholder="1,40" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                          </div>
                        )}
                        {showAlt && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Altura (m)</label>
                            <div className="flex gap-1">
                              <input type="text" value={m.altura} onChange={(e) => updateMeasureField(index, mi, 'altura', e.target.value)} placeholder="0,30" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                              {mi > 0 && (
                                <button type="button" onClick={() => removeMeasure(index, mi)} className="p-1 text-red-400 hover:text-red-600" title="Remover medida">✕</button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addMeasure(index)} className="mt-1 text-xs font-medium text-sky-600 hover:text-sky-700">
                    + Adicionar medida
                  </button>
                </div>
              )
            })()}
            {/* Cálculo */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Cálculo</p>
              {/* m² */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Área:</span>
                <span className="font-mono font-medium">{calcProdutoM2(product).toFixed(2).replace('.', ',')} m²</span>
                {product.item.toLowerCase().includes('retrátil') && (
                  <span className="text-xs text-amber-600">(+35cm no comprimento)</span>
                )}
              </div>
              {/* Preço por m² */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-20">R$/m²:</label>
                <input type="text" value={product.preco_m2} onChange={(e) => updateProductField(index, 'preco_m2', e.target.value)}
                  placeholder="0,00" className="w-24 px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              {/* Calha */}
              {(product.item.toLowerCase().includes('cobertura') || product.item.toLowerCase().includes('calha')) && (
                <div className="space-y-1 pt-1 border-t border-gray-200">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={product.com_calha} onChange={(e) => {
                      const updated = data.products.map((p, i) => i === index ? { ...p, com_calha: e.target.checked } : p)
                      updateField('products', updated)
                    }}
                      className="h-3.5 w-3.5 text-sky-600" />
                    <span>Calha</span>
                  </label>
                  {product.com_calha && (
                    <div className="flex items-center gap-2 pl-5">
                      <label className="text-xs text-gray-500">R$/m:</label>
                      <input type="text" value={product.calha_preco_m} onChange={(e) => updateProductField(index, 'calha_preco_m', e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" />
                      <label className="text-xs text-gray-500">Medida (m):</label>
                      <input type="text" value={product.calha_medida || product.comprimento} onChange={(e) => updateProductField(index, 'calha_medida', e.target.value)}
                        placeholder={product.comprimento} className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" />
                    </div>
                  )}
                </div>
              )}
              {/* Observação (reparo etc) */}
              <div>
                <input type="text" value={product.observacao} onChange={(e) => updateProductField(index, 'observacao', e.target.value)}
                  placeholder="Observação (ex: serviço de reparo...)" className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
              </div>
              {/* Subtotal */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-600">Subtotal:</span>
                <span className="text-sm font-bold text-sky-700">
                  {(() => {
                    const m2 = calcProdutoM2(product)
                    const preco = parseFloat(product.preco_m2.replace(',', '.')) || 0
                    let sub = m2 * preco
                    if (product.com_calha) {
                      const calhaPreco = parseFloat(product.calha_preco_m.replace(',', '.')) || 100
                      const calhaMedida = parseFloat((product.calha_medida || product.comprimento).replace(',', '.')) || 0
                      sub += calhaPreco * calhaMedida
                    }
                    // reparo: preco manual
                    if (getConfigForItem(product.item)?.measures.length === 0) {
                      sub = preco // preco direto
                    }
                    return `R$ ${sub.toFixed(2).replace('.', ',')}`
                  })()}
                </span>
              </div>
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

      {/* Signatures — only for pedidos */}
      {mode === 'pedido' && (
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
      )}

      {/* Signature Modals */}
      {mode === 'pedido' && (
      <>
      <SignatureModal isOpen={isSignatureModalOpen} onClose={() => setIsSignatureModalOpen(false)} onSave={handleSaveSignature} />
      <SignatureModal isOpen={isCompanySignatureModalOpen} onClose={() => setIsCompanySignatureModalOpen(false)} onSave={handleSaveCompanySignature} onSaveProfile={async (dataUrl) => {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) await supabase.from('profile').update({ company_signature_data_url: dataUrl }).eq('id', user.id)
        } catch {}
      }} />
      </>
      )}
    </form>
  )
}
