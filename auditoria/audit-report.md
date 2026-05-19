---
project: Toldos Fortaleza App
date: 2026-05-19
auditor: OWL
files_analyzed: 73
tech_stack: [Next.js 16, TypeScript, Tailwind 4, Supabase, Recharts, html2canvas, jsPDF]
score: B
summary: "Projeto funcional e bem estruturado. 3 catches silenciosos precisam de correção, dark mode não solicitado detectado, 32 usos de ': any', nenhum teste automatizado."
---

# Auditoria Toldos Fortaleza - 19/05/2026

## Nota Geral: B (Bom com ressalvas)

## Resumo Executivo

| Categoria | Status | Problemas |
|-----------|--------|-----------|
| Segurança | ⚠️ Atenção | 3 catches silenciosos |
| Qualidade | ⚠️ Atenção | 32 usos de `: any`, 0 console.log ✅ |
| Estrutura | ⚠️ Atenção | 4 arquivos >300 linhas |
| Performance | ⚠️ Atenção | 6 `<img>` nativos, 0 `select('*')` ✅ |
| Testes | ❌ Crítico | 0 arquivos de teste |
| Dark Mode | ❌ Não solicitado | ThemeToggle.tsx presente |

---

## 1. Segurança

### 1.1 - CRÍTICO: Catch silencioso em orçamento público
- **Arquivo:** `src/app/orcamento/[token]/page.tsx:16`
- **Problema:** Se a API falha, o orçamento carrega vazio sem erro
- **Impacto:** Cliente vê página sem dados, pensa que o orçamento não existe
- **Correção:**
```tsx
// Antes:
} catch {
  // fallback silencioso
}

// Depois:
} catch (err) {
  console.error('[orcamento] erro ao carregar:', err)
  setError('Não foi possível carregar o orçamento. Link pode estar expirado.')
}
```

### 1.2 - MÉDIO: Catch silencioso no upload de assinatura
- **Arquivo:** `src/components/pedido/PedidoForm.tsx:229`
- **Problema:** Se o upload da assinatura da empresa falha, usuário não recebe feedback
- **Correção:**
```tsx
// Antes:
} catch {}

// Depois:
} catch (err) {
  console.error('[assinatura] erro ao salvar:', err)
  alert('Erro ao salvar assinatura. Tente novamente.')
  return
}
```

### 1.3 - MÉDIO: Catch silencioso na geração de PDF
- **Arquivo:** `src/app/(auth)/pedidos/[id]/page.tsx:67`
- **Problema:** Se PDF falha, botão sai do loading mas usuário não sabe
- **Correção:**
```tsx
// Antes:
} catch { } finally {
  setIsPrinting(false)
}

// Depois:
} catch (err) {
  console.error('[pdf] erro ao gerar:', err)
  alert('Erro ao gerar PDF. Tente novamente.')
} finally {
  setIsPrinting(false)
}
```

### 1.4 - OK: Nenhuma chave secreta exposta
Todas as credenciais usam `process.env` corretamente.

### 1.5 - OK: Middleware protege rotas
Redireciona para `/login` se não autenticado, permite acesso público a `/orcamento/` e `/checklist/`.

---

## 2. Qualidade de Código

### 2.1 - MÉDIO: 32 usos de `: any`
- **Arquivos principais:**
  - `src/app/(auth)/agendamentos/page.tsx` (18 usos)
  - `src/app/orcamento/[token]/page.tsx` (3 usos)
  - `src/app/(auth)/clientes/[id]/page.tsx` (2 usos)
  - `src/app/(auth)/dashboard/page.tsx` (1 uso)
  - `src/app/(auth)/producao/page.tsx` (1 uso)
  - `src/components/pedido/PedidoPreview.tsx` (1 uso)
  - Outros (6 usos)
- **Impacto:** Desabilita checagem de tipos, esconde bugs em runtime
- **Correção:** Usar tipos de `src/types/` ou tipos do Supabase

### 2.2 - OK: 0 console.log esquecidos

### 2.3 - OK: 11 usos de useMemo/useCallback

---

## 3. Estrutura

### 3.1 - MÉDIO: Arquivos grandes (>300 linhas)

| Arquivo | Linhas | Recomendação |
|---------|--------|-------------|
| `src/components/pedido/PedidoForm.tsx` | 745 | Dividir em ProductSection, SignatureSection, PaymentSection |
| `src/app/(auth)/agendamentos/page.tsx` | 432 | Extrair ApptCard e DeadlineAlert |
| `src/components/cliente/ClienteForm.tsx` | 317 | Aceitável, pode dividir |
| `src/components/pedido/Checklist.tsx` | 309 | Aceitável |

### 3.2 - OK: 16 componentes UI reutilizáveis

### 3.3 - OK: 3 arquivos de tipos centralizados

---

## 4. Performance

### 4.1 - MÉDIO: 6 usos de `<img>` nativo
- **Arquivos:**
  - `src/app/orcamento/[token]/page.tsx:46` (logo)
  - `src/components/pedido/PedidoForm.tsx:697` (assinatura)
  - `src/components/pedido/PedidoForm.tsx:716` (assinatura empresa)
  - `src/components/pedido/PedidoPreview.tsx:36` (logo)
  - `src/components/pedido/PedidoPreview.tsx:149` (assinatura empresa)
  - `src/components/pedido/PedidoPreview.tsx:162` (assinatura)
- **Impacto:** Logo não é otimizado. Assinaturas são base64 (impacto menor).
- **Correção:** Usar `next/image` para logos.

### 4.2 - OK: 0 `.select('*')` encontrados

---

## 5. Testes

### 5.1 - CRÍTICO: Nenhum teste automatizado
- **Problema:** 0 arquivos `.test.ts` ou `.spec.ts` no código do projeto
- **Impacto:** Qualquer mudança pode quebrar funcionalidades sem que ninguém perceba
- **Recomendação:**
  - Testes unitários para cálculo de m²
  - Testes para geração de PDF
  - Testes de integração para fluxo de orçamento

---

## 6. Dark Mode (Não Solicitado)

### 6.1 - ThemeToggle.tsx presente
- **Arquivo:** `src/components/layout/ThemeToggle.tsx`
- **Problema:** Usuário rejeitou dark mode anteriormente
- **Ação:** Remover componente e referência no Header

---

## Quick Wins (Fazem rápido, alto impacto)

1. **Remover ThemeToggle.tsx** - Usuário não quer dark mode
2. **Corrigir catch do orçamento** - Adicionar mensagem de erro visível
3. **Corrigir catch do PDF** - Mostrar alerta quando falhar
4. **Corrigir catch da assinatura** - Mostrar erro quando falhar
5. **Trocar `<img>` do logo** - Usar next/image

## Technical Debt (Médio prazo)

1. **Dividir PedidoForm.tsx** (745 linhas) em subcomponentes
2. **Substituir `: any`** por tipos corretos (começar por agendamentos)
3. **Adicionar testes** - Pelo menos para cálculo de m² e fluxo de orçamento
4. **Melhorar fallback de URL** - Usar `window.location.origin`
5. **Dividir agendamentos/page.tsx** (432 linhas)
