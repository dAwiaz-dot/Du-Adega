# Adega Alfenas

> Projeto criado em 2026-07-31. Pasta dedicada — instruções aqui sobrescrevem as da raiz quando relevantes.

## Sobre

Site para uma adega em Alfenas-MG (nome e identidade visual ainda não
definidos pelo cliente) com três frentes: página institucional (landing),
página de pedidos online pro cliente final, e painel admin pra visualizar
os pedidos recebidos.

## Tipo

Cliente novo

## Entregas previstas

- Site (Next.js) com landing page, página de pedidos e painel admin

## Onde salvar o que

- Briefings e contexto: `briefing.md` nessa pasta
- Código do site: `site/`

## Contexto que herda da raiz

Esse projeto herda automaticamente o tom de voz e contexto do negócio
definidos em `_memoria/` da raiz. Não usa a identidade visual da Ryze
(`identidade/design-guide.md`) — essa é a marca da agência, não da adega.

## Específico desse projeto

- **Nome e identidade visual: Du Bebidas.** Marca real do cliente (Instagram
  @du_bebidas.26), aplicada a partir de prints da placa da loja e da logo do
  perfil. Paleta em `site/src/app/globals.css`: preto `#0d0d0d` + vermelho
  `#c8102e` / `#ff3b4e`. A pasta do projeto continua se chamando
  `Adega-Alfenas` (nome interno), mas o site e os textos usam "Du Bebidas".
  Logo em alta resolução ainda não recebida — só temos os prints de baixa
  qualidade enviados pelo cliente.
- **Catálogo de produtos é fictício.** `site/src/data/produtos.ts` tem
  produtos de exemplo (vinhos, espumantes, cervejas, destilados) só pra
  validar o fluxo. Substituir pelos produtos reais da adega antes de ir
  pro ar.
- **Stack:** Next.js 16 (App Router) + Tailwind v4 + `better-sqlite3` como
  banco local (`site/pedidos.sqlite3`, ignorado no git). Funciona bem em
  ambiente com filesystem persistente; se o deploy final for em Vercel
  (serverless, filesystem efêmero), vai ser necessário trocar por um banco
  externo (Supabase/Turso/Postgres) antes de publicar — o código já isola
  o acesso ao banco em `site/src/lib/db.ts`, então a troca é localizada.
- **Login do admin:** senha única via `ADMIN_PASSWORD` em `.env.local`
  (não commitado). Cookie httpOnly `adega_admin`. Sem multiusuário —
  suficiente pro MVP, mas não é autenticação robusta.
- **Rotas:**
  - `/` — landing page
  - `/pedido` — pedido do cliente (carrinho simples, sem login)
  - `/admin` — painel de pedidos (protegido por senha)
