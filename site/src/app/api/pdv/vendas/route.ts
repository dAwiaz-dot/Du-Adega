import { NextRequest, NextResponse } from "next/server";
import { db, type PedidoItem } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { verificarEstoque, baixarEstoque, mensagemEstoqueInsuficiente } from "@/lib/estoque";

const FORMAS_VALIDAS = ["Dinheiro", "Cartão", "Pix"];

type NovaVendaBody = {
  itens: PedidoItem[];
  formaPagamento: string;
};

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as NovaVendaBody;

  if (!Array.isArray(body.itens) || body.itens.length === 0) {
    return NextResponse.json({ error: "Adicione ao menos um item." }, { status: 400 });
  }
  if (!FORMAS_VALIDAS.includes(body.formaPagamento)) {
    return NextResponse.json({ error: "Escolha uma forma de pagamento válida." }, { status: 400 });
  }

  const erros = verificarEstoque(body.itens);
  if (erros.length > 0) {
    return NextResponse.json({ error: mensagemEstoqueInsuficiente(erros) }, { status: 409 });
  }

  const total = body.itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);

  const stmt = db.prepare(`
    INSERT INTO pedidos
      (cliente_nome, cliente_telefone, endereco, observacoes, itens, total, status, origem, forma_pagamento)
    VALUES
      ('Venda balcão', '-', '-', '', @itens, @total, 'entregue', 'pdv', @formaPagamento)
  `);

  const criarVenda = db.transaction(() => {
    const result = stmt.run({
      itens: JSON.stringify(body.itens),
      total,
      formaPagamento: body.formaPagamento,
    });
    baixarEstoque(body.itens);
    return result;
  });

  const result = criarVenda();

  return NextResponse.json({ id: result.lastInsertRowid, total }, { status: 201 });
}
