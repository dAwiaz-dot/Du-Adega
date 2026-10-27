import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PedidoForm } from "@/components/PedidoForm";
import { SocialFloat } from "@/components/SocialFloat";
import { InstallPrompt } from "@/components/InstallPrompt";
import { listarProdutosSite } from "@/lib/produtos";
import type { Produto } from "@/lib/db";
import { listarCategorias } from "@/lib/categorias";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Du Bebidas — Peça destilados, vinhos e cerveja em Alfenas-MG",
  description:
    "Adega e conveniência de bebidas em Alfenas-MG, aberta 24 horas. Monte seu pedido de destilados, vinhos, cerveja, gelo e refrigerante com entrega rápida.",
  keywords: [
    "adega Alfenas MG",
    "conveniência de bebidas 24h",
    "pedido de bebidas online Alfenas",
    "delivery de cerveja Alfenas",
    "vinhos Alfenas",
    "destilados Alfenas",
  ],
};

// Fotos do hero: um produto de cada tipo de bebida (é uma adega), priorizando
// os marcados como "mais pedido"
const TIPOS_VITRINE = [/cerveja|long/i, /whisk|destilad|gin|vodka/i, /energ/i, /vinho/i];

function escolherVitrine(produtos: Produto[]): Produto[] {
  const comFoto = produtos.filter((p) => p.imagem);
  const escolhidos: Produto[] = [];
  for (const tipo of TIPOS_VITRINE) {
    const doTipo = comFoto.filter((p) => tipo.test(p.categoria));
    const escolhido = doTipo.find((p) => p.destaque) ?? doTipo[0];
    if (escolhido) escolhidos.push(escolhido);
  }
  return escolhidos;
}

const WHATSAPP_URL = "https://wa.me/5535910034182";

export default function Home() {
  const produtos = listarProdutosSite();
  const categorias = listarCategorias();
  const vitrine = escolherVitrine(produtos);

  return (
    <div className="tema-loja flex min-h-full flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-white/5">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-vermelho/25 blur-[120px] lg:left-1/3"
          />

          <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-6 pt-10 pb-12 sm:pt-14 lg:grid-cols-[1.15fr_1fr] lg:pb-16">
            <div className="text-center lg:text-left">
              <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Aberto 24h · segunda até 13h
              </span>

              <h1 className="mt-5 font-display text-[3.4rem] leading-[0.9] tracking-wide text-white animate-fade-up [animation-delay:80ms] sm:text-7xl">
                Bebida gelada
                <br />
                <span className="text-vermelho-vivo">na sua porta.</span>
              </h1>

              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/65 animate-fade-up [animation-delay:160ms] lg:mx-0">
                Cerveja, destilados, vinhos, gelo e conveniência em Alfenas-MG.
                Monte seu pedido aqui e pague na entrega.
              </p>

              <div className="mt-7 flex flex-col items-center gap-3 animate-fade-up [animation-delay:240ms] sm:flex-row sm:justify-center lg:justify-start">
                <a
                  href="#cardapio"
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-vermelho px-7 py-3.5 font-semibold text-white shadow-lg shadow-vermelho/30 transition hover:brightness-110 active:scale-[0.97] sm:w-auto"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[130%] transition-transform duration-700 group-hover:translate-x-[130%]"
                  />
                  <span className="relative">Ver produtos</span>
                  <svg className="relative transition-transform group-hover:translate-y-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 font-semibold text-white transition hover:border-[#25D366] hover:text-[#25D366] active:scale-[0.97] sm:w-auto"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 12-12S18.6 0 12 0zm0 22c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.9 1 1-3.8-.2-.4C2.2 15.4 2 13.7 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm5.6-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.8-1-2.4-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" /></svg>
                  Pedir no WhatsApp
                </a>
              </div>

              <ul className="mt-8 grid grid-cols-3 gap-2 text-left animate-fade-up [animation-delay:320ms] sm:gap-3">
                {[
                  {
                    titulo: "24 horas",
                    texto: "seg. até 13h",
                    icone: <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
                  },
                  {
                    titulo: "Entrega",
                    texto: "Alfenas e região",
                    icone: <path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM9 17h6m4 0h1v-4l-3-5h-4v9M3 17h2V9h7" />,
                  },
                  {
                    titulo: "Paga na entrega",
                    texto: "combinado com a loja",
                    icone: <path d="M3 7h18v10H3zM3 11h18M7 15h3" />,
                  },
                ].map((item) => (
                  <li
                    key={item.titulo}
                    className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-vermelho-vivo">
                      {item.icone}
                    </svg>
                    <p className="mt-2 text-[13px] font-semibold leading-tight text-white">{item.titulo}</p>
                    <p className="mt-0.5 text-[11px] leading-tight text-white/50">{item.texto}</p>
                  </li>
                ))}
              </ul>
            </div>

            {vitrine.length >= 4 && (
              <div aria-hidden className="relative hidden lg:block">
                <div className="absolute inset-6 rounded-full bg-vermelho/20 blur-3xl animate-glow" />
                <div className="relative grid grid-cols-2 gap-4">
                  {vitrine.map((produto, i) => (
                    <div
                      key={produto.id}
                      style={{ animationDelay: `${200 + i * 90}ms` }}
                      className={`animate-scale-in overflow-hidden rounded-3xl border border-white/10 bg-card p-2 shadow-2xl shadow-black/60 ${
                        i % 2 === 1 ? "translate-y-8" : ""
                      }`}
                    >
                      <div className="tile-foto relative aspect-square overflow-hidden rounded-2xl">
                        <Image
                          src={produto.imagem!}
                          alt=""
                          fill
                          sizes="220px"
                          className="object-contain p-4"
                        />
                      </div>
                      <p className="truncate px-2 pt-2.5 pb-1 text-xs font-medium text-white/70">
                        {produto.nome}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <div id="cardapio" className="mx-auto max-w-5xl scroll-mt-20 px-6 pt-8 pb-12">
          <PedidoForm produtosIniciais={produtos} categoriasIniciais={categorias} />
        </div>
      </main>

      <Footer />
      <SocialFloat />
      <InstallPrompt />
    </div>
  );
}
