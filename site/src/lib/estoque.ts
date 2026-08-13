import { db } from "./db";
import type { PedidoItem } from "./db";

export const ESTOQUE_BAIXO = 5;

export type ErroEstoque = { id: string; nome: string; disponivel: number };

const consultarEstoque = db.prepare("SELECT estoque FROM produtos WHERE id = ?");

// Verificação best-effort: numa venda simultânea nos dois canais (site + PDV)
// há uma janela de corrida entre checar e baixar, mas o volume de uma adega
// não justifica lock pessimista — se acontecer, o admin vê o estoque negativo
// e ajusta na mão.
export function verificarEstoque(itens: PedidoItem[]): ErroEstoque[] {
  const erros: ErroEstoque[] = [];
  for (const item of itens) {
    const produto = consultarEstoque.get(item.id) as { estoque: number | null } | undefined;
    if (produto && produto.estoque !== null && produto.estoque < item.quantidade) {
      erros.push({ id: item.id, nome: item.nome, disponivel: produto.estoque });
    }
  }
  return erros;
}

const baixarUm = db.prepare(
  "UPDATE produtos SET estoque = estoque - @quantidade WHERE id = @id AND estoque IS NOT NULL"
);

export function baixarEstoque(itens: PedidoItem[]) {
  const transacao = db.transaction((lista: PedidoItem[]) => {
    for (const item of lista) {
      baixarUm.run({ id: item.id, quantidade: item.quantidade });
    }
  });
  transacao(itens);
}

export function mensagemEstoqueInsuficiente(erros: ErroEstoque[]): string {
  return `Estoque insuficiente: ${erros
    .map((e) => `${e.nome} (${e.disponivel} disponível)`)
    .join(", ")}`;
}
