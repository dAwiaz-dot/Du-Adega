"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { DadosDashboard, VendaDia } from "@/lib/dashboard";
import { animacoesLigadas, tocarSom } from "@/lib/efeitosAdmin";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const ATUALIZAR_MS = 30_000;
const CHAVE_META = "du_admin_meta_dia";
const CHAVE_META_COMEMORADA = "du_admin_meta_comemorada";

function dataCurta(dia: string) {
  const [, mes, d] = dia.split("-");
  return `${d}/${mes}`;
}

function hojeISO() {
  const agora = new Date();
  return `${agora.getFullYear()}-${agora.getMonth() + 1}-${agora.getDate()}`;
}

function saudacao(hora: number) {
  if (hora < 5) return "Boa madrugada";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function variacao(atual: number, anterior: number): number | null {
  if (anterior <= 0) return atual > 0 ? null : 0;
  return ((atual - anterior) / anterior) * 100;
}

function lerLocal(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravarLocal(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // armazenamento bloqueado — vale só pra essa sessão
  }
}

// Relógio compartilhado (null no servidor, pra não divergir de fuso/hora)
let agoraCache: Date | null = null;
function assinarRelogio(avisar: () => void) {
  const id = setInterval(() => {
    agoraCache = new Date();
    avisar();
  }, 15_000);
  return () => clearInterval(id);
}
function lerRelogio() {
  if (!agoraCache) agoraCache = new Date();
  return agoraCache;
}

// Meta do dia salva no navegador
const EVENTO_META = "du-admin-meta";
function assinarMeta(avisar: () => void) {
  window.addEventListener(EVENTO_META, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO_META, avisar);
    window.removeEventListener("storage", avisar);
  };
}

type Peca = { dx: string; dy: string; rot: string; cor: string; atraso: number; largura: number };

function gerarConfete(): Peca[] {
  return Array.from({ length: 36 }, (_, i) => {
    const angulo = (i / 36) * Math.PI * 2 + Math.random() * 0.4;
    const distancia = 90 + Math.random() * 120;
    return {
      dx: `${Math.cos(angulo) * distancia}px`,
      dy: `${Math.sin(angulo) * distancia - 40}px`,
      rot: `${Math.random() * 720 - 360}deg`,
      cor: ["#c8102e", "#ff3b4e", "#f5c542", "#ffffff", "#22c55e"][i % 5],
      atraso: Math.random() * 120,
      largura: 6 + Math.random() * 6,
    };
  });
}

// Número que "sobe" até o valor quando aparece ou muda
function Contador({ valor, formatar }: { valor: number; formatar: (n: number) => string }) {
  const [exibido, setExibido] = useState(valor);
  const anteriorRef = useRef(0);

  useLayoutEffect(() => {
    const de = anteriorRef.current;
    anteriorRef.current = valor;
    if (!animacoesLigadas() || de === valor) {
      setExibido(valor);
      return;
    }
    const inicio = performance.now();
    const duracao = 900;
    let quadro = 0;
    const passo = (agora: number) => {
      const t = Math.min((agora - inicio) / duracao, 1);
      const suave = 1 - Math.pow(1 - t, 3);
      setExibido(de + (valor - de) * suave);
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor]);

  return <>{formatar(exibido)}</>;
}

function SeloVariacao({ pct, rotulo, escuro = false }: { pct: number | null; rotulo: string; escuro?: boolean }) {
  if (pct === null) {
    return (
      <span className={`text-xs ${escuro ? "text-emerald-300" : "text-emerald-700"}`}>
        ▲ novo · {rotulo}
      </span>
    );
  }
  const subiu = pct >= 0;
  const cor = escuro
    ? subiu
      ? "bg-emerald-400/15 text-emerald-300"
      : "bg-red-400/15 text-red-300"
    : subiu
      ? "bg-emerald-50 text-emerald-700"
      : "bg-red-50 text-red-700";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cor}`}>
      {subiu ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
      <span className="font-normal opacity-70">{rotulo}</span>
    </span>
  );
}

function Confete({ pecas }: { pecas: Peca[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {pecas.map((p, i) => (
        <span
          key={i}
          className="anim-confete absolute rounded-[2px]"
          style={
            {
              width: p.largura,
              height: p.largura * 0.45,
              background: p.cor,
              animationDelay: `${p.atraso}ms`,
              "--dx": p.dx,
              "--dy": p.dy,
              "--rot": p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function PainelDashboard({ dados, adminNome }: { dados: DadosDashboard; adminNome: string }) {
  const router = useRouter();
  const agora = useSyncExternalStore(assinarRelogio, lerRelogio, () => null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [toast, setToast] = useState<{ id: number; texto: string; som: "venda" | "novoPedido" } | null>(null);
  const [dadosAnteriores, setDadosAnteriores] = useState(dados);

  // Chegou dado novo do servidor (atualização automática): avisa venda/pedido novo
  if (dados !== dadosAnteriores) {
    const anterior = dadosAnteriores;
    setDadosAnteriores(dados);
    setAtualizando(false);
    const proximoId = (toast?.id ?? 0) + 1;
    if (dados.hoje.qtd > anterior.hoje.qtd) {
      const novas = dados.hoje.qtd - anterior.hoje.qtd;
      const valor = dados.hoje.total - anterior.hoje.total;
      setToast({
        id: proximoId,
        som: "venda",
        texto: `${novas > 1 ? `${novas} vendas novas` : "Venda nova"} · +${brl.format(valor)}`,
      });
    } else if (dados.pedidosEmAberto > anterior.pedidosEmAberto) {
      setToast({ id: proximoId, som: "novoPedido", texto: "Pedido online novo chegando!" });
    }
  }

  // Atualização automática (só com a aba visível)
  useEffect(() => {
    const atualizar = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setUltimaAtualizacao(new Date());
      router.refresh();
    }, ATUALIZAR_MS);
    return () => clearInterval(atualizar);
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    tocarSom(toast.som);
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  function atualizarAgora() {
    tocarSom("clique");
    setAtualizando(true);
    setUltimaAtualizacao(new Date());
    router.refresh();
  }

  const dias = dados.vendas30;
  const ontem = dias[dias.length - 2]?.total ?? 0;
  const semanaAnterior = dias.slice(-14, -7).reduce((s, d) => s + d.total, 0);
  const primeiroNome = adminNome.split(" ")[0];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="anim-toast fixed left-1/2 top-24 z-50 flex items-center gap-3 rounded-full bg-preto px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/40 ring-1 ring-white/10"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-base">$</span>
          {toast.texto}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-fade-up">
          <p className="text-sm text-foreground/55">
            {agora
              ? agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
              : " "}
          </p>
          <h2 className="font-display text-4xl tracking-wide text-preto sm:text-5xl">
            {agora ? saudacao(agora.getHours()) : "Olá"}, {primeiroNome}
          </h2>
          <p className="text-sm text-foreground/60">
            Vendas do site e do balcão somadas. Pedidos cancelados não entram.
          </p>
        </div>
        <button
          type="button"
          onClick={atualizarAgora}
          className="group inline-flex items-center gap-2 rounded-full border border-borda bg-background px-4 py-2 text-sm text-foreground/70 transition hover:border-foreground/30 hover:text-foreground active:scale-95"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Ao vivo
          {(ultimaAtualizacao ?? agora) && (
            <span className="text-foreground/45">
              · {(ultimaAtualizacao ?? agora)!.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <svg
            className={`transition-transform group-hover:rotate-90 ${atualizando ? "animate-spin" : ""}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
          </svg>
        </button>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-preto p-6 text-white shadow-xl shadow-black/20 animate-fade-up [animation-delay:60ms]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-vermelho/40 blur-3xl animate-glow"
          />
          <div className="relative flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-white/65">Faturamento de hoje</p>
            <SeloVariacao pct={variacao(dados.hoje.total, ontem)} rotulo="vs ontem" escuro />
          </div>
          <p className="relative mt-2 text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">
            <Contador valor={dados.hoje.total} formatar={(n) => brl.format(n)} />
          </p>
          <div className="relative mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-sm">
            <div>
              <p className="text-white/50">Vendas</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                <Contador valor={dados.hoje.qtd} formatar={(n) => Math.round(n).toString()} />
              </p>
            </div>
            <div>
              <p className="text-white/50">Ticket médio</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {brl.format(dados.hoje.qtd > 0 ? dados.hoje.total / dados.hoje.qtd : 0)}
              </p>
            </div>
            <div>
              <p className="text-white/50">Site · Balcão</p>
              <BarraOrigem online={dados.hoje.online} pdv={dados.hoje.pdv} />
            </div>
          </div>
        </div>

        <MetaDoDia hoje={dados.hoje.total} dias={dias} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <CartaoPeriodo
          titulo="Últimos 7 dias"
          total={dados.semana.total}
          qtd={dados.semana.qtd}
          detalhe={`Site ${brl.format(dados.semana.online)} · Balcão ${brl.format(dados.semana.pdv)}`}
          selo={<SeloVariacao pct={variacao(dados.semana.total, semanaAnterior)} rotulo="vs 7 dias antes" />}
          atraso={120}
        />
        <CartaoPeriodo
          titulo="Este mês"
          total={dados.mes.total}
          qtd={dados.mes.qtd}
          detalhe={`Site ${brl.format(dados.mes.online)} · Balcão ${brl.format(dados.mes.pdv)}`}
          atraso={180}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <CartaoAtalho
          href="/admin"
          icone={<path d="M6 7h12l1 13H5L6 7ZM9 7a3 3 0 0 1 6 0" />}
          titulo="Pedidos online em aberto"
          valor={String(dados.pedidosEmAberto)}
          detalhe={dados.pedidosEmAberto > 0 ? "Novos, preparando ou a caminho" : "Nenhum pendente"}
          alerta={dados.pedidosEmAberto > 0}
          atraso={220}
        />
        <CartaoAtalho
          href="/admin/pdv"
          icone={<path d="M3 7h18v12H3zM3 11h18M7 15h4" />}
          titulo="Caixa"
          valor={dados.caixa ? "Aberto" : "Fechado"}
          detalhe={
            dados.caixa
              ? `${brl.format(dados.caixa.totalVendas)} vendido · ${brl.format(
                  dados.caixa.valorEsperadoDinheiro
                )} em dinheiro`
              : "Abra o caixa no PDV pra vender no balcão"
          }
          ok={!!dados.caixa}
          atraso={260}
        />
        <CartaoAtalho
          href="/admin/clientes"
          icone={<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 8v6M22 11h-6" />}
          titulo="Fiado a receber"
          valor={brl.format(dados.fiado.total)}
          detalhe={`${dados.fiado.qtd} cliente(s) devendo`}
          alerta={dados.fiado.total > 0}
          atraso={300}
        />
      </div>

      <GraficoVendas dias={dias} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Secao titulo="Mais vendidos — 30 dias">
          {dados.topProdutos.length === 0 ? (
            <Vazio texto="Nenhuma venda nos últimos 30 dias." />
          ) : (
            <ListaBarras
              itens={dados.topProdutos.map((p) => ({
                chave: p.id,
                rotulo: p.nome,
                valor: p.qtd,
                texto: `${p.qtd} un · ${brl.format(p.total)}`,
              }))}
            />
          )}
        </Secao>

        <Secao titulo="Categorias que mais faturam — 30 dias">
          {dados.topCategorias.length === 0 ? (
            <Vazio texto="Nenhuma venda nos últimos 30 dias." />
          ) : (
            <ListaBarras
              itens={dados.topCategorias.map((c) => ({
                chave: c.categoria,
                rotulo: c.categoria,
                valor: c.total,
                texto: brl.format(c.total),
              }))}
            />
          )}
        </Secao>

        <Secao
          titulo="Estoque que precisa de atenção"
          acao={
            <Link href="/admin/estoque" className="text-sm font-medium text-vermelho hover:underline">
              Ir pro estoque →
            </Link>
          }
        >
          <div className="mt-2 flex gap-2 text-xs font-semibold">
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">{dados.estoque.zerados} zerado(s)</span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
              {dados.estoque.baixos} com estoque baixo
            </span>
          </div>
          {dados.estoque.lista.length === 0 ? (
            <Vazio texto="Tudo em ordem no estoque." />
          ) : (
            <ul className="mt-3 divide-y divide-borda text-sm">
              {dados.estoque.lista.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">{p.nome}</span>
                  <SeloEstoque estoque={p.estoque} />
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Formas de pagamento — este mês">
          {dados.pagamentos.length === 0 ? (
            <Vazio texto="Nenhuma venda este mês." />
          ) : (
            <ListaBarras
              itens={dados.pagamentos.map((p) => ({
                chave: p.forma,
                rotulo: `${p.forma} · ${p.qtd} venda(s)`,
                valor: p.total,
                texto: brl.format(p.total),
              }))}
              semRanking
            />
          )}

          {dados.fiado.maiores.length > 0 && (
            <>
              <h3 className="mt-6 font-semibold">Maiores fiados</h3>
              <ul className="mt-2 divide-y divide-borda text-sm">
                {dados.fiado.maiores.map((c) => (
                  <li key={c.telefone} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0 truncate">{c.nome}</span>
                    <span className="font-medium tabular-nums text-red-700">{brl.format(c.saldo_devedor)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Secao>
      </div>
    </main>
  );
}

function BarraOrigem({ online, pdv }: { online: number; pdv: number }) {
  const total = online + pdv;
  const pctOnline = total > 0 ? (online / total) * 100 : 0;
  return (
    <div className="mt-2">
      <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
        {total > 0 && (
          <>
            <div className="anim-cresce-x h-full bg-vermelho-vivo" style={{ width: `${pctOnline}%` }} />
            <div className="anim-cresce-x h-full bg-white/70" style={{ width: `${100 - pctOnline}%` }} />
          </>
        )}
      </div>
      <p className="mt-1 text-[11px] text-white/45 tabular-nums">
        {total > 0 ? `${pctOnline.toFixed(0)}% site` : "sem vendas"}
      </p>
    </div>
  );
}

function MetaDoDia({ hoje, dias }: { hoje: number; dias: VendaDia[] }) {
  // Sugestão inicial: média dos dias com venda + 10%, arredondada pra cima
  const sugestao = useMemo(() => {
    const comVenda = dias.slice(0, -1).filter((d) => d.total > 0);
    if (comVenda.length === 0) return 500;
    const media = comVenda.reduce((s, d) => s + d.total, 0) / comVenda.length;
    return Math.max(100, Math.ceil((media * 1.1) / 50) * 50);
  }, [dias]);

  const metaSalva = useSyncExternalStore(assinarMeta, () => lerLocal(CHAVE_META), () => null);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState("");
  const [confete, setConfete] = useState<{ id: number; pecas: Peca[] } | null>(null);

  const metaAtual = Number(metaSalva) > 0 ? Number(metaSalva) : sugestao;
  const pct = metaAtual > 0 ? Math.min(hoje / metaAtual, 1) : 0;
  const batida = hoje >= metaAtual && hoje > 0;

  // Comemora uma vez por dia quando a meta é batida, logo depois do anel encher
  useEffect(() => {
    if (!batida || lerLocal(CHAVE_META_COMEMORADA) === hojeISO()) return;
    const t = setTimeout(() => {
      gravarLocal(CHAVE_META_COMEMORADA, hojeISO());
      tocarSom("meta");
      if (animacoesLigadas()) setConfete({ id: Date.now(), pecas: gerarConfete() });
    }, 900);
    return () => clearTimeout(t);
  }, [batida]);

  useEffect(() => {
    if (!confete) return;
    const t = setTimeout(() => setConfete(null), 1700);
    return () => clearTimeout(t);
  }, [confete]);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const valor = Number(rascunho.replace(/\./g, "").replace(",", "."));
    if (valor > 0) {
      gravarLocal(CHAVE_META, String(valor));
      window.dispatchEvent(new Event(EVENTO_META));
      tocarSom("sucesso");
    }
    setEditando(false);
  }

  const raio = 54;
  const circunferencia = 2 * Math.PI * raio;

  return (
    <div className="relative flex items-center gap-5 overflow-hidden rounded-3xl border border-borda bg-background p-6 animate-fade-up [animation-delay:120ms]">
      {confete && <Confete key={confete.id} pecas={confete.pecas} />}
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle cx="64" cy="64" r={raio} fill="none" stroke="currentColor" strokeWidth="12" className="text-borda" />
          <circle
            cx="64"
            cy="64"
            r={raio}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={circunferencia * (1 - pct)}
            className={`transition-[stroke-dashoffset] duration-1000 ease-out ${batida ? "text-emerald-500" : "text-vermelho"}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-preto">
            <Contador valor={pct * 100} formatar={(n) => `${Math.round(n)}%`} />
          </span>
          <span className="text-[11px] text-foreground/50">da meta</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground/60">Meta do dia</p>
        {editando ? (
          <form onSubmit={salvar} className="mt-1 flex gap-2">
            <input
              autoFocus
              inputMode="decimal"
              value={rascunho}
              onChange={(e) => setRascunho(e.target.value)}
              placeholder="Ex: 1500"
              className="w-full min-w-0 rounded-lg border border-borda bg-white px-3 py-1.5 text-sm focus:border-vermelho focus:outline-none"
            />
            <button className="shrink-0 rounded-lg bg-vermelho px-3 py-1.5 text-sm font-semibold text-white">
              Salvar
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setRascunho(String(metaAtual));
              setEditando(true);
            }}
            className="group mt-0.5 flex items-center gap-1.5 text-2xl font-bold tabular-nums text-preto"
            title="Editar meta"
          >
            {brl.format(metaAtual)}
            <svg className="text-foreground/30 transition group-hover:text-vermelho" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        )}
        <p className={`mt-2 text-sm font-medium ${batida ? "text-emerald-600" : "text-foreground/60"}`}>
          {batida
            ? "Meta batida! Bora passar dela."
            : `Faltam ${brl.format(Math.max(metaAtual - hoje, 0))}`}
        </p>
        <p className="mt-0.5 text-[11px] text-foreground/40">Salva só neste aparelho</p>
      </div>
    </div>
  );
}

function CartaoPeriodo({
  titulo,
  total,
  qtd,
  detalhe,
  selo,
  atraso,
}: {
  titulo: string;
  total: number;
  qtd: number;
  detalhe: string;
  selo?: React.ReactNode;
  atraso: number;
}) {
  return (
    <div
      style={{ animationDelay: `${atraso}ms` }}
      className="animate-fade-up rounded-2xl border border-borda bg-background p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground/60">{titulo}</p>
        {selo}
      </div>
      <p className="mt-1 text-3xl font-bold tabular-nums text-preto">
        <Contador valor={total} formatar={(n) => brl.format(n)} />
      </p>
      <p className="mt-1 text-xs text-foreground/50">
        {qtd} venda(s) · ticket médio {brl.format(qtd > 0 ? total / qtd : 0)}
      </p>
      <p className="mt-1 text-xs text-foreground/50">{detalhe}</p>
    </div>
  );
}

function CartaoAtalho({
  href,
  icone,
  titulo,
  valor,
  detalhe,
  alerta = false,
  ok = false,
  atraso,
}: {
  href: string;
  icone: React.ReactNode;
  titulo: string;
  valor: string;
  detalhe: string;
  alerta?: boolean;
  ok?: boolean;
  atraso: number;
}) {
  return (
    <Link
      href={href}
      onClick={() => tocarSom("clique")}
      style={{ animationDelay: `${atraso}ms` }}
      className="group animate-fade-up relative rounded-2xl border border-borda bg-background p-5 transition hover:-translate-y-0.5 hover:border-vermelho/50 hover:shadow-lg hover:shadow-vermelho/5"
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            alerta ? "bg-vermelho/10 text-vermelho" : ok ? "bg-emerald-50 text-emerald-600" : "bg-foreground/5 text-foreground/50"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icone}
          </svg>
        </span>
        {alerta && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vermelho opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-vermelho" />
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-foreground/60">{titulo}</p>
      <p className={`mt-0.5 text-2xl font-bold tabular-nums ${alerta ? "text-vermelho" : "text-preto"}`}>{valor}</p>
      <p className="mt-1 text-xs text-foreground/50">{detalhe}</p>
      <span className="absolute right-4 bottom-4 text-foreground/25 transition group-hover:translate-x-0.5 group-hover:text-vermelho">
        →
      </span>
    </Link>
  );
}

function Alternar<T extends string | number>({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full bg-foreground/5 p-0.5 text-xs font-medium">
      {opcoes.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          onClick={() => {
            tocarSom("clique");
            onChange(o.valor);
          }}
          className={`rounded-full px-3 py-1 transition ${
            valor === o.valor ? "bg-white text-preto shadow-sm" : "text-foreground/55 hover:text-foreground"
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

function GraficoVendas({ dias }: { dias: VendaDia[] }) {
  const [periodo, setPeriodo] = useState<7 | 30>(30);
  const [metrica, setMetrica] = useState<"total" | "qtd">("total");
  const visiveis = dias.slice(-periodo);
  const valores = visiveis.map((d) => (metrica === "total" ? d.total : d.qtd));
  const maximo = Math.max(...valores, 0);
  const soma = valores.reduce((s, v) => s + v, 0);
  const media = visiveis.length > 0 ? soma / visiveis.length : 0;
  const formatar = (v: number) => (metrica === "total" ? brl.format(v) : `${v} venda(s)`);
  const indiceMelhor = valores.indexOf(maximo);

  return (
    <section className="mt-6 rounded-3xl border border-borda bg-background p-5 sm:p-6 animate-fade-up [animation-delay:340ms]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-preto">Desempenho por dia</h3>
          <p className="mt-0.5 text-sm text-foreground/60">
            {maximo === 0
              ? "Sem vendas no período"
              : `${formatar(soma)} no período · média ${metrica === "total" ? brl.format(media) : media.toFixed(1)} por dia`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Alternar
            opcoes={[
              { valor: "total", rotulo: "Faturamento" },
              { valor: "qtd", rotulo: "Vendas" },
            ]}
            valor={metrica}
            onChange={setMetrica}
          />
          <Alternar
            opcoes={[
              { valor: 7 as const, rotulo: "7 dias" },
              { valor: 30 as const, rotulo: "30 dias" },
            ]}
            valor={periodo}
            onChange={setPeriodo}
          />
        </div>
      </div>

      {maximo === 0 ? (
        <Vazio texto="Nenhuma venda nesse período ainda. Assim que vender, aparece aqui." />
      ) : (
        <>
          <div key={`${periodo}-${metrica}`} className="relative mt-8 flex h-52 items-end gap-[3px] border-b border-borda">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 z-0 border-t border-dashed border-foreground/25"
              style={{ bottom: `${(media / maximo) * 100}%` }}
            >
              <span className="absolute -top-5 right-0 rounded bg-background px-1 text-[10px] text-foreground/45">
                média
              </span>
            </div>
            {visiveis.map((d, i) => {
              const v = valores[i];
              const altura = v > 0 ? Math.max((v / maximo) * 100, 2) : 0;
              const ehHoje = i === visiveis.length - 1;
              const ehMelhor = i === indiceMelhor;
              return (
                <div
                  key={d.dia}
                  tabIndex={0}
                  aria-label={`${dataCurta(d.dia)}: ${brl.format(d.total)}, ${d.qtd} venda(s)`}
                  className="group relative z-10 flex h-full flex-1 items-end outline-none"
                >
                  <div
                    className={`anim-cresce-y w-full rounded-t-md transition-colors ${
                      ehHoje
                        ? "bg-vermelho-vivo"
                        : "bg-vermelho/80 group-hover:bg-vermelho group-focus-visible:bg-vermelho"
                    }`}
                    style={{ height: `${altura}%`, animationDelay: `${i * (periodo === 7 ? 60 : 18)}ms` }}
                  />
                  {ehMelhor && periodo === 7 && (
                    <span className="absolute left-1/2 -translate-x-1/2 text-[10px] font-semibold text-vermelho" style={{ bottom: `calc(${altura}% + 4px)` }}>
                      ★
                    </span>
                  )}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-preto px-3 py-2 text-xs text-white shadow-xl group-hover:block group-focus-visible:block">
                    <p className="font-semibold">{ehHoje ? "Hoje" : dataCurta(d.dia)}</p>
                    <p className="tabular-nums">{brl.format(d.total)}</p>
                    <p className="text-white/60">{d.qtd} venda(s)</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-foreground/50">
            <span>{dataCurta(visiveis[0].dia)}</span>
            <span className="font-medium text-vermelho">Hoje</span>
          </div>
        </>
      )}

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-foreground/60 hover:text-foreground">Ver em tabela</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-foreground/50">
            <tr>
              <th className="py-1 font-medium">Dia</th>
              <th className="py-1 text-right font-medium">Vendas</th>
              <th className="py-1 text-right font-medium">Faturamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {[...visiveis].reverse().map((d) => (
              <tr key={d.dia}>
                <td className="py-1">{dataCurta(d.dia)}</td>
                <td className="py-1 text-right tabular-nums">{d.qtd}</td>
                <td className="py-1 text-right tabular-nums">{brl.format(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

function Secao({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-borda bg-background p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold text-preto">{titulo}</h3>
        {acao}
      </div>
      {children}
    </section>
  );
}

function ListaBarras({
  itens,
  semRanking = false,
}: {
  itens: { chave: string; rotulo: string; valor: number; texto: string }[];
  semRanking?: boolean;
}) {
  const maximo = Math.max(...itens.map((i) => i.valor), 1);
  const medalhas = ["bg-amber-400 text-amber-950", "bg-zinc-300 text-zinc-800", "bg-orange-300 text-orange-950"];
  return (
    <ul className="mt-4 space-y-3 text-sm">
      {itens.map((item, i) => (
        <li key={item.chave} className="flex items-center gap-3">
          {!semRanking && (
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                medalhas[i] ?? "bg-foreground/5 text-foreground/50"
              }`}
            >
              {i + 1}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate">{item.rotulo}</span>
              <span className="shrink-0 text-xs tabular-nums text-foreground/60">{item.texto}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/5">
              <div
                className="anim-cresce-x h-2 rounded-full bg-gradient-to-r from-vermelho to-vermelho-vivo"
                style={{ width: `${(item.valor / maximo) * 100}%`, animationDelay: `${i * 70}ms` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SeloEstoque({ estoque }: { estoque: number }) {
  if (estoque <= 0) {
    return (
      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        ● Zerado{estoque < 0 ? ` (${estoque})` : ""}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
      ▲ {estoque} un
    </span>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p className="py-8 text-center text-sm text-foreground/50">{texto}</p>;
}
