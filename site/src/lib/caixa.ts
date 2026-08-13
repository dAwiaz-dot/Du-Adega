import { db } from "./db";
import type { Caixa } from "./db";

export function caixaAberto(): Caixa | null {
  return (
    (db.prepare("SELECT * FROM caixa WHERE status = 'aberto' ORDER BY id DESC LIMIT 1").get() as
      | Caixa
      | undefined) ?? null
  );
}

export function abrirCaixa(valorInicial: number): Caixa {
  if (caixaAberto()) {
    throw new Error("Já existe um caixa aberto.");
  }
  const result = db
    .prepare("INSERT INTO caixa (valor_inicial) VALUES (?)")
    .run(valorInicial);
  return db.prepare("SELECT * FROM caixa WHERE id = ?").get(result.lastInsertRowid) as Caixa;
}

export type ResumoCaixa = {
  caixa: Caixa;
  porFormaPagamento: { forma_pagamento: string; qtd: number; total: number }[];
  totalVendas: number;
  totalDinheiro: number;
  valorEsperadoDinheiro: number;
};

export function resumoCaixa(caixaId: number): ResumoCaixa {
  const caixa = db.prepare("SELECT * FROM caixa WHERE id = ?").get(caixaId) as Caixa;
  const porFormaPagamento = db
    .prepare(
      `SELECT forma_pagamento, COUNT(*) as qtd, SUM(total) as total
       FROM pedidos
       WHERE caixa_id = ? AND origem = 'pdv' AND status != 'cancelado'
       GROUP BY forma_pagamento`
    )
    .all(caixaId) as { forma_pagamento: string; qtd: number; total: number }[];

  const totalVendas = porFormaPagamento.reduce((s, l) => s + l.total, 0);
  const totalDinheiro =
    porFormaPagamento.find((l) => l.forma_pagamento === "Dinheiro")?.total ?? 0;

  return {
    caixa,
    porFormaPagamento,
    totalVendas,
    totalDinheiro,
    valorEsperadoDinheiro: caixa.valor_inicial + totalDinheiro,
  };
}

export function fecharCaixa(
  caixaId: number,
  valorContado: number | null,
  observacoes: string | null
): Caixa {
  const atual = db.prepare("SELECT * FROM caixa WHERE id = ?").get(caixaId) as Caixa | undefined;
  if (!atual || atual.status !== "aberto") {
    throw new Error("Esse caixa não está aberto.");
  }
  db.prepare(
    `UPDATE caixa
     SET status = 'fechado', fechado_em = datetime('now','localtime'), valor_contado = ?, observacoes = ?
     WHERE id = ?`
  ).run(valorContado, observacoes, caixaId);
  return db.prepare("SELECT * FROM caixa WHERE id = ?").get(caixaId) as Caixa;
}

export function historicoCaixas(limite = 10): Caixa[] {
  return db
    .prepare("SELECT * FROM caixa WHERE status = 'fechado' ORDER BY id DESC LIMIT ?")
    .all(limite) as Caixa[];
}
