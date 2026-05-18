# Toldos Fortaleza App — Roadmap de Implementação

**Início:** 14/05/2026  
**Stack:** Next.js 16 + TypeScript 5 + Tailwind v4 + Supabase + PWA  
**Local:** `/mnt/c/dev/toldos-fortaleza-app/`

---

## 🟢 FASE 1 — MVP (Concluída)

| Sprint | Arquivo | Duração | Status |
|--------|---------|---------|--------|
| 1 — Setup + Auth | `sprint-01-setup-auth.md` | 1-2 dias | ✅ |
| 2 — Clientes CRUD | `sprint-02-clientes-crud.md` | 1 dia | ✅ |
| 3 — PORT Pedido | `sprint-03-port-pedido.md` | 2-3 dias | ✅ |
| 4 — Orçamentos | `sprint-04-orcamentos.md` | 1-2 dias | ✅ |
| 5 — Agendamentos + Prazos | `sprint-05-agendamentos.md` | 1-2 dias | ✅ |
| 6 — Integração | `sprint-06-integracao-fluxos.md` | 1 dia | ✅ |
| 7 — PWA + Offline | `sprint-07-pwa-offline.md` | 1 dia | ✅ |
| 8 — Dashboard + Polimento | `sprint-08-dashboard-polimento.md` | 1 dia | ✅ |

---

## 🔵 FASE 6 — Fotos + Dashboard Gráficos

| Sprint | Arquivo | Duração | Status |
|--------|---------|---------|--------|
| 6.1 — Fotos por Pedido | `sprint-6.1-fotos-pedido.md` | 2 dias | 📋 Planejado |
| 6.2 — Dashboard Gráficos | `sprint-6.2-dashboard-graficos.md` | 2 dias | 📋 Planejado |

**Master Plan:** `2026-05-17_fase-6-fotos-dashboard.md`

---

## 🟢 FASE 7 — Operação (Kanban + Checklist + Cálculo)

| Feature | Descrição |
|---------|-----------|
| 📦 Kanban de Produção | Quadro arrastável: Material → Fabricando → Pronto → Instalando → Concluído |
| ✅ Checklist do Instalador | Verificação pré-saída + formulário de conclusão com fotos |
| 🧮 Cálculo de Orçamento | largura × comprimento × preço/m² automático |

**Master Plan:** `2026-05-17_fase-7-kanban-checklist-calculo.md`  
**Depende de:** Fase 6  
**Duração estimada:** 4 dias  
**Status:** 📋 Planejado

---

## 🟡 FASE 8 — IA (Preenchimento Automático + Voz)

| Feature | Descrição |
|---------|-----------|
| 🤖 IA de Preenchimento | Cola conversa do WhatsApp → IA extrai dados → preenche formulário |
| 🎤 Reconhecimento de Voz | Ditar campos do pedido pelo microfone |

**Master Plan:** `2026-05-17_fase-8-ia-voz.md`  
**Depende de:** Fase 6  
**Duração estimada:** 5 dias  
**Status:** 📋 Planejado

---

## 🟣 FASE 9 — Engenharia & Finanças (Custos + Esboços)

| Feature | Descrição |
|---------|-----------|
| 💰 Cálculo de Custos | Cadastro de materiais, mão de obra, margem de lucro por serviço |
| ✏️ Esboços de Calhas e Rufos | Desenho técnico simples (canvas) para enviar ao fornecedor |

**Master Plan:** `2026-05-17_fase-9-custos-esbocos.md`  
**Depende de:** Fase 6, Fase 7 (cálculo de orçamento)  
**Duração estimada:** 6 dias  
**Status:** 📋 Planejado

---

## Grafo de Dependências

```
FASE 1 (MVP)
    │
    └── FASE 6 (Fotos + Gráficos) ← PRONTO PRA COMEÇAR
            │
            ├── FASE 7 (Kanban + Checklist + Cálculo)
            │       │
            │       └── FASE 9 (Custos + Esboços)
            │
            └── FASE 8 (IA + Voz)
```

---

## Planos de Arquitetura

| Arquivo | Conteúdo |
|---------|----------|
| `architecture.map.json` | Mapa de componentes, conexões, dados, riscos |
| `architecture.html` | Visualização interativa (abrir no navegador) |
| `architecture.review.md` | Explicação em linguagem simples para leigos |

---

## Detalhamento por Fase

| Fase | Master Plan | Sprints |
|------|------------|---------|
| Fase 1 (MVP) | `/mnt/c/dev/.hermes/plans/` | 8 arquivos sprint-0X-*.md |
| Fase 6 | `2026-05-17_fase-6-fotos-dashboard.md` | `sprint-6.1-*.md`, `sprint-6.2-*.md` |
| Fase 7 | `2026-05-17_fase-7-kanban-checklist-calculo.md` | A criar |
| Fase 8 | `2026-05-17_fase-8-ia-voz.md` | A criar |
| Fase 9 | `2026-05-17_fase-9-custos-esbocos.md` | A criar |
