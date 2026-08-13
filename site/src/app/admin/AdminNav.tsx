"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
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
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1 rounded-full bg-white/10 p-1">
            {LINKS.map((link) => {
              const ativo = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    ativo ? "bg-vermelho text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <button onClick={sair} className="text-sm text-white/70 hover:text-white">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
