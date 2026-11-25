"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { salvarPreferencias, tocarSom, usePreferenciasEfeitos } from "@/lib/efeitosAdmin";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/pdv", label: "PDV" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/estoque", label: "Estoque" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/clientes", label: "Clientes" },
];

export function AdminNav({ adminNome }: { adminNome: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <header className="bg-preto text-white">
      <div className="mx-auto max-w-5xl px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Painel — Du Bebidas</h1>
          <p className="text-xs text-white/60">Logado como {adminNome}</p>
        </div>
        <div className="flex min-w-0 max-w-full items-center gap-4">
          <nav className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto rounded-full bg-white/10 p-1">
            {LINKS.map((link) => {
              const ativo = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    ativo ? "bg-vermelho text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <BotaoEfeitos />
          <button onClick={sair} className="shrink-0 text-sm text-white/70 hover:text-white">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

function Chave({
  ligada,
  onChange,
  titulo,
  descricao,
}: {
  ligada: boolean;
  onChange: (valor: boolean) => void;
  titulo: string;
  descricao: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      onClick={() => onChange(!ligada)}
      className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition hover:bg-black/5"
    >
      <span>
        <span className="block text-sm font-medium text-preto">{titulo}</span>
        <span className="block text-xs text-foreground/55">{descricao}</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          ligada ? "bg-vermelho" : "bg-foreground/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            ligada ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

// Liga/desliga sons e animações do painel inteiro (fica salvo no aparelho)
function BotaoEfeitos() {
  const { sons, animacoes } = usePreferenciasEfeitos();
  const [aberto, setAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raiz = document.documentElement;
    if (animacoes) raiz.removeAttribute("data-sem-animacao");
    else raiz.setAttribute("data-sem-animacao", "");
    return () => raiz.removeAttribute("data-sem-animacao");
  }, [animacoes]);

  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (!caixaRef.current?.contains(e.target as Node)) setAberto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const tudoDesligado = !sons && !animacoes;

  return (
    <div ref={caixaRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label="Sons e animações"
        title="Sons e animações"
        className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
          aberto ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        {sons ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path d="m22 9-6 6M16 9l6 6" />
          </svg>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 animate-scale-in rounded-2xl border border-borda bg-white p-2 text-foreground shadow-2xl shadow-black/30">
          <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-foreground/45">
            Efeitos do painel
          </p>
          <Chave
            titulo="Sons"
            descricao="Venda, pedido novo, meta batida"
            ligada={sons}
            onChange={(valor) => {
              salvarPreferencias({ sons: valor });
              if (valor) tocarSom("sucesso");
            }}
          />
          <Chave
            titulo="Animações"
            descricao="Números, gráficos e comemorações"
            ligada={animacoes}
            onChange={(valor) => salvarPreferencias({ animacoes: valor })}
          />
          <div className="mt-1 border-t border-borda pt-1">
            <button
              type="button"
              onClick={() =>
                salvarPreferencias(
                  tudoDesligado ? { sons: true, animacoes: true } : { sons: false, animacoes: false }
                )
              }
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-vermelho transition hover:bg-vermelho/5"
            >
              {tudoDesligado ? "Ligar tudo" : "Desligar tudo"}
            </button>
          </div>
          {!sons && (
            <p className="px-3 pb-2 text-xs leading-snug text-amber-700">
              Com o som desligado, o alerta de pedido novo também fica mudo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
