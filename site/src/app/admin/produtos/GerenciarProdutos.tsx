"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Produto } from "@/lib/db";
import { ESTOQUE_BAIXO } from "@/lib/constantes";
import { AdminNav } from "../AdminNav";

type FormState = {
  id: string | null;
  nome: string;
  categoria: string;
  descricao: string;
  preco: string;
  destaque: string;
  imagem: string | null;
  estoque: string;
  codigoBarras: string;
};

const FORM_VAZIO: FormState = {
  id: null,
  nome: "",
  categoria: "",
  descricao: "",
  preco: "",
  destaque: "",
  imagem: null,
  estoque: "",
  codigoBarras: "",
};

export function GerenciarProdutos({
  produtosIniciais,
  adminNome,
}: {
  produtosIniciais: Produto[];
  adminNome: string;
}) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const categoriasExistentes = useMemo(
    () => Array.from(new Set(produtos.map((p) => p.categoria))),
    [produtos]
  );

  const produtosPorCategoria = useMemo(() => {
    const grupos: Record<string, Produto[]> = {};
    for (const produto of produtos) {
      grupos[produto.categoria] = grupos[produto.categoria] ?? [];
      grupos[produto.categoria].push(produto);
    }
    return grupos;
  }, [produtos]);

  function editar(produto: Produto) {
    setForm({
      id: produto.id,
      nome: produto.nome,
      categoria: produto.categoria,
      descricao: produto.descricao,
      preco: String(produto.preco),
      destaque: produto.destaque ?? "",
      imagem: produto.imagem,
      estoque: produto.estoque === null ? "" : String(produto.estoque),
      codigoBarras: produto.codigo_barras ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setForm(FORM_VAZIO);
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

      setForm((atual) => ({ ...atual, imagem: data.url }));
    } catch {
      setErro("Erro de conexão ao enviar a foto.");
    } finally {
      setEnviandoFoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const preco = Number(form.preco.replace(",", "."));
    if (!form.nome.trim() || !form.categoria.trim() || !preco || preco <= 0) {
      setErro("Preencha nome, categoria e um preço válido.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        categoria: form.categoria.trim(),
        descricao: form.descricao.trim(),
        preco,
        destaque: form.destaque.trim() || null,
        imagem: form.imagem,
        estoque: form.estoque.trim() === "" ? null : Number(form.estoque),
        codigo_barras: form.codigoBarras.trim() || null,
      };

      if (form.id) {
        const res = await fetch(`/api/produtos/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        setProdutos((atual) =>
          atual.map((p) => (p.id === form.id ? { ...p, ...payload } : p))
        );
      } else {
        const res = await fetch("/api/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setProdutos((atual) => [
          ...atual,
          { ...payload, id: data.id, ativo: 1, mostrar_site: 1, ordem: atual.length, criado_em: "" },
        ]);
      }

      setForm(FORM_VAZIO);
    } catch (err) {
      setErro(err instanceof Error && err.message ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(produto: Produto) {
    const novoAtivo = produto.ativo ? 0 : 1;
    setProdutos((atual) =>
      atual.map((p) => (p.id === produto.id ? { ...p, ativo: novoAtivo } : p))
    );
    await fetch(`/api/produtos/${produto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: novoAtivo }),
    });
  }

  async function alternarMostrarSite(produto: Produto) {
    const novoValor = produto.mostrar_site ? 0 : 1;
    setProdutos((atual) =>
      atual.map((p) => (p.id === produto.id ? { ...p, mostrar_site: novoValor } : p))
    );
    await fetch(`/api/produtos/${produto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mostrar_site: novoValor }),
    });
  }

  async function excluir(produto: Produto) {
    if (!window.confirm(`Excluir "${produto.nome}"? Não dá pra desfazer.`)) return;
    setProdutos((atual) => atual.filter((p) => p.id !== produto.id));
    await fetch(`/api/produtos/${produto.id}`, { method: "DELETE" });
  }

  return (
    <div className="min-h-screen bg-card">
      <AdminNav adminNome={adminNome} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <form
          onSubmit={salvar}
          className="rounded-lg border border-borda bg-background p-6"
        >
          <h2 className="font-display text-2xl tracking-wide text-preto">
            {form.id ? "Editar produto" : "Novo produto"}
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Nome do produto"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
            />
            <input
              required
              list="categorias-existentes"
              placeholder="Categoria (ex: Vinhos)"
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
              className="rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
            />
            <datalist id="categorias-existentes">
              {categoriasExistentes.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <textarea
            placeholder="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            className="mt-4 w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
            rows={2}
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              required
              inputMode="decimal"
              placeholder="Preço (ex: 29.90)"
              value={form.preco}
              onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))}
              className="rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
            />
            <input
              placeholder="Selo (opcional, ex: Mais pedido)"
              value={form.destaque}
              onChange={(e) => setForm((f) => ({ ...f, destaque: e.target.value }))}
              className="rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Estoque (deixe vazio pra não controlar)"
                value={form.estoque}
                onChange={(e) => setForm((f) => ({ ...f, estoque: e.target.value }))}
                className="w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
              />
              <p className="mt-1 text-xs text-foreground/50">
                Vazio = não controla estoque. Preenchido = baixa a cada venda e bloqueia
                quando zerar.
              </p>
            </div>
            <div>
              <input
                placeholder="Código de barras (opcional)"
                value={form.codigoBarras}
                onChange={(e) => setForm((f) => ({ ...f, codigoBarras: e.target.value }))}
                className="w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
              />
              <p className="mt-1 text-xs text-foreground/50">
                Bipa o produto com o leitor aqui, ou digita — usado pra achar rápido no PDV.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            {form.imagem && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-preto">
                <Image src={form.imagem} alt="" fill sizes="64px" className="object-cover" />
              </div>
            )}
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={enviarFoto}
                disabled={enviandoFoto}
                className="text-sm"
              />
              <p className="mt-1 text-xs text-foreground/50">
                {enviandoFoto ? "Enviando foto..." : "PNG, JPG, WEBP ou GIF — até 5MB"}
              </p>
            </div>
          </div>

          {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-full bg-vermelho px-6 py-2 font-medium text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : form.id ? "Salvar alterações" : "Adicionar produto"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="rounded-full border border-borda px-6 py-2 font-medium text-foreground/70 transition hover:border-vermelho hover:text-vermelho"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="mt-10 space-y-8">
          {Object.entries(produtosPorCategoria).map(([categoria, itens]) => (
            <div key={categoria}>
              <h3 className="text-vermelho font-semibold uppercase tracking-wide text-sm">
                {categoria}
              </h3>
              <div className="mt-3 space-y-3">
                {itens.map((produto) => (
                  <div
                    key={produto.id}
                    className={`flex items-center gap-4 rounded-lg border p-4 ${
                      produto.ativo ? "border-borda bg-background" : "border-borda bg-borda/20 opacity-60"
                    }`}
                  >
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-preto text-2xl">
                      {produto.imagem ? (
                        <Image src={produto.imagem} alt="" fill sizes="56px" className="object-cover" />
                      ) : (
                        <span className="text-white/60">{produto.nome.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{produto.nome}</p>
                        {produto.destaque && (
                          <span className="rounded-full bg-vermelho/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-vermelho">
                            {produto.destaque}
                          </span>
                        )}
                        {!produto.ativo && (
                          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-foreground/50">
                            Oculto
                          </span>
                        )}
                        {!produto.mostrar_site && (
                          <span className="rounded-full bg-preto/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-preto">
                            Só estoque
                          </span>
                        )}
                        {produto.estoque !== null && produto.estoque <= ESTOQUE_BAIXO && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                            {produto.estoque === 0 ? "Sem estoque" : `Estoque baixo: ${produto.estoque}`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/60">
                        R$ {produto.preco.toFixed(2)}
                        {produto.estoque !== null && (
                          <span className="text-foreground/40"> · estoque: {produto.estoque}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => alternarMostrarSite(produto)}
                        title={
                          produto.mostrar_site
                            ? "Tirar do site (fica só pro estoque/PDV)"
                            : "Colocar no site"
                        }
                        className="rounded-md border border-borda px-3 py-2 text-sm font-medium hover:bg-borda/30"
                      >
                        {produto.mostrar_site ? "🌐 No site" : "🔒 Só estoque"}
                      </button>
                      <button
                        onClick={() => alternarAtivo(produto)}
                        title={produto.ativo ? "Desativar produto (some de tudo)" : "Reativar produto"}
                        className="rounded-md border border-borda px-3 py-2 text-sm font-medium hover:bg-borda/30"
                      >
                        {produto.ativo ? "Ocultar" : "Mostrar"}
                      </button>
                      <button
                        onClick={() => editar(produto)}
                        className="rounded-md border border-borda px-3 py-2 text-sm font-medium hover:bg-borda/30"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluir(produto)}
                        className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {produtos.length === 0 && (
            <p className="text-center text-foreground/60 py-20">
              Nenhum produto cadastrado ainda.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
