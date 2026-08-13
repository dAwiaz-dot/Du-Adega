"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CHAVE_DISPENSADO = "du-bebidas-instalar-dispensado";
const DIAS_PARA_REAPARECER = 14;

function estaInstalado() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return standalone || iosStandalone;
}

function ehIOS() {
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visivel, setVisivel] = useState(false);
  const [ios, setIos] = useState(false);
  const [instalando, setInstalando] = useState(false);

  useEffect(() => {
    if (estaInstalado()) return;

    const dispensadoEm = localStorage.getItem(CHAVE_DISPENSADO);
    if (dispensadoEm) {
      const dias = (Date.now() - Number(dispensadoEm)) / (1000 * 60 * 60 * 24);
      if (dias < DIAS_PARA_REAPARECER) return;
    }

    const iOS = ehIOS();
    setIos(iOS);

    function aoTerBeforeInstall(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setVisivel(true);
    }
    window.addEventListener("beforeinstallprompt", aoTerBeforeInstall);

    // iOS Safari não dispara beforeinstallprompt — mostra a dica manual direto.
    const timer = setTimeout(() => {
      if (iOS) setVisivel(true);
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", aoTerBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  function dispensar() {
    setVisivel(false);
    localStorage.setItem(CHAVE_DISPENSADO, String(Date.now()));
  }

  async function instalar() {
    if (!promptEvent) return;
    setInstalando(true);
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      setVisivel(false);
      localStorage.setItem(CHAVE_DISPENSADO, String(Date.now()));
    } finally {
      setInstalando(false);
      setPromptEvent(null);
    }
  }

  if (!visivel) return null;

  return (
    <div className="fixed bottom-4 left-4 right-20 z-40 animate-slide-up sm:right-24 sm:max-w-sm">
      <div className="flex items-center gap-3 rounded-xl border border-vermelho-vivo/30 bg-preto p-4 text-white shadow-xl">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/20">
          <Image src="/icon-192.png" alt="" fill sizes="40px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Instale a Du Bebidas</p>
          {ios ? (
            <p className="mt-0.5 text-xs text-white/70">
              Toque em <span className="font-medium">Compartilhar</span> (
              <span aria-hidden>⬆️</span>) e depois em{" "}
              <span className="font-medium">Adicionar à Tela de Início</span>.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-white/70">
              Acesso rápido direto da tela inicial, sem precisar abrir o navegador.
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {!ios && promptEvent && (
            <button
              onClick={instalar}
              disabled={instalando}
              className="rounded-full bg-vermelho-vivo px-3 py-1.5 text-xs font-semibold text-preto transition hover:brightness-95 active:scale-95 disabled:opacity-60"
            >
              {instalando ? "..." : "Instalar"}
            </button>
          )}
          <button onClick={dispensar} className="text-xs text-white/50 hover:text-white/80">
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
