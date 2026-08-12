"use client";

import { useState } from "react";
import type { Categoria } from "@/lib/db";
import { AdminNav } from "../AdminNav";

export function GerenciarCategorias({
  categoriasIniciais,
  qtdPorCategoria,
  adminNome,
}: {
  categoriasIniciais: Categoria[];
  qtdPorCategoria: Record<string, number>;
  adminNome: string;
}) {
  const [categorias, setCategorias] = useState(
    [...categoriasIniciais].sort((a, b) => a.ordem - b.ordem)
  );
  const [novoNome, setNovoNome] = useState("");
  const [novoIcone, setNovoIcone] = useState("🍹");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [editandoNome, setEditandoNome] = useState<string | null>(null);
  const [nomeEmEdicao, setNomeEmEdicao] = useState("");

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!novoNome.trim()) return;

    setSalvando(true);
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome.trim(), icone: novoIcone.trim() || "🍹" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível criar.");
        return;
      }
      setCategorias((atual) => [
        ...atual,
        { nome: novoNome.trim(), icone: novoIcone.trim() || "🍹", ordem: atual.length },
      ]);
      setNovoNome("");
      setNovoIcone("🍹");
    } finally {
      setSalvando(false);
    }
  }

  async function mudarIcone(nome: string, icone: string) {
    setCategorias((atual) =>
      atual.map((c) => (c.nome === nome ? { ...c, icone } : c))
    );
    await fetch(`/api/categorias/${encodeURIComponent(nome)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icone }),
    });
  }

  async function mover(nome: string, direcao: -1 | 1) {
    const index = categorias.findIndex((c) => c.nome === nome);
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= categorias.length) return;

    const nova = [...categorias];
    [nova[index], nova[alvo]] = [nova[alvo], nova[index]];
    const comOrdemAtualizada = nova.map((c, i) => ({ ...c, ordem: i }));
    setCategorias(comOrdemAtualizada);

    await Promise.all([
      fetch(`/api/categorias/${encodeURIComponent(nova[index].nome)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem: index }),
      }),
      fetch(`/api/categorias/${encodeURIComponent(nova[alvo].nome)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem: alvo }),
      }),
    ]);
  }

  function comecarRenomear(nome: string) {
    setEditandoNome(nome);
    setNomeEmEdicao(nome);
    setErro(null);
  }

  async function salvarRenomear(nomeAtual: string) {
    if (!nomeEmEdicao.trim() || nomeEmEdicao.trim() === nomeAtual) {
      setEditandoNome(null);
      return;
    }

    setErro(null);
    const res = await fetch(`/api/categorias/${encodeURIComponent(nomeAtual)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novoNome: nomeEmEdicao.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.error ?? "Não foi possível renomear.");
      return;
    }

    setCategorias((atual) =>
      atual.map((c) => (c.nome === nomeAtual ? { ...c, nome: nomeEmEdicao.trim() } : c))
    );
    setEditandoNome(null);
  }

  async function excluir(categoria: Categoria) {
    const qtd = qtdPorCategoria[categoria.nome] ?? 0;
    if (qtd > 0) {
      setErro(
        `"${categoria.nome}" ainda tem ${qtd} produto(s). Mova ou apague eles antes de excluir a categoria.`
      );
      return;
    }
    if (!window.confirm(`Excluir a categoria "${categoria.nome}"?`)) return;

    const res = await fetch(`/api/categorias/${encodeURIComponent(categoria.nome)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCategorias((atual) => atual.filter((c) => c.nome !== categoria.nome));
    }
  }

  return (
    <div className="min-h-screen bg-card">
      <AdminNav adminNome={adminNome} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <form
          onSubmit={criar}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-borda bg-background p-6"
        >
          <div>
            <label className="text-xs text-foreground/60">Ícone</label>
            <input
              value={novoIcone}
              onChange={(e) => setNovoIcone(e.target.value)}
              maxLength={4}
              className="mt-1 w-16 rounded-md border border-borda px-3 py-2 text-center text-lg"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-foreground/60">Nova categoria</label>
            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Ex: Energéticos"
              className="mt-1 w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
            />
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-full bg-vermelho px-6 py-2 font-medium text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            Adicionar
          </button>
        </form>

        {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

        <div className="mt-6 space-y-2">
          {categorias.map((categoria, index) => (
            <div
              key={categoria.nome}
              className="flex items-center gap-3 rounded-lg border border-borda bg-background p-3"
            >
              <div className="flex flex-col">
                <button
                  onClick={() => mover(categoria.nome, -1)}
                  disabled={index === 0}
                  className="text-foreground/40 hover:text-vermelho disabled:opacity-20"
                  title="Subir"
                >
                  ▲
                </button>
                <button
                  onClick={() => mover(categoria.nome, 1)}
                  disabled={index === categorias.length - 1}
                  className="text-foreground/40 hover:text-vermelho disabled:opacity-20"
                  title="Descer"
                >
                  ▼
                </button>
              </div>

              <input
                value={categoria.icone}
                onChange={(e) => mudarIcone(categoria.nome, e.target.value)}
                maxLength={4}
                className="w-12 rounded-md border border-borda px-2 py-1.5 text-center text-lg"
              />

              {editandoNome === categoria.nome ? (
                <input
                  autoFocus
                  value={nomeEmEdicao}
                  onChange={(e) => setNomeEmEdicao(e.target.value)}
                  onBlur={() => salvarRenomear(categoria.nome)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") salvarRenomear(categoria.nome);
                    if (e.key === "Escape") setEditandoNome(null);
                  }}
                  className="flex-1 rounded-md border border-vermelho px-3 py-1.5 focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => comecarRenomear(categoria.nome)}
                  className="flex-1 text-left font-medium hover:text-vermelho"
                  title="Clique pra renomear"
                >
                  {categoria.nome}
                </button>
              )}

              <span className="text-xs text-foreground/50">
                {qtdPorCategoria[categoria.nome] ?? 0} produto(s)
              </span>

              <button
                onClick={() => excluir(categoria)}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Excluir
              </button>
            </div>
          ))}

          {categorias.length === 0 && (
            <p className="text-center text-foreground/60 py-20">
              Nenhuma categoria ainda — cria a primeira acima.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
