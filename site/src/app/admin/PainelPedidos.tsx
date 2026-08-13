"use client";

import { useEffect, useRef, useState } from "react";
import type { Pedido, PedidoItem } from "@/lib/db";
import { AdminNav } from "./AdminNav";

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

const MENSAGEM_STATUS: Record<Pedido["status"], (pedido: Pedido) => string> = {
  novo: (p) =>
    `Oi ${p.cliente_nome}! Recebemos seu pedido #${p.id} aqui na Du Bebidas. 🍻`,
  preparando: (p) =>
    `Oi ${p.cliente_nome}! Seu pedido #${p.id} já está sendo separado por aqui.`,
  a_caminho: (p) =>
    `Seu pedido #${p.id} saiu pra entrega! 🛵 Chega logo aí.`,
  entregue: (p) =>
    `Pedido #${p.id} entregue! Valeu pela preferência 🙌 Qualquer coisa é só chamar.`,
  cancelado: (p) =>
    `Oi ${p.cliente_nome}, seu pedido #${p.id} foi cancelado. Qualquer dúvida chama a gente por aqui.`,
};

function linkWhatsAppPedido(pedido: Pedido) {
  const digitos = pedido.cliente_telefone.replace(/\D/g, "");
  const numero =
    digitos.length <= 11 ? `55${digitos}` : digitos;
  const mensagem = MENSAGEM_STATUS[pedido.status](pedido);
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
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
  const [pedidos, setPedidos] = useState(pedidosIniciais);
  const [aba, setAba] = useState<Pedido["status"] | "todos">("novo");
  const [busca, setBusca] = useState("");
  const [conectado, setConectado] = useState(true);
  const [erroStatus, setErroStatus] = useState<string | null>(null);
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
          setConectado(true);
        } else {
          setConectado(false);
        }
      } catch {
        setConectado(false);
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

    const statusAnterior = pedidos.find((p) => p.id === id)?.status;
    setErroStatus(null);
    setPedidos((atual) =>
      atual.map((p) => (p.id === id ? { ...p, status } : p))
    );

    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error();
      setConectado(true);
    } catch {
      setConectado(false);
      setErroStatus(
        `Não deu pra salvar o status do pedido #${id}. Confira a conexão e tente de novo.`
      );
      if (statusAnterior) {
        setPedidos((atual) =>
          atual.map((p) => (p.id === id ? { ...p, status: statusAnterior } : p))
        );
      }
    }
  }

  const buscaNormalizada = busca.trim().toLowerCase();
  const pedidosFiltrados = (
    aba === "todos" ? pedidos : pedidos.filter((p) => p.status === aba)
  ).filter(
    (p) =>
      !buscaNormalizada ||
      p.cliente_nome.toLowerCase().includes(buscaNormalizada) ||
      p.cliente_telefone.replace(/\D/g, "").includes(buscaNormalizada.replace(/\D/g, ""))
  );

  const faturamentoHoje = pedidos
    .filter((p) => p.criado_em.startsWith(hojeStr()) && p.status !== "cancelado")
    .reduce((soma, p) => soma + p.total, 0);

  const pedidosEmAberto = pedidos.filter((p) =>
    ["novo", "preparando", "a_caminho"].includes(p.status)
  ).length;

  return (
    <div className="min-h-screen bg-card">
      <AdminNav adminNome={adminNome} />

      <div className="bg-background border-b border-borda">
        <div className="mx-auto max-w-5xl px-6 py-4 flex flex-wrap items-center gap-6">
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
          <span
            className="flex items-center gap-1.5 text-xs text-foreground/50"
            title={conectado ? "Atualizando normalmente" : "Sem conexão com o servidor"}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                conectado ? "bg-green-500" : "bg-red-500 animate-pulse"
              }`}
            />
            {conectado ? "Online" : "Sem conexão"}
          </span>
          <input
            type="search"
            placeholder="Buscar por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="ml-auto w-full max-w-xs rounded-md border border-borda px-3 py-2 text-sm transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
          />
        </div>
        {erroStatus && (
          <div className="mx-auto max-w-5xl px-6 pb-4">
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              ⚠️ {erroStatus}
            </p>
          </div>
        )}
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        Pedido #{pedido.id} — {pedido.cliente_nome}
                      </p>
                      {pedido.origem === "pdv" ? (
                        <span className="rounded-full bg-preto px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                          Balcão · {pedido.forma_pagamento}
                        </span>
                      ) : (
                        <span className="rounded-full bg-vermelho/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-vermelho">
                          Online
                        </span>
                      )}
                    </div>
                    {pedido.origem === "online" && (
                      <p className="text-sm text-foreground/60">
                        {pedido.cliente_telefone} · {pedido.endereco}
                      </p>
                    )}
                    <p className="text-xs text-foreground/50 mt-1">
                      {pedido.criado_em}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pedido.origem === "online" && (
                      <a
                        href={linkWhatsAppPedido(pedido)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Avisar cliente no WhatsApp"
                        className="flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-2 text-sm font-medium text-white transition hover:brightness-95"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 12-12S18.6 0 12 0zm0 22c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.9 1 1-3.8-.2-.4C2.2 15.4 2 13.7 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm5.6-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.8-1-2.4-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
                        </svg>
                        Avisar
                      </a>
                    )}
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
