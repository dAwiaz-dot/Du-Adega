"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Produto, EstoqueMovimento } from "@/lib/db";
import { ESTOQUE_BAIXO } from "@/lib/constantes";
import { AdminNav } from "../AdminNav";

type Movimento = EstoqueMovimento & { produto_nome: string };
type TipoAcao = "entrada" | "perda" | "contagem";
type Filtro = "controlados" | "atencao" | "sem_controle";

const TIPO_LABEL: Record<EstoqueMovimento["tipo"], string> = {
  venda_online: "Venda no site",
  venda_pdv: "Venda no balcão",
  ajuste: "Contagem / ajuste",
  entrada: "Entrada (chegou mercadoria)",
  perda: "Saída (perda, quebra, consumo)",
  devolucao: "Devolução (pedido cancelado)",
};

const ACAO_INFO: Record<TipoAcao, { titulo: string; campo: string; obs: string; botao: string }> = {
  entrada: {
    titulo: "Entrada de mercadoria",
    campo: "Quantas unidades chegaram?",
    obs: "Obs. (opcional, ex: fornecedor, nota)",
    botao: "Somar ao estoque",
  },
  perda: {
    titulo: "Saída / perda",
    campo: "Quantas unidades saíram?",
    obs: "Motivo (ex: quebrou, venceu, consumo)",
    botao: "Tirar do estoque",
  },
  contagem: {
    titulo: "Contagem",
    campo: "Quantas unidades tem na prateleira agora?",
    obs: "Obs. (opcional)",
    botao: "Salvar contagem",
  },
};

export function ControleEstoque({
  movimentosIniciais,
  produtosIniciais,
  adminNome,
}: {
  movimentosIniciais: Movimento[];
  produtosIniciais: Produto[];
  adminNome: string;
}) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [movimentos, setMovimentos] = useState(movimentosIniciais);
  const [filtro, setFiltro] = useState<Filtro>(
    produtosIniciais.some((p) => p.estoque !== null) ? "controlados" : "sem_controle"
  );
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [acao, setAcao] = useState<{ produtoId: string; tipo: TipoAcao } | null>(null);
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [historicoDe, setHistoricoDe] = useState("todos");
  const historicoRef = useRef<HTMLElement>(null);

  const contagem = useMemo(() => {
    const controlados = produtos.filter((p) => p.estoque !== null);
    return {
      controlados: controlados.length,
      atencao: controlados.filter((p) => (p.estoque ?? 0) <= ESTOQUE_BAIXO).length,
      zerados: controlados.filter((p) => (p.estoque ?? 0) <= 0).length,
      semControle: produtos.length - controlados.length,
    };
  }, [produtos]);

  const categorias = useMemo(
    () => Array.from(new Set(produtos.map((p) => p.categoria))).sort((a, b) => a.localeCompare(b)),
    [produtos]
  );

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos
      .filter((p) => {
        if (filtro === "controlados" && p.estoque === null) return false;
        if (filtro === "atencao" && (p.estoque === null || p.estoque > ESTOQUE_BAIXO)) return false;
        if (filtro === "sem_controle" && p.estoque !== null) return false;
        if (categoria !== "todas" && p.categoria !== categoria) return false;
        if (
          termo &&
          !p.nome.toLowerCase().includes(termo) &&
          !(p.codigo_barras ?? "").toLowerCase().includes(termo)
        )
          return false;
        return true;
      })
      .sort((a, b) =>
        filtro === "atencao" ? (a.estoque ?? 0) - (b.estoque ?? 0) : a.nome.localeCompare(b.nome)
      );
  }, [produtos, filtro, categoria, busca]);

  const movimentosVisiveis = useMemo(
    () => (historicoDe === "todos" ? movimentos : movimentos.filter((m) => m.produto_id === historicoDe)),
    [movimentos, historicoDe]
  );

  function abrirAcao(produtoId: string, tipo: TipoAcao) {
    setAcao({ produtoId, tipo });
    setQuantidade("");
    setObservacao("");
    setErro(null);
    setAviso(null);
  }

  function fecharAcao() {
    setAcao(null);
    setErro(null);
  }

  function verHistorico(produtoId: string) {
    setHistoricoDe(produtoId);
    requestAnimationFrame(() => historicoRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  async function confirmarAcao(e: React.FormEvent, produto: Produto) {
    e.preventDefault();
    if (!acao) return;
    const qtd = Number(quantidade);
    if (!Number.isInteger(qtd) || qtd < 0 || (acao.tipo !== "contagem" && qtd === 0)) {
      setErro("Digite uma quantidade válida (número inteiro).");
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/estoque/movimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId: produto.id,
          tipo: acao.tipo,
          quantidade: qtd,
          observacao: observacao.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProdutos((atual) =>
        atual.map((p) => (p.id === produto.id ? { ...p, estoque: data.estoque } : p))
      );
      setAviso(`${produto.nome}: estoque agora é ${data.estoque}.`);
      setAcao(null);

      const resMov = await fetch("/api/estoque/movimentos");
      if (resMov.ok) setMovimentos((await resMov.json()).movimentos);
    } catch (err) {
      setErro(err instanceof Error && err.message ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function previa(produto: Produto): number | null {
    if (!acao) return null;
    const qtd = Number(quantidade);
    if (quantidade === "" || !Number.isFinite(qtd)) return null;
    const atual = produto.estoque ?? 0;
    if (acao.tipo === "entrada") return atual + qtd;
    if (acao.tipo === "perda") return atual - qtd;
    return qtd;
  }

  const abas: { id: Filtro; label: string; qtd: number }[] = [
    { id: "controlados", label: "Com controle", qtd: contagem.controlados },
    { id: "atencao", label: "Baixo ou zerado", qtd: contagem.atencao },
    { id: "sem_controle", label: "Sem controle", qtd: contagem.semControle },
  ];

  return (
    <div className="min-h-screen bg-card">
      <AdminNav adminNome={adminNome} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <h2 className="font-display text-2xl tracking-wide text-preto">Estoque</h2>
        <p className="text-sm text-foreground/60">
          Chegou mercadoria? Use <b>Entrada</b>. Quebrou ou venceu? <b>Saída</b>. Contou a prateleira?{" "}
          <b>Contagem</b>. As vendas do site e do balcão já descontam sozinhas.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Resumo titulo="Com controle" valor={contagem.controlados} />
          <Resumo titulo="Estoque baixo" valor={contagem.atencao - contagem.zerados} tom="amarelo" />
          <Resumo titulo="Zerados" valor={contagem.zerados} tom="vermelho" />
          <Resumo titulo="Sem controle" valor={contagem.semControle} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setFiltro(aba.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filtro === aba.id
                  ? "border-vermelho bg-vermelho text-white"
                  : "border-borda bg-background hover:border-vermelho hover:text-vermelho"
              }`}
            >
              {aba.label} <span className="opacity-70">({aba.qtd})</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            placeholder="Buscar por nome ou código de barras..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-md border border-borda bg-background px-3 py-2 text-sm transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20 sm:max-w-sm"
          />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="rounded-md border border-borda bg-background px-3 py-2 text-sm focus:border-vermelho focus:outline-none"
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {aviso && (
          <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            ✓ {aviso}
          </p>
        )}

        <div className="mt-4 divide-y divide-borda rounded-lg border border-borda bg-background">
          {lista.length === 0 && (
            <p className="p-10 text-center text-sm text-foreground/60">
              {filtro === "atencao"
                ? "Nenhum produto com estoque baixo. Tudo em ordem."
                : "Nenhum produto encontrado com esse filtro."}
            </p>
          )}

          {lista.map((produto) => {
            const aberto = acao?.produtoId === produto.id;
            const controlado = produto.estoque !== null;
            const valorPrevia = aberto ? previa(produto) : null;

            return (
              <div key={produto.id} className={aberto ? "bg-card" : ""}>
                <div className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-4">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-preto">
                    {produto.imagem ? (
                      <Image src={produto.imagem} alt="" fill sizes="44px" className="object-cover" />
                    ) : (
                      <span className="text-white/60">{produto.nome.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{produto.nome}</p>
                    <p className="text-xs text-foreground/50">{produto.categoria}</p>
                  </div>

                  <QuantidadeEstoque estoque={produto.estoque} />

                  <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                    {controlado ? (
                      <>
                        <BotaoAcao ativo={aberto && acao?.tipo === "entrada"} onClick={() => abrirAcao(produto.id, "entrada")}>
                          + Entrada
                        </BotaoAcao>
                        <BotaoAcao ativo={aberto && acao?.tipo === "perda"} onClick={() => abrirAcao(produto.id, "perda")}>
                          − Saída
                        </BotaoAcao>
                        <BotaoAcao ativo={aberto && acao?.tipo === "contagem"} onClick={() => abrirAcao(produto.id, "contagem")}>
                          Contagem
                        </BotaoAcao>
                        <button
                          onClick={() => verHistorico(produto.id)}
                          title="Ver histórico desse produto"
                          className="rounded-md px-2 py-2 text-sm text-foreground/50 hover:text-vermelho"
                        >
                          Histórico
                        </button>
                      </>
                    ) : (
                      <BotaoAcao ativo={aberto} onClick={() => abrirAcao(produto.id, "contagem")}>
                        Começar a controlar
                      </BotaoAcao>
                    )}
                  </div>
                </div>

                {aberto && acao && (
                  <form
                    onSubmit={(e) => confirmarAcao(e, produto)}
                    className="border-t border-borda px-3 pb-4 pt-3 sm:px-4"
                  >
                    <p className="text-sm font-semibold">
                      {controlado ? ACAO_INFO[acao.tipo].titulo : "Começar a controlar o estoque"}
                    </p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
                      <label className="text-xs text-foreground/60">
                        {ACAO_INFO[acao.tipo].campo}
                        <input
                          autoFocus
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          value={quantidade}
                          onChange={(e) => setQuantidade(e.target.value)}
                          className="mt-1 w-full rounded-md border border-borda bg-background px-3 py-2 text-base text-foreground focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
                        />
                      </label>
                      <label className="text-xs text-foreground/60">
                        {ACAO_INFO[acao.tipo].obs}
                        <input
                          value={observacao}
                          onChange={(e) => setObservacao(e.target.value)}
                          className="mt-1 w-full rounded-md border border-borda bg-background px-3 py-2 text-sm text-foreground focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={salvando}
                          className="rounded-full bg-vermelho px-5 py-2 text-sm font-medium text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60"
                        >
                          {salvando ? "Salvando..." : ACAO_INFO[acao.tipo].botao}
                        </button>
                        <button
                          type="button"
                          onClick={fecharAcao}
                          className="rounded-full border border-borda px-4 py-2 text-sm text-foreground/70 hover:border-vermelho hover:text-vermelho"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                    {valorPrevia !== null && (
                      <p className="mt-2 text-sm text-foreground/70">
                        Estoque vai ficar: <b className={valorPrevia < 0 ? "text-red-700" : ""}>{valorPrevia}</b>
                        {controlado && <span className="text-foreground/50"> (hoje: {produto.estoque})</span>}
                      </p>
                    )}
                    {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
                  </form>
                )}
              </div>
            );
          })}
        </div>

        <section ref={historicoRef} className="mt-10 scroll-mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-wide text-preto">Histórico</h2>
              <p className="text-sm text-foreground/60">Últimas movimentações de estoque.</p>
            </div>
            <select
              value={historicoDe}
              onChange={(e) => setHistoricoDe(e.target.value)}
              className="max-w-full rounded-md border border-borda bg-background px-3 py-2 text-sm focus:border-vermelho focus:outline-none"
            >
              <option value="todos">Todos os produtos</option>
              {produtos
                .filter((p) => p.estoque !== null)
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
            </select>
          </div>

          <div className="mt-4 divide-y divide-borda rounded-lg border border-borda bg-background">
            {movimentosVisiveis.length === 0 && (
              <p className="p-8 text-center text-sm text-foreground/60">
                Nenhuma movimentação ainda.
              </p>
            )}
            {movimentosVisiveis.map((mov) => (
              <div key={mov.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{mov.produto_nome}</p>
                  <p className="text-xs text-foreground/50">
                    {TIPO_LABEL[mov.tipo] ?? mov.tipo}
                    {mov.pedido_id ? ` · pedido #${mov.pedido_id}` : ""} · {mov.criado_em}
                  </p>
                  {mov.observacao && (
                    <p className="text-xs text-foreground/60">“{mov.observacao}”</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className={`font-semibold tabular-nums ${mov.quantidade < 0 ? "text-red-600" : "text-green-700"}`}>
                    {mov.quantidade > 0 ? "+" : ""}
                    {mov.quantidade}
                  </p>
                  <p className="text-xs text-foreground/50">ficou: {mov.estoque_resultante}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
  tom,
}: {
  titulo: string;
  valor: number;
  tom?: "amarelo" | "vermelho";
}) {
  const cor =
    valor > 0 && tom === "vermelho"
      ? "text-red-700"
      : valor > 0 && tom === "amarelo"
        ? "text-amber-700"
        : "";
  return (
    <div className="rounded-lg border border-borda bg-background p-4">
      <p className="text-xs text-foreground/60">{titulo}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${cor}`}>{valor}</p>
    </div>
  );
}

function QuantidadeEstoque({ estoque }: { estoque: number | null }) {
  if (estoque === null) {
    return <span className="shrink-0 text-xs text-foreground/40">sem controle</span>;
  }
  const cor =
    estoque <= 0
      ? "bg-red-100 text-red-700"
      : estoque <= ESTOQUE_BAIXO
        ? "bg-amber-100 text-amber-800"
        : "bg-green-50 text-green-800";
  const rotulo = estoque <= 0 ? "zerado" : estoque <= ESTOQUE_BAIXO ? "baixo" : "un";
  return (
    <span className={`shrink-0 rounded-md px-3 py-1 text-center tabular-nums ${cor}`}>
      <span className="text-lg font-semibold">{estoque}</span>{" "}
      <span className="text-xs">{rotulo}</span>
    </span>
  );
}

function BotaoAcao({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium transition sm:flex-none ${
        ativo
          ? "border-vermelho bg-vermelho text-white"
          : "border-borda hover:border-vermelho hover:text-vermelho"
      }`}
    >
      {children}
    </button>
  );
}
