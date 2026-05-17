# Architecture Review — Toldos Fortaleza App

> Explicação em linguagem simples para quem não é programador.

---

## O que o sistema faz

O **Toldos Fortaleza App** é um sistema interno para gerenciar a operação da Toldos Fortaleza — empresa de toldos e coberturas em policarbonato de Santo André/SP.

Com ele, você consegue:

- **Criar pedidos de compra** — preenche dados do cliente, produtos, valor, pagamento, prazo de entrega, assina digitalmente e gera um PDF profissional
- **Criar orçamentos** — igual ao pedido, mas com status (rascunho → enviado → aprovado). Gera um link que você manda pro cliente aprovar pelo celular, sem precisar instalar nada
- **Agendar visitas e instalações** — calendário com visitas de medição, instalações, reparos. Avisa quando tem pedido com prazo vencido
- **Cadastrar clientes** — ficha completa com busca por CEP automática
- **Dashboard** — visão geral com quantos pedidos no mês, faturamento, orçamentos pendentes

---

## As partes principais (como se fosse uma casa)

Imagine o sistema como uma casa com 4 andares:

### 🏠 Térreo — Onde os dados moram (Supabase)
É um banco de dados na nuvem (servidor da Supabase, gratuito). Guarda:
- Seus clientes (`client`)
- Seus pedidos e orçamentos (`document`)
- Seus agendamentos (`appointment`)
- Seu perfil com logo e assinatura (`profile`)

**Arquivo que comprova:** `supabase/migration.sql`

### 🚪 1º Andar — A porta de entrada (Autenticação)
É o login. Você entra com email e senha. Sem login, ninguém acessa os dados. Tem um "guarda" (middleware) que bloqueia todas as páginas exceto a de login e o link público do orçamento.

**Arquivos que comprovam:** `src/app/login/page.tsx`, `src/middleware.ts`, `src/lib/auth.ts`

### 🛋️ 2º Andar — O que você vê (Interface)
É o site em si. Tem um menu lateral (Sidebar com Dashboard, Pedidos, Orçamentos, Agendamentos, Clientes) e as páginas de cada seção. Funciona no celular como app (PWA) — instala na tela inicial e abre em tela cheia.

**Arquivos que comprovam:** `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `public/manifest.json`

### ⚙️ 3º Andar — As máquinas (Lógica de negócio)
É onde a mágica acontece:
- **Formulário de pedido** — portado do app antigo que você já usava, com as mesmas máscaras de CPF, cálculo de parcelas, valor por extenso
- **Assinatura digital** — canvas onde você desenha com o dedo ou mouse
- **Gerador de PDF** — transforma o preview do documento em PDF limpo
- **Busca de CEP** — preenche endereço automaticamente
- **Cálculo de prazos** — identifica pedidos vencidos

**Arquivos que comprovam:** `src/components/pedido/PedidoForm.tsx`, `src/components/pedido/PedidoPreview.tsx`, `src/components/pedido/SignaturePad.tsx`, `src/lib/utils/pdf.ts`, `src/lib/utils/format.ts`, `src/lib/utils/cep.ts`

---

## Como os dados fluem (um exemplo)

Quando você cria um pedido:

1. Faz login → sistema carrega seu perfil (logo + assinatura padrão)
2. Digita o nome do cliente → busca automática preenche telefone, endereço, CPF
3. Adiciona produtos, valor, forma de pagamento, prazo
4. Opcional: assina digitalmente (pode salvar no perfil pra reutilizar)
5. Clica "Salvar Pedido"
6. O sistema salva o cliente no banco (se for novo) e vincula ao pedido
7. O formulário inteiro é salvo como um "documento"
8. Clica "PDF" → o preview do documento é transformado em PDF e baixado

**Fluxo comprovado em:** `src/app/(auth)/pedidos/novo/page.tsx` (função `handleSave`)

---

## Riscos identificados (o que precisa de atenção)

### 🔴 Alto — Precisa resolver
1. **Chave secreta do Supabase** — Uma chave especial (`service_role`) é usada na página pública de orçamento. Ela NUNCA aparece no navegador do cliente, só roda no servidor da Vercel. Mas se um dia alguém sem querer colocar ela num arquivo errado, o banco inteiro fica vulnerável.
2. **Sem backup** — Não foi configurado backup automático do banco. Se o Supabase tiver um problema, os dados podem ser perdidos.

### ⚠️ Médio — Deve planejar
3. **iPhone limitado** — No iPhone, o app não mostra prompt de instalação (tem que ir no menu Compartilhar) e não recebe notificações push. Funciona, mas não é tão fluido quanto no Android.
4. **Sem testes** — Não tem testes automatizados. Se alguém mexer no código, pode quebrar algo sem perceber.
5. **Sem fotos** — A tabela para guardar fotos existe, mas não tem a tela para tirar/upload de fotos da medição.

### ✅ Baixo — Sob controle
6. **Cores do Tailwind quebrando PDF** — Já foi corrigido (o preview do documento usa cores "hex" em vez de classes do Tailwind)
7. **Tabela única para pedidos e orçamentos** — Funciona bem por enquanto porque são 90% iguais. Se um dia divergirem muito, pode dar trabalho separar.
8. **Apenas 2 usuários** — A segurança é simples. Se contratar mais gente, precisa rever quem pode ver/editar o quê.

---

## O que precisa ser confirmado

1. **WhatsApp Business** — Você mencionou integração com WhatsApp para envio automático. Isso não foi implementado. Quer que eu implemente?
2. **Backup do Supabase** — Entrar no painel do Supabase e verificar se os backups automáticos estão ativos: https://supabase.com/dashboard/project/szkqvemhqbfaiyvgjwhl/database/backups
3. **Fotos da medição** — Quer a funcionalidade de tirar fotos durante a visita e anexar ao pedido?
4. **Mais usuários** — Pretende dar acesso para instaladores ou vendedores no futuro?
5. **Domínio próprio** — O app está em `toldos-fortaleza-app.vercel.app`. Quer um domínio tipo `app.toldosfortaleza.com`?

---

## Bibliotecas instaladas mas não usadas

Algumas coisas foram instaladas e não estão sendo aproveitadas:

| Biblioteca | Para que serve | Por que não usa |
|-----------|---------------|-----------------|
| `zustand` | Gerenciamento de estado | Usei um sistema mais simples com listeners |
| `sonner` | Notificações toast | Alertas estão usando `alert()` nativo |
| `recharts` | Gráficos | Dashboard não tem gráficos ainda |
| `react-big-calendar` | Calendário visual | Criei um calendário customizado mais simples |

---

## Como está organizado o código

```
src/
├── app/                        # Páginas (Next.js App Router)
│   ├── (auth)/                 # Páginas que exigem login
│   │   ├── dashboard/          # Página inicial
│   │   ├── pedidos/            # Lista, novo, editar pedido
│   │   ├── orcamentos/         # Lista, novo, editar orçamento
│   │   ├── agendamentos/       # Calendário + prazos
│   │   └── clientes/           # Lista, novo, detalhe do cliente
│   ├── login/                  # Página de login
│   └── orcamento/[token]/      # Página pública de aprovação
├── components/
│   ├── layout/                 # Sidebar, Header, PWA
│   ├── pedido/                 # PedidoForm, PedidoPreview, SignaturePad
│   └── cliente/                # ClienteForm, ClienteBusca
├── lib/
│   ├── supabase/               # Clientes do banco (browser e server)
│   ├── utils/                  # format.ts, cep.ts, pdf.ts, cliente-sync.ts
│   └── constants/empresa.ts    # Dados fixos da Toldos Fortaleza
└── types/                      # Tipos TypeScript (pedido, client)
```

---

*Review gerado automaticamente a partir da análise de 50+ arquivos do projeto. Data: 17/05/2026.*
