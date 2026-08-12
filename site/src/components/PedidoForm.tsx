"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0]);
  const chipRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

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

  const qtdTotalItens = itensCarrinho.reduce((s, i) => s + i.quantidade, 0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCategoriaAtiva(entry.target.id.replace("p-", ""));
          }
        });
      },
      { rootMargin: "-150px 0px -65% 0px", threshold: 0 }
    );

    categorias.forEach((categoria) => {
      const el = document.getElementById(`p-${categoria}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    chipRefs.current[categoriaAtiva]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [categoriaAtiva]);

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
      <div className="mt-10 animate-fade-up rounded-lg border border-borda bg-background p-8 text-center">
        <div className="mx-auto flex h-16 w-16 animate-scale-in items-center justify-center rounded-full bg-vermelho/10">
          <svg
            width="34"
            height="34"
            viewBox="0 0 34 34"
            fill="none"
            className="text-vermelho"
          >
            <circle
              cx="17"
              cy="17"
              r="15"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.25"
            />
            <path
              d="M10 17.5l4.5 4.5L24 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="48"
              strokeDashoffset="48"
              className="animate-draw"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-vermelho">
          Pedido #{pedidoId} recebido!
        </h2>
        <p className="mt-2 text-foreground/70">
          Vamos confirmar com você por telefone em instantes.
        </p>
        <button
          onClick={() => setPedidoId(null)}
          className="mt-6 rounded-full bg-vermelho px-6 py-2 font-medium text-white transition hover:brightness-110 active:scale-95"
        >
          Fazer outro pedido
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviarPedido} className={qtdTotalItens > 0 ? "pb-28" : ""}>
      <nav
        aria-label="Categorias"
        className="no-scrollbar sticky top-[64px] z-10 -mx-6 overflow-x-auto border-b border-borda bg-card px-6 py-3"
      >
        <div className="flex gap-2">
          {categorias.map((categoria) => {
            const ativa = categoria === categoriaAtiva;
            return (
              <a
                key={categoria}
                ref={(el) => {
                  chipRefs.current[categoria] = el;
                }}
                href={`#p-${categoria}`}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  ativa
                    ? "border-vermelho bg-vermelho text-white shadow-sm"
                    : "border-borda hover:border-vermelho hover:text-vermelho"
                }`}
              >
                <span>{categoriaIcone[categoria] ?? "🍹"}</span>
                {categoria}
              </a>
            );
          })}
        </div>
      </nav>

      <div className="mt-8">
        {categorias.map((categoria) => (
          <div key={categoria} id={`p-${categoria}`} className="mb-8 scroll-mt-32">
            <h2 className="flex items-center gap-2 text-vermelho font-semibold uppercase tracking-wide text-sm">
              <span>{categoriaIcone[categoria] ?? "🍹"}</span>
              {categoria}
            </h2>
            <div className="mt-3 space-y-3">
              {produtos
                .filter((p) => p.categoria === categoria)
                .map((produto) => {
                  const quantidade = carrinho[produto.id] ?? 0;
                  return (
                    <div
                      key={produto.id}
                      className={`flex items-center gap-4 rounded-lg border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        quantidade > 0 ? "border-vermelho" : "border-borda"
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
                          className="h-8 w-8 rounded-full border border-vermelho text-vermelho font-semibold transition active:scale-90"
                        >
                          −
                        </button>
                        <span
                          key={quantidade}
                          className="w-6 text-center animate-pop"
                        >
                          {quantidade}
                        </span>
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(produto.id, 1)}
                          className="h-8 w-8 rounded-full bg-vermelho text-white font-semibold transition active:scale-90"
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
        <h2 className="font-semibold text-preto">Seus dados</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Nome completo"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            className="rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
          />
          <input
            required
            placeholder="Telefone / WhatsApp"
            value={clienteTelefone}
            onChange={(e) => setClienteTelefone(e.target.value)}
            className="rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
          />
        </div>
        <input
          required
          placeholder="Endereço de entrega"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          className="mt-4 w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
        />
        <textarea
          placeholder="Observações (opcional)"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="mt-4 w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
          rows={3}
        />
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg bg-preto px-6 py-4 text-white">
        <span className="font-semibold">Total</span>
        <span key={total} className="text-xl font-semibold text-vermelho-vivo animate-pop">
          R$ {total.toFixed(2)}
        </span>
      </div>

      {erro && <p className="mt-4 animate-fade-up text-red-600 text-sm">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-vermelho-vivo px-8 py-3 font-semibold text-preto transition hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
      >
        {enviando && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-preto/30 border-t-preto" />
        )}
        {enviando ? "Enviando..." : "Confirmar pedido"}
      </button>

      {qtdTotalItens > 0 && (
        <a
          href="#checkout"
          className="fixed inset-x-0 bottom-0 z-20 animate-slide-up border-t border-vermelho-vivo/40 bg-vermelho px-6 py-4 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition active:scale-[0.99]"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span className="font-medium">
              {qtdTotalItens} {qtdTotalItens === 1 ? "item" : "itens"} no carrinho
            </span>
            <span key={total} className="animate-pop rounded-full bg-white/15 px-4 py-1.5 font-semibold">
              R$ {total.toFixed(2)} · Finalizar
            </span>
          </div>
        </a>
      )}
    </form>
  );
}
