import { db } from "@/lib/db";
import type { MovimentoSaldo } from "@/lib/db";

export type Cliente = {
  cliente_telefone: string;
  cliente_nome: string;
  endereco: string;
  qtd_pedidos: number;
  total_gasto: number;
  ultimo_pedido_em: string;
  saldo_devedor: number;
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
        a.ultimo_pedido_em,
        COALESCE(c.saldo_devedor, 0) AS saldo_devedor
      FROM ultimos u
      JOIN agregados a ON a.cliente_telefone = u.cliente_telefone
      LEFT JOIN clientes c ON c.telefone = u.cliente_telefone
      WHERE u.rn = 1

      UNION ALL

      SELECT
        c.telefone,
        c.nome,
        '' AS endereco,
        0 AS qtd_pedidos,
        0 AS total_gasto,
        '' AS ultimo_pedido_em,
        c.saldo_devedor
      FROM clientes c
      WHERE c.telefone NOT IN (SELECT DISTINCT cliente_telefone FROM pedidos)

      ORDER BY ultimo_pedido_em DESC
      `
    )
    .all() as Cliente[];
}

function normalizarTelefone(telefone: string) {
  return telefone.trim();
}

function upsertCliente(telefone: string, nome: string) {
  db.prepare(
    `INSERT INTO clientes (telefone, nome) VALUES (@telefone, @nome)
     ON CONFLICT(telefone) DO UPDATE SET nome = excluded.nome`
  ).run({ telefone, nome });
}

// valor positivo aumenta a dívida (fiado/ajuste), negativo reduz (pagamento).
export function ajustarSaldoDevedor(
  telefoneBruto: string,
  nome: string,
  valor: number,
  tipo: MovimentoSaldo["tipo"],
  pedidoId: number | null = null,
  observacao: string | null = null
) {
  const telefone = normalizarTelefone(telefoneBruto);
  const transacao = db.transaction(() => {
    upsertCliente(telefone, nome);
    db.prepare("UPDATE clientes SET saldo_devedor = saldo_devedor + ? WHERE telefone = ?").run(
      valor,
      telefone
    );
    db.prepare(
      `INSERT INTO movimentos_saldo (telefone, tipo, valor, pedido_id, observacao)
       VALUES (@telefone, @tipo, @valor, @pedidoId, @observacao)`
    ).run({ telefone, tipo, valor, pedidoId, observacao });
  });
  transacao();
}

export function listarMovimentosSaldo(telefone: string): MovimentoSaldo[] {
  return db
    .prepare("SELECT * FROM movimentos_saldo WHERE telefone = ? ORDER BY id DESC")
    .all(normalizarTelefone(telefone)) as MovimentoSaldo[];
}
