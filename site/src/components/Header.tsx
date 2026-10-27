import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-preto/90 text-white shadow-lg shadow-black/40 backdrop-blur-md">
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
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-[#0b2e17] transition hover:brightness-105 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 12-12S18.6 0 12 0zm0 22c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.9 1 1-3.8-.2-.4C2.2 15.4 2 13.7 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm5.6-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.8-1-2.4-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
          </svg>
          WhatsApp
        </a>
      </div>
    </header>
  );
}
