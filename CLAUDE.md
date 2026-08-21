# Du Bebidas

> Projeto criado em 2026-07-31 como "Adega Alfenas" (nome interno), pasta
> renomeada pra `Du-Bebidas` em 2026-08-21 pra bater com a marca real do
> cliente. Pasta dedicada — instruções aqui sobrescrevem as da raiz quando
> relevantes.

## Sobre

Site da Du Bebidas, adega em Alfenas-MG, com três frentes: página
institucional (landing), página de pedidos online pro cliente final, e
painel admin completo (pedidos, produtos, categorias, estoque, PDV, caixa,
clientes fiado). Em produção desde ~2026-08, com catálogo real gerenciado
pelo cliente direto no painel admin.

**URL de produção:** https://du-adega-production.up.railway.app

## Tipo

Cliente ativo, site em produção

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
  `#c8102e` / `#ff3b4e`.
- **Catálogo é real, não fictício.** Gerenciado pelo cliente direto em
  `/admin/produtos` — só nesse dia (2026-08) já passava de 200 produtos em
  ~30 categorias (bebidas, salgadinhos, doces, cigarros, etc.), com fotos
  reais enviadas via upload (`/api/upload`, salvas em `uploads/` ao lado
  do banco, servidas por `/api/uploads/[filename]`). Categorias e produtos
  são 100% dados de banco (`categorias`/`produtos` no SQLite) — não há
  mais arquivo estático de seed em uso; o `SEED_PRODUTOS`/`SEED_CATEGORIAS`
  em `site/src/lib/db.ts` só roda no primeiro boot de um banco vazio (ex:
  ambiente local do zero).
- **Logo recriada, não é a original.** `site/public/logo-du-bebidas.svg`
  foi desenhada do zero a partir dos prints (placa da loja + foto de
  perfil do Instagram), não é o arquivo oficial do cliente. Trocar se ele
  mandar a logo em alta resolução. (Ainda não recebida até 2026-08-17.)
- **Layout estilo delivery (iFood/Zé Delivery):** o pedido acontece direto
  na home (`/`), em três telas dentro de `PedidoForm.tsx` — categorias
  (cards com foto + busca por nome) → produtos da categoria (chips pra
  trocar rápido, toca no produto abre balão com descrição/foto grande) →
  checkout (dados + confirmação). Carrinho fica num botão flutuante que
  abre modal, com opção de remover item.
- **Stack:** Next.js 16 (App Router) + Tailwind v4 + `better-sqlite3` como
  banco (`site/src/lib/db.ts`). Caminho do arquivo configurável via
  `DB_PATH` (padrão `./pedidos.sqlite3` se não definida).
- **Login do admin:** via `ADMIN_USERS` em `.env.local` (não commitado),
  formato `Nome:senha,Nome2:senha2` — suporta múltiplos usuários. Cookie
  httpOnly `adega_admin`. Sem hash de senha — suficiente pro MVP, mas não
  é autenticação robusta.
- **Rotas:**
  - `/` — landing page + pedido do cliente (`/pedido` só redireciona pra
    cá, mantido por compatibilidade com links antigos)
  - `/admin` — painel: pedidos, produtos, categorias, estoque, PDV, caixa,
    clientes fiado (tudo protegido por senha)

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
