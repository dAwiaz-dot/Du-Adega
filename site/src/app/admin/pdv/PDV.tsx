"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Produto, Categoria, Caixa } from "@/lib/db";
import type { ResumoVendasHoje } from "@/lib/pdv";
import type { ResumoCaixa } from "@/lib/caixa";
import { AdminNav } from "../AdminNav";

type Carrinho = Record<string, number>;

const FORMAS_PAGAMENTO = ["Dinheiro", "Cartão", "Pix", "Fiado"] as const;

function horaCurta(dataStr: string) {
  const [, hora] = dataStr.split(" ");
  return hora?.slice(0, 5) ?? dataStr;
}

export function PDV({
  produtosIniciais,
  categoriasIniciais,
  resumoInicial,
  caixaInicial,
  resumoCaixaInicial,
  adminNome,
}: {
  produtosIniciais: Produto[];
  categoriasIniciais: Categoria[];
  resumoInicial: ResumoVendasHoje;
  caixaInicial: Caixa | null;
  resumoCaixaInicial: ResumoCaixa | null;
  adminNome: string;
}) {
  const router = useRouter();
  const produtos = produtosIniciais;
  const categoriaIcone = useMemo(
    () => Object.fromEntries(categoriasIniciais.map((c) => [c.nome, c.icone])),
    [categoriasIniciais]
  );
  const categorias = useMemo(() => {
    const presentes = new Set(produtos.map((p) => p.categoria));
    return categoriasIniciais.filter((c) => presentes.has(c.nome)).map((c) => c.nome);
  }, [produtos, categoriasIniciais]);

  const [categoriaAtiva, setCategoriaAtiva] = useState<string | "todas">("todas");
  const [carrinho, setCarrinho] = useState<Carrinho>({});
  const [codigoBarras, setCodigoBarras] = useState("");
  const [avisoLeitor, setAvisoLeitor] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null
  );
  const inputLeitorRef = useRef<HTMLInputElement>(null);
  const [formaPagamento, setFormaPagamento] = useState<(typeof FORMAS_PAGAMENTO)[number]>("Dinheiro");
  const [clienteNomeFiado, setClienteNomeFiado] = useState("");
  const [clienteTelefoneFiado, setClienteTelefoneFiado] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaVenda, setUltimaVenda] = useState<{ id: number; total: number } | null>(null);
  const [resumo, setResumo] = useState(resumoInicial);

  const [caixa, setCaixa] = useState(caixaInicial);
  const [resumoCaixaState, setResumoCaixaState] = useState(resumoCaixaInicial);
  const [valorInicialInput, setValorInicialInput] = useState("");
  const [abrindoCaixa, setAbrindoCaixa] = useState(false);
  const [erroCaixa, setErroCaixa] = useState<string | null>(null);
  const [painelFechamento, setPainelFechamento] = useState(false);
  const [valorContadoInput, setValorContadoInput] = useState("");
  const [observacoesFechamento, setObservacoesFechamento] = useState("");
  const [fechandoCaixa, setFechandoCaixa] = useState(false);

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

  useEffect(() => {
    if (caixa) inputLeitorRef.current?.focus();
  }, [caixa]);

  useEffect(() => {
    if (!avisoLeitor) return;
    const timer = setTimeout(() => setAvisoLeitor(null), 2000);
    return () => clearTimeout(timer);
  }, [avisoLeitor]);

  function processarCodigoBarras() {
    const codigo = codigoBarras.trim();
    setCodigoBarras("");
    if (!codigo) return;

    const produto = produtos.find((p) => p.codigo_barras?.trim() === codigo);
    if (!produto) {
      setAvisoLeitor({ tipo: "erro", texto: `Nenhum produto com o código ${codigo}` });
      return;
    }
    if (produto.estoque !== null && produto.estoque <= 0) {
      setAvisoLeitor({ tipo: "erro", texto: `${produto.nome} está sem estoque` });
      return;
    }
    alterarQuantidade(produto.id, 1);
    setAvisoLeitor({ tipo: "ok", texto: `${produto.nome} adicionado` });
  }

  async function abrirCaixa(e: React.FormEvent) {
    e.preventDefault();
    setErroCaixa(null);
    const valorInicial = Number(valorInicialInput.replace(",", "."));
    if (Number.isNaN(valorInicial) || valorInicial < 0) {
      setErroCaixa("Informe um valor inicial válido.");
      return;
    }

    setAbrindoCaixa(true);
    try {
      const res = await fetch("/api/caixa/abrir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valorInicial }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErroCaixa(data.error ?? "Não foi possível abrir o caixa.");
        return;
      }
      setCaixa(data.caixa);
      setResumoCaixaState({
        caixa: data.caixa,
        porFormaPagamento: [],
        totalVendas: 0,
        totalDinheiro: 0,
        valorEsperadoDinheiro: data.caixa.valor_inicial,
      });
      setValorInicialInput("");
      router.refresh();
    } catch {
      setErroCaixa("Erro de conexão ao abrir o caixa.");
    } finally {
      setAbrindoCaixa(false);
    }
  }

  async function fecharCaixa() {
    if (!caixa) return;
    setFechandoCaixa(true);
    setErroCaixa(null);
    try {
      const valorContado =
        valorContadoInput.trim() === "" ? null : Number(valorContadoInput.replace(",", "."));
      const res = await fetch(`/api/caixa/${caixa.id}/fechar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valorContado, observacoes: observacoesFechamento.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErroCaixa(data.error ?? "Não foi possível fechar o caixa.");
        return;
      }
      setCaixa(null);
      setResumoCaixaState(null);
      setPainelFechamento(false);
      setValorContadoInput("");
      setObservacoesFechamento("");
      router.refresh();
    } catch {
      setErroCaixa("Erro de conexão ao fechar o caixa.");
    } finally {
      setFechandoCaixa(false);
    }
  }

  async function finalizarVenda() {
    if (itensCarrinho.length === 0) return;
    if (formaPagamento === "Fiado" && (!clienteNomeFiado.trim() || !clienteTelefoneFiado.trim())) {
      setErro("Informe nome e telefone do cliente pra vender fiado.");
      return;
    }
    setErro(null);
    setFinalizando(true);
    try {
      const res = await fetch("/api/pdv/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: itensCarrinho,
          formaPagamento,
          clienteNome: formaPagamento === "Fiado" ? clienteNomeFiado.trim() : undefined,
          clienteTelefone: formaPagamento === "Fiado" ? clienteTelefoneFiado.trim() : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? "Não foi possível finalizar a venda.");
        return;
      }

      setUltimaVenda({ id: data.id, total: data.total });
      setCarrinho({});
      setClienteNomeFiado("");
      setClienteTelefoneFiado("");
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
      setResumoCaixaState((atual) => {
        if (!atual) return atual;
        const linha = atual.porFormaPagamento.find((l) => l.forma_pagamento === formaPagamento);
        const novasLinhas = linha
          ? atual.porFormaPagamento.map((l) =>
              l.forma_pagamento === formaPagamento
                ? { ...l, qtd: l.qtd + 1, total: l.total + data.total }
                : l
            )
          : [...atual.porFormaPagamento, { forma_pagamento: formaPagamento, qtd: 1, total: data.total }];
        const totalVendas = atual.totalVendas + data.total;
        const totalDinheiro =
          formaPagamento === "Dinheiro" ? atual.totalDinheiro + data.total : atual.totalDinheiro;
        return {
          ...atual,
          porFormaPagamento: novasLinhas,
          totalVendas,
          totalDinheiro,
          valorEsperadoDinheiro: atual.caixa.valor_inicial + totalDinheiro,
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
                R$ {linha.total.toFixed(2)} <span className="text-foreground/40">· {linha.qtd}</span>
              </p>
            </div>
          ))}

          {caixa && (
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-foreground/50">
                  Caixa aberto às {horaCurta(caixa.aberto_em)}
                </p>
                <p className="text-sm font-medium">Inicial: R$ {caixa.valor_inicial.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setPainelFechamento(true)}
                className="rounded-md border border-borda px-3 py-2 text-sm font-medium hover:bg-borda/30"
              >
                Fechar caixa
              </button>
            </div>
          )}
        </div>
      </div>

      {!caixa ? (
        <main className="mx-auto max-w-md px-6 py-16">
          <div className="rounded-lg border border-borda bg-background p-6 text-center">
            <h2 className="font-display text-2xl tracking-wide text-preto">Abrir caixa</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Informe o valor inicial (troco) pra começar a vender no balcão.
            </p>
            <form onSubmit={abrirCaixa} className="mt-5">
              <input
                required
                inputMode="decimal"
                placeholder="Valor inicial (ex: 100.00)"
                value={valorInicialInput}
                onChange={(e) => setValorInicialInput(e.target.value)}
                className="w-full rounded-md border border-borda px-4 py-2 text-center transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
              />
              {erroCaixa && <p className="mt-3 text-sm text-red-600">{erroCaixa}</p>}
              <button
                type="submit"
                disabled={abrindoCaixa}
                className="mt-4 w-full rounded-full bg-vermelho-vivo px-6 py-3 font-semibold text-preto transition hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
              >
                {abrindoCaixa ? "Abrindo..." : "Abrir caixa"}
              </button>
            </form>
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="relative mb-4">
                <input
                  ref={inputLeitorRef}
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      processarCodigoBarras();
                    }
                  }}
                  onBlur={() => {
                    if (painelFechamento) return;
                    setTimeout(() => inputLeitorRef.current?.focus(), 200);
                  }}
                  placeholder="📷 Bipar código de barras..."
                  autoFocus
                  className="w-full rounded-lg border-2 border-dashed border-borda bg-background px-4 py-3 text-center transition focus:border-vermelho focus:outline-none"
                />
                {avisoLeitor && (
                  <p
                    className={`absolute inset-x-0 -bottom-6 animate-fade-up text-center text-xs font-medium ${
                      avisoLeitor.tipo === "ok" ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {avisoLeitor.texto}
                  </p>
                )}
              </div>

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
                        <span className="text-[10px] font-semibold uppercase text-red-600">
                          Sem estoque
                        </span>
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
                <div className="mt-2 grid grid-cols-4 gap-2">
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

                {formaPagamento === "Fiado" && (
                  <div className="mt-3 space-y-2 rounded-md bg-borda/20 p-3">
                    <input
                      placeholder="Nome do cliente"
                      value={clienteNomeFiado}
                      onChange={(e) => setClienteNomeFiado(e.target.value)}
                      className="w-full rounded-md border border-borda px-3 py-2 text-sm transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
                    />
                    <input
                      placeholder="Telefone do cliente"
                      value={clienteTelefoneFiado}
                      onChange={(e) => setClienteTelefoneFiado(e.target.value)}
                      className="w-full rounded-md border border-borda px-3 py-2 text-sm transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
                    />
                    <p className="text-[11px] text-foreground/50">
                      Fica registrado como dívida na aba Clientes.
                    </p>
                  </div>
                )}
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
      )}

      {painelFechamento && caixa && resumoCaixaState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm animate-scale-in rounded-lg bg-background p-6">
            <h2 className="font-display text-xl tracking-wide text-preto">Fechar caixa</h2>
            <p className="mt-1 text-xs text-foreground/50">
              Aberto às {horaCurta(caixa.aberto_em)} · inicial R$ {caixa.valor_inicial.toFixed(2)}
            </p>

            <div className="mt-4 space-y-1.5 text-sm">
              {resumoCaixaState.porFormaPagamento.length === 0 && (
                <p className="text-foreground/50">Nenhuma venda nesse caixa ainda.</p>
              )}
              {resumoCaixaState.porFormaPagamento.map((linha) => (
                <div key={linha.forma_pagamento} className="flex justify-between">
                  <span>{linha.forma_pagamento}</span>
                  <span className="font-medium">R$ {linha.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-borda pt-1.5 font-semibold">
                <span>Total vendido</span>
                <span>R$ {resumoCaixaState.totalVendas.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-vermelho font-semibold">
                <span>Esperado em dinheiro</span>
                <span>R$ {resumoCaixaState.valorEsperadoDinheiro.toFixed(2)}</span>
              </div>
            </div>

            <input
              inputMode="decimal"
              placeholder="Valor contado na gaveta (opcional)"
              value={valorContadoInput}
              onChange={(e) => setValorContadoInput(e.target.value)}
              className="mt-4 w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
            />
            <textarea
              placeholder="Observações (opcional)"
              value={observacoesFechamento}
              onChange={(e) => setObservacoesFechamento(e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
            />

            {erroCaixa && <p className="mt-3 text-sm text-red-600">{erroCaixa}</p>}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setPainelFechamento(false)}
                className="flex-1 rounded-full border border-borda px-4 py-2 font-medium text-foreground/70 transition hover:border-vermelho hover:text-vermelho"
              >
                Cancelar
              </button>
              <button
                onClick={fecharCaixa}
                disabled={fechandoCaixa}
                className="flex-1 rounded-full bg-vermelho px-4 py-2 font-medium text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {fechandoCaixa ? "Fechando..." : "Confirmar fechamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
