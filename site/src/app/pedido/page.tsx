import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PedidoForm } from "./PedidoForm";

export const metadata: Metadata = {
  title: "Faça seu pedido",
  description:
    "Monte seu pedido de bebidas — vinhos, cerveja, destilados, gelo e refrigerante — e receba em casa em Alfenas-MG. Entrega rápida, 24 horas.",
  keywords: [
    "pedido de bebidas online Alfenas",
    "delivery de cerveja Alfenas",
    "comprar bebidas 24h",
  ],
};

export default function PedidoPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1 bg-card">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-3xl font-semibold text-preto text-center">
            Faça seu pedido
          </h1>
          <p className="text-center text-foreground/60 mt-2">
            Escolha os produtos, informe seus dados e envie. Combinamos o
            pagamento na entrega.
          </p>
          <PedidoForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
