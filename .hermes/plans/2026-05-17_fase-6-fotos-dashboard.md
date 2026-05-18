# Plano — Fase 6: Fotos por Pedido + Dashboard com Gráficos

**Projeto:** Toldos Fortaleza App  
**Data:** 17/05/2026  
**Versão do plano:** 1.0  
**Depende de:** Sprints 1-8 concluídos (app em produção)

---

## 1. Objetivo

Adicionar duas features ao app em produção:

- **Fotos por pedido** — upload de fotos da galeria do celular, organizadas por pedido, salvas no Supabase Storage + banco
- **Dashboard com gráficos** — faturamento mensal, taxa de conversão, serviços por semana, substituindo o dashboard estático atual

---

## 2. Contexto do Negócio

O usuário (Leandro, Toldos Fortaleza) tira fotos com o celular durante as visitas de medição e instalação. Hoje essas fotos ficam na galeria do celular, misturadas com fotos pessoais. Ele quer anexá-las ao pedido correspondente para consulta futura.

Para gestão, ele quer visualizar:
- Faturamento mensal (total de vendas pagas/instaladas)
- Taxa de conversão (orçamentos com visita → pedidos)
- Quantos serviços foram feitos por semana

---

## 3. Arquitetura

### 3.1 Fotos — Fluxo de Dados

```
Usuário → Seleciona fotos da galeria → Upload via Supabase Storage
                                                    │
                                          ┌─────────┴─────────┐
                                          ▼                   ▼
                                   Supabase Storage      attachment table
                                   (arquivo .jpg)       (storage_path,
                                                         document_id,
                                                         type,
                                                         description)
```

- **Storage:** bucket `attachments` no Supabase, público (ou autenticado)
- **Banco:** tabela `attachment` já existe, precisa popular
- **UI:** botão "Adicionar fotos" no detalhe do pedido (`/pedidos/[id]`)

### 3.2 Dashboard — Fontes de Dados

| Métrica | Query |
|---------|-------|
| **Faturamento mensal** | `SELECT SUM(total_value) FROM document WHERE type='pedido' AND status IN ('pago','instalado') GROUP BY month(created_at)` |
| **Taxa de conversão** | Orçamentos com visita: count de `appointment WHERE type='visita_medicao'` vinculados a `document WHERE type='orcamento'` ÷ Orçamentos que viraram pedido (status='aprovado' e existe documento type='pedido' com mesmos dados) |
| **Serviços por semana** | `SELECT COUNT(*) FROM appointment WHERE type='instalacao' AND status='concluido' GROUP BY week(scheduled_at)` |

### 3.3 Tech Stack

| Componente | Tecnologia | Justificativa |
|-----------|-----------|---------------|
| Gráficos | `recharts` (reinstalar) | Biblioteca React nativa, SVG, já conhecida |
| Upload de arquivos | `<input type="file" accept="image/*" multiple>` + Supabase Storage | API nativa do navegador, sem dependência extra |
| Storage | Supabase Storage (`attachments` bucket) | Já incluso no plano, sem custo adicional |
| Galeria | CSS grid simples + lightbox | Leve, sem dependência |

---

## 4. Estrutura de Arquivos (novos/modificados)

```
src/
├── app/(auth)/
│   ├── dashboard/
│   │   └── page.tsx          ← SUBSTITUÍDO (gráficos)
│   └── pedidos/
│       └── [id]/
│           └── page.tsx      ← MODIFICADO (seção fotos)
├── components/
│   ├── dashboard/
│   │   ├── RevenueChart.tsx  ← NOVO
│   │   ├── ConversionRate.tsx ← NOVO
│   │   └── WeeklyServices.tsx ← NOVO
│   └── pedido/
│       ├── PhotoUpload.tsx   ← NOVO
│       └── PhotoGallery.tsx  ← NOVO
├── lib/
│   └── supabase/
│       └── storage.ts        ← NOVO (upload/delete/list helpers)
supabase/
├── migration.sql              ← MODIFICADO (bucket policy SQL)
└── storage-policy.sql         ← NOVO
```

---

## 5. Modelo de Dados

### 5.1 Tabela `attachment` (já existe)

```sql
CREATE TABLE IF NOT EXISTS attachment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES document(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('foto_medicao', 'foto_instalacao', 'documento')),
  storage_path TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2 Storage Bucket

```sql
-- Criar bucket (via Dashboard ou SQL)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true);

-- Política: usuários autenticados podem upload/leitura
CREATE POLICY "authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_select" ON storage.objects
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 6. Riscos

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Storage gratuito insuficiente (1GB no free tier) | Baixa | Médio | Comprimir imagens antes do upload (max 1920px) |
| Performance com muitas fotos (N+1 queries) | Média | Baixo | Carregar fotos em lote por document_id |
| recharts aumentando bundle size | Baixa | Baixo | Tree-shaking do recharts é bom. Bundle aumenta ~50KB gzip |
| Taxa de conversão difícil de calcular (vínculo orçamento→visita→pedido) | Média | Médio | Simplificar: considerar orçamento "com visita" se existir appointment type='visita_medicao' vinculado ao client_id do orçamento |

---

## 7. Perguntas em Aberto

1. **Qualidade das fotos:** Comprimir automaticamente para web (max 1920px) ou manter original?
2. **Tipos de foto:** `foto_medicao` e `foto_instalacao` — precisa de mais tipos?
3. **Gráfico de conversão:** A taxa é #pedidos / #orcamentos_com_visita ou #pedidos / total_orcamentos?

---

## 8. Estimativa

| Sprint | Esforço |
|--------|---------|
| 6.1 — Fotos por Pedido | 2 dias |
| 6.2 — Dashboard Gráficos | 2 dias |
| **Total Fase 6** | **4 dias** |

---

*Plano gerado em modo planning. Nenhum código foi alterado.*
