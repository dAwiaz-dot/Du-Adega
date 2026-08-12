import { db, type Categoria } from "@/lib/db";

export function listarCategorias(): Categoria[] {
  return db.prepare("SELECT * FROM categorias ORDER BY ordem ASC").all() as Categoria[];
}

export function garantirCategoria(nome: string) {
  const existe = db.prepare("SELECT 1 FROM categorias WHERE nome = ?").get(nome);
  if (existe) return;

  const { count: maxOrdem } = db
    .prepare("SELECT COALESCE(MAX(ordem), -1) + 1 as count FROM categorias")
    .get() as { count: number };

  db.prepare("INSERT INTO categorias (nome, icone, ordem) VALUES (?, '🍹', ?)").run(
    nome,
    maxOrdem
  );
}

export function contarProdutosNaCategoria(nome: string): number {
  const { count } = db
    .prepare("SELECT COUNT(*) as count FROM produtos WHERE categoria = ?")
    .get(nome) as { count: number };
  return count;
}
