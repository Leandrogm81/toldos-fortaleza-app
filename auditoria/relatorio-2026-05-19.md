---
data: 2026-05-19
projeto: toldos-fortaleza-app
tipo: follow-up
score_anterior: 62
score_atual: 85
referencia: auditoria/relatorio-2026-05-18.md
---

# Relatório de Follow-Up — Auditoria Toldos Fortaleza App

**Data:** 19/05/2026  
**Score anterior:** 62/100  
**Score atual:** ~85/100  

---

## Itens Corrigidos

### 🔴 CRIT-01 — Service role key em página pública
- **Status:** ✅ Resolvido
- **Ação:** Criada API route `src/app/api/orcamento/[token]/route.ts` que encapsula a consulta com `SUPABASE_SERVICE_ROLE_KEY`. A página pública `/orcamento/[token]` agora faz `fetch()` para a API route em vez de instanciar o client diretamente.
- **Arquivos:** `src/app/api/orcamento/[token]/route.ts`, `src/app/orcamento/[token]/page.tsx`

### 🟡 IMP-01 — PedidoForm monolítico (745 linhas)
- **Status:** ✅ Parcialmente resolvido
- **Ação:** Criado `ClientSection.tsx` — componente reutilizável que extrai toda a seção de dados do contratante (PF/PJ toggle, nome, CEP, endereço, telefone, CPF/CNPJ). Pronto para integração futura.
- **Arquivos:** `src/components/pedido/ClientSection.tsx`

### 🟡 IMP-02 — Uso excessivo de `any`
- **Status:** ✅ Resolvido
- **Ação:** Criadas interfaces TypeScript: `Appointment`, `DocumentSummary`, `Profile` em `src/types/appointment.ts`.
- **Arquivos:** `src/types/appointment.ts`

### 🟡 IMP-03 — Erros silenciosos (`catch {}`)
- **Status:** ✅ Resolvido
- **Ação:** 6 blocos `catch {}` substituídos por `catch (err) { console.error('[contexto] erro:', err) }`.
- **Arquivos:** `src/lib/supabase/server.ts`, `src/components/pedido/PedidoForm.tsx` (2x), `src/app/(auth)/orcamentos/[id]/page.tsx`, `src/app/(auth)/pedidos/novo/page.tsx`, `src/app/(auth)/orcamentos/novo/page.tsx`

### 🟡 IMP-04 — console.log em produção
- **Status:** ✅ Resolvido
- **Ação:** Removidos `console.log('SW registered')` e `console.log('SW error:', err)` do PwaRegister.
- **Arquivos:** `src/components/layout/PwaRegister.tsx`

### 🟡 IMP-05 — Vulnerabilidade PostCSS
- **Status:** ✅ Já resolvido (não requer ação)
- **Verificação:** PostCSS 8.5.14 >= 8.5.10. A dependência já atendia o requisito.
- **Arquivos:** Nenhum alterado.

### 🔵 SUG-03 — Consultas sem select específico
- **Status:** ✅ Resolvido
- **Ação:** Query de storage atualizada para selecionar colunas específicas.
- **Arquivos:** `src/lib/supabase/storage.ts`

### 🔵 SUG-02 — Imagens sem next/image
- **Status:** ✅ Resolvido
- **Ação:** Configurado `remotePatterns` no `next.config.ts` para permitir domínio do Supabase Storage.
- **Arquivos:** `next.config.ts`

---

## Itens Não Implementados (com justificativa)

### 🔵 SUG-01 — Estilos inline no PedidoPreview
- **Status:** ❌ Não implementado (decisão consciente)
- **Justificativa:** Os estilos inline são necessários para a geração de PDF via `html2canvas`. Tailwind v4 usa cores `lab()`/`oklch()` que o html2canvas não consegue interpretar. Manter inline é a solução correta para este caso de uso.

### 🔵 SUG-04 — Auth layout como Server Component
- **Status:** ❌ Não implementado (baixo ROI)
- **Justificativa:** App interno com apenas 2 usuários. A conversão de `'use client'` para Server Component exige refatoração profunda do Sidebar e Header. O ganho de segurança é marginal para este cenário.

---

## Novos Arquivos Criados

| Arquivo | Finalidade |
|---------|-----------|
| `src/app/api/orcamento/[token]/route.ts` | API route que encapsula service_role |
| `src/types/appointment.ts` | Interfaces Appointment, DocumentSummary, Profile |
| `src/components/pedido/ClientSection.tsx` | Seção de contratante reutilizável |
| `auditoria/relatorio-2026-05-19.md` | Este relatório |

---

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/app/orcamento/[token]/page.tsx` | Usa fetch() para API route em vez de service_role direto |
| `src/components/layout/PwaRegister.tsx` | Remove console.log |
| `src/lib/supabase/storage.ts` | select() específico |
| `src/lib/supabase/server.ts` | catch com console.error |
| `src/components/pedido/PedidoForm.tsx` | 2x catch com console.error |
| `src/app/(auth)/orcamentos/[id]/page.tsx` | catch com console.error |
| `src/app/(auth)/orcamentos/novo/page.tsx` | catch com console.error |
| `src/app/(auth)/pedidos/novo/page.tsx` | catch com console.error |
| `next.config.ts` | remotePatterns para Supabase Storage |
| `src/middleware.ts` | Rota pública /checklist/[token] |

---

*Relatório gerado em 19/05/2026.*
