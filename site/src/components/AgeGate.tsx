"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";

const STORAGE_KEY = "du_bebidas_maioridade_confirmada";

function subscribe() {
  // localStorage não dispara evento na própria aba que escreve — a
  // confirmação instantânea do clique é tratada via estado local
  // (confirmadoAgora), não por essa inscrição.
  return () => {};
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  // Sem acesso ao localStorage no servidor: assume não confirmado, o que
  // faz o gate aparecer por padrão até o React reconciliar com o valor
  // real do cliente logo após a hidratação.
  return false;
}

export function AgeGate() {
  const confirmadoAntes = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [confirmadoAgora, setConfirmadoAgora] = useState(false);
  const [recusado, setRecusado] = useState(false);
  const visivel = !confirmadoAntes && !confirmadoAgora;

  useEffect(() => {
    if (!visivel) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [visivel]);

  function confirmar() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setConfirmadoAgora(true);
  }

  function recusar() {
    setRecusado(true);
  }

  if (!visivel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-6 backdrop-blur-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 600px 400px at 50% 0%, rgba(200,16,46,0.22), transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-md animate-scale-in overflow-hidden rounded-2xl border border-borda bg-background text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="relative bg-preto px-8 pb-8 pt-10">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,59,78,0.35),transparent_60%)]"
          />
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-vermelho/50 animate-glow"
            />
            <Image
              src="/logo-du-bebidas.svg"
              alt="Du Bebidas"
              width={80}
              height={80}
              className="relative"
              priority
            />
          </div>

          {!recusado ? (
            <>
              <h2 className="mt-5 font-display text-3xl tracking-wide text-white">
                Bem-vindo à Du Bebidas
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Este site vende bebidas alcoólicas. Confirma que você tem 18
                anos ou mais?
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-5 font-display text-2xl tracking-wide text-white">
                Acesso restrito
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Esse site é destinado só a maiores de 18 anos. Volte quando
                tiver a idade permitida.
              </p>
            </>
          )}
        </div>

        {!recusado ? (
          <div className="space-y-3 px-8 py-7">
            <button
              type="button"
              onClick={confirmar}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-vermelho-vivo px-6 py-3 font-semibold text-preto transition hover:brightness-95 hover:shadow-lg hover:shadow-vermelho-vivo/30 active:scale-[0.98]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[130%] transition-transform duration-700 group-hover:translate-x-[130%]"
              />
              <span className="relative">Sim, sou maior de idade</span>
            </button>
            <button
              type="button"
              onClick={recusar}
              className="w-full rounded-full border border-borda px-6 py-2.5 font-medium text-foreground/70 transition hover:border-vermelho hover:text-vermelho active:scale-[0.98]"
            >
              Não
            </button>
            <p className="pt-1 text-xs leading-relaxed text-foreground/50">
              Ao confirmar, você declara ser maior de idade. Venda e consumo
              de bebida alcoólica proibidos para menores de 18 anos.
            </p>
          </div>
        ) : (
          <div className="px-8 py-7">
            <a
              href="https://www.google.com"
              className="inline-flex w-full items-center justify-center rounded-full border border-borda px-6 py-2.5 font-medium text-foreground/70 transition hover:border-vermelho hover:text-vermelho"
            >
              Sair do site
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
