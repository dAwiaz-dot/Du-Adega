"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Produto, Categoria } from "@/lib/db";
import type { ResumoVendasHoje } from "@/lib/pdv";
import { AdminNav } from "../AdminNav";

type Carrinho = Record<string, number>;

const FORMAS_PAGAMENTO = ["Dinheiro", "Cartão", "Pix"] as const;

export function PDV({
  produtosIniciais,
  categoriasIniciais,
  resumoInicial,
  adminNome,
}: {
  produtosIniciais: Produto[];
  categoriasIniciais: Categoria[];
  resumoInicial: ResumoVendasHoje;
  adminNome: string;
}) {
  const produtos = produtosIniciais;
  const categoriaIcone = useMemo(
    () => Object.fromEntries(categoriasIniciais.map((c) => [c.nome, c.icone])),
    [categoriasIniciais]
  );
  const categorias = useMemo(() => {
    const presentes = new Set(produtos.map((p) => p.categoria));
    const ordenadas = categoriasIniciais.filter((c) => presentes.has(c.nome)).map((c) => c.nome);
    return ordenadas;
  }, [produtos, categoriasIniciais]);

  const [categoriaAtiva, setCategoriaAtiva] = useState<string | "todas">("todas");
  const [carrinho, setCarrinho] = useState<Carrinho>({});
  const [formaPagamento, setFormaPagamento] = useState<(typeof FORMAS_PAGAMENTO)[number]>("Dinheiro");
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaVenda, setUltimaVenda] = useState<{ id: number; total: number } | null>(null);
  const [resumo, setResumo] = useState(resumoInicial);

  const produtosFiltrados =
    categoriaAtiva === "todas" ? produtos : produtos.filter((p) => p.categoria === categoriaAtiva);

  const itensCarrinho = useMemo(
    () =>
      Object.entries(carrinho)
        .filter(([, quantidade]) => quantidade > 0)
        .map(([id, quantidade]) => {
          const produto = produtos.find((p) => p.id === id)!;
          return { id, nome: produto.nome, preco: produto.preco, quantidade };
        }),
    [carrinho, produtos]
  );

  const total = itensCarrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  const qtdTotalItens = itensCarrinho.reduce((s, i) => s + i.quantidade, 0);

  function alterarQuantidade(id: string, delta: number) {
    setUltimaVenda(null);
    setCarrinho((atual) => {
      const atualQtd = atual[id] ?? 0;
      const novaQtd = Math.max(0, atualQtd + delta);
      return { ...atual, [id]: novaQtd };
    });
  }

  async function finalizarVenda() {
    if (itensCarrinho.length === 0) return;
    setErro(null);
    setFinalizando(true);
    try {
      const res = await fetch("/api/pdv/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: itensCarrinho, formaPagamento }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? "Não foi possível finalizar a venda.");
        return;
      }

      setUltimaVenda({ id: data.id, total: data.total });
      setCarrinho({});
      setResumo((atual) => {
        const linha = atual.porFormaPagamento.find((l) => l.forma_pagamento === formaPagamento);
        const novasLinhas = linha
          ? atual.porFormaPagamento.map((l) =>
              l.forma_pagamento === formaPagamento
                ? { ...l, qtd: l.qtd + 1, total: l.total + data.total }
                : l
            )
          : [...atual.porFormaPagamento, { forma_pagamento: formaPagamento, qtd: 1, total: data.total }];
        return {
          porFormaPagamento: novasLinhas,
          totalGeral: atual.totalGeral + data.total,
          qtdVendas: atual.qtdVendas + 1,
        };
      });
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <div className="min-h-screen bg-card">
      <AdminNav adminNome={adminNome} />

      <div className="bg-background border-b border-borda">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-foreground/50">Vendas de balcão hoje</p>
            <p className="text-lg font-semibold text-vermelho">
              R$ {resumo.totalGeral.toFixed(2)}{" "}
              <span className="text-sm font-normal text-foreground/50">
                ({resumo.qtdVendas} venda{resumo.qtdVendas === 1 ? "" : "s"})
              </span>
            </p>
          </div>
          {resumo.porFormaPagamento.map((linha) => (
            <div key={linha.forma_pagamento}>
              <p className="text-xs text-foreground/50">{linha.forma_pagamento}</p>
              <p className="text-sm font-medium">
                R$ {linha.total.toFixed(2)}{" "}
                <span className="text-foreground/40">· {linha.qtd}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <nav className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
              <button
                onClick={() => setCategoriaAtiva("todas")}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  categoriaAtiva === "todas"
                    ? "border-vermelho bg-vermelho text-white"
                    : "border-borda hover:border-vermelho hover:text-vermelho"
                }`}
              >
                Todas
              </button>
              {categorias.map((categoria) => (
                <button
                  key={categoria}
                  onClick={() => setCategoriaAtiva(categoria)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    categoriaAtiva === categoria
                      ? "border-vermelho bg-vermelho text-white"
                      : "border-borda hover:border-vermelho hover:text-vermelho"
                  }`}
                >
                  {categoriaIcone[categoria] ?? "🍹"} {categoria}
                </button>
              ))}
            </nav>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {produtosFiltrados.map((produto) => {
                const semEstoque = produto.estoque !== null && produto.estoque <= 0;
                const quantidade = carrinho[produto.id] ?? 0;
                return (
                  <button
                    key={produto.id}
                    type="button"
                    disabled={semEstoque}
                    onClick={() => alterarQuantidade(produto.id, 1)}
                    className={`relative flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                      quantidade > 0
                        ? "border-vermelho bg-vermelho/5"
                        : "border-borda bg-background hover:border-vermelho/50"
                    }`}
                  >
                    {quantidade > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-6 w-6 animate-pop items-center justify-center rounded-full bg-vermelho text-xs font-bold text-white">
                        {quantidade}
                      </span>
                    )}
                    <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-preto text-2xl">
                      {produto.imagem ? (
                        <Image src={produto.imagem} alt="" fill sizes="56px" className="object-cover" />
                      ) : (
                        categoriaIcone[produto.categoria] ?? "🍹"
                      )}
                    </div>
                    <p className="text-xs font-medium leading-tight">{produto.nome}</p>
                    <p className="text-xs text-foreground/60">R$ {produto.preco.toFixed(2)}</p>
                    {semEstoque && (
                      <span className="text-[10px] font-semibold uppercase text-red-600">Sem estoque</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-fit rounded-lg border border-borda bg-background p-5 lg:sticky lg:top-24">
            <h2 className="font-display text-xl tracking-wide text-preto">Venda atual</h2>

            {itensCarrinho.length === 0 ? (
              <p className="mt-6 text-center text-sm text-foreground/50">
                Toque num produto pra adicionar.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {itensCarrinho.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex-1 min-w-0 truncate">{item.nome}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.id, -1)}
                        className="h-6 w-6 rounded-full border border-vermelho text-xs font-semibold text-vermelho transition active:scale-90"
                      >
                        −
                      </button>
                      <span className="w-4 text-center">{item.quantidade}</span>
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.id, 1)}
                        className="h-6 w-6 rounded-full bg-vermelho text-xs font-semibold text-white transition active:scale-90"
                      >
                        +
                      </button>
                    </div>
                    <span className="w-16 shrink-0 text-right font-medium">
                      R$ {(item.preco * item.quantidade).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 border-t border-borda pt-4">
              <p className="text-xs font-medium text-foreground/60">Forma de pagamento</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {FORMAS_PAGAMENTO.map((forma) => (
                  <button
                    key={forma}
                    type="button"
                    onClick={() => setFormaPagamento(forma)}
                    className={`rounded-md border px-2 py-2 text-xs font-medium transition ${
                      formaPagamento === forma
                        ? "border-vermelho bg-vermelho text-white"
                        : "border-borda hover:border-vermelho hover:text-vermelho"
                    }`}
                  >
                    {forma}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-preto px-4 py-3 text-white">
              <span className="font-semibold">Total</span>
              <span key={total} className="animate-pop text-lg font-semibold text-vermelho-vivo">
                R$ {total.toFixed(2)}
              </span>
            </div>

            {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

            {ultimaVenda && (
              <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                Venda #{ultimaVenda.id} registrada — R$ {ultimaVenda.total.toFixed(2)}
              </p>
            )}

            <button
              type="button"
              onClick={finalizarVenda}
              disabled={itensCarrinho.length === 0 || finalizando}
              className="mt-4 w-full rounded-full bg-vermelho-vivo px-6 py-3 font-semibold text-preto transition hover:brightness-95 active:scale-[0.98] disabled:opacity-50"
            >
              {finalizando ? "Registrando..." : `Finalizar venda (${qtdTotalItens})`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
