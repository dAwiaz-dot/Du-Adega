import { db } from "./db";
import type { PedidoItem, EstoqueMovimento } from "./db";

export { ESTOQUE_BAIXO } from "./constantes";

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

const registrarMovimento = db.prepare(`
  INSERT INTO estoque_movimentos (produto_id, tipo, quantidade, estoque_resultante, pedido_id, observacao)
  VALUES (@produtoId, @tipo, @quantidade, @estoqueResultante, @pedidoId, @observacao)
`);

export function baixarEstoque(
  itens: PedidoItem[],
  contexto: { tipo: "venda_online" | "venda_pdv"; pedidoId: number }
) {
  const transacao = db.transaction((lista: PedidoItem[]) => {
    for (const item of lista) {
      const antes = consultarEstoque.get(item.id) as { estoque: number | null } | undefined;
      if (!antes || antes.estoque === null) continue; // produto sem controle de estoque

      baixarUm.run({ id: item.id, quantidade: item.quantidade });
      registrarMovimento.run({
        produtoId: item.id,
        tipo: contexto.tipo,
        quantidade: -item.quantidade,
        estoqueResultante: antes.estoque - item.quantidade,
        pedidoId: contexto.pedidoId,
        observacao: null,
      });
    }
  });
  transacao(itens);
}

export function registrarAjusteEstoque(produtoId: string, antes: number, depois: number) {
  if (antes === depois) return;
  registrarMovimento.run({
    produtoId,
    tipo: "ajuste",
    quantidade: depois - antes,
    estoqueResultante: depois,
    pedidoId: null,
    observacao: "Ajuste manual pelo admin",
  });
}

export function mensagemEstoqueInsuficiente(erros: ErroEstoque[]): string {
  return `Estoque insuficiente: ${erros
    .map((e) => `${e.nome} (${e.disponivel} disponível)`)
    .join(", ")}`;
}

export function listarMovimentosEstoque(limite = 100): (EstoqueMovimento & { produto_nome: string })[] {
  return db
    .prepare(
      `SELECT m.*, COALESCE(p.nome, m.produto_id) as produto_nome
       FROM estoque_movimentos m
       LEFT JOIN produtos p ON p.id = m.produto_id
       ORDER BY m.id DESC
       LIMIT ?`
    )
    .all(limite) as (EstoqueMovimento & { produto_nome: string })[];
}
