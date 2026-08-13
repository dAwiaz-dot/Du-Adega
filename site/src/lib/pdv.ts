import { db } from "./db";

export type ResumoFormaPagamento = {
  forma_pagamento: string;
  qtd: number;
  total: number;
};

export type ResumoVendasHoje = {
  porFormaPagamento: ResumoFormaPagamento[];
  totalGeral: number;
  qtdVendas: number;
};

export function resumoVendasHoje(): ResumoVendasHoje {
  const linhas = db
    .prepare(
      `SELECT forma_pagamento, COUNT(*) as qtd, SUM(total) as total
       FROM pedidos
       WHERE origem = 'pdv'
         AND date(criado_em) = date('now', 'localtime')
         AND status != 'cancelado'
       GROUP BY forma_pagamento`
    )
    .all() as ResumoFormaPagamento[];

  return {
    porFormaPagamento: linhas,
    totalGeral: linhas.reduce((soma, l) => soma + l.total, 0),
    qtdVendas: linhas.reduce((soma, l) => soma + l.qtd, 0),
  };
}
