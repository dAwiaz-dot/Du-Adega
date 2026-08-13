"use client";

import type { Produto, EstoqueMovimento } from "@/lib/db";
import { ESTOQUE_BAIXO } from "@/lib/constantes";
import { AdminNav } from "../AdminNav";

const TIPO_LABEL: Record<EstoqueMovimento["tipo"], string> = {
  venda_online: "Venda online",
  venda_pdv: "Venda balcão",
  ajuste: "Ajuste manual",
};

export function HistoricoEstoque({
  movimentosIniciais,
  produtosControlados,
  adminNome,
}: {
  movimentosIniciais: (EstoqueMovimento & { produto_nome: string })[];
  produtosControlados: Produto[];
  adminNome: string;
}) {
  const produtosBaixo = produtosControlados.filter(
    (p) => p.estoque !== null && p.estoque <= ESTOQUE_BAIXO
  );

  return (
    <div className="min-h-screen bg-card">
      <AdminNav adminNome={adminNome} />

      <main className="mx-auto max-w-4xl px-6 py-10">
        {produtosBaixo.length > 0 && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-700">Estoque baixo ou zerado</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {produtosBaixo.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.nome}</span>
                  <span className="font-medium text-red-700">
                    {p.estoque === 0 ? "Sem estoque" : `${p.estoque} unidade(s)`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="font-display text-2xl tracking-wide text-preto">Movimentações</h2>
        <p className="text-sm text-foreground/60">
          Últimas {movimentosIniciais.length} entradas/saídas de produtos com controle de estoque.
        </p>

        <div className="mt-5 divide-y divide-borda rounded-lg border border-borda bg-background">
          {movimentosIniciais.length === 0 && (
            <p className="p-8 text-center text-foreground/60">
              Nenhuma movimentação ainda. Elas aparecem aqui assim que um produto com estoque
              controlado for vendido ou ajustado.
            </p>
          )}
          {movimentosIniciais.map((mov) => (
            <div key={mov.id} className="flex items-center justify-between gap-4 p-4 text-sm">
              <div>
                <p className="font-medium">{mov.produto_nome}</p>
                <p className="text-xs text-foreground/50">
                  {TIPO_LABEL[mov.tipo]}
                  {mov.pedido_id ? ` · pedido #${mov.pedido_id}` : ""} · {mov.criado_em}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${mov.quantidade < 0 ? "text-red-600" : "text-green-700"}`}>
                  {mov.quantidade > 0 ? "+" : ""}
                  {mov.quantidade}
                </p>
                <p className="text-xs text-foreground/50">saldo: {mov.estoque_resultante}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
