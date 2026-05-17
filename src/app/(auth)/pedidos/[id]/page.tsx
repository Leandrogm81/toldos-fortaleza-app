'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PedidoForm } from '@/components/pedido/PedidoForm'
import { PedidoPreview } from '@/components/pedido/PedidoPreview'
import { generatePDF, downloadTxtContent } from '@/lib/utils/pdf'
import { initialPedidoData } from '@/types/pedido'
import type { PedidoFormData } from '@/types/pedido'
import Link from 'next/link'

export default function EditarPedidoPage() {
  const { id } = useParams<{ id: string }>()
  const [formData, setFormData] = useState<PedidoFormData | null>(null)
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    loadOrder(id)
  }, [id])

  async function loadOrder(orderId: string) {
    const supabase = createClient()
    const { data } = await supabase.from('document').select('*').eq('id', orderId).single()
    if (data) {
      setFormData(data.doc_data as PedidoFormData)
      if (data.logo_data_url) setLogoSrc(data.logo_data_url)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!formData) return
    setIsSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('document').update({
        doc_data: formData as any,
        date: formData.date,
        logo_data_url: logoSrc,
        signature_data_url: formData.signatureDataUrl || null,
        company_signature_data_url: formData.companySignatureDataUrl || null,
        total_value: parseFloat(formData.productValue.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
      }).eq('id', id)
      alert('Pedido atualizado com sucesso!')
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err?.message || ''))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = async () => {
    if (!formData) return
    setIsPrinting(true)
    try {
      const clientName = formData.clientName.replace(/\s+/g, '_') || 'pedido'
      await generatePDF('print-area', `pedido-${clientName}.pdf`)
    } catch { } finally {
      setIsPrinting(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (ev) => setLogoSrc(ev.target?.result as string)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleRemoveLogo = () => setLogoSrc(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-gray-500">Pedido não encontrado</p>
        <Link href="/pedidos" className="text-sm text-sky-600 mt-2 inline-block">Voltar para pedidos</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 sticky top-0 z-20 border-b">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center px-2 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-800">Editar Pedido</h1>
          <div className="flex gap-2">
            <Link href="/pedidos" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
              Voltar
            </Link>
            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={handlePrint} disabled={isPrinting} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-sky-300 transition-colors">
              {isPrinting ? 'Gerando PDF...' : 'PDF'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-2 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-lg h-fit">
          <PedidoForm
            data={formData}
            onChange={setFormData}
            logoSrc={logoSrc}
            onLogoChange={handleLogoChange}
            onRemoveLogo={handleRemoveLogo}
          />
        </div>
        <div className="lg:col-span-3 bg-gray-200 p-4 sm:p-8 rounded-lg shadow-inner overflow-y-auto lg:max-h-[calc(100vh-120px)]">
          <PedidoPreview data={formData} logoSrc={logoSrc} includeSignature={true} />
        </div>
      </main>
    </div>
  )
}
