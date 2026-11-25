"use client";

// Sons e animações do painel admin. Tudo é sintetizado com Web Audio (sem
// arquivo de áudio) e pode ser desligado pelo botão "Efeitos" no menu do
// admin. A preferência fica salva no navegador de cada aparelho.

import { useSyncExternalStore } from "react";

export type PreferenciasEfeitos = { sons: boolean; animacoes: boolean };

const CHAVE = "du_admin_efeitos";
const PADRAO: PreferenciasEfeitos = { sons: true, animacoes: true };

let atual: PreferenciasEfeitos | null = null;
const ouvintes = new Set<() => void>();

function ler(): PreferenciasEfeitos {
  if (atual) return atual;
  try {
    const salvo = localStorage.getItem(CHAVE);
    atual = salvo ? { ...PADRAO, ...JSON.parse(salvo) } : PADRAO;
  } catch {
    atual = PADRAO;
  }
  return atual!;
}

export function salvarPreferencias(novas: Partial<PreferenciasEfeitos>) {
  atual = { ...ler(), ...novas };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(atual));
  } catch {
    // modo privado ou armazenamento bloqueado — vale só pra essa sessão
  }
  ouvintes.forEach((ouvinte) => ouvinte());
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function usePreferenciasEfeitos(): PreferenciasEfeitos {
  return useSyncExternalStore(assinar, ler, () => PADRAO);
}

export function animacoesLigadas(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  return ler().animacoes;
}

export type Som = "clique" | "sucesso" | "venda" | "novoPedido" | "meta" | "erro";

// [frequência Hz, início s, duração s, tipo de onda, volume]
type Nota = [number, number, number, OscillatorType, number];

const SONS: Record<Som, Nota[]> = {
  clique: [[1200, 0, 0.05, "triangle", 0.12]],
  sucesso: [
    [660, 0, 0.12, "sine", 0.22],
    [990, 0.09, 0.18, "sine", 0.22],
  ],
  // "plim" de caixa registradora
  venda: [
    [1318, 0, 0.09, "triangle", 0.2],
    [1760, 0.07, 0.09, "triangle", 0.2],
    [2637, 0.14, 0.35, "sine", 0.18],
  ],
  novoPedido: [
    [880, 0, 0.18, "sine", 0.3],
    [1175, 0.2, 0.18, "sine", 0.3],
    [880, 0.4, 0.18, "sine", 0.3],
    [1175, 0.6, 0.3, "sine", 0.3],
  ],
  meta: [
    [523, 0, 0.14, "triangle", 0.22],
    [659, 0.12, 0.14, "triangle", 0.22],
    [784, 0.24, 0.14, "triangle", 0.22],
    [1047, 0.36, 0.5, "triangle", 0.25],
  ],
  erro: [
    [220, 0, 0.15, "square", 0.08],
    [180, 0.14, 0.22, "square", 0.08],
  ],
};

let contexto: AudioContext | null = null;

export function tocarSom(som: Som) {
  if (typeof window === "undefined" || !ler().sons) return;
  try {
    if (!contexto) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      contexto = new Ctor();
    }
    const ctx = contexto;
    if (ctx.state === "suspended") void ctx.resume();
    const agora = ctx.currentTime;
    for (const [freq, inicio, duracao, tipo, volume] of SONS[som]) {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = tipo;
      osc.frequency.value = freq;
      ganho.gain.setValueAtTime(0.0001, agora + inicio);
      ganho.gain.exponentialRampToValueAtTime(volume, agora + inicio + 0.01);
      ganho.gain.exponentialRampToValueAtTime(0.0001, agora + inicio + duracao);
      osc.connect(ganho);
      ganho.connect(ctx.destination);
      osc.start(agora + inicio);
      osc.stop(agora + inicio + duracao + 0.02);
    }
  } catch {
    // navegador bloqueou áudio sem interação prévia — sem problema, é só o som
  }
}
