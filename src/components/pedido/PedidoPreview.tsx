'use client'

import { EMPRESA } from '@/lib/constants/empresa'
import type { PedidoFormData } from '@/types/pedido'

export function PedidoPreview({
  data,
  logoSrc,
  includeSignature,
  mode = 'pedido',
  validade,
}: {
  data: PedidoFormData
  logoSrc: string | null
  includeSignature: boolean
  mode?: 'pedido' | 'orcamento'
  validade?: string
}) {
  return (
    <div
      id="print-area"
      style={{
        width: '100%',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        padding: '16px 24px',
        border: '1px solid #d1d5db',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#1f2937',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: '12px' }}>
        {logoSrc ? (
          <img src={logoSrc} alt="Logo" style={{ height: '64px', width: 'auto', margin: '0 auto', objectFit: 'contain' }} />
        ) : null}
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', marginTop: '6px', color: '#000000' }}>
          {mode === 'orcamento' ? 'ORÇAMENTO' : 'PEDIDO DE COMPRA'}
        </h2>
        {mode === 'orcamento' && validade && (
          <p style={{ fontSize: '10px', color: '#4b5563', marginTop: '2px' }}>Validade: {validade}</p>
        )}
      </header>

      <main>
        <p style={{ marginBottom: '8px' }}>Data: {data.date}</p>

        {/* Contratado */}
        <section style={{ marginBottom: '8px' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '11px', color: '#0369a1', borderBottom: '1px solid #0369a1', paddingBottom: '2px', marginBottom: '4px' }}>Contratado</h3>
          <div style={{ fontSize: '11px' }}>
            <p style={{ margin: 0 }}>{EMPRESA.nome}</p>
            <p style={{ margin: 0 }}>{EMPRESA.endereco} – {EMPRESA.bairro} – {EMPRESA.cidade} CEP: {EMPRESA.cep}</p>
            <p style={{ margin: 0 }}>Tel: {EMPRESA.telefone} | CNPJ: {EMPRESA.cnpj} | IE: {EMPRESA.ie}</p>
          </div>
        </section>

        {/* Contratante */}
        <section style={{ marginBottom: '8px' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '11px', color: '#0369a1', borderBottom: '1px solid #0369a1', paddingBottom: '2px', marginBottom: '4px' }}>Contratante</h3>
          <div style={{ fontSize: '11px' }}>
            {data.clientName && <p style={{ margin: 0 }}>Nome: {data.clientName}</p>}
            {data.clientAddress && <p style={{ margin: 0 }}>Endereço: {data.clientAddress}</p>}
            {data.clientNeighborhood && <p style={{ margin: 0 }}>Bairro: {data.clientNeighborhood}</p>}
            {data.clientCity && <p style={{ margin: 0 }}>Cidade: {data.clientCity}</p>}
            {data.clientPhone && <p style={{ margin: 0 }}>Telefone: {data.clientPhone}</p>}
            {data.clientCnpj ? (
              <p style={{ margin: 0 }}>CNPJ: {data.clientCnpj}{data.clientIe ? ` / IE: ${data.clientIe}` : ''}</p>
            ) : (
              <p style={{ margin: 0 }}>
                {data.clientCpf && `CPF: ${data.clientCpf}${data.clientRg ? ` / RG: ${data.clientRg}` : ''}`}
                {!data.clientCpf && data.clientRg && `RG: ${data.clientRg}`}
              </p>
            )}
          </div>
        </section>

        {/* Produtos */}
        <section style={{ marginBottom: '8px' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '11px', color: '#0369a1', borderBottom: '1px solid #0369a1', paddingBottom: '2px', marginBottom: '4px' }}>Produto(s)</h3>
          {data.products.map((product, index) => (
            <div key={index} style={{ fontSize: '11px', borderBottom: index < data.products.length - 1 ? '1px solid #e5e7eb' : 'none', paddingBottom: '4px', marginBottom: '4px' }}>
              {product.item && <p style={{ margin: 0 }}><b>Item {index + 1}:</b> {product.item}</p>}
              {product.structure && <p style={{ margin: 0 }}><b>Estrutura:</b> {product.structure}</p>}
              {product.material && <p style={{ margin: 0 }}><b>Material:</b> {product.material}</p>}
              {product.cor_material && <p style={{ margin: 0 }}><b>Cor:</b> {product.cor_material}</p>}
              {product.accessories && <p style={{ margin: 0 }}><b>Acessórios:</b> {product.accessories}</p>}
              {product.measure && <p style={{ margin: 0 }}><b>Medida:</b> {product.measure}</p>}
              {(product.measures && product.measures.length > 0) ? (
                product.measures.map((m: any, mi: number) => {
                  const parts = [m.comprimento && `${m.comprimento}m`, m.largura && `${m.largura}m`, m.altura && `${m.altura}m`].filter(Boolean)
                  return parts.length > 0 ? (
                    <p key={mi} style={{ margin: 0 }}>
                      <b>{product.measures!.length > 1 ? `Medida ${mi + 1}:` : 'Medida:'}</b> {parts.join(' × ')}
                    </p>
                  ) : null
                })
              ) : (
                <>
                  {(product.comprimento || product.largura || product.altura) && (
                    <p style={{ margin: 0 }}>
                      <b>Medida:</b> {[product.comprimento && `${product.comprimento}m`, product.largura && `${product.largura}m`, product.altura && `${product.altura}m`].filter(Boolean).join(' × ')}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </section>

        {/* Valor e Pagamento */}
        <section style={{ fontSize: '11px', margin: '10px 0' }}>
          {data.productValue && (
            <div style={{ border: '1px solid #000000', padding: '4px 6px', marginBottom: '2px' }}>
              Valor R$ {data.productValue.replace('R$', '').trim()} – {data.productValueText}
            </div>
          )}
          <div style={{ border: '1px solid #000000', padding: '4px 6px', marginBottom: '2px' }}>
            Forma de pagamento: {data.paymentMethod || 'A combinar'}
          </div>
          <div style={{ border: '1px solid #000000', padding: '4px 6px' }}>
            {EMPRESA.banco} / Pix: {EMPRESA.pix}
          </div>
        </section>

        {/* Prazo */}
        <section style={{ fontSize: '11px' }}>
          {data.deliveryTime && <p style={{ margin: 0 }}>Prazo de Entrega: {data.deliveryTime}</p>}
          <p style={{ margin: 0 }}>Garantia: {EMPRESA.garantia}</p>
        </section>
      </main>

      {/* Assinaturas */}
      <section style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: '24px', gap: '16px 32px' }}>
        <div style={{ textAlign: 'center', width: '200px' }}>
          <div style={{ height: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px' }}>
            {data.companySignatureDataUrl && (
              <img src={data.companySignatureDataUrl} alt="Assinatura" style={{ maxHeight: '100%', width: 'auto', objectFit: 'contain' }} />
            )}
          </div>
          <div style={{ borderTop: '1px solid #1f2937', paddingTop: '4px' }}>
            <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold' }}>{EMPRESA.responsavel}</p>
            <p style={{ margin: 0, fontSize: '8px', color: '#4b5563' }}>Assinatura do Contratado</p>
          </div>
        </div>

        {includeSignature && (
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ height: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px' }}>
              {data.signatureDataUrl && (
                <img src={data.signatureDataUrl} alt="Assinatura" style={{ maxHeight: '100%', width: 'auto', objectFit: 'contain' }} />
              )}
            </div>
            <div style={{ borderTop: '1px solid #1f2937', paddingTop: '4px' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold' }}>{data.clientName || ''}</p>
              <p style={{ margin: 0, fontSize: '8px', color: '#4b5563' }}>Assinatura do Contratante</p>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ fontSize: '8px', textAlign: 'left', paddingTop: '10px', marginTop: '14px' }}>
        <p style={{ margin: 0 }}>Razão Social: {EMPRESA.nome} / Nome Fantasia: {EMPRESA.fantasia}</p>
        <p style={{ margin: 0 }}>CNPJ: {EMPRESA.cnpj} / Inscrição Estadual: {EMPRESA.ie}</p>
        <p style={{ margin: 0 }}>Endereço: {EMPRESA.endereco} {EMPRESA.bairro} - {EMPRESA.cidade} – CEP: {EMPRESA.cep}</p>
        <p style={{ margin: 0 }}>Telefone e WhatsApp: {EMPRESA.telefone}</p>
        <p style={{ margin: 0 }}>Redes Sociais: Facebook {EMPRESA.facebook} / Instagram: {EMPRESA.instagram}</p>
        <p style={{ margin: 0 }}>Site: {EMPRESA.site}</p>
      </footer>
    </div>
  )
}
