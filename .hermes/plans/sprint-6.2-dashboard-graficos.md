# Sprint 6.2 — Dashboard com Gráficos

**Projeto:** Toldos Fortaleza App  
**Duração estimada:** 2 dias  
**Dependências:** Sprint 3 (pedidos), Sprint 5 (agendamentos)  
**Objetivo:** Substituir o dashboard estático por um dashboard com gráficos reais de faturamento, conversão e produtividade.

---

## ⚠️ Pré-requisito

Reinstalar `recharts` (removido anteriormente como "não usado", agora será usado):

```bash
npm install recharts
```

---

## Tarefas

### 6.2.1 Componente RevenueChart (Faturamento Mensal)

- [ ] Criar `src/components/dashboard/RevenueChart.tsx`:

**Funcionalidades:**
- Gráfico de barras (BarChart do Recharts)
- Eixo X: últimos 6 meses (labels "Jan", "Fev", ..., "Jun")
- Eixo Y: R$ faturados
- Barras azuis (sky-600)
- Tooltip ao passar o mouse: "Maio: R$ 15.600"
- Dados vêm de: `document WHERE type='pedido' AND status IN ('pago','instalado') GROUP BY month(created_at)`
- Estado vazio: "Sem dados de faturamento"

**Query Supabase:**
```ts
const { data } = await supabase
  .from('document')
  .select('total_value, created_at')
  .eq('type', 'pedido')
  .in('status', ['pago', 'instalado'])
  .gte('created_at', sixMonthsAgo.toISOString())
```

**Processamento client-side:**
```ts
const monthlyData = months.map(m => ({
  month: m.label,
  value: pedidos
    .filter(p => new Date(p.created_at).getMonth() === m.index)
    .reduce((sum, p) => sum + (p.total_value || 0), 0)
}))
```

**Validação:**
- Gráfico renderiza com dados reais
- Barras têm altura proporcional aos valores
- Tooltip mostra mês + valor formatado

---

### 6.2.2 Componente ConversionRate (Taxa de Conversão)

- [ ] Criar `src/components/dashboard/ConversionRate.tsx`:

**Funcionalidades:**
- Card com indicador circular ou barra horizontal
- Mostra: "X% de conversão" (orçamentos com visita → pedidos)
- Cálculo:
  1. Total de orçamentos que tiveram visita de medição (count de `appointment type='visita_medicao'` vinculados a documentos `type='orcamento'`)
  2. Desses, quantos se tornaram pedidos (status 'aprovado' e existe documento `type='pedido'` com mesmo `client_id` no período)
  3. Taxa = #pedidos / #orcamentos_com_visita * 100

**Query aproximada (simplificada):**
```ts
// Orçamentos com visita vinculada
const { data: orcamentosComVisita } = await supabase
  .from('appointment')
  .select('document_id, document:document_id(type, status, client_id)')
  .eq('type', 'visita_medicao')

// Verificar quantos desses clientes têm pedido posterior
// (lógica client-side)
```

**Simplificação aceitável:** contar orçamentos onde existe um appointment `visita_medicao` vinculado ao mesmo `client_id` e um documento `pedido` também vinculado.

**Validação:**
- Card mostra taxa calculada
- Se houver 10 orçamentos com visita e 6 viraram pedido → "60%"

---

### 6.2.3 Componente WeeklyServices (Serviços por Semana)

- [ ] Criar `src/components/dashboard/WeeklyServices.tsx`:

**Funcionalidades:**
- Gráfico de barras ou lista visual
- Eixo X: últimas 8 semanas ("Sem 18", "Sem 19", ...)
- Eixo Y: quantidade de instalações concluídas
- Dados de: `appointment WHERE type='instalacao' AND status='concluido' GROUP BY week(scheduled_at)`
- Barras verdes

**Query Supabase:**
```ts
const { data } = await supabase
  .from('appointment')
  .select('scheduled_at')
  .eq('type', 'instalacao')
  .eq('status', 'concluido')
  .gte('scheduled_at', eightWeeksAgo.toISOString())
```

**Validação:**
- Gráfico mostra ~5-10 serviços por semana (conforme mencionado pelo usuário)
- Semanas sem serviço mostram barra zerada

---

### 6.2.4 Substituir Dashboard Page

- [ ] Reescrever `src/app/(auth)/dashboard/page.tsx`:

**Layout do novo dashboard:**
```
┌──────────────────────────────────────────────┐
│  Dashboard — 17 de maio de 2026              │
├──────────┬──────────┬──────────┬──────────────┤
│ Pedidos  │ Orçamentos│ Agenda  │ Faturamento  │
│   12     │    5      │   8     │  R$ 45.600   │
├──────────┴──────────┴──────────┴──────────────┤
│  📊 Faturamento Mensal (últimos 6 meses)      │
│  [           BarChart           ]             │
├──────────────────────────────────────────────┤
│  📈 Conversão        │  🔧 Serviços/semana   │
│  60% (6/10)          │  [      BarChart     ] │
│  orçamentos→pedidos  │                       │
├──────────────────────────────────────────────┤
│  ⚡ Ações rápidas                             │
│  [+ Pedido] [+ Orçamento] [+ Cliente] [Agenda]│
├──────────────────────────────────────────────┤
│  📋 Documentos Recentes                       │
│  Pedido — João Silva — 15/05 — R$ 2.500      │
│  Orçamento — Maria — 14/05 — R$ 1.800        │
└──────────────────────────────────────────────┘
```

**KPIs (mantidos do dashboard atual):**
- Pedidos do mês, Orçamentos pendentes, Agenda da semana, Clientes
- Card de faturamento com valor formatado
- Card de prazos críticos (se houver vencidos)

**Gráficos (novos):**
- RevenueChart: barras de faturamento
- ConversionRate: indicador de taxa
- WeeklyServices: barras de serviços

**Ações rápidas (mantidas):**
- Botões coloridos para Novo Pedido, Orçamento, Cliente, Agenda

**Documentos recentes (mantidos):**
- Lista dos últimos 8 documentos com links

**Validação:**
- Dashboard carrega sem erros
- Gráficos renderizam com dados reais
- KPIs mostram valores corretos
- Responsivo em mobile

---

### 6.2.5 Responsividade dos Gráficos

- [ ] Garantir que os gráficos do Recharts sejam responsivos:
  - Usar `ResponsiveContainer` do Recharts com `width="100%"` e `height={300}`
  - Em mobile (< 640px), `height={200}`
  - Layout de gráficos lado a lado empilha em mobile

---

## Aceitação do Sprint

- [ ] `recharts` reinstalado
- [ ] RevenueChart mostra faturamento dos últimos 6 meses
- [ ] ConversionRate mostra % de orçamentos com visita que viraram pedido
- [ ] WeeklyServices mostra instalações concluídas por semana
- [ ] Dashboard substituído com layout de 3 gráficos + KPIs
- [ ] Gráficos responsivos (desktop e mobile)
- [ ] Dados reais do Supabase (não mockados)
- [ ] Estados vazios tratados ("Sem dados")

---

## Notas Técnicas

### Recharts vs outras bibliotecas

Recharts foi escolhido porque:
- Já estava no projeto (vamos reinstalar)
- SVG-based (escalável, nítido em qualquer resolução)
- API declarativa React (fácil de manter)
- Bundle ~50KB gzip (aceitável)

### Performance

As queries de agregação são feitas client-side porque:
- Supabase free tier não tem functions para agregação server-side
- O volume de dados é pequeno (< 1000 documentos)
- Se crescer, migrar para Supabase Edge Functions ou Materialized Views

### Cálculo da taxa de conversão

A taxa usa uma heurística (orcamento com visita → pedido no mesmo cliente) porque não há chave estrangeira direta entre orçamento e pedido convertido. É uma aproximação razoável para o MVP. Se precisar de precisão, adicionar campo `converted_from_id` na tabela `document`.

### Cores

Manter paleta consistente:
- Sky (azul): pedidos, faturamento
- Amber (laranja): orçamentos
- Green (verde): instalações, concluído
- Red (vermelho): prazos vencidos
