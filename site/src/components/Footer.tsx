import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-preto text-white/70">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm">
        <div className="flex items-center gap-4">
          <Image
            src="/logo-du-bebidas.svg"
            alt="Du Bebidas"
            width={40}
            height={40}
            className="rounded-full shrink-0"
          />
          <div>
            <p className="text-white">Du Bebidas — destilados, vinhos e cerveja. Aberto 24h.</p>
            <p className="mt-1">
              Alameda das Acácias, 530 · Alfenas-MG · (35) 91003-4182
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/5535910034182"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp Du Bebidas"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-vermelho-vivo hover:text-vermelho-vivo active:scale-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 12-12S18.6 0 12 0zm0 22c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.9 1 1-3.8-.2-.4C2.2 15.4 2 13.7 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm5.6-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.8-1-2.4-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/du_bebidas.26/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram Du Bebidas"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-vermelho-vivo hover:text-vermelho-vivo active:scale-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 2 .2 2.5.4.6.2 1 .5 1.5 1 .4.4.7.9 1 1.5.2.5.3 1.2.4 2.5.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 2-.4 2.5-.2.6-.5 1-1 1.5-.4.4-.9.7-1.5 1-.5.2-1.2.3-2.5.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-2-.2-2.5-.4-.6-.2-1-.5-1.5-1-.4-.4-.7-.9-1-1.5-.2-.5-.3-1.2-.4-2.5-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-2 .4-2.5.2-.6.5-1 1-1.5.4-.4.9-.7 1.5-1 .5-.2 1.2-.3 2.5-.4 1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 5.8.1 5 .3 4.2.6c-.8.3-1.5.7-2.2 1.4C1.3 2.7.9 3.4.6 4.2.3 5 .1 5.8.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.3.2 2.1.5 2.9.3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.6.4 2.9.5 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c1.3-.1 2.1-.2 2.9-.5.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.4-1.6.5-2.9.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.3-.2-2.1-.5-2.9-.3-.8-.7-1.5-1.4-2.2C21.3 1.3 20.6.9 19.8.6 19 .3 18.2.1 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.4a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
