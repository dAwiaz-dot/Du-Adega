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
  banco (`site/src/lib/db.ts`). Caminho do arquivo configurável via
  `DB_PATH` (padrão `./pedidos.sqlite3` se não definida).
- **Login do admin:** via `ADMIN_USERS` em `.env.local` (não commitado),
  formato `Nome:senha,Nome2:senha2` — suporta múltiplos usuários. Cookie
  httpOnly `adega_admin`. Sem hash de senha — suficiente pro MVP, mas não
  é autenticação robusta.
- **Rotas:**
  - `/` — landing page
  - `/pedido` — pedido do cliente (carrinho simples, sem login)
  - `/admin` — painel de pedidos (protegido por senha)

## Deploy (Railway)

Decidido: hospedagem no Railway. Diferente da Vercel (serverless), o
Railway roda um container persistente — então dá pra manter o SQLite
como está, sem trocar de banco, desde que use um **volume persistente**.

Passo a passo:

1. Criar projeto no Railway a partir do repo
   [dAwiaz-dot/Du-Adega](https://github.com/dAwiaz-dot/Du-Adega), apontando
   o root directory pra `site/` (o repo tem `CLAUDE.md`/`briefing.md` na
   raiz, o app Next.js fica em `site/`).
2. Adicionar um **volume** montado em `/data` no serviço.
3. Configurar variáveis de ambiente:
   - `ADMIN_USERS=Nome:senha` (login do painel admin)
   - `DB_PATH=/data/pedidos.sqlite3` (persiste entre deploys, graças ao volume)
4. Build/start são automáticos via `railway.json` (Nixpacks + `npm run
   start`, que já respeita a porta que o Railway injeta em `$PORT`).
5. Testado localmente simulando o ambiente (`PORT` e `DB_PATH` customizados)
   antes de subir — build e start funcionam sem alteração de código além
   da configuração de env vars.
