'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PedidoForm } from '@/components/pedido/PedidoForm'
import { PedidoPreview } from '@/components/pedido/PedidoPreview'
import { generatePDF } from '@/lib/utils/pdf'
import { initialPedidoData } from '@/types/pedido'
import type { PedidoFormData } from '@/types/pedido'
import Link from 'next/link'

export default function EditarOrcamentoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [formData, setFormData] = useState<PedidoFormData | null>(null)
  const [validade, setValidade] = useState('')
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [status, setStatus] = useState('rascunho')
  const [loading, setLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    loadDoc(id)
  }, [id])

  async function loadDoc(docId: string) {
    const supabase = createClient()
    const { data } = await supabase.from('document').select('*').eq('id', docId).single()
    if (data) {
      const docData = data.doc_data as PedidoFormData
      setFormData(docData)
      setValidade((docData as any).validade || '')
      setStatus(data.status)
      if (data.logo_data_url) setLogoSrc(data.logo_data_url)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!formData) return
    setIsSaving(true)
    const supabase = createClient()
    await supabase.from('document').update({
      doc_data: { ...formData, validade } as any,
      date: formData.date,
      logo_data_url: logoSrc,
      status,
      total_value: parseFloat(formData.productValue.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
    }).eq('id', id)
    setIsSaving(false)
    alert('Orçamento atualizado!')
  }

  const handleStatusChange = async (newStatus: string) => {
    const supabase = createClient()
    await supabase.from('document').update({ status: newStatus }).eq('id', id)
    setStatus(newStatus)
  }

  const handleConvertToPedido = async () => {
    if (!confirm('Criar pedido a partir deste orçamento?')) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: pedido } = await supabase.from('document').insert({
      type: 'pedido', status: 'rascunho', date: new Date().toLocaleDateString('pt-BR'),
      doc_data: formData as any, logo_data_url: logoSrc, total_value: 0, created_by: user?.id,
    }).select('id').single()
    await supabase.from('document').update({ status: 'aprovado' }).eq('id', id)
    setStatus('aprovado')
    if (pedido) router.push(`/pedidos/${pedido.id}`)
  }

  const handlePrint = async () => {
    if (!formData) return
    setIsPrinting(true)
    try { await generatePDF('print-area', `orcamento-${(formData.clientName || '').replace(/\s+/g, '_')}.pdf`) } catch {}
    setIsPrinting(false)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full" /></div>
  if (!formData) return <div className="text-center py-20"><p className="text-lg text-gray-500">Orçamento não encontrado</p><Link href="/orcamentos" className="text-sm text-amber-600 mt-2 inline-block">Voltar</Link></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 sticky top-0 z-20 border-b">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center px-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/orcamentos" className="text-sm text-gray-500 hover:text-gray-700">← Voltar</Link>
            <h1 className="text-xl font-bold text-gray-800">Orçamento</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              status === 'rascunho' ? 'bg-yellow-100 text-yellow-700' :
              status === 'enviado' ? 'bg-blue-100 text-blue-700' :
              status === 'aprovado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>{status}</span>
          </div>
          <div className="flex gap-2">
            {status === 'rascunho' && <button onClick={() => handleStatusChange('enviado')} className="px-3 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700">Enviar</button>}
            {status === 'enviado' && <button onClick={() => handleStatusChange('aprovado')} className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Aprovar</button>}
            {status === 'aprovado' && <button onClick={handleConvertToPedido} className="px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">+ Pedido</button>}
            <button onClick={async () => {
              const supabase = createClient()
              const { data: doc } = await supabase.from('document').select('public_token').eq('id', id).single()
              let token = doc?.public_token
              if (!token) {
                token = crypto.randomUUID().slice(0, 8)
                await supabase.from('document').update({ public_token: token }).eq('id', id)
              }
              const link = `${window.location.origin}/orcamento/${token}`
              await navigator.clipboard.writeText(link)
              alert(`Link copiado!\n${link}`)
            }} className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Compartilhar</button>
            <button onClick={handleSave} disabled={isSaving} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{isSaving ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={handlePrint} disabled={isPrinting} className="px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">{isPrinting ? '...' : 'PDF'}</button>
          </div>
        </div>
      </header>
      <main className="max-w-screen-2xl mx-auto p-2 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-lg h-fit">
          <PedidoForm data={formData} onChange={setFormData} logoSrc={logoSrc} onLogoChange={(e) => { const r = new FileReader(); r.onload = (ev) => setLogoSrc(ev.target?.result as string); if (e.target?.files?.[0]) r.readAsDataURL(e.target.files[0]); }} onRemoveLogo={() => setLogoSrc(null)} mode="orcamento" validade={validade} onValidadeChange={setValidade} />
        </div>
        <div className="lg:col-span-3 bg-gray-200 p-4 sm:p-8 rounded-lg shadow-inner overflow-y-auto lg:max-h-[calc(100vh-120px)]">
          <PedidoPreview data={formData} logoSrc={logoSrc} includeSignature={true} mode="orcamento" validade={validade} />
        </div>
      </main>
    </div>
  )
}
