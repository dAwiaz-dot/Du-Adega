import { db } from "@/lib/db";

export type Cliente = {
  cliente_telefone: string;
  cliente_nome: string;
  endereco: string;
  qtd_pedidos: number;
  total_gasto: number;
  ultimo_pedido_em: string;
};

export function listarClientes(): Cliente[] {
  return db
    .prepare(
      `
      WITH ultimos AS (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY cliente_telefone ORDER BY criado_em DESC) AS rn
        FROM pedidos
      ),
      agregados AS (
        SELECT
          cliente_telefone,
          COUNT(*) AS qtd_pedidos,
          SUM(CASE WHEN status != 'cancelado' THEN total ELSE 0 END) AS total_gasto,
          MAX(criado_em) AS ultimo_pedido_em
        FROM pedidos
        GROUP BY cliente_telefone
      )
      SELECT
        u.cliente_telefone,
        u.cliente_nome,
        u.endereco,
        a.qtd_pedidos,
        a.total_gasto,
        a.ultimo_pedido_em
      FROM ultimos u
      JOIN agregados a ON a.cliente_telefone = u.cliente_telefone
      WHERE u.rn = 1
      ORDER BY a.ultimo_pedido_em DESC
      `
    )
    .all() as Cliente[];
}
