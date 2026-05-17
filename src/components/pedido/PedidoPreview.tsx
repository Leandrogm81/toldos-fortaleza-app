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
    <div id="print-area" className="w-full mx-auto bg-white shadow-2xl p-4 sm:p-6 border border-gray-300 font-sans text-xs text-gray-800">
      <header className="text-center mb-4">
        {/* Logo */}
        {logoSrc ? (
          <img src={logoSrc} alt="Logo" className="h-16 w-auto mx-auto object-contain" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="h-12 w-auto mx-auto text-sky-800">
            <path d="M35 2 H 5 V 38 H 35 V 28 H 20 V 12 H 35 V 2 Z" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" />
          </svg>
        )}
        <h2 className="text-base font-bold tracking-widest mt-2">
          {mode === 'orcamento' ? 'ORÇAMENTO' : 'PEDIDO DE COMPRA'}
        </h2>
        {mode === 'orcamento' && validade && (
          <p className="text-xs text-gray-600 mt-1">Validade: {validade}</p>
        )}
      </header>

      <main>
        <p className="mb-3">Data: {data.date}</p>

        {/* Contratado */}
        <section className="mb-3">
          <h3 className="font-bold text-xs text-sky-700 border-b border-sky-700 pb-0.5 mb-1.5">Contratado</h3>
          <div className="space-y-px text-xs">
            <p>{EMPRESA.nome}</p>
            <p>{EMPRESA.endereco} – {EMPRESA.bairro} – {EMPRESA.cidade} CEP: {EMPRESA.cep}</p>
            <p>Tel: {EMPRESA.telefone} | CNPJ: {EMPRESA.cnpj} | IE: {EMPRESA.ie}</p>
          </div>
        </section>

        {/* Contratante */}
        <section className="mb-3">
          <h3 className="font-bold text-xs text-sky-700 border-b border-sky-700 pb-0.5 mb-1.5">Contratante</h3>
          <div className="space-y-px text-xs">
            {data.clientName && <p>Nome: {data.clientName}</p>}
            {data.clientAddress && <p>Endereço: {data.clientAddress}</p>}
            {data.clientNeighborhood && <p>Bairro: {data.clientNeighborhood}</p>}
            {data.clientCity && <p>Cidade: {data.clientCity}</p>}
            {data.clientPhone && <p>Telefone: {data.clientPhone}</p>}
            {data.clientCnpj ? (
              <>
                {data.clientCnpj && <p>CNPJ: {data.clientCnpj}{data.clientIe ? ` / IE: ${data.clientIe}` : ''}</p>}
              </>
            ) : (
              <>
                {data.clientCpf && <p>CPF: {data.clientCpf}{data.clientRg ? ` / RG: ${data.clientRg}` : ''}</p>}
                {!data.clientCpf && data.clientRg && <p>RG: {data.clientRg}</p>}
              </>
            )}
          </div>
        </section>

        {/* Produtos */}
        <section className="mb-3">
          <h3 className="font-bold text-xs text-sky-700 border-b border-sky-700 pb-0.5 mb-1.5">Produto(s)</h3>
          {data.products.map((product, index) => (
            <div key={index} className={`space-y-px text-xs ${index < data.products.length - 1 ? 'mb-1.5 pb-1.5 border-b border-gray-200' : ''}`}>
              {product.item && <p><span className="font-semibold">Item {index + 1}:</span> {product.item}</p>}
              {product.structure && <p><span className="font-semibold">Estrutura:</span> {product.structure}</p>}
              {product.material && <p><span className="font-semibold">Material:</span> {product.material}</p>}
              {product.accessories && <p><span className="font-semibold">Acessórios:</span> {product.accessories}</p>}
              {product.measure && <p><span className="font-semibold">Medida:</span> {product.measure}</p>}
            </div>
          ))}
        </section>

        {/* Valor e Pagamento */}
        <section className="space-y-1.5 text-xs my-4">
          {data.productValue && (
            <div className="border border-black p-1.5">
              Valor R$ {data.productValue.replace('R$', '').trim()} – {data.productValueText}
            </div>
          )}
          <div className="border border-black p-1.5">
            Forma de pagamento: {data.paymentMethod || 'A combinar'}
          </div>
          <div className="border border-black p-1.5">
            {EMPRESA.banco} / Pix: {EMPRESA.pix}
          </div>
        </section>

        {/* Prazo */}
        <section className="space-y-px text-xs">
          {data.deliveryTime && <p>Prazo de Entrega: {data.deliveryTime}</p>}
          <p>Garantia: {EMPRESA.garantia}</p>
        </section>
      </main>

      {/* Assinaturas */}
      <section className="mt-10 flex flex-wrap justify-around items-start gap-x-4 gap-y-6">
        <div className="text-center w-56">
          <div className="h-14 flex items-end justify-center pb-1">
            {data.companySignatureDataUrl && (
              <img src={data.companySignatureDataUrl} alt="Assinatura do Contratado" className="max-h-full w-auto object-contain" />
            )}
          </div>
          <div className="border-t border-gray-800 pt-1.5">
            <p className="text-xs font-semibold">{EMPRESA.responsavel}</p>
            <p className="text-[10px] text-gray-600">Assinatura do Contratado</p>
          </div>
        </div>

        {includeSignature && (
          <div className="text-center w-56">
            <div className="h-14 flex items-end justify-center pb-1">
              {data.signatureDataUrl && (
                <img src={data.signatureDataUrl} alt="Assinatura do Contratante" className="max-h-full w-auto object-contain" />
              )}
            </div>
            <div className="border-t border-gray-800 pt-1.5">
              <p className="text-xs font-semibold">{data.clientName || ''}</p>
              <p className="text-[10px] text-gray-600">Assinatura do Contratante</p>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-left text-[9px] pt-4 mt-6">
        <div className="space-y-px">
          <p>Razão Social: {EMPRESA.nome} / Nome Fantasia: {EMPRESA.fantasia}</p>
          <p>CNPJ: {EMPRESA.cnpj} / Inscrição Estadual: {EMPRESA.ie}</p>
          <p>Endereço: {EMPRESA.endereco} {EMPRESA.bairro} - {EMPRESA.cidade} – CEP: {EMPRESA.cep}</p>
          <p>Telefone e WhatsApp: {EMPRESA.telefone}</p>
          <p>Redes Sociais: Facebook {EMPRESA.facebook} / Instagram: {EMPRESA.instagram}</p>
          <p>Site: {EMPRESA.site}</p>
        </div>
      </footer>
    </div>
  )
}
