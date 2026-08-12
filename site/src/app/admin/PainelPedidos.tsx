"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Pedido, PedidoItem } from "@/lib/db";

const STATUS_LABEL: Record<Pedido["status"], string> = {
  novo: "Novo",
  preparando: "Preparando",
  a_caminho: "A caminho",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const STATUS_ORDEM: Pedido["status"][] = [
  "novo",
  "preparando",
  "a_caminho",
  "entregue",
  "cancelado",
];

const POLL_MS = 8000;

function tocarAlerta() {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioContextCtor();
    const oscilador = ctx.createOscillator();
    const ganho = ctx.createGain();
    oscilador.type = "sine";
    oscilador.frequency.value = 880;
    ganho.gain.setValueAtTime(0.3, ctx.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscilador.connect(ganho);
    ganho.connect(ctx.destination);
    oscilador.start();
    oscilador.stop(ctx.currentTime + 0.5);
    oscilador.onended = () => ctx.close();
  } catch {
    // navegador bloqueou áudio sem interação prévia — sem problema, é só o som
  }
}

function hojeStr() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function escapeHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function imprimirPedido(pedido: Pedido) {
  const itens: PedidoItem[] = JSON.parse(pedido.itens);
  const janela = window.open("", "_blank", "width=340,height=600");
  if (!janela) return;

  const qtdItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

  const linhasItens = itens
    .map(
      (item) => `
        <div class="linha-item">
          <span class="qtd">${item.quantidade}x</span>
          <span class="nome">${escapeHtml(item.nome)}</span>
          <span class="preco">${(item.preco * item.quantidade).toFixed(2)}</span>
        </div>`
    )
    .join("");

  janela.document.write(`
    <html>
      <head>
        <title>Pedido #${pedido.id}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          * { box-sizing: border-box; }
          body {
            font-family: "Courier New", monospace;
            width: 72mm;
            margin: 0;
            padding: 0;
            color: #000;
            font-size: 13px;
          }
          .centro { text-align: center; }
          .titulo { font-size: 16px; font-weight: bold; }
          .pedido-num { font-size: 22px; font-weight: bold; margin: 4px 0; }
          .linha { border-top: 1px dashed #000; margin: 6px 0; }
          p { margin: 2px 0; }
          .linha-item { display: flex; gap: 6px; margin: 3px 0; }
          .linha-item .qtd { flex: 0 0 auto; font-weight: bold; }
          .linha-item .nome { flex: 1 1 auto; }
          .linha-item .preco { flex: 0 0 auto; }
          .total { font-weight: bold; font-size: 15px; text-align: right; margin-top: 6px; }
          .obs { margin-top: 6px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="centro">
          <p class="titulo">DU BEBIDAS</p>
          <p class="pedido-num">PEDIDO #${pedido.id}</p>
          <p>${pedido.criado_em}</p>
        </div>
        <div class="linha"></div>
        <p><strong>${escapeHtml(pedido.cliente_nome)}</strong></p>
        <p>${escapeHtml(pedido.cliente_telefone)}</p>
        <p>${escapeHtml(pedido.endereco)}</p>
        <div class="linha"></div>
        ${linhasItens}
        <div class="linha"></div>
        <p>Total de itens: ${qtdItens}</p>
        ${pedido.observacoes ? `<p class="obs">Obs: ${escapeHtml(pedido.observacoes)}</p>` : ""}
        <p class="total">TOTAL: R$ ${pedido.total.toFixed(2)}</p>
        <div class="linha"></div>
        <p class="centro">Status: ${STATUS_LABEL[pedido.status]}</p>
      </body>
    </html>
  `);
  janela.document.close();
  janela.focus();
  janela.print();
}

export function PainelPedidos({
  pedidosIniciais,
  adminNome,
}: {
  pedidosIniciais: Pedido[];
  adminNome: string;
}) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState(pedidosIniciais);
  const [aba, setAba] = useState<Pedido["status"] | "todos">("novo");
  const emVooRef = useRef(false);
  const idsConhecidosRef = useRef<Set<number>>(
    new Set(pedidosIniciais.map((p) => p.id))
  );

  useEffect(() => {
    const intervalo = setInterval(async () => {
      if (emVooRef.current) return;
      emVooRef.current = true;
      try {
        const res = await fetch("/api/pedidos", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const novosPedidos: Pedido[] = data.pedidos;

          const temPedidoNovo = novosPedidos.some(
            (p) => !idsConhecidosRef.current.has(p.id)
          );
          idsConhecidosRef.current = new Set(novosPedidos.map((p) => p.id));

          if (temPedidoNovo) tocarAlerta();

          setPedidos(novosPedidos);
        }
      } finally {
        emVooRef.current = false;
      }
    }, POLL_MS);

    return () => clearInterval(intervalo);
  }, []);

  const pedidosNovos = pedidos.filter((p) => p.status === "novo").length;

  useEffect(() => {
    document.title =
      pedidosNovos > 0
        ? `(${pedidosNovos}) Painel de Pedidos — Du Bebidas`
        : "Painel de Pedidos — Du Bebidas";
  }, [pedidosNovos]);

  async function atualizarStatus(id: number, status: Pedido["status"]) {
    if (status === "cancelado") {
      const confirmar = window.confirm(`Cancelar o pedido #${id}?`);
      if (!confirmar) return;
    }

    setPedidos((atual) =>
      atual.map((p) => (p.id === id ? { ...p, status } : p))
    );

    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function sair() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  const pedidosFiltrados =
    aba === "todos" ? pedidos : pedidos.filter((p) => p.status === aba);

  const faturamentoHoje = pedidos
    .filter((p) => p.criado_em.startsWith(hojeStr()) && p.status !== "cancelado")
    .reduce((soma, p) => soma + p.total, 0);

  const pedidosEmAberto = pedidos.filter((p) =>
    ["novo", "preparando", "a_caminho"].includes(p.status)
  ).length;

  return (
    <div className="min-h-screen bg-card">
      <header className="bg-preto text-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Painel de Pedidos — Du Bebidas</h1>
            <p className="text-xs text-white/60">Logado como {adminNome}</p>
          </div>
          <button
            onClick={sair}
            className="text-sm text-white/70 hover:text-white"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="bg-background border-b border-borda">
        <div className="mx-auto max-w-5xl px-6 py-4 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-foreground/50">Faturamento de hoje</p>
            <p className="text-lg font-semibold text-vermelho">
              R$ {faturamentoHoje.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-foreground/50">Pedidos em aberto</p>
            <p className="text-lg font-semibold">{pedidosEmAberto}</p>
          </div>
        </div>
      </div>

      <nav className="border-b border-borda bg-background">
        <div className="mx-auto max-w-5xl px-6 flex gap-1 overflow-x-auto">
          {(["todos", ...STATUS_ORDEM] as const).map((status) => {
            const contagem =
              status === "todos"
                ? pedidos.length
                : pedidos.filter((p) => p.status === status).length;
            const ativa = aba === status;
            return (
              <button
                key={status}
                onClick={() => setAba(status)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  ativa
                    ? "border-vermelho text-vermelho"
                    : "border-transparent text-foreground/50 hover:text-foreground"
                }`}
              >
                {status === "todos" ? "Todos" : STATUS_LABEL[status]}
                {contagem > 0 && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      status === "novo" && contagem > 0
                        ? "bg-vermelho text-white"
                        : "bg-borda text-foreground/60"
                    }`}
                  >
                    {contagem}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {pedidosFiltrados.length === 0 && (
          <p className="text-foreground/60 text-center py-20">
            Nenhum pedido nessa aba.
          </p>
        )}

        <div className="space-y-4">
          {pedidosFiltrados.map((pedido) => {
            const itens: PedidoItem[] = JSON.parse(pedido.itens);
            return (
              <div
                key={pedido.id}
                className="rounded-lg border border-borda bg-background p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      Pedido #{pedido.id} — {pedido.cliente_nome}
                    </p>
                    <p className="text-sm text-foreground/60">
                      {pedido.cliente_telefone} · {pedido.endereco}
                    </p>
                    <p className="text-xs text-foreground/50 mt-1">
                      {pedido.criado_em}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => imprimirPedido(pedido)}
                      className="rounded-md border border-borda px-3 py-2 text-sm font-medium hover:bg-borda/30"
                    >
                      Imprimir
                    </button>
                    <select
                      value={pedido.status}
                      onChange={(e) =>
                        atualizarStatus(
                          pedido.id,
                          e.target.value as Pedido["status"]
                        )
                      }
                      className="rounded-md border border-borda px-3 py-2 text-sm font-medium"
                    >
                      {STATUS_ORDEM.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <ul className="mt-4 text-sm divide-y divide-borda">
                  {itens.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between py-1.5"
                    >
                      <span>
                        {item.quantidade}x {item.nome}
                      </span>
                      <span>
                        R$ {(item.preco * item.quantidade).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                {pedido.observacoes && (
                  <p className="mt-3 text-sm text-foreground/60 italic">
                    Obs: {pedido.observacoes}
                  </p>
                )}

                <p className="mt-3 text-right font-semibold text-vermelho">
                  Total: R$ {pedido.total.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
