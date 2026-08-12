"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export function AdminLogin() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    });

    setCarregando(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Senha incorreta.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-preto px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px] text-white"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-vermelho/30 blur-3xl animate-glow"
      />

      <form
        onSubmit={entrar}
        className="relative w-full max-w-sm animate-fade-up rounded-2xl bg-white p-8 shadow-2xl shadow-black/50"
      >
        <div className="relative mx-auto mb-4 h-14 w-14 animate-scale-in">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full bg-vermelho/30 blur-md animate-glow"
          />
          <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-vermelho">
            <Image
              src="/logo-du-bebidas.svg"
              alt="Du Bebidas"
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <h1 className="font-display text-3xl tracking-wide text-preto text-center">
          Painel de Pedidos
        </h1>
        <p className="text-sm text-foreground/60 text-center mt-1">
          Área restrita — Du Bebidas
        </p>

        <input
          type="password"
          placeholder="Senha de acesso"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="mt-6 w-full rounded-md border border-borda px-4 py-2 transition focus:border-vermelho focus:outline-none focus:ring-2 focus:ring-vermelho/20"
          autoFocus
        />

        {erro && (
          <p className="mt-2 animate-fade-up text-sm text-red-600">{erro}</p>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-vermelho px-6 py-2.5 font-medium text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {carregando && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
