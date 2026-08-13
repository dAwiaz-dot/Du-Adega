import { db, type Produto } from "@/lib/db";

// Catálogo público do site de pedidos.
export function listarProdutosSite(): Produto[] {
  return db
    .prepare(
      "SELECT * FROM produtos WHERE ativo = 1 AND mostrar_site = 1 ORDER BY ordem ASC, criado_em ASC"
    )
    .all() as Produto[];
}

// Tudo que pode ser vendido (site + balcão), inclusive produtos que só
// existem pro PDV/estoque e não aparecem no site.
export function listarProdutosVenda(): Produto[] {
  return db
    .prepare("SELECT * FROM produtos WHERE ativo = 1 ORDER BY ordem ASC, criado_em ASC")
    .all() as Produto[];
}

export function listarTodosProdutos(): Produto[] {
  return db
    .prepare("SELECT * FROM produtos ORDER BY ordem ASC, criado_em ASC")
    .all() as Produto[];
}

export function categoriasDe(produtos: Produto[]): string[] {
  return Array.from(new Set(produtos.map((p) => p.categoria)));
}

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function gerarIdProduto(nome: string): string {
  const base = slugify(nome) || "produto";
  let id = base;
  let sufixo = 1;
  const existe = db.prepare("SELECT 1 FROM produtos WHERE id = ?");
  while (existe.get(id)) {
    sufixo += 1;
    id = `${base}-${sufixo}`;
  }
  return id;
}
