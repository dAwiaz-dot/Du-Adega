import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PedidoForm } from "@/components/PedidoForm";

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

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="flex-1 bg-card">
        <section className="bg-preto text-white">
          <div className="mx-auto max-w-3xl px-6 py-10 text-center">
            <div className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full ring-2 ring-vermelho">
              <Image
                src="/logo-du-bebidas.svg"
                alt="Du Bebidas"
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Faça seu pedido</h1>
            <p className="mt-2 text-white/70 text-sm">
              Escolha os produtos, informe seus dados e envie. Combinamos o
              pagamento na entrega.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
              <span>🕐 Aberto 24h · seg. até 13h</span>
              <span>📍 Alameda das Acácias, 530</span>
              <span>🛵 Entrega rápida</span>
            </div>
            <a
              href="https://wa.me/5535910034182"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full border border-white/30 px-6 py-2 text-sm font-semibold text-white hover:border-white transition"
            >
              Prefere pedir no WhatsApp?
            </a>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-6 py-10">
          <PedidoForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
