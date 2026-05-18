# Plano — Fase 7: Kanban de Produção + Checklist + Cálculo de Orçamento

**Projeto:** Toldos Fortaleza App  
**Status:** 📋 Planejado (não iniciado)  
**Depende de:** Fase 6 concluída  
**Duração estimada:** 4 dias  

---

## 1. Objetivo

Adicionar três features operacionais:

- **Kanban de produção** — quadro visual com colunas arrastáveis para acompanhar cada pedido
- **Checklist do instalador** — formulário de verificação pré-instalação + conclusão com fotos
- **Cálculo de orçamento** — calculadora integrada: largura × comprimento × preço/m²

---

## 2. Funcionalidades

### 2.1 Kanban de Produção

| Coluna | Significado |
|--------|------------|
| 📦 Material | Pedido aprovado, aguardando compra de material |
| 🔧 Fabricando | Em produção na fábrica |
| ✅ Pronto | Fabricação concluída, aguardando instalação |
| 🚛 Instalando | Equipe em campo |
| ✔️ Concluído | Instalação finalizada |

**Funcionalidades:**
- Cards de pedido arrastáveis entre colunas (drag and drop)
- Cada card mostra: nome do cliente, data do pedido, valor
- Clique no card → abre o pedido
- Cores por status
- Contador de cards por coluna

### 2.2 Checklist do Instalador

**Fluxo:**
1. Antes de sair: checklist de verificação (material separado? ferramentas? medidas conferidas?)
2. No local: formulário de conclusão (fotos do serviço pronto, observações, assinatura do cliente)
3. Registro salvo no pedido

**Funcionalidades:**
- Template de checklist configurável
- Formulário mobile-first (usado no celular em campo)
- Upload de fotos "depois" vinculadas ao checklist
- Histórico de checklists por pedido

### 2.3 Cálculo de Orçamento

**Funcionalidades:**
- Campo "Largura (m)" e "Comprimento (m)" → cálculo automático de m²
- Preço por m² configurável por tipo de material (policarbonato, lona, etc.)
- Multiplicadores: tipo de estrutura, dificuldade, ANDAR (taxa adicional)
- Resultado automático no campo "Valor Total" do formulário de pedido
- Histórico de preços/m² para referência

---

## 3. Riscos

| Risco | Mitigação |
|-------|-----------|
| Drag and drop complexo em mobile | Usar biblioteca leve (dnd-kit ou react-beautiful-dnd) |
| Checklist muito rígido | Permitir adicionar/remover itens por serviço |
| Preços desatualizados | Tabela de preços editável com data de vigência |

---

## 4. Perguntas em Aberto

1. O Kanban substitui o status atual do pedido ou é uma visão complementar?
2. O checklist é igual para todos os serviços ou varia por tipo?
3. Os preços/m² mudam com frequência? Precisa de histórico?

---

*Plano salvo para referência futura. Detalhamento será feito quando a Fase 7 for iniciada.*
