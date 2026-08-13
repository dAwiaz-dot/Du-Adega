"use client";

import { useMemo, useState } from "react";
import type { Cliente } from "@/lib/clientes";
import { AdminNav } from "../AdminNav";

type Ordenacao = "recente" | "gasto" | "pedidos" | "deve";

function linkWhatsApp(telefone: string) {
  const digitos = telefone.replace(/\D/g, "");
  const numero = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${numero}`;
}

export function VerClientes({
  clientesIniciais,
  adminNome,
}: {
  clientesIniciais: Cliente[];
  adminNome: string;
}) {
  const [clientes, setClientes] = useState(clientesIniciais);
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("recente");
  const [pagandoTelefone, setPagandoTelefone] = useState<string | null>(null);
  const [valorPagamento, setValorPagamento] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [novoDebitoAberto, setNovoDebitoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [novoValor, setNovoValor] = useState("");

  const clientesFiltrados = useMemo(() => {
    const buscaNorm = busca.trim().toLowerCase();
    const digitosBusca = buscaNorm.replace(/\D/g, "");

    let lista = clientes.filter(
      (c) =>
        !buscaNorm ||
        c.cliente_nome.toLowerCase().includes(buscaNorm) ||
        (digitosBusca && c.cliente_telefone.replace(/\D/g, "").includes(digitosBusca))
    );

    lista = [...lista].sort((a, b) => {
      if (ordenacao === "gasto") return b.total_gasto - a.total_gasto;
      if (ordenacao === "pedidos") return b.qtd_pedidos - a.qtd_pedidos;
      if (ordenacao === "deve") return b.saldo_devedor - a.saldo_devedor;
      return b.ultimo_pedido_em.localeCompare(a.ultimo_pedido_em);
    });

    return lista;
  }, [busca, ordenacao, clientes]);

  const totalClientes = clientes.length;
  const totalGastoGeral = clientes.reduce((s, c) => s + c.total_gasto, 0);
  const totalDevedor = clientes.reduce((s, c) => s + c.saldo_devedor, 0);

  function atualizarSaldoLocal(telefone: string, nome: string, delta: number) {
    setClientes((atual) => {
      const existe = atual.find((c) => c.cliente_telefone === telefone);
      if (existe) {
        return atual.map((c) =>
          c.cliente_telefone === telefone
            ? { ...c, saldo_devedor: c.saldo_devedor + delta }
            : c
        );
      }
      return [
        ...atual,
        {
          cliente_telefone: telefone,
          cliente_nome: nome,
          endereco: "",
          qtd_pedidos: 0,
          total_gasto: 0,
          ultimo_pedido_em: "",
          saldo_devedor: delta,
        },
      ];
    });
  }

  async function registrarPagamento(cliente: Cliente) {
    const valor = Number(valorPagamento.replace(",", "."));
    if (!valor || valor <= 0) {
      setErro("Informe um valor válido.");
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/clientes/saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone: cliente.cliente_telefone,
          nome: cliente.cliente_nome,
          valor,
          tipo: "pagamento",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível registrar o pagamento.");
        return;
      }
      atualizarSaldoLocal(cliente.cliente_telefone, cliente.cliente_nome, -valor);
      setPagandoTelefone(null);
      setValorPagamento("");
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  async function registrarNovoDebito(e: React.FormEvent) {
    e.preventDefault();
    const valor = Number(novoValor.replace(",", "."));
    if (!novoNome.trim() || !novoTelefone.trim()) {
      setErro("Preencha nome e telefone.");
      return;
    }
    if (!valor || valor <= 0) {
      setErro("Informe um valor válido.");
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/clientes/saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone: novoTelefone.trim(),
          nome: novoNome.trim(),
          valor,
          tipo: "divida",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível registrar o débito.");
        return;
      }
      atualizarSaldoLocal(novoTelefone.trim(), novoNome.trim(), valor);
      setNovoNome("");
      setNovoTelefone("");
      setNovoValor("");
      setNovoDebitoAberto(false);
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-card">
      <AdminNav adminNome={adminNome} />

      <div className="bg-background border-b border-borda">
        <div className="mx-auto max-w-5xl px-6 py-4 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-foreground/50">Clientes</p>
            <p className="text-lg font-semibold text-vermelho">{totalClientes}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/50">Faturamento total</p>
            <p className="text-lg font-semibold">R$ {totalGastoGeral.toFixed(2)}</p>
          </div>
          {totalDevedor > 0 && (
            <div>
              <p className="text-xs text-foreground/50">Total a receber (fiado)</p>
              <p className="text-lg font-semibold text-red-600">R$ {totalDevedor.toFixed(2)}</p>
            </div>
          )}
          <button
            onClick={() => setNovoDebitoAberto(true)}
            className="rounded-full border border-borda px-4 py-2 text-sm font-medium hover:bg-borda/30"
          >
            + Registrar débito
          </button>
          <input
            type="search"
            placeholder="Buscar por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="ml-auto w-full max-w-xs rounded-md border border-borda px-3 py-2 text-sm transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
          />
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
            className="rounded-md border border-borda px-3 py-2 text-sm"
          >
            <option value="recente">Mais recente</option>
            <option value="gasto">Quem mais gastou</option>
            <option value="pedidos">Quem mais pediu</option>
            <option value="deve">Quem mais deve</option>
          </select>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {clientesFiltrados.length === 0 && (
          <p className="text-center text-foreground/60 py-20">
            Nenhum cliente encontrado.
          </p>
        )}

        <div className="space-y-3">
          {clientesFiltrados.map((cliente) => (
            <div
              key={cliente.cliente_telefone}
              className="rounded-lg border border-borda bg-background p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{cliente.cliente_nome}</p>
                    {cliente.saldo_devedor > 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                        Deve R$ {cliente.saldo_devedor.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/60">
                    {cliente.cliente_telefone}
                    {cliente.endereco ? ` · ${cliente.endereco}` : ""}
                  </p>
                  {cliente.ultimo_pedido_em && (
                    <p className="text-xs text-foreground/50 mt-1">
                      Último pedido: {cliente.ultimo_pedido_em}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {cliente.qtd_pedidos > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-foreground/60">
                        {cliente.qtd_pedidos} {cliente.qtd_pedidos === 1 ? "pedido" : "pedidos"}
                      </p>
                      <p className="font-semibold text-vermelho">
                        R$ {cliente.total_gasto.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {cliente.saldo_devedor > 0 && (
                    <button
                      onClick={() => {
                        setPagandoTelefone(cliente.cliente_telefone);
                        setErro(null);
                      }}
                      className="rounded-md border border-borda px-3 py-2 text-sm font-medium hover:bg-borda/30"
                    >
                      Registrar pagamento
                    </button>
                  )}
                  <a
                    href={linkWhatsApp(cliente.cliente_telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:brightness-95"
                    title="Chamar no WhatsApp"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 12-12S18.6 0 12 0zm0 22c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.9 1 1-3.8-.2-.4C2.2 15.4 2 13.7 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm5.6-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.8-1-2.4-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
                    </svg>
                  </a>
                </div>
              </div>

              {pagandoTelefone === cliente.cliente_telefone && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-borda/20 p-3">
                  <input
                    autoFocus
                    inputMode="decimal"
                    placeholder={`Valor pago (deve R$ ${cliente.saldo_devedor.toFixed(2)})`}
                    value={valorPagamento}
                    onChange={(e) => setValorPagamento(e.target.value)}
                    className="flex-1 min-w-[160px] rounded-md border border-borda px-3 py-2 text-sm transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
                  />
                  <button
                    onClick={() => registrarPagamento(cliente)}
                    disabled={salvando}
                    className="rounded-md bg-vermelho px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => {
                      setPagandoTelefone(null);
                      setValorPagamento("");
                      setErro(null);
                    }}
                    className="rounded-md border border-borda px-4 py-2 text-sm font-medium hover:bg-borda/30"
                  >
                    Cancelar
                  </button>
                  {erro && <p className="w-full text-sm text-red-600">{erro}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {novoDebitoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm animate-scale-in rounded-lg bg-background p-6">
            <h2 className="font-display text-xl tracking-wide text-preto">Registrar débito</h2>
            <p className="mt-1 text-xs text-foreground/50">
              Pra lançar um cliente que já deve, sem passar pelo PDV.
            </p>
            <form onSubmit={registrarNovoDebito} className="mt-4 space-y-3">
              <input
                required
                placeholder="Nome do cliente"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
              />
              <input
                required
                placeholder="Telefone"
                value={novoTelefone}
                onChange={(e) => setNovoTelefone(e.target.value)}
                className="w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
              />
              <input
                required
                inputMode="decimal"
                placeholder="Valor devido"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                className="w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
              />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNovoDebitoAberto(false);
                    setErro(null);
                  }}
                  className="flex-1 rounded-full border border-borda px-4 py-2 font-medium text-foreground/70 transition hover:border-vermelho hover:text-vermelho"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 rounded-full bg-vermelho px-4 py-2 font-medium text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
