---
data: 2026-05-18
projeto: toldos-fortaleza-app
score: 62
total_arquivos: 68
total_linhas: 7711
vulnerabilidades:
  critico: 1
  importante: 5
  sugestao: 4
stack:
  - Next.js 16.2.6
  - React 19.2.4
  - TypeScript 5
  - Tailwind CSS 4
  - Supabase (szkqvemhqbfaiyvgjwhl)
---

# Relatório de Auditoria Técnica — Toldos Fortaleza App

**Data:** 18/05/2026
**Score:** 62/100
**Arquivos analisados:** 68 (7.711 linhas)

---

## Resumo Executivo

O projeto tem uma base funcional sólida com arquitetura bem definida (App Router, Supabase SSR, PWA). Os principais problemas são: **componente PedidoForm excessivamente grande (745 linhas)**, **ausência total de testes**, **uso excessivo de `any` no TypeScript**, e **erros silenciosos** que podem causar perda de dados sem feedback ao usuário.

---

## 🔴 CRÍTICO (1)

### [CRIT-01] Chave SERVICE_ROLE_KEY em página pública server-side

- **Arquivo:** `src/app/orcamento/[token]/page.tsx:12-21`
- **Problema:** A página de orçamento público instancia `createServerClient` com `SUPABASE_SERVICE_ROLE_KEY` diretamente. Embora seja server-side (não expõe ao navegador), isso cria uma superfície de ataque: se houver qualquer SSR injection ou vazamento de erro, a key administrativa pode ser exposta.
- **Severidade:** Crítica — bypass completo de RLS.
- **Correção:** Criar uma API route (`app/api/orcamento/[token]/route.ts`) que encapsula a consulta com service role. A página chama a API via `fetch()`.

```typescript
// app/api/orcamento/[token]/route.ts
import { createServerAdminClient } from '@/lib/supabase/server'
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServerAdminClient()
  const { data } = await supabase.from('document').select('*').eq('public_token', token).single()
  return Response.json(data)
}
```

---

## 🟡 IMPORTANTE (5)

### [IMP-01] PedidoForm.tsx com 745 linhas — componente monolítico

- **Arquivo:** `src/components/pedido/PedidoForm.tsx` (745 linhas)
- **Problema:** Um único componente gerencia: dados do cliente, produtos, medidas, cálculos, assinaturas, pagamento, upload de fotos, e máscaras de input. Viola o princípio de responsabilidade única.
- **Correção:** Decompor em:
  - `ClientInfoSection.tsx` — dados do cliente + busca CEP
  - `ProductSection.tsx` — lista de produtos + autocomplete
  - `ProductMeasure.tsx` — medidas individuais
  - `PaymentSection.tsx` — forma de pagamento
  - `SignatureSection.tsx` — assinaturas
  - `PedidoForm.tsx` — orquestrador (fica com ~150 linhas)

### [IMP-02] Uso excessivo de `any` no TypeScript (~20+ ocorrências)

- **Arquivos:**
  - `src/app/(auth)/agendamentos/page.tsx:63,64,72,89,105,109,131,132,171,209,217,231,265,279,291,323,387,407` (18 ocorrências)
  - `src/app/(auth)/clientes/[id]/page.tsx:18,19`
  - `src/app/(auth)/dashboard/page.tsx:12`
- **Problema:** `any` desativa a verificação de tipos. Erros que o TypeScript detectaria em desenvolvimento passam para produção.
- **Correção:** Criar interfaces:

```typescript
// types/appointment.ts
export interface Appointment {
  id: string
  client_id: string
  scheduled_at: string
  status: 'agendado' | 'concluido' | 'cancelado'
  notes?: string
  created_at: string
}

// types/document.ts
export interface DocumentSummary {
  id: string
  type: 'pedido' | 'orcamento'
  status: string
  date: string
  doc_data: Record<string, unknown>
}
```

### [IMP-03] Erros silenciosos — `catch {}` sem logging (6 ocorrências)

- **Arquivos:**
  - `src/app/(auth)/orcamentos/novo/page.tsx:105`
  - `src/app/(auth)/orcamentos/[id]/page.tsx:81`
  - `src/app/(auth)/pedidos/novo/page.tsx:52`
  - `src/components/pedido/PedidoForm.tsx:229,739`
  - `src/lib/supabase/server.ts:20`
- **Problema:** Exceções são capturadas e completamente ignoradas. O usuário não recebe feedback quando algo falha.
- **Correção:**

```typescript
// Antes:
} catch {}

// Depois:
} catch (err) {
  console.error('[contexto] erro:', err)
  // Opcional: toast de erro para o usuário
}
```

### [IMP-04] console.log em código de produção

- **Arquivo:** `src/components/layout/PwaRegister.tsx:11-12`
- **Problema:** `console.log('SW registered')` e `console.log('SW error:', err)` expõem informações no navegador do usuário.
- **Correção:** Remover ou usar `console.debug` (que é removido em builds de produção com config adequada).

### [IMP-05] Vulnerabilidade PostCSS (XSS via CSS)

- **Dependência:** `postcss < 8.5.10` (via Next.js)
- **CVE:** GHSA-qx2v-qp2m-jg93 (CVSS 6.1 — moderado)
- **Correção:** `npm update next` para versão que inclui postcss >= 8.5.10

---

## 🔵 SUGESTÃO (4)

### [SUG-01] Estilos inline no PedidoPreview

- **Arquivo:** `src/components/pedido/PedidoPreview.tsx` (184 linhas, todos os estilos inline)
- **Problema:** Dificulta manutenção e impede uso do Tailwind.
- **Correção:** Migrar para classes Tailwind. Para o contexto de PDF (html2canvas), manter um CSS separado para impressão.

### [SUG-02] Imagens sem next/image

- **Arquivo:** `src/components/pedido/PhotoGallery.tsx:69,109`
- **Problema:** Usa `<img>` nativo em vez de `<Image>` do Next.js.
- **Correção:** Substituir por `next/image` com `sizes` e `priority={false}`.

### [SUG-03] Consultas sem select específico

- **Arquivos:**
  - `src/components/cliente/ClienteBusca.tsx:40` — `.select('id, name, phone, city, doc_type, cpf, cnpj, address, neighborhood, cep, rg, ie')` (ok, mas sem limite de paginação)
  - `src/lib/supabase/storage.ts:31` — `.select('*')`
  - `src/app/(auth)/orcamento/[token]/page.tsx:25` — `.select('*')`
- **Correção:** Especificar colunas necessárias e adicionar `.range()` para paginação.

### [SUG-04] Auth layout como client component

- **Arquivo:** `src/app/(auth)/layout.tsx`
- **Problema:** `'use client'` com redirecionamento via `useEffect` — o conteúdo protegido é enviado ao navegador antes do redirect.
- **Correção:** Usar Server Component com verificação via `cookies()` e `redirect()` do Next.js.

---

## 🧪 Testes Sugeridos (prioridade alta)

### 1. Funções de cálculo (m², calha, retrátil)
```typescript
// __tests__/calc.test.ts
describe('calcProdutoM2', () => {
  it('calcula área simples: 5m x 3m = 15m²')
  it('adiciona 35cm no comprimento para retrátil')
  it('calcula calha: R$100/m')
  it('retorna 0 para item sem medidas (reparo)')
})
```

### 2. Formatadores
```typescript
// __tests__/format.test.ts
describe('formatCpf', () => {
  it('12345678901 → 123.456.789-01')
  it('retorna vazio para string vazia')
})
describe('formatCnpj', () => { ... })
describe('formatPhone', () => { ... })
describe('formatCurrency', () => { ... })
describe('numberToWordsPtBr', () => { ... })
```

### 3. Validação de formulários
```typescript
// __tests__/validation.test.ts
describe('ClienteForm', () => {
  it('rejeita nome vazio')
  it('rejeita telefone vazio')
  it('aceita CPF válido')
  it('aceita CNPJ válido')
})
```

### 4. Autenticação
```typescript
// __tests__/auth.test.ts
describe('auth middleware', () => {
  it('redireciona para /login se não autenticado')
  it('redireciona para /dashboard se já autenticado na página de login')
  it('permite acesso a /orcamento/[token] sem auth')
})
```

---

## ⚡ Quick Wins (correções rápidas de alto impacto)

| Ação | Tempo estimado | Impacto |
|------|---------------|---------|
| `npm update next` (corrige PostCSS) | 5 min | Segurança |
| Remover console.log do PwaRegister | 5 min | Segurança |
| Adicionar `console.error` nos `catch {}` | 30 min | Confiabilidade |
| Criar interfaces TypeScript para agendamentos | 1h | Qualidade |
| Adicionar `select()` específico nas queries | 30 min | Performance |

---

## 📊 Débito Técnico

| Item | Nível | Esforço estimado |
|------|-------|-----------------|
| Dividir PedidoForm em sub-componentes | Alto | 4-6h |
| Criar suite de testes (unit + integration) | Alto | 8-12h |
| Migrar `any` para tipos adequados | Médio | 3-4h |
| Implementar error handling adequado | Médio | 2-3h |
| Otimizar consultas Supabase | Médio | 2h |
| Migrar imagens para next/image | Baixo | 1h |
| Refatorar auth layout para Server Component | Baixo | 1h |

---

*Relatório gerado automaticamente pelo Agente Hermes.*
