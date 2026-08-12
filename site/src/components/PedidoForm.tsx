"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Produto, Categoria } from "@/lib/db";

type Carrinho = Record<string, number>;

export function PedidoForm({
  produtosIniciais,
  categoriasIniciais,
}: {
  produtosIniciais: Produto[];
  categoriasIniciais: Categoria[];
}) {
  const produtos = produtosIniciais;
  const categoriaIcone = useMemo(
    () => Object.fromEntries(categoriasIniciais.map((c) => [c.nome, c.icone])),
    [categoriasIniciais]
  );
  const categorias = useMemo(() => {
    const presentes = new Set(produtos.map((p) => p.categoria));
    const ordenadas = categoriasIniciais
      .filter((c) => presentes.has(c.nome))
      .map((c) => c.nome);
    const semCategoria = Array.from(presentes).filter((c) => !ordenadas.includes(c));
    return [...ordenadas, ...semCategoria];
  }, [produtos, categoriasIniciais]);

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
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-semibold text-white transition hover:brightness-95 active:scale-95"
          >
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
            className="mt-4 rounded-full border border-borda px-6 py-2 font-medium text-foreground/70 transition hover:border-vermelho hover:text-vermelho active:scale-95"
          >
            Fazer outro pedido
          </button>
        </div>
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
                .map((produto, index) => {
                  const quantidade = carrinho[produto.id] ?? 0;
                  return (
                    <div
                      key={produto.id}
                      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
                      className={`flex animate-fade-up items-center gap-4 rounded-lg border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        quantidade > 0 ? "border-vermelho" : "border-borda"
                      }`}
                    >
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-preto text-2xl">
                        {produto.imagem ? (
                          <Image
                            src={produto.imagem}
                            alt={produto.nome}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          categoriaIcone[categoria] ?? "🍹"
                        )}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-medium">{produto.nome}</p>
                          {produto.destaque && (
                            <span className="shrink-0 rounded-full bg-vermelho/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-vermelho">
                              {produto.destaque}
                            </span>
                          )}
                        </div>
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
