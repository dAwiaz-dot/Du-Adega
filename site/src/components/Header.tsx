import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-preto text-white shadow-lg shadow-black/30">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-du-bebidas.svg"
            alt="Du Bebidas"
            width={44}
            height={44}
            className="rounded-full"
          />
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-wide">
              Du <span className="text-vermelho-vivo">Bebidas</span>
            </p>
            <p className="text-[11px] text-white/50">Alfenas-MG · aberto 24h</p>
          </div>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/#catalogo"
            className="hidden sm:block hover:text-vermelho-vivo transition-colors"
          >
            Produtos
          </Link>
          <Link
            href="/pedido"
            className="rounded-full bg-vermelho-vivo px-4 py-2 font-medium text-preto hover:brightness-95 transition"
          >
            Fazer pedido
          </Link>
        </nav>
      </div>
    </header>
  );
}
