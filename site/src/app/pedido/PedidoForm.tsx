"use client";

import { useMemo, useState } from "react";
import { produtos, categorias, categoriaIcone } from "@/data/produtos";

type Carrinho = Record<string, number>;

export function PedidoForm() {
  const [carrinho, setCarrinho] = useState<Carrinho>({});
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pedidoId, setPedidoId] = useState<number | null>(null);

  const itensCarrinho = useMemo(
    () =>
      Object.entries(carrinho)
        .filter(([, quantidade]) => quantidade > 0)
        .map(([id, quantidade]) => {
          const produto = produtos.find((p) => p.id === id)!;
          return { id, nome: produto.nome, preco: produto.preco, quantidade };
        }),
    [carrinho]
  );

  const total = itensCarrinho.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );

  function alterarQuantidade(id: string, delta: number) {
    setCarrinho((atual) => {
      const atualQtd = atual[id] ?? 0;
      const novaQtd = Math.max(0, atualQtd + delta);
      return { ...atual, [id]: novaQtd };
    });
  }

  async function enviarPedido(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (itensCarrinho.length === 0) {
      setErro("Adicione ao menos um produto ao pedido.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteNome,
          clienteTelefone,
          endereco,
          observacoes,
          itens: itensCarrinho,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? "Não foi possível enviar o pedido.");
        return;
      }

      setPedidoId(data.id);
      setCarrinho({});
      setClienteNome("");
      setClienteTelefone("");
      setEndereco("");
      setObservacoes("");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (pedidoId) {
    return (
      <div className="mt-10 rounded-lg border border-borda bg-background p-8 text-center">
        <h2 className="text-xl font-semibold text-vermelho">
          Pedido #{pedidoId} recebido!
        </h2>
        <p className="mt-2 text-foreground/70">
          Vamos confirmar com você por telefone em instantes.
        </p>
        <button
          onClick={() => setPedidoId(null)}
          className="mt-6 rounded-full bg-vermelho px-6 py-2 text-white font-medium hover:brightness-110 transition"
        >
          Fazer outro pedido
        </button>
      </div>
    );
  }

  const qtdTotalItens = itensCarrinho.reduce((s, i) => s + i.quantidade, 0);

  return (
    <form onSubmit={enviarPedido} className={qtdTotalItens > 0 ? "pb-28" : ""}>
      <nav
        aria-label="Categorias"
        className="sticky top-[64px] z-10 -mx-6 overflow-x-auto border-b border-borda bg-card px-6 py-3"
      >
        <div className="flex gap-2">
          {categorias.map((categoria) => (
            <a
              key={categoria}
              href={`#p-${categoria}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-borda px-4 py-1.5 text-sm font-medium hover:border-vermelho hover:text-vermelho transition"
            >
              <span>{categoriaIcone[categoria] ?? "🍹"}</span>
              {categoria}
            </a>
          ))}
        </div>
      </nav>

      <div className="mt-8">
        {categorias.map((categoria) => (
          <div key={categoria} id={`p-${categoria}`} className="mb-8 scroll-mt-32">
            <h3 className="flex items-center gap-2 text-vermelho-vivo font-semibold uppercase tracking-wide text-sm">
              <span>{categoriaIcone[categoria] ?? "🍹"}</span>
              {categoria}
            </h3>
            <div className="mt-3 space-y-3">
              {produtos
                .filter((p) => p.categoria === categoria)
                .map((produto) => {
                  const quantidade = carrinho[produto.id] ?? 0;
                  return (
                    <div
                      key={produto.id}
                      className={`flex items-center gap-4 rounded-lg border p-4 transition ${
                        quantidade > 0
                          ? "border-vermelho bg-background"
                          : "border-borda bg-background"
                      }`}
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-preto text-2xl">
                        {categoriaIcone[categoria] ?? "🍹"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{produto.nome}</p>
                        <p className="text-sm text-foreground/60">
                          R$ {produto.preco.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(produto.id, -1)}
                          className="h-8 w-8 rounded-full border border-vermelho text-vermelho font-semibold"
                        >
                          −
                        </button>
                        <span className="w-6 text-center">{quantidade}</span>
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(produto.id, 1)}
                          className="h-8 w-8 rounded-full bg-vermelho text-white font-semibold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div id="checkout" className="scroll-mt-32 rounded-lg border border-borda bg-background p-6">
        <h3 className="font-semibold text-preto">Seus dados</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Nome completo"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            className="rounded-md border border-borda px-4 py-2"
          />
          <input
            required
            placeholder="Telefone / WhatsApp"
            value={clienteTelefone}
            onChange={(e) => setClienteTelefone(e.target.value)}
            className="rounded-md border border-borda px-4 py-2"
          />
        </div>
        <input
          required
          placeholder="Endereço de entrega"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          className="mt-4 w-full rounded-md border border-borda px-4 py-2"
        />
        <textarea
          placeholder="Observações (opcional)"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="mt-4 w-full rounded-md border border-borda px-4 py-2"
          rows={3}
        />
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg bg-preto px-6 py-4 text-white">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-semibold text-vermelho-vivo">
          R$ {total.toFixed(2)}
        </span>
      </div>

      {erro && <p className="mt-4 text-red-600 text-sm">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="mt-4 w-full rounded-full bg-vermelho-vivo px-8 py-3 font-semibold text-preto hover:brightness-95 transition disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Confirmar pedido"}
      </button>

      {qtdTotalItens > 0 && (
        <a
          href="#checkout"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-vermelho-vivo/40 bg-vermelho px-6 py-4 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span className="font-medium">
              {qtdTotalItens} {qtdTotalItens === 1 ? "item" : "itens"} no carrinho
            </span>
            <span className="rounded-full bg-white/15 px-4 py-1.5 font-semibold">
              R$ {total.toFixed(2)} · Finalizar
            </span>
          </div>
        </a>
      )}
    </form>
  );
}
