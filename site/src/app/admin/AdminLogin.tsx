"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="flex min-h-screen items-center justify-center bg-preto">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg"
      >
        <h1 className="text-xl font-semibold text-preto text-center">
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
          className="mt-6 w-full rounded-md border border-borda px-4 py-2"
          autoFocus
        />
        {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="mt-4 w-full rounded-full bg-vermelho px-6 py-2 font-medium text-white hover:brightness-110 transition disabled:opacity-60"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
