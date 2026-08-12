import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { produtos, categorias } from "@/data/produtos";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-preto text-white">
          <div className="mx-auto max-w-5xl px-6 py-24 text-center">
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
            <div className="mt-10">
              <Link
                href="/pedido"
                className="inline-block rounded-full bg-vermelho-vivo px-8 py-3 font-semibold text-preto hover:brightness-95 transition"
              >
                Fazer meu pedido
              </Link>
            </div>
          </div>
        </section>

        <section id="sobre" className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <h3 className="font-semibold text-vermelho text-lg">Aberto 24 horas</h3>
              <p className="mt-2 text-sm text-foreground/70">
                Todos os dias, sem parar — segunda até às 13h. Bebida boa não
                tem hora certa.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-vermelho text-lg">Entrega em Alfenas</h3>
              <p className="mt-2 text-sm text-foreground/70">
                Pedido feito online, entregue rápido na sua casa ou evento.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-vermelho text-lg">Atendimento próximo</h3>
              <p className="mt-2 text-sm text-foreground/70">
                Dúvida sobre o pedido ou combo? É só chamar no WhatsApp.
              </p>
            </div>
          </div>
        </section>

        <section id="catalogo" className="bg-card border-y border-borda">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-2xl font-semibold text-preto text-center">
              Alguns dos nossos produtos
            </h2>
            <p className="text-center text-sm text-foreground/60 mt-2">
              Catálogo provisório — em breve com os produtos reais da loja.
            </p>

            {categorias.map((categoria) => (
              <div key={categoria} className="mt-10">
                <h3 className="text-vermelho-vivo font-semibold uppercase tracking-wide text-sm">
                  {categoria}
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {produtos
                    .filter((p) => p.categoria === categoria)
                    .map((produto) => (
                      <div
                        key={produto.id}
                        className="rounded-lg border border-borda bg-background p-4"
                      >
                        <p className="font-semibold">{produto.nome}</p>
                        <p className="text-sm text-foreground/60 mt-1">
                          {produto.descricao}
                        </p>
                        <p className="mt-3 font-semibold text-vermelho">
                          R$ {produto.preco.toFixed(2)}
                        </p>
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
                Ver catálogo completo e pedir
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
