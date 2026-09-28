"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Produto } from "@/lib/db";
import { ESTOQUE_BAIXO } from "@/lib/constantes";
import { AdminNav } from "../AdminNav";

// Os dois flags do banco (ativo + mostrar_site) viram uma escolha só na tela.
type Visibilidade = "site" | "balcao" | "desativado";
type FiltroStatus = "todos" | Visibilidade | "sem_foto" | "sem_estoque";

function visibilidadeDe(p: Pick<Produto, "ativo" | "mostrar_site">): Visibilidade {
  if (!p.ativo) return "desativado";
  return p.mostrar_site ? "site" : "balcao";
}

function flagsDe(v: Visibilidade) {
  return { ativo: v === "desativado" ? 0 : 1, mostrar_site: v === "site" ? 1 : 0 };
}

const VISIBILIDADE_LABEL: Record<Visibilidade, string> = {
  site: "No site e no balcão",
  balcao: "Só no balcão (PDV)",
  desativado: "Desativado",
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type FormState = {
  id: string | null;
  nome: string;
  categoria: string;
  descricao: string;
  preco: string;
  destaque: string;
  imagem: string | null;
  codigoBarras: string;
  visibilidade: Visibilidade;
  controlarEstoque: boolean;
  estoqueInicial: string;
};

const FORM_VAZIO: FormState = {
  id: null,
  nome: "",
  categoria: "",
  descricao: "",
  preco: "",
  destaque: "",
  imagem: null,
  codigoBarras: "",
  visibilidade: "site",
  controlarEstoque: false,
  estoqueInicial: "",
};

const inputClass =
  "w-full rounded-md border border-borda bg-background px-3 py-2 text-foreground transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20";

export function GerenciarProdutos({
  produtosIniciais,
  adminNome,
}: {
  produtosIniciais: Produto[];
  adminNome: string;
}) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [form, setForm] = useState<FormState | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>("todos");
  const [busca, setBusca] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const produtoEditado = form?.id ? produtos.find((p) => p.id === form.id) ?? null : null;

  useEffect(() => {
    if (!form) return;
    function aoApertar(e: KeyboardEvent) {
      if (e.key === "Escape" && !salvando) fechar();
    }
    window.addEventListener("keydown", aoApertar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", aoApertar);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form !== null, salvando]);

  const categoriasExistentes = useMemo(
    () => Array.from(new Set(produtos.map((p) => p.categoria))).sort((a, b) => a.localeCompare(b)),
    [produtos]
  );

  const contagemStatus = useMemo(() => {
    const c = { todos: produtos.length, site: 0, balcao: 0, desativado: 0, sem_foto: 0, sem_estoque: 0 };
    for (const p of produtos) {
      c[visibilidadeDe(p)] += 1;
      if (!p.imagem) c.sem_foto += 1;
      if (p.estoque !== null && p.estoque <= 0) c.sem_estoque += 1;
    }
    return c;
  }, [produtos]);

  const produtosPorCategoria = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = produtos.filter((p) => {
      if (categoriaFiltro !== "todas" && p.categoria !== categoriaFiltro) return false;
      if (statusFiltro === "sem_foto" && p.imagem) return false;
      if (statusFiltro === "sem_estoque" && !(p.estoque !== null && p.estoque <= 0)) return false;
      if (
        (statusFiltro === "site" || statusFiltro === "balcao" || statusFiltro === "desativado") &&
        visibilidadeDe(p) !== statusFiltro
      )
        return false;
      if (
        termo &&
        !p.nome.toLowerCase().includes(termo) &&
        !(p.codigo_barras ?? "").toLowerCase().includes(termo)
      )
        return false;
      return true;
    });
    const grupos: Record<string, Produto[]> = {};
    for (const produto of filtrados) {
      grupos[produto.categoria] = grupos[produto.categoria] ?? [];
      grupos[produto.categoria].push(produto);
    }
    return grupos;
  }, [produtos, categoriaFiltro, statusFiltro, busca]);

  const totalFiltrado = Object.values(produtosPorCategoria).reduce((s, l) => s + l.length, 0);

  function novo() {
    setForm({
      ...FORM_VAZIO,
      categoria: categoriaFiltro !== "todas" ? categoriaFiltro : "",
    });
    setErro(null);
    setAviso(null);
  }

  function editar(produto: Produto) {
    setForm({
      id: produto.id,
      nome: produto.nome,
      categoria: produto.categoria,
      descricao: produto.descricao,
      preco: produto.preco.toFixed(2).replace(".", ","),
      destaque: produto.destaque ?? "",
      imagem: produto.imagem,
      codigoBarras: produto.codigo_barras ?? "",
      visibilidade: visibilidadeDe(produto),
      controlarEstoque: produto.estoque !== null,
      estoqueInicial: "",
    });
    setErro(null);
    setAviso(null);
  }

  function fechar() {
    setForm(null);
    setErro(null);
  }

  async function enviarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setEnviandoFoto(true);
    setErro(null);
    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? "Não foi possível enviar a foto.");
        return;
      }

      setForm((atual) => (atual ? { ...atual, imagem: data.url } : atual));
    } catch {
      setErro("Erro de conexão ao enviar a foto.");
    } finally {
      setEnviandoFoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErro(null);

    // Aceita "29,90", "1.299,90" e "29.90".
    const precoTexto = form.preco.trim();
    const preco = precoTexto.includes(",")
      ? Number(precoTexto.replace(/\./g, "").replace(",", "."))
      : Number(precoTexto);
    if (!form.nome.trim() || !form.categoria.trim() || !preco || preco <= 0) {
      setErro("Preencha nome, categoria e um preço válido.");
      return;
    }

    const estoqueInicial = form.estoqueInicial.trim() === "" ? 0 : Number(form.estoqueInicial);
    if (form.controlarEstoque && (!Number.isInteger(estoqueInicial) || estoqueInicial < 0)) {
      setErro("Quantidade em estoque precisa ser um número inteiro.");
      return;
    }

    const base = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim(),
      descricao: form.descricao.trim(),
      preco,
      destaque: form.destaque.trim() || null,
      imagem: form.imagem,
      codigo_barras: form.codigoBarras.trim() || null,
      ...flagsDe(form.visibilidade),
    };

    setSalvando(true);
    try {
      if (form.id && produtoEditado) {
        // Estoque só vai no PATCH quando o controle foi ligado/desligado aqui.
        // Quantidade do dia a dia é mexida na tela de Estoque, pra uma venda
        // no meio da edição não ser sobrescrita pelo número velho da tela.
        const payload: Record<string, unknown> = { ...base };
        const tinhaControle = produtoEditado.estoque !== null;
        if (form.controlarEstoque && !tinhaControle) payload.estoque = estoqueInicial;
        if (!form.controlarEstoque && tinhaControle) payload.estoque = null;

        const res = await fetch(`/api/produtos/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        setProdutos((atual) =>
          atual.map((p) => (p.id === form.id ? ({ ...p, ...payload } as Produto) : p))
        );
        setAviso(`"${base.nome}" atualizado.`);
      } else {
        const res = await fetch("/api/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...base,
            mostrar_site: base.mostrar_site === 1,
            estoque: form.controlarEstoque ? estoqueInicial : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setProdutos((atual) => [
          ...atual,
          {
            ...base,
            id: data.id,
            ativo: 1,
            estoque: form.controlarEstoque ? estoqueInicial : null,
            ordem: atual.length,
            criado_em: "",
          },
        ]);
        setAviso(`"${base.nome}" adicionado.`);
      }

      setForm(null);
    } catch (err) {
      setErro(err instanceof Error && err.message ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function mudarVisibilidade(produto: Produto, v: Visibilidade) {
    const flags = flagsDe(v);
    const anterior = { ativo: produto.ativo, mostrar_site: produto.mostrar_site };
    setProdutos((atual) => atual.map((p) => (p.id === produto.id ? { ...p, ...flags } : p)));
    const res = await fetch(`/api/produtos/${produto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flags),
    }).catch(() => null);
    if (!res?.ok) {
      setProdutos((atual) => atual.map((p) => (p.id === produto.id ? { ...p, ...anterior } : p)));
      setAviso(`Não foi possível mudar "${produto.nome}". Tente de novo.`);
    }
  }

  async function excluir() {
    if (!produtoEditado) return;
    const ok = window.confirm(
      `Excluir "${produtoEditado.nome}" de vez?\n\nSe a ideia é só tirar de venda, use "Desativado" — assim o histórico e as fotos ficam guardados.`
    );
    if (!ok) return;
    setSalvando(true);
    const res = await fetch(`/api/produtos/${produtoEditado.id}`, { method: "DELETE" }).catch(
      () => null
    );
    setSalvando(false);
    if (!res?.ok) {
      setErro("Não foi possível excluir.");
      return;
    }
    setProdutos((atual) => atual.filter((p) => p.id !== produtoEditado.id));
    setAviso(`"${produtoEditado.nome}" excluído.`);
    setForm(null);
  }

  const abasStatus: { id: FiltroStatus; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "site", label: "No site" },
    { id: "balcao", label: "Só balcão" },
    { id: "desativado", label: "Desativados" },
    { id: "sem_foto", label: "Sem foto" },
    { id: "sem_estoque", label: "Sem estoque" },
  ];

  return (
    <div className="min-h-screen bg-card">
      <AdminNav adminNome={adminNome} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-wide text-preto">Produtos</h2>
            <p className="text-sm text-foreground/60">
              {produtos.length} cadastrados · clique num produto pra editar
            </p>
          </div>
          <button
            onClick={novo}
            className="rounded-full bg-vermelho px-5 py-2.5 font-medium text-white transition hover:brightness-110 active:scale-95"
          >
            + Novo produto
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            placeholder="Buscar por nome ou código de barras..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-md border border-borda bg-background px-3 py-2 text-sm transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20 sm:max-w-sm"
          />
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="rounded-md border border-borda bg-background px-3 py-2 text-sm focus:border-vermelho focus:outline-none"
          >
            <option value="todas">Todas as categorias</option>
            {categoriasExistentes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {abasStatus.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setStatusFiltro(aba.id)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                statusFiltro === aba.id
                  ? "border-vermelho bg-vermelho text-white"
                  : "border-borda bg-background hover:border-vermelho hover:text-vermelho"
              }`}
            >
              {aba.label} <span className="opacity-70">({contagemStatus[aba.id]})</span>
            </button>
          ))}
        </div>

        {aviso && (
          <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            {aviso}
          </p>
        )}

        {totalFiltrado !== produtos.length && (
          <p className="mt-4 text-sm text-foreground/60">
            Mostrando {totalFiltrado} de {produtos.length}.{" "}
            <button
              onClick={() => {
                setBusca("");
                setCategoriaFiltro("todas");
                setStatusFiltro("todos");
              }}
              className="font-medium text-vermelho hover:underline"
            >
              Limpar filtros
            </button>
          </p>
        )}

        <div className="mt-6 space-y-8">
          {Object.entries(produtosPorCategoria).map(([categoria, itens]) => (
            <div key={categoria}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-vermelho">
                {categoria} <span className="text-foreground/40">· {itens.length}</span>
              </h3>
              <div className="mt-2 divide-y divide-borda rounded-lg border border-borda bg-background">
                {itens.map((produto) => {
                  const vis = visibilidadeDe(produto);
                  return (
                    <div
                      key={produto.id}
                      className={`flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap ${
                        vis === "desativado" ? "opacity-55" : ""
                      }`}
                    >
                      <button
                        onClick={() => editar(produto)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-preto">
                          {produto.imagem ? (
                            <Image src={produto.imagem} alt="" fill sizes="48px" className="object-cover" />
                          ) : (
                            <span className="text-white/60">{produto.nome.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-medium">{produto.nome}</p>
                            {produto.destaque && (
                              <span className="rounded-full bg-vermelho/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-vermelho">
                                {produto.destaque}
                              </span>
                            )}
                            {!produto.imagem && (
                              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-foreground/60">
                                Sem foto
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground/60">
                            <span className="font-medium text-foreground">{brl.format(produto.preco)}</span>
                            <EstoqueTexto estoque={produto.estoque} />
                          </p>
                        </div>
                      </button>

                      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                        <select
                          value={vis}
                          onChange={(e) => mudarVisibilidade(produto, e.target.value as Visibilidade)}
                          aria-label={`Onde ${produto.nome} aparece`}
                          className={`flex-1 rounded-md border px-2 py-2 text-sm focus:border-vermelho focus:outline-none sm:flex-none ${
                            vis === "site"
                              ? "border-green-200 bg-green-50 text-green-800"
                              : vis === "balcao"
                                ? "border-borda bg-card"
                                : "border-borda bg-borda/40"
                          }`}
                        >
                          {(Object.keys(VISIBILIDADE_LABEL) as Visibilidade[]).map((v) => (
                            <option key={v} value={v}>
                              {VISIBILIDADE_LABEL[v]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => editar(produto)}
                          className="rounded-md border border-borda px-3 py-2 text-sm font-medium hover:border-vermelho hover:text-vermelho"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {totalFiltrado === 0 && (
            <p className="py-20 text-center text-foreground/60">
              {produtos.length === 0
                ? "Nenhum produto cadastrado ainda."
                : "Nenhum produto encontrado com esse filtro/busca."}
            </p>
          )}
        </div>
      </main>

      {form && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !salvando) fechar();
          }}
        >
          <form
            onSubmit={salvar}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-background shadow-2xl animate-slide-up sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-borda px-5 py-4">
              <h2 className="font-display text-xl tracking-wide text-preto">
                {form.id ? "Editar produto" : "Novo produto"}
              </h2>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-foreground/60 hover:bg-borda/40"
              >
                ×
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <fieldset className="space-y-3">
                <Campo rotulo="Nome do produto *">
                  <input
                    required
                    autoFocus={!form.id}
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className={inputClass}
                  />
                </Campo>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo rotulo="Categoria *" dica="Escolha uma existente ou digite uma nova">
                    <input
                      required
                      list="categorias-existentes"
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      className={inputClass}
                    />
                    <datalist id="categorias-existentes">
                      {categoriasExistentes.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </Campo>
                  <Campo rotulo="Preço (R$) *">
                    <input
                      required
                      inputMode="decimal"
                      placeholder="0,00"
                      value={form.preco}
                      onChange={(e) => setForm({ ...form, preco: e.target.value })}
                      className={inputClass}
                    />
                  </Campo>
                </div>
                <Campo rotulo="Descrição">
                  <textarea
                    rows={2}
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    className={inputClass}
                  />
                </Campo>
              </fieldset>

              <fieldset>
                <p className="text-sm font-medium">Foto</p>
                <div className="mt-2 flex items-center gap-4">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-preto">
                    {form.imagem ? (
                      <Image src={form.imagem} alt="" fill sizes="96px" className="object-cover" />
                    ) : (
                      <span className="text-xs text-white/50">sem foto</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={enviarFoto}
                      disabled={enviandoFoto}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={enviandoFoto}
                        className="rounded-md border border-borda px-3 py-2 text-sm font-medium hover:border-vermelho hover:text-vermelho disabled:opacity-60"
                      >
                        {enviandoFoto ? "Enviando..." : form.imagem ? "Trocar foto" : "Escolher foto"}
                      </button>
                      {form.imagem && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, imagem: null })}
                          className="rounded-md px-3 py-2 text-sm text-foreground/60 hover:text-vermelho"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-foreground/50">PNG, JPG, WEBP ou GIF, até 5MB</p>
                  </div>
                </div>
              </fieldset>

              <fieldset className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Onde aparece">
                  <select
                    value={form.visibilidade}
                    onChange={(e) => setForm({ ...form, visibilidade: e.target.value as Visibilidade })}
                    className={inputClass}
                  >
                    {(Object.keys(VISIBILIDADE_LABEL) as Visibilidade[])
                      .filter((v) => form.id || v !== "desativado")
                      .map((v) => (
                        <option key={v} value={v}>
                          {VISIBILIDADE_LABEL[v]}
                        </option>
                      ))}
                  </select>
                </Campo>
                <Campo rotulo="Selo (opcional)" dica='Ex: "Mais pedido", "Promoção"'>
                  <input
                    value={form.destaque}
                    onChange={(e) => setForm({ ...form, destaque: e.target.value })}
                    className={inputClass}
                  />
                </Campo>
                <Campo rotulo="Código de barras (opcional)" dica="Bipe com o leitor aqui dentro">
                  <input
                    value={form.codigoBarras}
                    onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })}
                    className={inputClass}
                  />
                </Campo>
              </fieldset>

              <fieldset className="rounded-lg border border-borda p-4">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.controlarEstoque}
                    onChange={(e) => setForm({ ...form, controlarEstoque: e.target.checked })}
                    className="h-4 w-4 accent-vermelho"
                  />
                  Controlar estoque desse produto
                </label>
                <p className="mt-1 text-xs text-foreground/50">
                  Com controle, cada venda desconta sozinha e o produto trava quando zera.
                </p>

                {form.controlarEstoque && produtoEditado?.estoque != null && (
                  <p className="mt-3 text-sm">
                    Estoque atual: <b>{produtoEditado.estoque}</b>.{" "}
                    <Link href="/admin/estoque" className="font-medium text-vermelho hover:underline">
                      Dar entrada ou corrigir na tela de Estoque
                    </Link>
                  </p>
                )}

                {form.controlarEstoque && (produtoEditado === null || produtoEditado.estoque === null) && (
                  <div className="mt-3 max-w-[200px]">
                    <Campo rotulo="Quantidade que tem agora">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        placeholder="0"
                        value={form.estoqueInicial}
                        onChange={(e) => setForm({ ...form, estoqueInicial: e.target.value })}
                        className={inputClass}
                      />
                    </Campo>
                  </div>
                )}

                {!form.controlarEstoque && produtoEditado?.estoque != null && (
                  <p className="mt-3 text-sm text-amber-800">
                    Ao salvar, esse produto para de controlar estoque (hoje tem {produtoEditado.estoque}).
                  </p>
                )}
              </fieldset>

              {form.id && (
                <div className="border-t border-borda pt-4">
                  <button
                    type="button"
                    onClick={excluir}
                    disabled={salvando}
                    className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
                  >
                    Excluir produto de vez
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-borda px-5 py-4">
              {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={salvando || enviandoFoto}
                  className="flex-1 rounded-full bg-vermelho px-6 py-2.5 font-medium text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60 sm:flex-none"
                >
                  {salvando ? "Salvando..." : form.id ? "Salvar alterações" : "Adicionar produto"}
                </button>
                <button
                  type="button"
                  onClick={fechar}
                  disabled={salvando}
                  className="rounded-full border border-borda px-6 py-2.5 font-medium text-foreground/70 transition hover:border-vermelho hover:text-vermelho"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Campo({
  rotulo,
  dica,
  children,
}: {
  rotulo: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{rotulo}</span>
      <div className="mt-1">{children}</div>
      {dica && <span className="mt-1 block text-xs text-foreground/50">{dica}</span>}
    </label>
  );
}

function EstoqueTexto({ estoque }: { estoque: number | null }) {
  if (estoque === null) return null;
  if (estoque <= 0) return <span className="font-medium text-red-700"> · sem estoque</span>;
  if (estoque <= ESTOQUE_BAIXO)
    return <span className="font-medium text-amber-700"> · estoque baixo: {estoque}</span>;
  return <span className="text-foreground/50"> · {estoque} em estoque</span>;
}
