import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-preto text-white shadow-lg shadow-black/30">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/logo-du-bebidas.svg"
            alt="Du Bebidas"
            width={44}
            height={44}
            className="rounded-full transition-transform duration-300 group-hover:scale-105"
          />
          <div className="leading-tight">
            <p className="font-display text-2xl tracking-wide">
              Du <span className="text-vermelho-vivo">Bebidas</span>
            </p>
            <p className="text-[11px] text-white/50">Alfenas-MG · aberto 24h</p>
          </div>
        </Link>
        <a
          href="https://wa.me/5535910034182"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-vermelho-vivo px-4 py-2 text-sm font-medium text-preto transition hover:brightness-95 active:scale-95"
        >
          WhatsApp
        </a>
      </div>
    </header>
  );
}
