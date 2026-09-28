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

// antes = null quando o produto passa a ter controle de estoque agora.
export function registrarAjusteEstoque(produtoId: string, antes: number | null, depois: number) {
  if (antes === depois) return;
  registrarMovimento.run({
    produtoId,
    tipo: "ajuste",
    quantidade: depois - (antes ?? 0),
    estoqueResultante: depois,
    pedidoId: null,
    observacao: antes === null ? "Início do controle de estoque" : "Ajuste manual pelo admin",
  });
}

export type TipoMovimentoManual = "entrada" | "perda" | "contagem";

// Movimento relativo feito na tela de Estoque. Lê e grava dentro da mesma
// transação, então uma venda no meio não é sobrescrita (diferente de mandar
// o número absoluto que estava na tela).
export function movimentarEstoque(
  produtoId: string,
  tipo: TipoMovimentoManual,
  quantidade: number,
  observacao: string | null
): number {
  const transacao = db.transaction(() => {
    const atual = consultarEstoque.get(produtoId) as { estoque: number | null } | undefined;
    if (!atual) throw new Error("Produto não encontrado.");

    const antes = atual.estoque ?? 0;
    const depois =
      tipo === "entrada" ? antes + quantidade : tipo === "perda" ? antes - quantidade : quantidade;

    db.prepare("UPDATE produtos SET estoque = ? WHERE id = ?").run(depois, produtoId);

    if (depois !== antes || atual.estoque === null) {
      registrarMovimento.run({
        produtoId,
        tipo: tipo === "contagem" ? "ajuste" : tipo,
        quantidade: depois - antes,
        estoqueResultante: depois,
        pedidoId: null,
        observacao:
          observacao ??
          (atual.estoque === null ? "Início do controle de estoque" : null),
      });
    }
    return depois;
  });
  return transacao();
}

// Saldo líquido de cada produto num pedido, olhando só o histórico de
// estoque. Assim cancelar/descancelar é idempotente e pedidos antigos
// (cancelados antes da devolução automática existir) não geram baixa dupla.
const saldoPorProdutoDoPedido = db.prepare(`
  SELECT produto_id,
    SUM(quantidade) AS liquido,
    SUM(CASE WHEN tipo = 'devolucao' THEN quantidade ELSE 0 END) AS devolvido
  FROM estoque_movimentos
  WHERE pedido_id = ? AND tipo IN ('venda_online', 'venda_pdv', 'devolucao')
  GROUP BY produto_id
`);

const somarUm = db.prepare(
  "UPDATE produtos SET estoque = estoque + @quantidade WHERE id = @id AND estoque IS NOT NULL"
);

export function devolverEstoqueDoPedido(pedidoId: number) {
  const transacao = db.transaction(() => {
    const linhas = saldoPorProdutoDoPedido.all(pedidoId) as {
      produto_id: string;
      liquido: number;
      devolvido: number;
    }[];
    for (const linha of linhas) {
      if (linha.liquido >= 0) continue;
      const antes = consultarEstoque.get(linha.produto_id) as { estoque: number | null } | undefined;
      if (!antes || antes.estoque === null) continue;
      const quantidade = -linha.liquido;
      somarUm.run({ id: linha.produto_id, quantidade });
      registrarMovimento.run({
        produtoId: linha.produto_id,
        tipo: "devolucao",
        quantidade,
        estoqueResultante: antes.estoque + quantidade,
        pedidoId,
        observacao: "Pedido cancelado",
      });
    }
  });
  transacao();
}

export function rebaixarEstoqueDoPedido(pedidoId: number, tipo: "venda_online" | "venda_pdv") {
  const transacao = db.transaction(() => {
    const linhas = saldoPorProdutoDoPedido.all(pedidoId) as {
      produto_id: string;
      liquido: number;
      devolvido: number;
    }[];
    for (const linha of linhas) {
      if (linha.liquido !== 0 || linha.devolvido <= 0) continue;
      const antes = consultarEstoque.get(linha.produto_id) as { estoque: number | null } | undefined;
      if (!antes || antes.estoque === null) continue;
      baixarUm.run({ id: linha.produto_id, quantidade: linha.devolvido });
      registrarMovimento.run({
        produtoId: linha.produto_id,
        tipo,
        quantidade: -linha.devolvido,
        estoqueResultante: antes.estoque - linha.devolvido,
        pedidoId,
        observacao: "Pedido reaberto",
      });
    }
  });
  transacao();
}

export function mensagemEstoqueInsuficiente(erros: ErroEstoque[]): string {
  return `Estoque insuficiente: ${erros
    .map((e) => `${e.nome} (${e.disponivel} disponível)`)
    .join(", ")}`;
}

export function listarMovimentosEstoque(limite = 200): (EstoqueMovimento & { produto_nome: string })[] {
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
