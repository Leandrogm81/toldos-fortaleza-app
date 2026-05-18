# Plano — Fase 9: Cálculo de Custos + Esboços de Calhas e Rufos

**Projeto:** Toldos Fortaleza App  
**Status:** 📋 Planejado (não iniciado)  
**Depende de:** Fase 6 concluída, Fase 7 (cálculo de orçamento)  
**Duração estimada:** 6 dias  

---

## 1. Objetivo

Adicionar duas features de engenharia e finanças:

- **Cálculo de custos** — cadastro de materiais com preço, cálculo de custo total vs valor cobrado = margem de lucro
- **Esboços de calhas e rufos** — ferramenta de desenho técnico simples para enviar ao fornecedor

---

## 2. Funcionalidades

### 2.1 Cálculo de Custos por Serviço

**Contexto do usuário:**
O Leandro compra materiais (alumínio, ferro, lona, policarbonato, acessórios) e paga funcionários. Ele quer saber, por serviço, quanto gastou vs quanto cobrou.

**Funcionalidades:**

#### Cadastro de Materiais
- Tabela `material` com: nome, tipo (alumínio, ferro, lona, policarbonato, acessório), unidade (metro, m², unidade), preço_unitario, data_vigencia
- CRUD de materiais com histórico de preços
- Busca rápida por nome/tipo

#### Cadastro de Mão de Obra
- Tabela `labor` com: nome do funcionário, custo_diario, função
- Tempo gasto por etapa (fabricação: X dias × Y funcionários, instalação: X dias × Y funcionários)

#### Composição do Custo
- Para cada pedido, o usuário informa:
  - Materiais usados (quantidade × preço unitário)
  - Dias de fabricação × funcionários envolvidos
  - Dias de instalação × funcionários envolvidos
  - Custos extras (transporte, ferramentas, pedágio)
- Cálculo automático: **Custo Total** e **Margem** = (Valor Pedido - Custo Total) / Valor Pedido × 100

#### Dashboard de Margem
- Margem média por mês
- Produtos mais lucrativos
- Funcionários mais produtivos

### 2.2 Esboços de Calhas e Rufos

**Contexto do usuário:**
O Leandro encomenda calhas e rufos sob medida de fornecedores. Hoje ele desenha à mão, tira foto e manda por WhatsApp.

**Funcionalidades:**
- Tela de desenho com grid milimetrado (canvas)
- Ferramentas: linha reta, retângulo, texto (dimensões)
- Cotas (medidas nos desenhos) — ex: "120cm", "45°"
- Cada desenho vinculado a um pedido
- Exportar como PDF ou PNG para enviar ao fornecedor
- Templates pré-definidos: "Calha tipo U", "Rufo tipo L", "Emenda"

**Implementação técnica:**
- Canvas HTML5 com `fabric.js` ou `konva.js` (bibliotecas leves de desenho)
- Comandos simplificados (não é um AutoCAD, é um rascunho técnico)
- Salvar desenho como JSON (para editar depois) + PNG (para compartilhar)
- Integração com a galeria de fotos do pedido

---

## 3. Modelo de Dados (novas tabelas)

```sql
-- Materiais
CREATE TABLE material (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('aluminio', 'ferro', 'lona', 'policarbonato', 'acessorio', 'outro')),
  unit TEXT NOT NULL DEFAULT 'm', -- metro, m2, unidade
  unit_price NUMERIC NOT NULL,
  valid_from DATE NOT NULL DEFAULT now(),
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Custos do pedido
CREATE TABLE order_cost (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES document(id) ON DELETE CASCADE,
  total_materials NUMERIC DEFAULT 0,
  total_labor NUMERIC DEFAULT 0,
  total_extras NUMERIC DEFAULT 0,
  total_cost NUMERIC GENERATED ALWAYS AS (total_materials + total_labor + total_extras) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Itens de custo (materiais usados no pedido)
CREATE TABLE order_cost_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_cost_id UUID REFERENCES order_cost(id) ON DELETE CASCADE,
  material_id UUID REFERENCES material(id),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- Esboços
CREATE TABLE sketch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES document(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'calha', -- calha, rufo, emenda, outro
  canvas_data JSONB NOT NULL, -- fabric.js JSON
  preview_url TEXT, -- PNG thumbnail
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Riscos

| Risco | Mitigação |
|-------|-----------|
| Cálculo de custos trabalhoso de preencher | Preencher automaticamente com base no tipo de produto e medidas. O usuário ajusta. |
| Preços de materiais voláteis (inflação, fornecedor) | Histórico de preços com data de vigência. Alertar se preço estiver desatualizado > 30 dias. |
| Desenho técnico complexo de implementar | Escopo limitado: linhas, retângulos, texto. Não é CAD. |
| Adoção (usuário pode achar trabalhoso) | Focar em preenchimento rápido: poucos campos, sugestões automáticas. |

---

## 5. Perguntas em Aberto

1. Os fornecedores aceitam desenho digital ou preferem foto de desenho à mão?
2. Quer gerar automaticamente a lista de materiais a partir das medidas do pedido?
3. Precisa de controle de estoque (entrada/saída de materiais) ou só custo por serviço?

---

*Plano salvo para referência futura. Detalhamento será feito quando a Fase 9 for iniciada.*
