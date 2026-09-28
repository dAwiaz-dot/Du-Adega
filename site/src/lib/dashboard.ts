import { db } from "./db";
import { caixaAberto, resumoCaixa, type ResumoCaixa } from "./caixa";
import { ESTOQUE_BAIXO } from "./constantes";

// Tudo aqui é só leitura — o dashboard nunca altera dado.

export type ResumoPeriodo = {
  total: number;
  qtd: number;
  online: number;
  pdv: number;
};

const FILTRO_PERIODO = {
  hoje: "date(criado_em) = date('now', 'localtime')",
  semana: "date(criado_em) >= date('now', 'localtime', '-6 days')",
  mes: "strftime('%Y-%m', criado_em) = strftime('%Y-%m', 'now', 'localtime')",
} as const;

function resumoPeriodo(periodo: keyof typeof FILTRO_PERIODO): ResumoPeriodo {
  const linha = db
    .prepare(
      `SELECT
         COALESCE(SUM(total), 0) AS total,
         COUNT(*) AS qtd,
         COALESCE(SUM(CASE WHEN origem = 'online' THEN total ELSE 0 END), 0) AS online,
         COALESCE(SUM(CASE WHEN origem = 'pdv' THEN total ELSE 0 END), 0) AS pdv
       FROM pedidos
       WHERE status != 'cancelado' AND ${FILTRO_PERIODO[periodo]}`
    )
    .get() as ResumoPeriodo;
  return linha;
}

export type VendaDia = { dia: string; total: number; qtd: number };

function vendasUltimos30Dias(): VendaDia[] {
  return db
    .prepare(
      `WITH RECURSIVE dias(d) AS (
         SELECT date('now', 'localtime', '-29 days')
         UNION ALL
         SELECT date(d, '+1 day') FROM dias WHERE d < date('now', 'localtime')
       )
       SELECT d AS dia, COALESCE(SUM(p.total), 0) AS total, COUNT(p.id) AS qtd
       FROM dias
       LEFT JOIN pedidos p ON date(p.criado_em) = d AND p.status != 'cancelado'
       GROUP BY d
       ORDER BY d`
    )
    .all() as VendaDia[];
}

export type ProdutoVendido = { id: string; nome: string; qtd: number; total: number };

function produtosMaisVendidos(limite = 8): ProdutoVendido[] {
  return db
    .prepare(
      `SELECT
         json_extract(j.value, '$.id') AS id,
         json_extract(j.value, '$.nome') AS nome,
         SUM(json_extract(j.value, '$.quantidade')) AS qtd,
         SUM(json_extract(j.value, '$.quantidade') * json_extract(j.value, '$.preco')) AS total
       FROM pedidos p, json_each(p.itens) j
       WHERE p.status != 'cancelado'
         AND date(p.criado_em) >= date('now', 'localtime', '-29 days')
       GROUP BY json_extract(j.value, '$.id')
       ORDER BY qtd DESC
       LIMIT ?`
    )
    .all(limite) as ProdutoVendido[];
}

export type CategoriaVendida = { categoria: string; total: number };

function categoriasMaisVendidas(limite = 6): CategoriaVendida[] {
  return db
    .prepare(
      `SELECT
         COALESCE(pr.categoria, 'Outros') AS categoria,
         SUM(json_extract(j.value, '$.quantidade') * json_extract(j.value, '$.preco')) AS total
       FROM pedidos p, json_each(p.itens) j
       LEFT JOIN produtos pr ON pr.id = json_extract(j.value, '$.id')
       WHERE p.status != 'cancelado'
         AND date(p.criado_em) >= date('now', 'localtime', '-29 days')
       GROUP BY COALESCE(pr.categoria, 'Outros')
       ORDER BY total DESC
       LIMIT ?`
    )
    .all(limite) as CategoriaVendida[];
}

export type PagamentoMes = { forma: string; qtd: number; total: number };

function pagamentosDoMes(): PagamentoMes[] {
  return db
    .prepare(
      `SELECT
         COALESCE(forma_pagamento, CASE WHEN origem = 'online' THEN 'Pedido online' ELSE 'Não informado' END) AS forma,
         COUNT(*) AS qtd,
         SUM(total) AS total
       FROM pedidos
       WHERE status != 'cancelado' AND ${FILTRO_PERIODO.mes}
       GROUP BY forma
       ORDER BY total DESC`
    )
    .all() as PagamentoMes[];
}

export type ProdutoEstoque = { id: string; nome: string; estoque: number };

function estoqueCritico() {
  const lista = db
    .prepare(
      `SELECT id, nome, estoque FROM produtos
       WHERE ativo = 1 AND estoque IS NOT NULL AND estoque <= ?
       ORDER BY estoque ASC, nome ASC`
    )
    .all(ESTOQUE_BAIXO) as ProdutoEstoque[];
  return {
    zerados: lista.filter((p) => p.estoque <= 0).length,
    baixos: lista.filter((p) => p.estoque > 0).length,
    lista: lista.slice(0, 8),
  };
}

export type Devedor = { telefone: string; nome: string; saldo_devedor: number };

function fiado() {
  const { total, qtd } = db
    .prepare(
      "SELECT COALESCE(SUM(saldo_devedor), 0) AS total, COUNT(*) AS qtd FROM clientes WHERE saldo_devedor > 0.009"
    )
    .get() as { total: number; qtd: number };
  const maiores = db
    .prepare(
      "SELECT telefone, nome, saldo_devedor FROM clientes WHERE saldo_devedor > 0.009 ORDER BY saldo_devedor DESC LIMIT 5"
    )
    .all() as Devedor[];
  return { total, qtd, maiores };
}

function pedidosOnlineEmAberto(): number {
  const { qtd } = db
    .prepare(
      "SELECT COUNT(*) AS qtd FROM pedidos WHERE origem = 'online' AND status IN ('novo', 'preparando', 'a_caminho')"
    )
    .get() as { qtd: number };
  return qtd;
}

export type DadosDashboard = {
  hoje: ResumoPeriodo;
  semana: ResumoPeriodo;
  mes: ResumoPeriodo;
  vendas30: VendaDia[];
  topProdutos: ProdutoVendido[];
  topCategorias: CategoriaVendida[];
  pagamentos: PagamentoMes[];
  estoque: ReturnType<typeof estoqueCritico>;
  fiado: ReturnType<typeof fiado>;
  pedidosEmAberto: number;
  caixa: ResumoCaixa | null;
};

export function carregarDashboard(): DadosDashboard {
  const aberto = caixaAberto();
  return {
    hoje: resumoPeriodo("hoje"),
    semana: resumoPeriodo("semana"),
    mes: resumoPeriodo("mes"),
    vendas30: vendasUltimos30Dias(),
    topProdutos: produtosMaisVendidos(),
    topCategorias: categoriasMaisVendidas(),
    pagamentos: pagamentosDoMes(),
    estoque: estoqueCritico(),
    fiado: fiado(),
    pedidosEmAberto: pedidosOnlineEmAberto(),
    caixa: aberto ? resumoCaixa(aberto.id) : null,
  };
}
