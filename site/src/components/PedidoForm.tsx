"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Produto, Categoria } from "@/lib/db";

type Carrinho = Record<string, number>;
type Tela = "categorias" | "produtos" | "checkout";

const formatadorPreco = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatarPreco(valor: number): string {
  return formatadorPreco.format(valor);
}

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

const inputClasse =
  "w-full rounded-xl border border-borda bg-white/[0.03] px-4 py-3 text-foreground placeholder:text-foreground/35 transition focus:border-vermelho-vivo focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-vermelho/25";

function IconeMais() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconeMenos() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function IconeFechar({ tamanho = 16 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function IconeVoltar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconeSacola({ tamanho = 20 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7h12l1 13H5L6 7Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}

function FotoProduto({
  produto,
  sizes,
  className = "",
  padding = "p-2",
}: {
  produto: Pick<Produto, "imagem" | "nome" | "categoria">;
  sizes: string;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={`tile-foto relative overflow-hidden ${className}`}>
      {produto.imagem ? (
        <Image
          src={produto.imagem}
          alt={produto.nome}
          fill
          sizes={sizes}
          className={`object-contain ${padding} transition-transform duration-300 group-hover:scale-105`}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-3xl">
          {emojiCategoria(produto.categoria)}
        </span>
      )}
    </div>
  );
}

function ControleQuantidade({
  quantidade,
  onMenos,
  onMais,
  tamanho = "sm",
}: {
  quantidade: number;
  onMenos: () => void;
  onMais: () => void;
  tamanho?: "sm" | "lg";
}) {
  const botao = tamanho === "lg" ? "h-11 w-11" : "h-8 w-8";
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-borda bg-white/[0.03] p-1">
      <button
        type="button"
        onClick={onMenos}
        aria-label="Diminuir quantidade"
        className={`flex ${botao} items-center justify-center rounded-full text-foreground/70 transition hover:bg-white/10 hover:text-foreground active:scale-90`}
      >
        <IconeMenos />
      </button>
      <span
        key={quantidade}
        className={`${tamanho === "lg" ? "w-8 text-lg" : "w-5 text-sm"} text-center font-semibold tabular-nums animate-pop`}
      >
        {quantidade}
      </span>
      <button
        type="button"
        onClick={onMais}
        aria-label="Aumentar quantidade"
        className={`flex ${botao} items-center justify-center rounded-full bg-vermelho text-white transition hover:brightness-110 active:scale-90`}
      >
        <IconeMais />
      </button>
    </div>
  );
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

  const maisPedidos = useMemo(
    () => produtos.filter((p) => p.destaque && p.imagem).slice(0, 12),
    [produtos]
  );

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
  const [ultimoProdutoId, setUltimoProdutoId] = useState<string | null>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const produtoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const chipsScrollRef = useRef<HTMLDivElement | null>(null);

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
          return {
            id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade,
            imagem: produto.imagem,
            categoria: produto.categoria,
          };
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

  function removerItem(id: string) {
    setCarrinho((atual) =>
      Object.fromEntries(Object.entries(atual).filter(([itemId]) => itemId !== id))
    );
  }

  function abrirCategoria(categoria: string) {
    setCategoriaAtiva(categoria);
    setTela("produtos");
  }

  function voltarParaItem(id: string | null) {
    if (!id) return;
    requestAnimationFrame(() => {
      produtoRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function fecharDetalheProduto() {
    const id = produtoDetalhe?.id ?? null;
    setProdutoDetalhe(null);
    voltarParaItem(id);
  }

  function voltarParaProdutos() {
    setTela("produtos");
    voltarParaItem(ultimoProdutoId);
  }

  function scrollChips(delta: number) {
    chipsScrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  function abrirDetalhe(produto: Produto) {
    setUltimoProdutoId(produto.id);
    setProdutoDetalhe(produto);
  }

  function renderProdutoRow(produto: Produto, index: number) {
    const quantidade = carrinho[produto.id] ?? 0;
    return (
      <div
        key={produto.id}
        ref={(el) => {
          produtoRefs.current[produto.id] = el;
        }}
        style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
        className={`group animate-fade-up flex items-center gap-3.5 rounded-2xl border bg-card p-2.5 pr-3 transition-all duration-200 hover:border-white/20 ${
          quantidade > 0 ? "border-vermelho/70 shadow-[0_0_0_1px_rgba(200,16,46,0.35)]" : "border-borda"
        }`}
      >
        <button
          type="button"
          onClick={() => abrirDetalhe(produto)}
          className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
        >
          <FotoProduto
            produto={produto}
            sizes="80px"
            className="h-20 w-20 shrink-0 rounded-xl"
            padding="p-1.5"
          />
          <div className="min-w-0 flex-1">
            {produto.destaque && (
              <span className="mb-1 inline-block rounded-md bg-vermelho/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-vermelho-vivo">
                {produto.destaque}
              </span>
            )}
            <p className="line-clamp-2 text-[15px] font-medium leading-snug text-foreground">
              {produto.nome}
            </p>
            <p className="mt-1 font-semibold text-foreground">{formatarPreco(produto.preco)}</p>
          </div>
        </button>
        {quantidade > 0 ? (
          <ControleQuantidade
            quantidade={quantidade}
            onMenos={() => alterarQuantidade(produto.id, -1)}
            onMais={() => alterarQuantidade(produto.id, 1)}
          />
        ) : (
          <button
            type="button"
            onClick={() => alterarQuantidade(produto.id, 1)}
            aria-label={`Adicionar ${produto.nome}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vermelho text-white shadow-md shadow-vermelho/25 transition hover:scale-105 hover:brightness-110 active:scale-90"
          >
            <IconeMais />
          </button>
        )}
      </div>
    );
  }

  function renderItemCarrinho(item: (typeof itensCarrinho)[number]) {
    return (
      <div key={item.id} className="flex items-center gap-3 py-3">
        <FotoProduto
          produto={item}
          sizes="48px"
          className="h-12 w-12 shrink-0 rounded-lg"
          padding="p-1"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium leading-snug">{item.nome}</p>
          <p className="text-sm font-semibold text-foreground/80">
            {formatarPreco(item.preco * item.quantidade)}
          </p>
        </div>
        <ControleQuantidade
          quantidade={item.quantidade}
          onMenos={() => alterarQuantidade(item.id, -1)}
          onMais={() => alterarQuantidade(item.id, 1)}
        />
        <button
          type="button"
          onClick={() => removerItem(item.id)}
          aria-label={`Remover ${item.nome}`}
          className="shrink-0 rounded-full p-1.5 text-foreground/35 transition hover:bg-white/5 hover:text-vermelho-vivo"
        >
          <IconeFechar tamanho={14} />
        </button>
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
          itens: itensCarrinho.map(({ id, nome, preco, quantidade }) => ({
            id,
            nome,
            preco,
            quantidade,
          })),
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
        `Total: ${formatarPreco(total)}`,
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
      <div className="mx-auto mt-6 max-w-md animate-fade-up rounded-3xl border border-borda bg-card p-8 text-center">
        <div className="mx-auto flex h-20 w-20 animate-scale-in items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/30">
          <svg width="38" height="38" viewBox="0 0 34 34" fill="none" className="text-emerald-400">
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
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45">
          Pedido #{pedidoId}
        </p>
        <h2 className="mt-1 font-display text-4xl tracking-wide text-foreground">
          Recebemos seu pedido!
        </h2>
        <p className="mt-2 text-foreground/65">
          Falta um passo: confirma no WhatsApp pra gente já separar tudo.
        </p>

        {linkWhatsApp && (
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 font-semibold text-[#0b2e17] transition hover:brightness-105 hover:shadow-lg hover:shadow-[#25D366]/30 active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 12-12S18.6 0 12 0zm0 22c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.9 1 1-3.8-.2-.4C2.2 15.4 2 13.7 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm5.6-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.8-1-2.4-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
            </svg>
            Confirmar no WhatsApp
          </a>
        )}

        <button
          onClick={() => {
            setPedidoId(null);
            setLinkWhatsApp(null);
          }}
          className="mt-3 w-full rounded-full border border-borda px-6 py-3 font-medium text-foreground/70 transition hover:border-white/30 hover:text-foreground active:scale-[0.98]"
        >
          Fazer outro pedido
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviarPedido} className={qtdTotalItens > 0 && tela !== "checkout" ? "pb-28" : ""}>
      {tela === "categorias" && (
        <div>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cerveja, gelo, whisky..."
              className="w-full rounded-2xl border border-borda bg-card py-3.5 pl-12 pr-4 text-foreground placeholder:text-foreground/40 transition focus:border-vermelho-vivo focus:outline-none focus:ring-2 focus:ring-vermelho/25"
            />
          </div>

          {busca.trim() ? (
            <div className="mt-6">
              <p className="mb-3 text-sm text-foreground/50">
                {resultadosBusca.length}{" "}
                {resultadosBusca.length === 1 ? "resultado" : "resultados"} pra &ldquo;
                {busca.trim()}&rdquo;
              </p>
              {resultadosBusca.length === 0 ? (
                <p className="mt-10 text-center text-foreground/60">
                  Nada por aqui. Tenta outro nome ou chama no WhatsApp.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {resultadosBusca.map((produto, index) => renderProdutoRow(produto, index))}
                </div>
              )}
            </div>
          ) : (
            <>
              {maisPedidos.length > 0 && (
                <section className="mt-8">
                  <div className="flex items-end justify-between">
                    <h2 className="font-display text-3xl tracking-wide text-foreground">
                      Mais pedidos
                    </h2>
                    <span className="text-xs text-foreground/40">arraste pro lado →</span>
                  </div>
                  <div className="no-scrollbar -mx-6 mt-3 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-2 [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-48px),transparent)]">
                    {maisPedidos.map((produto, index) => {
                      const quantidade = carrinho[produto.id] ?? 0;
                      return (
                        <div
                          key={produto.id}
                          style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
                          className={`group animate-fade-up relative flex w-40 shrink-0 snap-start flex-col rounded-2xl border bg-card p-2 sm:w-44 ${
                            quantidade > 0 ? "border-vermelho/70" : "border-borda"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => abrirDetalhe(produto)}
                            className="text-left"
                          >
                            <FotoProduto
                              produto={produto}
                              sizes="176px"
                              className="aspect-square w-full rounded-xl"
                              padding="p-3"
                            />
                            <p className="mt-2.5 line-clamp-2 min-h-[2.5rem] px-1 text-sm font-medium leading-tight">
                              {produto.nome}
                            </p>
                          </button>
                          <div className="mt-2 flex items-center justify-between px-1 pb-0.5">
                            <span className="text-sm font-semibold">{formatarPreco(produto.preco)}</span>
                            <button
                              type="button"
                              onClick={() => alterarQuantidade(produto.id, 1)}
                              aria-label={`Adicionar ${produto.nome}`}
                              className="flex h-8 min-w-8 items-center justify-center rounded-full bg-vermelho px-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-90"
                            >
                              {quantidade > 0 ? (
                                <span key={quantidade} className="animate-pop">{quantidade}</span>
                              ) : (
                                <IconeMais />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="mt-8">
                <h2 className="font-display text-3xl tracking-wide text-foreground">Categorias</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                        style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                        className="group animate-fade-up relative flex flex-col overflow-hidden rounded-2xl border border-borda bg-card p-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-vermelho/60 hover:shadow-xl hover:shadow-vermelho/10 active:scale-[0.97]"
                      >
                        <FotoProduto
                          produto={{ imagem: capa, nome: categoria, categoria }}
                          sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
                          className="aspect-[4/3] w-full rounded-xl"
                          padding="p-3"
                        />
                        {qtdNoCarrinho > 0 && (
                          <span className="absolute right-3.5 top-3.5 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-vermelho px-1.5 text-xs font-bold text-white shadow-md animate-pop">
                            {qtdNoCarrinho}
                          </span>
                        )}
                        <div className="flex items-center justify-between gap-2 px-1.5 pt-2.5 pb-1">
                          <div className="min-w-0">
                            <p className="truncate font-semibold leading-tight text-foreground">
                              {categoria}
                            </p>
                            <p className="mt-0.5 text-xs text-foreground/45">
                              {produtosCategoria.length}{" "}
                              {produtosCategoria.length === 1 ? "item" : "itens"}
                            </p>
                          </div>
                          <span className="shrink-0 text-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-vermelho-vivo">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {tela === "produtos" && (
        <div>
          <button
            type="button"
            onClick={() => setTela("categorias")}
            className="mb-2 inline-flex items-center gap-1 rounded-full py-1 pr-3 text-sm font-medium text-foreground/60 transition hover:text-foreground"
          >
            <IconeVoltar />
            Todas as categorias
          </button>

          <div className="sticky top-[68px] z-10 -mx-6 bg-background/95 backdrop-blur-md">
            <nav
              aria-label="Categorias"
              ref={chipsScrollRef}
              className="no-scrollbar overflow-x-auto border-b border-borda px-12 py-3"
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
                      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                        ativa
                          ? "border-vermelho bg-vermelho text-white shadow-md shadow-vermelho/25"
                          : "border-borda text-foreground/70 hover:border-white/25 hover:text-foreground"
                      }`}
                    >
                      {categoria}
                    </button>
                  );
                })}
              </div>
            </nav>
            <button
              type="button"
              onClick={() => scrollChips(-160)}
              aria-label="Categorias anteriores"
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-borda bg-card text-foreground/70 shadow-md transition hover:text-foreground active:scale-90"
            >
              <IconeVoltar />
            </button>
            <button
              type="button"
              onClick={() => scrollChips(160)}
              aria-label="Próximas categorias"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 rotate-180 items-center justify-center rounded-full border border-borda bg-card text-foreground/70 shadow-md transition hover:text-foreground active:scale-90"
            >
              <IconeVoltar />
            </button>
          </div>

          <div className="mt-6 mb-8">
            <h2 className="font-display text-4xl tracking-wide text-foreground">
              {categoriaAtiva}
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {produtos
                .filter((p) => p.categoria === categoriaAtiva)
                .map((produto, index) => renderProdutoRow(produto, index))}
            </div>
          </div>
        </div>
      )}

      {tela === "checkout" && (
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={voltarParaProdutos}
            className="mb-3 inline-flex items-center gap-1 py-1 pr-3 text-sm font-medium text-foreground/60 transition hover:text-foreground"
          >
            <IconeVoltar />
            Adicionar mais itens
          </button>

          <h2 className="font-display text-4xl tracking-wide text-foreground">Finalizar pedido</h2>

          <div className="mt-4 rounded-2xl border border-borda bg-card px-5 py-2">
            <div className="divide-y divide-borda">{itensCarrinho.map(renderItemCarrinho)}</div>
          </div>

          <div className="mt-4 rounded-2xl border border-borda bg-card p-5">
            <h3 className="font-semibold text-foreground">Seus dados</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Nome completo"
                autoComplete="name"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className={inputClasse}
              />
              <input
                required
                type="tel"
                placeholder="Telefone / WhatsApp"
                autoComplete="tel"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                className={inputClasse}
              />
            </div>
            <input
              required
              placeholder="Endereço de entrega (rua, número, bairro)"
              autoComplete="street-address"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className={`mt-3 ${inputClasse}`}
            />
            <p className="mt-1.5 text-xs text-foreground/45">
              Entregamos em Alfenas-MG e região.
            </p>
            <textarea
              placeholder="Observações (opcional) — ex: troco pra R$ 100, ponto de referência"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className={`mt-3 ${inputClasse}`}
              rows={3}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-borda bg-card p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-foreground/70">Total</span>
              <span key={total} className="text-2xl font-bold text-foreground animate-pop">
                {formatarPreco(total)}
              </span>
            </div>
            <p className="mt-1 text-xs text-foreground/45">
              Pagamento combinado direto com a loja na entrega.
            </p>

            {erro && (
              <p className="mt-4 animate-fade-up rounded-xl bg-vermelho/15 px-4 py-2.5 text-sm text-vermelho-vivo">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-vermelho px-8 py-4 font-semibold text-white shadow-lg shadow-vermelho/30 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[130%] transition-transform duration-700 group-hover:translate-x-[130%]"
              />
              {enviando && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              <span className="relative">
                {enviando ? "Enviando..." : "Confirmar pedido"}
              </span>
            </button>
          </div>
        </div>
      )}

      {produtoDetalhe && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in sm:items-center"
          onClick={fecharDetalheProduto}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-md animate-slide-up overflow-y-auto rounded-t-3xl border border-borda bg-card sm:rounded-3xl"
          >
            <div className="relative p-3 pb-0">
              <FotoProduto
                produto={produtoDetalhe}
                sizes="448px"
                className="h-64 w-full rounded-2xl"
                padding="p-6"
              />
              <button
                type="button"
                onClick={fecharDetalheProduto}
                aria-label="Fechar"
                className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
              >
                <IconeFechar />
              </button>
            </div>

            <div className="p-6">
              {produtoDetalhe.destaque && (
                <span className="mb-2 inline-block rounded-md bg-vermelho/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-vermelho-vivo">
                  {produtoDetalhe.destaque}
                </span>
              )}
              <p className="text-xl font-semibold leading-snug text-foreground">
                {produtoDetalhe.nome}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatarPreco(produtoDetalhe.preco)}
              </p>
              {produtoDetalhe.descricao && (
                <p className="mt-3 text-sm leading-relaxed text-foreground/65">
                  {produtoDetalhe.descricao}
                </p>
              )}

              <div className="mt-6 flex items-center gap-3">
                <ControleQuantidade
                  tamanho="lg"
                  quantidade={carrinho[produtoDetalhe.id] ?? 0}
                  onMenos={() => alterarQuantidade(produtoDetalhe.id, -1)}
                  onMais={() => alterarQuantidade(produtoDetalhe.id, 1)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if ((carrinho[produtoDetalhe.id] ?? 0) === 0) {
                      alterarQuantidade(produtoDetalhe.id, 1);
                    } else {
                      fecharDetalheProduto();
                    }
                  }}
                  className="flex-1 rounded-full bg-vermelho px-6 py-3.5 font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
                >
                  {(carrinho[produtoDetalhe.id] ?? 0) === 0
                    ? "Adicionar"
                    : `Pronto · ${formatarPreco(produtoDetalhe.preco * (carrinho[produtoDetalhe.id] ?? 0))}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {carrinhoAberto && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in sm:items-center"
          onClick={() => setCarrinhoAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-md animate-slide-up overflow-y-auto rounded-t-3xl border border-borda bg-card p-6 sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl tracking-wide text-foreground">Seu carrinho</h2>
              <button
                type="button"
                onClick={() => setCarrinhoAberto(false)}
                className="rounded-full p-2 text-foreground/50 transition hover:bg-white/5 hover:text-foreground"
                aria-label="Fechar carrinho"
              >
                <IconeFechar />
              </button>
            </div>

            {itensCarrinho.length === 0 ? (
              <p className="mt-6 text-center text-foreground/60">Seu carrinho está vazio.</p>
            ) : (
              <>
                <div className="mt-2 divide-y divide-borda">
                  {itensCarrinho.map(renderItemCarrinho)}
                </div>

                <div className="mt-3 flex items-baseline justify-between border-t border-borda pt-4">
                  <span className="text-foreground/70">Total</span>
                  <span key={total} className="animate-pop text-2xl font-bold text-foreground">
                    {formatarPreco(total)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCarrinhoAberto(false);
                    setTela("checkout");
                  }}
                  className="mt-5 w-full rounded-full bg-vermelho px-6 py-3.5 font-semibold text-white shadow-lg shadow-vermelho/30 transition hover:brightness-110 active:scale-[0.98]"
                >
                  Continuar pedido
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setCarrinhoAberto(false)}
              className="mt-2 w-full rounded-full px-6 py-3 text-sm font-medium text-foreground/60 transition hover:text-foreground"
            >
              Continuar comprando
            </button>
          </div>
        </div>
      )}

      {qtdTotalItens > 0 && tela !== "checkout" && (
        <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4 sm:pb-6">
          <button
            type="button"
            onClick={() => setCarrinhoAberto(true)}
            className="mx-auto flex w-full max-w-md animate-slide-up items-center gap-3 rounded-full bg-vermelho py-2.5 pl-2.5 pr-5 text-white shadow-[0_10px_40px_rgba(200,16,46,0.45)] ring-1 ring-white/10 transition hover:brightness-110 active:scale-[0.98]"
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
              <IconeSacola />
              <span
                key={qtdTotalItens}
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-vermelho animate-pop"
              >
                {qtdTotalItens}
              </span>
            </span>
            <span className="flex-1 text-left font-semibold">Ver carrinho</span>
            <span key={total} className="font-bold tabular-nums animate-pop">
              {formatarPreco(total)}
            </span>
          </button>
        </div>
      )}
    </form>
  );
}
