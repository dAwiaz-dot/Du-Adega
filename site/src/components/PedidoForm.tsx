"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Produto, Categoria } from "@/lib/db";

type Carrinho = Record<string, number>;
type Tela = "categorias" | "produtos" | "checkout";

function emojiCategoria(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("vinho")) return "🍷";
  if (n.includes("cerveja")) return "🍺";
  if (n.includes("destilado") || n.includes("whisky") || n.includes("gin") || n.includes("vodka"))
    return "🥃";
  if (n.includes("gelo") || n.includes("carv")) return "🧊";
  if (n.includes("água") || n.includes("agua") || n.includes("refri")) return "🥤";
  if (n.includes("energ")) return "⚡";
  if (n.includes("doce") || n.includes("snack") || n.includes("petisco")) return "🍿";
  return "🛒";
}

export function PedidoForm({
  produtosIniciais,
  categoriasIniciais,
}: {
  produtosIniciais: Produto[];
  categoriasIniciais: Categoria[];
}) {
  const produtos = produtosIniciais;
  const categorias = useMemo(() => {
    const presentes = new Set(produtos.map((p) => p.categoria));
    const ordenadas = categoriasIniciais
      .filter((c) => presentes.has(c.nome))
      .map((c) => c.nome);
    const semCategoria = Array.from(presentes).filter((c) => !ordenadas.includes(c));
    return [...ordenadas, ...semCategoria];
  }, [produtos, categoriasIniciais]);

  const [tela, setTela] = useState<Tela>("categorias");
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [produtoDetalhe, setProdutoDetalhe] = useState<Produto | null>(null);
  const [carrinho, setCarrinho] = useState<Carrinho>({});
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [linkWhatsApp, setLinkWhatsApp] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0]);
  const [busca, setBusca] = useState("");
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const resultadosBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];
    return produtos.filter((p) => p.nome.toLowerCase().includes(termo));
  }, [busca, produtos]);

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

  function abrirCategoria(categoria: string) {
    setCategoriaAtiva(categoria);
    setTela("produtos");
  }

  function renderProdutoRow(produto: Produto, index: number) {
    const quantidade = carrinho[produto.id] ?? 0;
    return (
      <div
        key={produto.id}
        style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
        className={`group animate-fade-up flex items-center gap-4 rounded-lg border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
          quantidade > 0 ? "border-vermelho" : "border-borda"
        }`}
      >
        <button
          type="button"
          onClick={() => setProdutoDetalhe(produto)}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-preto text-2xl">
            {produto.imagem ? (
              <Image
                src={produto.imagem}
                alt={produto.nome}
                fill
                sizes="56px"
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <span className="text-white/60">{produto.nome.charAt(0).toUpperCase()}</span>
            )}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-medium">{produto.nome}</p>
              {produto.destaque && (
                <span className="shrink-0 rounded-full bg-vermelho/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-vermelho">
                  {produto.destaque}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground/60">R$ {produto.preco.toFixed(2)}</p>
            <p className="text-xs text-foreground/50">{produto.categoria}</p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => alterarQuantidade(produto.id, -1)}
            className="h-8 w-8 rounded-full border border-vermelho text-vermelho font-semibold transition-transform duration-150 hover:scale-110 hover:bg-vermelho/10 active:scale-90"
          >
            −
          </button>
          <span key={quantidade} className="w-6 text-center animate-pop">
            {quantidade}
          </span>
          <button
            type="button"
            onClick={() => alterarQuantidade(produto.id, 1)}
            className="h-8 w-8 rounded-full bg-vermelho text-white font-semibold transition-transform duration-150 hover:scale-110 hover:brightness-110 active:scale-90"
          >
            +
          </button>
        </div>
      </div>
    );
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

      const linhas = itensCarrinho
        .map((item) => `${item.quantidade}x ${item.nome}`)
        .join("\n");
      const mensagem = [
        `Pedido #${data.id} — Du Bebidas`,
        "",
        linhas,
        "",
        `Total: R$ ${total.toFixed(2)}`,
        `Nome: ${clienteNome}`,
        `Endereço: ${endereco}`,
        observacoes ? `Obs: ${observacoes}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      setPedidoId(data.id);
      setLinkWhatsApp(
        `https://wa.me/5535910034182?text=${encodeURIComponent(mensagem)}`
      );
      setCarrinho({});
      setClienteNome("");
      setClienteTelefone("");
      setEndereco("");
      setObservacoes("");
      setTela("categorias");
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
          Falta um passo: confirma o pedido no WhatsApp pra gente já
          separar tudo.
        </p>

        {linkWhatsApp && (
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-semibold text-white transition hover:scale-105 hover:brightness-95 hover:shadow-lg hover:shadow-[#25D366]/40 active:scale-95"
          >
            <span
              aria-hidden
              className="absolute inset-0 -z-10 rounded-full bg-[#25D366]/60 animate-glow"
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 12-12S18.6 0 12 0zm0 22c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.9 1 1-3.8-.2-.4C2.2 15.4 2 13.7 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm5.6-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.8-1-2.4-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
            </svg>
            Confirmar no WhatsApp
          </a>
        )}

        <div>
          <button
            onClick={() => {
              setPedidoId(null);
              setLinkWhatsApp(null);
            }}
            className="mt-4 rounded-full border border-borda px-6 py-2 font-medium text-foreground/70 transition hover:scale-105 hover:border-vermelho hover:text-vermelho active:scale-95"
          >
            Fazer outro pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviarPedido} className={qtdTotalItens > 0 && tela !== "checkout" ? "pb-28" : ""}>
      {tela === "categorias" && (
        <div className="mt-2">
          <h2 className="text-lg font-semibold text-preto">Escolha uma categoria</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Toque numa categoria pra ver os produtos, ou busque pelo nome.
          </p>

          <div className="relative mt-4">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40">
              🔍
            </span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto pelo nome..."
              className="w-full rounded-full border border-borda bg-background py-2.5 pl-11 pr-4 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
            />
          </div>

          {busca.trim() ? (
            <div className="mt-6">
              {resultadosBusca.length === 0 ? (
                <p className="mt-6 text-center text-foreground/60">
                  Nenhum produto encontrado pra &ldquo;{busca.trim()}&rdquo;.
                </p>
              ) : (
                <div className="space-y-3">
                  {resultadosBusca.map((produto, index) => renderProdutoRow(produto, index))}
                </div>
              )}
            </div>
          ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {categorias.map((categoria, index) => {
              const produtosCategoria = produtos.filter((p) => p.categoria === categoria);
              const qtdNoCarrinho = produtosCategoria.reduce(
                (s, p) => s + (carrinho[p.id] ?? 0),
                0
              );
              const capa = produtosCategoria.find((p) => p.imagem)?.imagem ?? null;
              return (
                <button
                  key={categoria}
                  type="button"
                  onClick={() => abrirCategoria(categoria)}
                  style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                  className="animate-fade-up group relative overflow-hidden rounded-xl border border-borda bg-background text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-vermelho hover:shadow-md active:scale-95"
                >
                  {qtdNoCarrinho > 0 && (
                    <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-vermelho text-xs font-bold text-white animate-pop">
                      {qtdNoCarrinho}
                    </span>
                  )}
                  <div className="relative flex h-24 items-center justify-center overflow-hidden bg-preto">
                    {capa ? (
                      <Image
                        src={capa}
                        alt=""
                        fill
                        sizes="200px"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <span className="text-4xl">{emojiCategoria(categoria)}</span>
                    )}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-preto/70 via-transparent to-transparent"
                    />
                  </div>
                  <div className="p-3">
                    <p className="truncate font-medium">{categoria}</p>
                    <p className="text-xs text-foreground/60">
                      {produtosCategoria.length}{" "}
                      {produtosCategoria.length === 1 ? "item" : "itens"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          )}
        </div>
      )}

      {tela === "produtos" && (
        <div>
          <button
            type="button"
            onClick={() => setTela("categorias")}
            className="mb-3 flex items-center gap-1 text-sm font-medium text-foreground/70 transition hover:text-vermelho"
          >
            ← Categorias
          </button>

          <nav
            aria-label="Categorias"
            className="no-scrollbar sticky top-[64px] z-10 -mx-6 overflow-x-auto border-b border-borda bg-card px-6 py-3"
          >
            <div className="flex gap-2">
              {categorias.map((categoria) => {
                const ativa = categoria === categoriaAtiva;
                return (
                  <button
                    key={categoria}
                    type="button"
                    ref={(el) => {
                      chipRefs.current[categoria] = el;
                    }}
                    onClick={() => setCategoriaAtiva(categoria)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                      ativa
                        ? "border-vermelho bg-vermelho text-white shadow-sm"
                        : "border-borda hover:border-vermelho hover:text-vermelho"
                    }`}
                  >
                    {categoria}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="mt-8">
            <div className="mb-8 scroll-mt-32">
              <h2 className="flex items-center gap-2 text-vermelho font-semibold uppercase tracking-wide text-sm">
                {categoriaAtiva}
              </h2>
              <div className="mt-3 space-y-3">
                {produtos
                  .filter((p) => p.categoria === categoriaAtiva)
                  .map((produto, index) => renderProdutoRow(produto, index))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tela === "checkout" && (
        <div>
          <button
            type="button"
            onClick={() => setTela("produtos")}
            className="mb-3 flex items-center gap-1 text-sm font-medium text-foreground/70 transition hover:text-vermelho"
          >
            ← Voltar e adicionar mais itens
          </button>

          <div className="rounded-lg border border-borda bg-background p-6">
            <h2 className="font-semibold text-preto">Seu pedido</h2>
            <div className="mt-4 space-y-3">
              {itensCarrinho.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-borda pb-3 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.nome}</p>
                    <p className="text-sm text-foreground/60">R$ {item.preco.toFixed(2)} un.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(item.id, -1)}
                      className="h-7 w-7 rounded-full border border-vermelho text-vermelho font-semibold transition-transform duration-150 hover:scale-110 active:scale-90"
                    >
                      −
                    </button>
                    <span className="w-5 text-center">{item.quantidade}</span>
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(item.id, 1)}
                      className="h-7 w-7 rounded-full bg-vermelho text-white font-semibold transition-transform duration-150 hover:scale-110 active:scale-90"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm font-medium">
                    R$ {(item.preco * item.quantidade).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-borda bg-background p-6">
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
            <p className="mt-1.5 text-xs text-foreground/70">
              📍 Entregamos em Alfenas-MG e região.
            </p>
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
          <p className="mt-2 text-center text-xs text-foreground/70">
            💳 Forma de pagamento combinada direto com a loja na entrega.
          </p>

          {erro && <p className="mt-4 animate-fade-up text-red-600 text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-vermelho-vivo px-8 py-3 font-semibold text-preto transition hover:brightness-95 hover:shadow-lg hover:shadow-vermelho-vivo/30 active:scale-[0.98] disabled:opacity-60"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[130%] transition-transform duration-700 group-hover:translate-x-[130%]"
            />
            {enviando && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-preto/30 border-t-preto" />
            )}
            <span className="relative">
              {enviando ? "Enviando..." : "Confirmar pedido"}
            </span>
          </button>
        </div>
      )}

      {produtoDetalhe && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setProdutoDetalhe(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-md animate-slide-up overflow-y-auto rounded-t-2xl bg-background sm:rounded-2xl"
          >
            <div className="relative h-56 w-full shrink-0 bg-preto">
              {produtoDetalhe.imagem ? (
                <Image
                  src={produtoDetalhe.imagem}
                  alt={produtoDetalhe.nome}
                  fill
                  sizes="448px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl text-white/60">
                  {produtoDetalhe.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => setProdutoDetalhe(null)}
                aria-label="Fechar"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-lg text-white transition hover:bg-black/70"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-lg font-semibold text-preto">{produtoDetalhe.nome}</p>
                {produtoDetalhe.destaque && (
                  <span className="shrink-0 rounded-full bg-vermelho/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-vermelho">
                    {produtoDetalhe.destaque}
                  </span>
                )}
              </div>
              <p className="mt-1 text-lg font-semibold text-vermelho">
                R$ {produtoDetalhe.preco.toFixed(2)}
              </p>
              {produtoDetalhe.descricao && (
                <p className="mt-3 text-sm text-foreground/70">{produtoDetalhe.descricao}</p>
              )}

              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => alterarQuantidade(produtoDetalhe.id, -1)}
                  className="h-10 w-10 rounded-full border border-vermelho text-vermelho font-semibold transition-transform duration-150 hover:scale-110 hover:bg-vermelho/10 active:scale-90"
                >
                  −
                </button>
                <span
                  key={carrinho[produtoDetalhe.id] ?? 0}
                  className="w-8 text-center text-lg animate-pop"
                >
                  {carrinho[produtoDetalhe.id] ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => alterarQuantidade(produtoDetalhe.id, 1)}
                  className="h-10 w-10 rounded-full bg-vermelho text-white font-semibold transition-transform duration-150 hover:scale-110 hover:brightness-110 active:scale-90"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if ((carrinho[produtoDetalhe.id] ?? 0) === 0) {
                    alterarQuantidade(produtoDetalhe.id, 1);
                  } else {
                    setProdutoDetalhe(null);
                  }
                }}
                className="mt-4 w-full rounded-full bg-vermelho-vivo px-6 py-3 font-semibold text-preto transition hover:brightness-95 active:scale-[0.98]"
              >
                {(carrinho[produtoDetalhe.id] ?? 0) === 0 ? "Adicionar ao carrinho" : "Fechar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {carrinhoAberto && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setCarrinhoAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-md animate-slide-up overflow-y-auto rounded-t-2xl bg-background p-6 sm:rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-preto">Seu carrinho</h2>
              <button
                type="button"
                onClick={() => setCarrinhoAberto(false)}
                className="text-xl text-foreground/50 transition hover:text-vermelho"
                aria-label="Fechar carrinho"
              >
                ✕
              </button>
            </div>

            {itensCarrinho.length === 0 ? (
              <p className="mt-6 text-center text-foreground/60">Seu carrinho está vazio.</p>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {itensCarrinho.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 border-b border-borda pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.nome}</p>
                        <p className="text-sm text-foreground/60">R$ {item.preco.toFixed(2)} un.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(item.id, -1)}
                          className="h-7 w-7 rounded-full border border-vermelho text-vermelho font-semibold transition-transform duration-150 hover:scale-110 active:scale-90"
                        >
                          −
                        </button>
                        <span className="w-5 text-center">{item.quantidade}</span>
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(item.id, 1)}
                          className="h-7 w-7 rounded-full bg-vermelho text-white font-semibold transition-transform duration-150 hover:scale-110 active:scale-90"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-16 shrink-0 text-right text-sm font-medium">
                        R$ {(item.preco * item.quantidade).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span key={total} className="animate-pop text-vermelho">
                    R$ {total.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCarrinhoAberto(false);
                    setTela("checkout");
                  }}
                  className="mt-4 w-full rounded-full bg-vermelho-vivo px-6 py-3 font-semibold text-preto transition hover:brightness-95 active:scale-[0.98]"
                >
                  Continuar pedido
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setCarrinhoAberto(false)}
              className="mt-2 w-full rounded-full border border-borda px-6 py-2 text-sm font-medium text-foreground/70 transition hover:border-vermelho hover:text-vermelho"
            >
              Continuar comprando
            </button>
          </div>
        </div>
      )}

      {qtdTotalItens > 0 && tela !== "checkout" && (
        <button
          type="button"
          onClick={() => setCarrinhoAberto(true)}
          className="fixed inset-x-0 bottom-0 z-20 animate-slide-up border-t border-vermelho-vivo/40 bg-vermelho px-6 py-4 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition hover:brightness-110 active:scale-[0.99]"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span className="font-medium">
              🛒 {qtdTotalItens} {qtdTotalItens === 1 ? "item" : "itens"} no carrinho
            </span>
            <span key={total} className="animate-pop rounded-full bg-white/15 px-4 py-1.5 font-semibold">
              R$ {total.toFixed(2)} · Ver carrinho
            </span>
          </div>
        </button>
      )}
    </form>
  );
}
