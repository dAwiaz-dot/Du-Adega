import Link from "next/link";

export function Header() {
  return (
    <header className="bg-preto text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-wide">
          Du <span className="text-vermelho-vivo">Bebidas</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/#sobre" className="hover:text-vermelho-vivo transition-colors">
            Sobre
          </Link>
          <Link href="/#catalogo" className="hover:text-vermelho-vivo transition-colors">
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
