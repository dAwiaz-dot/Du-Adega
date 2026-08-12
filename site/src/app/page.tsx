import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { produtos, categorias, categoriaIcone } from "@/data/produtos";

export const metadata: Metadata = {
  title: "Du Bebidas — Destilados, Vinhos e Cerveja em Alfenas-MG",
  description:
    "Adega e conveniência de bebidas em Alfenas-MG, aberta 24 horas. Destilados, vinhos, cerveja gelada, gelo, carvão e refrigerante com entrega rápida.",
  keywords: [
    "adega Alfenas MG",
    "conveniência de bebidas 24h",
    "cerveja gelada delivery",
    "vinhos Alfenas",
    "destilados Alfenas",
  ],
};

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-preto text-white">
          <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20 text-center">
            <div className="mx-auto mb-6 h-20 w-20 overflow-hidden rounded-full ring-2 ring-vermelho">
              <Image
                src="/logo-du-bebidas.svg"
                alt="Du Bebidas"
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-vermelho-vivo font-medium tracking-widest uppercase text-sm">
              Alfenas-MG · Aberto 24 horas
            </p>
            <h1 className="mt-4 text-4xl sm:text-5xl font-semibold leading-tight">
              Destilados, vinhos e cerveja
              <br />
              gelada na porta da sua casa
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-white/80 text-lg">
              Gelo, carvão, água, refrigerante e as bebidas que você precisa,
              a qualquer hora. Escolha os produtos e finalize seu pedido em
              poucos minutos.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/pedido"
                className="inline-block rounded-full bg-vermelho-vivo px-8 py-3 font-semibold text-preto hover:brightness-95 transition"
              >
                Fazer meu pedido
              </Link>
              <a
                href="https://wa.me/5535910034182"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full border border-white/30 px-8 py-3 font-semibold text-white hover:border-white transition"
              >
                Chamar no WhatsApp
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70">
              <span>🕐 Aberto 24h · seg. até 13h</span>
              <span>📍 Alameda das Acácias, 530</span>
              <span>🛵 Entrega rápida</span>
            </div>
          </div>
        </section>

        <nav
          aria-label="Categorias"
          className="sticky top-[64px] z-10 overflow-x-auto border-b border-borda bg-card"
        >
          <div className="mx-auto flex max-w-5xl gap-2 px-6 py-3">
            {categorias.map((categoria) => (
              <a
                key={categoria}
                href={`#cat-${categoria}`}
                className="flex shrink-0 items-center gap-2 rounded-full border border-borda px-4 py-1.5 text-sm font-medium hover:border-vermelho hover:text-vermelho transition"
              >
                <span>{categoriaIcone[categoria] ?? "🍹"}</span>
                {categoria}
              </a>
            ))}
          </div>
        </nav>

        <section id="catalogo" className="bg-card">
          <div className="mx-auto max-w-5xl px-6 py-14">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-semibold text-preto">Cardápio</h2>
              <p className="text-sm text-foreground/70">
                Catálogo provisório — em breve com fotos e produtos reais.
              </p>
            </div>

            {categorias.map((categoria) => (
              <div key={categoria} id={`cat-${categoria}`} className="mt-10 scroll-mt-32">
                <h3 className="flex items-center gap-2 font-semibold uppercase tracking-wide text-sm text-vermelho">
                  <span>{categoriaIcone[categoria] ?? "🍹"}</span>
                  {categoria}
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {produtos
                    .filter((p) => p.categoria === categoria)
                    .map((produto) => (
                      <div
                        key={produto.id}
                        className="flex gap-4 rounded-lg border border-borda bg-background p-4"
                      >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-preto text-3xl">
                          {categoriaIcone[categoria] ?? "🍹"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{produto.nome}</p>
                          <p className="text-sm text-foreground/60 mt-1 line-clamp-2">
                            {produto.descricao}
                          </p>
                          <p className="mt-2 font-semibold text-vermelho">
                            R$ {produto.preco.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            <div className="mt-12 text-center">
              <Link
                href="/pedido"
                className="inline-block rounded-full bg-vermelho px-8 py-3 font-semibold text-white hover:brightness-110 transition"
              >
                Ver carrinho e pedir
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
