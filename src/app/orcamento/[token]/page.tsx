import { EMPRESA } from '@/lib/constants/empresa'
import type { PedidoFormData } from '@/types/pedido'

export const dynamic = 'force-dynamic'

export default async function OrcamentoPublicoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Busca via API route (service_role fica encapsulado na API)
  let orcamento: any = null
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://toldos-fortaleza-app.vercel.app' : ''}/api/orcamento/${token}`, {
      cache: 'no-store',
    })
    if (res.ok) orcamento = await res.json()
  } catch {
    // fallback silencioso
  }

  if (!orcamento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-sm">
          <p className="text-2xl mb-4">❌</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Orçamento não encontrado</h1>
          <p className="text-gray-500">Este link pode estar inválido ou expirado.</p>
        </div>
      </div>
    )
  }

  const formData: PedidoFormData = orcamento.doc_data

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Orçamento</h1>
          <p className="text-sm text-gray-500">De: {EMPRESA.fantasia}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div id="print-area">
            <header style={{ textAlign: 'center', marginBottom: '16px' }}>
              {orcamento.logo_data_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={orcamento.logo_data_url} alt="Logo" style={{ height: '64px', margin: '0 auto 8px' }} />
              )}
              <h2 style={{ fontWeight: 'bold', fontSize: '18px', letterSpacing: '2px', marginTop: '8px' }}>
                ORÇAMENTO
              </h2>
            </header>

            <main style={{ fontSize: '12px' }}>
              <p style={{ marginBottom: '8px' }}>Data: {formData.date}</p>

              <section style={{ marginBottom: '12px' }}>
                <h3 style={{ fontWeight: 'bold', color: '#0369a1', borderBottom: '1px solid #0369a1', paddingBottom: '2px', marginBottom: '4px' }}>Contratado</h3>
                <p style={{ margin: 0 }}>{EMPRESA.fantasia}</p>
                <p style={{ margin: 0 }}>{EMPRESA.endereco}</p>
                <p style={{ margin: 0 }}>{EMPRESA.bairro} — {EMPRESA.cidade}</p>
                <p style={{ margin: 0 }}>Fone: {EMPRESA.telefone}</p>
              </section>

              <section style={{ marginBottom: '12px' }}>
                <h3 style={{ fontWeight: 'bold', color: '#0369a1', borderBottom: '1px solid #0369a1', paddingBottom: '2px', marginBottom: '4px' }}>Contratante</h3>
                <p style={{ margin: 0 }}><b>Nome:</b> {formData.clientName}</p>
                {formData.clientAddress && <p style={{ margin: 0 }}><b>Endereço:</b> {formData.clientAddress}</p>}
                {formData.clientNeighborhood && <p style={{ margin: 0 }}><b>Bairro:</b> {formData.clientNeighborhood}</p>}
                {formData.clientCity && <p style={{ margin: 0 }}><b>Cidade:</b> {formData.clientCity}</p>}
                {formData.clientCep && <p style={{ margin: 0 }}><b>CEP:</b> {formData.clientCep}</p>}
                {formData.clientPhone && <p style={{ margin: 0 }}><b>Fone:</b> {formData.clientPhone}</p>}
                {formData.clientCpf && <p style={{ margin: 0 }}><b>CPF:</b> {formData.clientCpf}</p>}
                {formData.clientCnpj && <p style={{ margin: 0 }}><b>CNPJ:</b> {formData.clientCnpj}</p>}
              </section>

              <section style={{ marginBottom: '12px' }}>
                <h3 style={{ fontWeight: 'bold', color: '#0369a1', borderBottom: '1px solid #0369a1', paddingBottom: '2px', marginBottom: '4px' }}>Produto(s)</h3>
                {formData.products?.map((product: any, index: number) => (
                  <div key={index} style={{ marginBottom: '4px', borderBottom: index < formData.products!.length - 1 ? '1px solid #e5e7eb' : 'none', paddingBottom: '4px' }}>
                    {product.item && <p style={{ margin: 0 }}><b>Item {index + 1}:</b> {product.item}</p>}
                    {product.structure && <p style={{ margin: 0 }}><b>Estrutura:</b> {product.structure}</p>}
                    {product.material && <p style={{ margin: 0 }}><b>Material:</b> {product.material}</p>}
                    {product.cor_material && <p style={{ margin: 0 }}><b>Cor:</b> {product.cor_material}</p>}
                    {product.accessories && <p style={{ margin: 0 }}><b>Acessórios:</b> {product.accessories}</p>}
                    {(product.comprimento || product.largura || product.altura) && (
                      <p style={{ margin: 0 }}><b>Medida:</b> {[product.comprimento && `${product.comprimento}m`, product.largura && `${product.largura}m`, product.altura && `${product.altura}m`].filter(Boolean).join(' × ')}</p>
                    )}
                  </div>
                ))}
              </section>

              <section style={{ fontSize: '12px', margin: '10px 0' }}>
                {formData.productValue && (
                  <div style={{ border: '1px solid #000000', padding: '4px 6px', marginBottom: '2px' }}>
                    Valor R$ {formData.productValue.replace('R$', '').trim()} – {formData.productValueText}
                  </div>
                )}
                <div style={{ border: '1px solid #000000', padding: '4px 6px', marginBottom: '2px' }}>
                  Forma de pagamento: {formData.paymentMethod || 'A combinar'}
                  {formData.paymentOptions && formData.paymentOptions.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      <p style={{ fontWeight: 'bold', margin: '0 0 2px 0' }}>Opções de pagamento:</p>
                      {formData.paymentOptions.map((opt: any, oi: number) => (
                        <p key={opt.id} style={{ margin: '0', paddingLeft: '12px', fontSize: '10px' }}>
                          {String.fromCharCode(97 + oi)}) {opt.label}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ border: '1px solid #000000', padding: '4px 6px' }}>
                  {EMPRESA.banco} / Pix: {EMPRESA.pix}
                </div>
              </section>

              {formData.deliveryTime && (
                <p style={{ fontSize: '12px' }}><b>Prazo de entrega:</b> {formData.deliveryTime}</p>
              )}

              {orcamento.validade && (
                <p style={{ fontSize: '12px' }}><b>Validade:</b> {orcamento.validade}</p>
              )}
            </main>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-gray-400">
          <p>{EMPRESA.fantasia} — {EMPRESA.telefone}</p>
        </div>
      </div>
    </div>
  )
}
