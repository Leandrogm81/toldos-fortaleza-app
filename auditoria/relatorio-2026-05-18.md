---
data: 2026-05-18
projeto: toldos-fortaleza-app
score: 58
score_anterior: 62
total_arquivos: 68
total_linhas: 7711
vulnerabilidades:
  critico: 2
  importante: 6
  sugestao: 5
metricas:
  maiores_arquivos:
    - PedidoForm.tsx: 745 linhas
    - agendamentos/page.tsx: 432 linhas
    - Checklist.tsx: 309 linhas
    - ClienteForm.tsx: 317 linhas
    - clientes/[id]/page.tsx: 300 linhas
  usos_any: 25
  catch_vazios: 6
  select_star: 11
  console_log: 2
  hooks_no_maior: 14
stack:
  - Next.js 16.2.6
  - React 19.2.4
  - TypeScript 5 (strict: true)
  - Tailwind CSS 4
  - Supabase (szkqvemhqbfaiyvgjwhl)
  - Recharts, Zod, html2canvas, jsPDF, date-fns
dependencias:
  prod: 97
  dev: 372
  total: 515
  vulnerabilidades: 2 (postcss moderado)
---

# Relatório de Auditoria Técnica — Toldos Fortaleza App (2ª Rodada)

**Data:** 18/05/2026
**Score:** 58/100 (↓ 4 pontos da 1ª rodada — análise mais profunda)
**Arquivos analisados:** 68 (7.711 linhas de código)
**Cobertura de testes:** 0%

---

## Resumo Executivo

O projeto tem uma base funcional sólida com arquitetura bem definida (App Router, Supabase SSR, PWA ativo). Porém, a análise completa de todos os 68 arquivos revelou débito técnico significativo:

- **Componente monolítico** de 745 linhas com 14 hooks
- **Zero testes** para 7.711 linhas de código
- **25 usos de `any`** que desativam a segurança do TypeScript
- **6 erros silenciosos** que podem causar perda de dados sem feedback
- **11 consultas ineficientes** trazendo dados desnecessários
- **2 vulnerabilidades** de segurança (1 crítica, 1 moderada)

---

## 🔴 CRÍTICO (2)

### [CRIT-01] PedidoForm.tsx — componente monolítico (745 linhas, 14 hooks)

- **Arquivo:** `src/components/pedido/PedidoForm.tsx`
- **Métricas:** 745 linhas, 14 hooks (4 useState, 3 useEffect, 4 useCallback, 3 useRef)
- **Problema:** Um único componente gerencia toda a lógica de pedidos/orçamentos: dados do cliente, busca CEP, produtos, medidas, cálculos de m²/calha, assinaturas, pagamento, máscaras de input, e interações com Supabase. Viola severamente o princípio de responsabilidade única.
- **Risco:** Alta probabilidade de regressões. Dificuldade extrema de manutenção e onboarding de novos desenvolvedores.
- **Correção:** Decompor em sub-componentes:

```
PedidoForm.tsx (~150 linhas — orquestrador)
├── ClientInfoSection.tsx — dados do cliente + busca CEP
├── ProductSection.tsx — lista de produtos + autocomplete
├── ProductMeasure.tsx — medidas individuais (comprimento/largura/altura)
├── PaymentSection.tsx — forma de pagamento + cálculo automático
└── SignatureSection.tsx — assinaturas do cliente e empresa
```

### [CRIT-02] SERVICE_ROLE_KEY em página server-side pública

- **Arquivo:** `src/app/orcamento/[token]/page.tsx:12-21`
- **Problema:** A página de orçamento público instancia `createServerClient` diretamente com `SUPABASE_SERVICE_ROLE_KEY`. Embora seja server-side (não expõe ao navegador diretamente), a chave administrativa está acoplada ao componente de página. Qualquer vazamento de erro SSR, stack trace, ou log pode expor a key.
- **Risco:** Bypass completo de RLS. Acesso total ao banco de dados.
- **Correção:**

```typescript
// CRIAR: app/api/orcamento/[token]/route.ts
import { createServerAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createServerAdminClient()
  const { data, error } = await supabase
    .from('document')
    .select('id, type, status, date, doc_data, logo_data_url')
    .eq('public_token', token)
    .single()

  if (error || !data) return Response.json({ error: 'not_found' }, { status: 404 })
  return Response.json(data)
}

// REFAZER: app/orcamento/[token]/page.tsx
// Trocar o createServerClient por: const res = await fetch(`/api/orcamento/${token}`)
```

---

## 🟡 IMPORTANTE (6)

### [IMP-01] ~25 usos de `any` — TypeScript desativado

- **Arquivos afetados:**
  - `src/app/(auth)/agendamentos/page.tsx` — 18 ocorrências (63,64,72,89,105,109,131,132,171,209,217,231,265,279,291,323,387,407)
  - `src/app/(auth)/clientes/[id]/page.tsx` — 2 ocorrências (18,19)
  - `src/app/(auth)/dashboard/page.tsx` — 1 ocorrência (12)
  - `src/components/pedido/PedidoForm.tsx` — 2 ocorrências (46,306)
  - `src/app/(auth)/orcamentos/novo/page.tsx` — 2 ocorrências
- **Problema:** `any` desativa a verificação de tipos. Erros que o TypeScript detectaria em desenvolvimento passam para produção.
- **Correção:** Criar interfaces:

```typescript
// types/appointment.ts
export interface Appointment {
  id: string
  title: string
  type: 'visita_medicao' | 'instalacao' | 'reparo' | 'pos_venda' | 'outro'
  status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'
  client_id: string | null
  document_id: string | null
  scheduled_at: string
  duration_min: number
  notes: string | null
  client?: { name: string; phone: string }
  document?: { type: string }
}

// types/document.ts
export interface DocumentSummary {
  id: string
  type: 'pedido' | 'orcamento'
  status: string
  date: string
  doc_data: Record<string, unknown>
  created_at: string
}

export interface DeadlineOrder extends DocumentSummary {
  deadline: Date | null
  status: 'vencido' | 'hoje' | 'amanha' | '3dias' | '7dias' | 'ok'
  clientName: string
}
```

### [IMP-02] 6 erros silenciosos — `catch {}` sem logging

- **Arquivos:**
  - `src/app/(auth)/orcamentos/novo/page.tsx:105`
  - `src/app/(auth)/orcamentos/[id]/page.tsx:81`
  - `src/app/(auth)/pedidos/novo/page.tsx:52`
  - `src/components/pedido/PedidoForm.tsx:229,739`
  - `src/lib/supabase/server.ts:20`
- **Problema:** Exceções são capturadas e completamente ignoradas. O usuário não recebe feedback quando algo falha.
- **Correção:**

```typescript
// ANTES:
} catch {}

// DEPOIS:
} catch (err) {
  console.error('[nome-do-contexto] erro:', err)
  // Opcional: toast de erro para o usuário
}
```

### [IMP-03] 11 consultas com `select('*')` — dados desnecessários

- **Arquivos:**
  - `src/app/(auth)/clientes/page.tsx:23` — `.select('*')`
  - `src/app/(auth)/clientes/[id]/page.tsx:28` — `.select('*')`
  - `src/app/(auth)/clientes/[id]/page.tsx:37` — `.select('*')` (2x)
  - `src/app/(auth)/orcamentos/page.tsx:40` — `.select('*')`
  - `src/app/(auth)/orcamentos/[id]/page.tsx:33` — `.select('*')`
  - `src/app/(auth)/pedidos/page.tsx:27` — `.select('*')`
  - `src/app/(auth)/pedidos/[id]/page.tsx:32` — `.select('*')`
  - `src/app/(auth)/agendamentos/page.tsx:80` — `.select('*')`
  - `src/components/pedido/Checklist.tsx:56` — `.select('*')`
  - `src/lib/auth.ts:67` — `.select('*')`
- **Problema:** Traz todas as colunas da tabela, inclusive dados pesados não utilizados.
- **Correção:** Especificar colunas necessárias:

```typescript
// Exemplo para lista de clientes:
.select('id, name, phone, city, doc_type, created_at')

// Exemplo para detalhe do cliente:
.select('id, name, phone, doc_type, cpf, rg, cnpj, ie, cep, address, neighborhood, city, notes, created_at')
```

### [IMP-04] console.log em produção

- **Arquivo:** `src/components/layout/PwaRegister.tsx:11-12`
- **Problema:** Logs expostos no navegador do usuário.
- **Correção:** Remover ou substituir por `console.debug`.

### [IMP-05] Vulnerabilidade PostCSS (XSS via CSS)

- **Dependência:** `postcss < 8.5.10` (via Next.js)
- **CVE:** GHSA-qx2v-qp2m-jg93 (CVSS 6.1 — moderado)
- **Correção:** `npm update next`

### [IMP-06] Imagens sem otimização

- **Arquivo:** `src/components/pedido/PhotoGallery.tsx:69,109`
- **Problema:** Usa `<img>` nativo em vez de `<Image>` do Next.js.
- **Correção:**

```typescript
import Image from 'next/image'
// Trocar <img> por <Image src={url} alt={alt} width={400} height={400} loading="lazy" />
```

---

## 🔵 SUGESTÃO (5)

### [SUG-01] Estilos inline no PedidoPreview

- **Arquivo:** `src/components/pedido/PedidoPreview.tsx` (184 linhas, tudo inline)
- **Correção:** Migrar para classes Tailwind. Manter CSS separado para contexto de impressão (html2canvas).

### [SUG-02] Auth layout como client component

- **Arquivo:** `src/app/(auth)/layout.tsx`
- **Problema:** `'use client'` com redirecionamento via `useEffect` — conteúdo protegido é enviado ao navegador antes do redirect.
- **Correção:** Server Component com verificação via `cookies()` e `redirect()`.

### [SUG-03] Pasta /lib/store vazia

- **Arquivo:** `src/lib/store/` (diretório vazio)
- **Correção:** Remover a pasta ou implementar gerenciamento de estado (Zustand/Jotai).

### [SUG-04] InstallPrompt usa `any`

- **Arquivo:** `src/components/layout/InstallPrompt.tsx:6`
- **Problema:** `useState<any>(null)` para o prompt de instalação PWA.
- **Correção:** Tipar corretamente com `BeforeInstallPromptEvent`.

### [SUG-05] OrcamentoAprovado faz update direto com client-side

- **Arquivo:** `src/app/orcamento/[token]/OrcamentoAprovado.tsx:10-24`
- **Problema:** O botão de aprovar orçamento faz um update direto no Supabase via client-side, sem passar por uma API. Isso significa que qualquer pessoa com o link pode aprovar o orçamento, e a validação é feita apenas no client.
- **Correção:** Criar uma API route para aprovação com validação server-side.

---

## 🧪 Testes Sugeridos (por prioridade)

### Prioridade 1 — Funções de cálculo (sem dependência de UI)

```typescript
// __tests__/calc.test.ts
describe('calcProdutoM2', () => {
  it('calcula área simples: 5m x 3m = 15m²')
  it('adiciona 35cm no comprimento para retrátil')
  it('retorna 0 para item sem medidas (reparo)')
  it('calcula calha: R$100/m')
})

describe('parseDeliveryDeadline', () => {
  it('parseia "15 dias" corretamente')
  it('parseia "15/06/2026" corretamente')
  it('retorna null para string vazia')
})

describe('getDeadlineStatus', () => {
  it('retorna "vencido" para data passada')
  it('retorna "hoje" para data de hoje')
  it('retorna "amanha" para data de amanhã')
  it('retorna "ok" para data distante')
})
```

### Prioridade 2 — Formatadores

```typescript
// __tests__/format.test.ts
describe('formatCpf', () => {
  it('12345678901 → 123.456.789-01')
  it('retorna vazio para string vazia')
  it('limita a 11 dígitos')
})

describe('formatCnpj', () => {
  it('11222333000181 → 11.222.333/0001-81')
})

describe('formatPhone', () => {
  it('1120360010 → (11) 2036-0010')
  it('11999990000 → (11) 99999-0000')
})

describe('formatCurrency', () => {
  it('12345 → R$ 123,45')
  it('0 → vazio')
})

describe('numberToWordsPtBr', () => {
  it('1 → "Um real"')
  it('150 → "Cento e cinquenta reais"')
  it('0 → "Zero"')
})
```

### Prioridade 3 — Validação de formulários

```typescript
// __tests__/validation.test.ts
describe('ClienteForm', () => {
  it('rejeita nome vazio')
  it('rejeita telefone vazio')
  it('aceita CPF válido')
  it('aceita CNPJ válido')
})
```

### Prioridade 4 — Autenticação

```typescript
// __tests__/auth.test.ts
describe('auth middleware', () => {
  it('redireciona para /login se não autenticado')
  it('redireciona para /dashboard se já autenticado na página de login')
  it('permite acesso a /orcamento/[token] sem auth')
  it('permite acesso a /login sem auth')
})
```

---

## ⚡ Quick Wins (correções rápidas de alto impacto)

| # | Ação | Tempo | Impacto |
|---|------|-------|---------|
| 1 | `npm update next` (corrige PostCSS XSS) | 5 min | Segurança |
| 2 | Remover `console.log` do PwaRegister | 5 min | Segurança |
| 3 | Remover pasta vazia `/lib/store/` | 1 min | Organização |
| 4 | Adicionar `console.error` nos 6 `catch {}` | 30 min | Confiabilidade |
| 5 | Trocar `select('*')` por colunas específicas (11 pontos) | 1h | Performance |
| 6 | Criar interfaces TypeScript (substituir ~25 `any`) | 2-3h | Qualidade |
| 7 | Criar testes dos cálculos + formatadores | 2-3h | Confiabilidade |

---

## 📊 Débito Técnico Consolidado

| Item | Severidade | Esforço | Prioridade |
|------|-----------|---------|------------|
| Dividir PedidoForm em sub-componentes | Alta | 4-6h | P1 |
| Criar suite de testes (unit + integration) | Alta | 8-12h | P1 |
| Isolar SERVICE_ROLE_KEY em API route | Alta | 1h | P1 |
| Migrar `any` para tipos adequados | Médio | 3-4h | P2 |
| Implementar error handling adequado | Médio | 2-3h | P2 |
| Otimizar 11 consultas Supabase | Médio | 1h | P2 |
| Migrar imagens para next/image | Baixo | 1h | P3 |
| Refatorar auth layout para Server Component | Baixo | 1h | P3 |
| Remover pasta vazia /lib/store | Baixo | 1 min | P3 |
| Criar API route para aprovação de orçamento | Médio | 1h | P2 |

**Esforço total estimado:** ~22-30 horas

---

## 📈 Comparativo com 1ª Rodada

| Métrica | 1ª Rodada | 2ª Rodada | Variação |
|---------|----------|----------|----------|
| Score | 62 | 58 | ↓ 4 |
| Críticos | 1 | 2 | +1 (PedidoForm identificado como crítico) |
| Importantes | 5 | 6 | +1 (select* contabilizado) |
| Sugestões | 4 | 5 | +1 (pasta vazia, OrcamentoAprovado) |
| Arquivos analisados | Parcial | 68/68 (100%) | Completo |

A nota baixou porque a 2ª rodada analisou 100% dos arquivos e identificou problemas adicionais que a análise parcial não capturou.

---

*Relatório gerado automaticamente pelo Agente Hermes — 18/05/2026*
*Análise completa de 68 arquivos / 7.711 linhas de código*
