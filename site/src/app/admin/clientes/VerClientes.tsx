"use client";

import { useMemo, useState } from "react";
import type { Cliente } from "@/lib/clientes";
import { AdminNav } from "../AdminNav";

type Ordenacao = "recente" | "gasto" | "pedidos";

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
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("recente");

  const clientesFiltrados = useMemo(() => {
    const buscaNorm = busca.trim().toLowerCase();
    const digitosBusca = buscaNorm.replace(/\D/g, "");

    let lista = clientesIniciais.filter(
      (c) =>
        !buscaNorm ||
        c.cliente_nome.toLowerCase().includes(buscaNorm) ||
        (digitosBusca && c.cliente_telefone.replace(/\D/g, "").includes(digitosBusca))
    );

    lista = [...lista].sort((a, b) => {
      if (ordenacao === "gasto") return b.total_gasto - a.total_gasto;
      if (ordenacao === "pedidos") return b.qtd_pedidos - a.qtd_pedidos;
      return b.ultimo_pedido_em.localeCompare(a.ultimo_pedido_em);
    });

    return lista;
  }, [busca, ordenacao, clientesIniciais]);

  const totalClientes = clientesIniciais.length;
  const totalGastoGeral = clientesIniciais.reduce((s, c) => s + c.total_gasto, 0);

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
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-borda bg-background p-4"
            >
              <div>
                <p className="font-medium">{cliente.cliente_nome}</p>
                <p className="text-sm text-foreground/60">
                  {cliente.cliente_telefone} · {cliente.endereco}
                </p>
                <p className="text-xs text-foreground/50 mt-1">
                  Último pedido: {cliente.ultimo_pedido_em}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-foreground/60">
                    {cliente.qtd_pedidos} {cliente.qtd_pedidos === 1 ? "pedido" : "pedidos"}
                  </p>
                  <p className="font-semibold text-vermelho">
                    R$ {cliente.total_gasto.toFixed(2)}
                  </p>
                </div>
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
          ))}
        </div>
      </main>
    </div>
  );
}
