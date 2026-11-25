import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { carregarDashboard, type ResumoPeriodo, type VendaDia } from "@/lib/dashboard";
import { AdminLogin } from "../AdminLogin";
import { AdminNav } from "../AdminNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — Admin",
  robots: { index: false, follow: false },
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function dataCurta(dia: string) {
  const [, mes, d] = dia.split("-");
  return `${d}/${mes}`;
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adega_admin")?.value === "1";

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const adminNome = cookieStore.get("adega_admin_nome")?.value ?? "Admin";
  const dados = carregarDashboard();

  return (
    <div className="min-h-screen bg-card">
      <AdminNav adminNome={adminNome} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <h2 className="font-display text-2xl tracking-wide text-preto">Visão geral</h2>
        <p className="text-sm text-foreground/60">
          Vendas do site e do balcão somadas. Pedidos cancelados não entram.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <CartaoPeriodo titulo="Hoje" resumo={dados.hoje} destaque />
          <CartaoPeriodo titulo="Últimos 7 dias" resumo={dados.semana} />
          <CartaoPeriodo titulo="Este mês" resumo={dados.mes} />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <CartaoAtalho
            href="/admin"
            titulo="Pedidos online em aberto"
            valor={String(dados.pedidosEmAberto)}
            detalhe={dados.pedidosEmAberto > 0 ? "Novos, preparando ou a caminho" : "Nenhum pendente"}
            alerta={dados.pedidosEmAberto > 0}
          />
          <CartaoAtalho
            href="/admin/pdv"
            titulo="Caixa"
            valor={dados.caixa ? "Aberto" : "Fechado"}
            detalhe={
              dados.caixa
                ? `${brl.format(dados.caixa.totalVendas)} vendido · ${brl.format(
                    dados.caixa.valorEsperadoDinheiro
                  )} em dinheiro na gaveta`
                : "Abra o caixa no PDV pra vender no balcão"
            }
          />
          <CartaoAtalho
            href="/admin/clientes"
            titulo="Fiado a receber"
            valor={brl.format(dados.fiado.total)}
            detalhe={`${dados.fiado.qtd} cliente(s) devendo`}
            alerta={dados.fiado.total > 0}
          />
        </div>

        <section className="mt-8 rounded-lg border border-borda bg-background p-5">
          <h3 className="font-semibold">Faturamento por dia — últimos 30 dias</h3>
          <GraficoVendas dias={dados.vendas30} />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-borda bg-background p-5">
            <h3 className="font-semibold">Mais vendidos — 30 dias</h3>
            {dados.topProdutos.length === 0 ? (
              <Vazio texto="Nenhuma venda nos últimos 30 dias." />
            ) : (
              <ListaBarras
                itens={dados.topProdutos.map((p) => ({
                  chave: p.id,
                  rotulo: p.nome,
                  valor: p.qtd,
                  texto: `${p.qtd} un · ${brl.format(p.total)}`,
                }))}
              />
            )}
          </section>

          <section className="rounded-lg border border-borda bg-background p-5">
            <h3 className="font-semibold">Categorias que mais faturam — 30 dias</h3>
            {dados.topCategorias.length === 0 ? (
              <Vazio texto="Nenhuma venda nos últimos 30 dias." />
            ) : (
              <ListaBarras
                itens={dados.topCategorias.map((c) => ({
                  chave: c.categoria,
                  rotulo: c.categoria,
                  valor: c.total,
                  texto: brl.format(c.total),
                }))}
              />
            )}
          </section>

          <section className="rounded-lg border border-borda bg-background p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold">Estoque que precisa de atenção</h3>
              <Link href="/admin/estoque" className="text-sm font-medium text-vermelho hover:underline">
                Ir pro estoque
              </Link>
            </div>
            <p className="mt-1 text-sm text-foreground/60">
              {dados.estoque.zerados} zerado(s) · {dados.estoque.baixos} com estoque baixo
            </p>
            {dados.estoque.lista.length === 0 ? (
              <Vazio texto="Tudo em ordem no estoque." />
            ) : (
              <ul className="mt-3 divide-y divide-borda text-sm">
                {dados.estoque.lista.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0 truncate">{p.nome}</span>
                    <SeloEstoque estoque={p.estoque} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-borda bg-background p-5">
            <h3 className="font-semibold">Formas de pagamento — este mês</h3>
            {dados.pagamentos.length === 0 ? (
              <Vazio texto="Nenhuma venda este mês." />
            ) : (
              <ul className="mt-3 divide-y divide-borda text-sm">
                {dados.pagamentos.map((p) => (
                  <li key={p.forma} className="flex items-center justify-between gap-3 py-2">
                    <span>
                      {p.forma} <span className="text-foreground/50">· {p.qtd} venda(s)</span>
                    </span>
                    <span className="font-medium tabular-nums">{brl.format(p.total)}</span>
                  </li>
                ))}
              </ul>
            )}

            {dados.fiado.maiores.length > 0 && (
              <>
                <h3 className="mt-6 font-semibold">Maiores fiados</h3>
                <ul className="mt-2 divide-y divide-borda text-sm">
                  {dados.fiado.maiores.map((c) => (
                    <li key={c.telefone} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0 truncate">{c.nome}</span>
                      <span className="font-medium tabular-nums text-red-700">
                        {brl.format(c.saldo_devedor)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function CartaoPeriodo({
  titulo,
  resumo,
  destaque = false,
}: {
  titulo: string;
  resumo: ResumoPeriodo;
  destaque?: boolean;
}) {
  const ticket = resumo.qtd > 0 ? resumo.total / resumo.qtd : 0;
  return (
    <div
      className={`rounded-lg border p-5 ${
        destaque ? "border-preto bg-preto text-white" : "border-borda bg-background"
      }`}
    >
      <p className={`text-sm ${destaque ? "text-white/70" : "text-foreground/60"}`}>{titulo}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{brl.format(resumo.total)}</p>
      <p className={`mt-1 text-xs ${destaque ? "text-white/60" : "text-foreground/50"}`}>
        {resumo.qtd} venda(s) · ticket médio {brl.format(ticket)}
      </p>
      <p className={`mt-2 text-xs ${destaque ? "text-white/60" : "text-foreground/50"}`}>
        Site {brl.format(resumo.online)} · Balcão {brl.format(resumo.pdv)}
      </p>
    </div>
  );
}

function CartaoAtalho({
  href,
  titulo,
  valor,
  detalhe,
  alerta = false,
}: {
  href: string;
  titulo: string;
  valor: string;
  detalhe: string;
  alerta?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-borda bg-background p-5 transition hover:border-vermelho"
    >
      <p className="text-sm text-foreground/60">{titulo}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${alerta ? "text-vermelho" : ""}`}>
        {valor}
      </p>
      <p className="mt-1 text-xs text-foreground/50">{detalhe}</p>
    </Link>
  );
}

function GraficoVendas({ dias }: { dias: VendaDia[] }) {
  const maximo = Math.max(...dias.map((d) => d.total), 0);
  const totalPeriodo = dias.reduce((s, d) => s + d.total, 0);

  if (maximo === 0) {
    return <Vazio texto="Nenhuma venda nos últimos 30 dias." />;
  }

  return (
    <>
      <p className="mt-1 text-sm text-foreground/60">
        {brl.format(totalPeriodo)} no período · melhor dia {brl.format(maximo)}
      </p>
      <div className="mt-6 flex h-44 items-end gap-[2px] border-b border-borda">
        {dias.map((d) => {
          const altura = d.total > 0 ? Math.max((d.total / maximo) * 100, 2) : 0;
          return (
            <div
              key={d.dia}
              tabIndex={0}
              aria-label={`${dataCurta(d.dia)}: ${brl.format(d.total)}, ${d.qtd} venda(s)`}
              className="group relative flex h-full flex-1 items-end outline-none"
            >
              <div
                className="w-full rounded-t-[4px] bg-vermelho transition group-hover:bg-vermelho-vivo group-focus-visible:bg-vermelho-vivo"
                style={{ height: `${altura}%` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-preto px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block group-focus-visible:block">
                <p className="font-medium">{dataCurta(d.dia)}</p>
                <p className="tabular-nums">{brl.format(d.total)}</p>
                <p className="text-white/60">{d.qtd} venda(s)</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs text-foreground/50">
        <span>{dataCurta(dias[0].dia)}</span>
        <span>Hoje</span>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-foreground/60 hover:text-foreground">
          Ver em tabela
        </summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-foreground/50">
            <tr>
              <th className="py-1 font-medium">Dia</th>
              <th className="py-1 text-right font-medium">Vendas</th>
              <th className="py-1 text-right font-medium">Faturamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {[...dias].reverse().map((d) => (
              <tr key={d.dia}>
                <td className="py-1">{dataCurta(d.dia)}</td>
                <td className="py-1 text-right tabular-nums">{d.qtd}</td>
                <td className="py-1 text-right tabular-nums">{brl.format(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

function ListaBarras({
  itens,
}: {
  itens: { chave: string; rotulo: string; valor: number; texto: string }[];
}) {
  const maximo = Math.max(...itens.map((i) => i.valor), 1);
  return (
    <ul className="mt-4 space-y-3 text-sm">
      {itens.map((item) => (
        <li key={item.chave}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate">{item.rotulo}</span>
            <span className="shrink-0 text-xs tabular-nums text-foreground/60">{item.texto}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-borda/60">
            <div
              className="h-2 rounded-full bg-vermelho"
              style={{ width: `${(item.valor / maximo) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function SeloEstoque({ estoque }: { estoque: number }) {
  if (estoque <= 0) {
    return (
      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        ● Zerado{estoque < 0 ? ` (${estoque})` : ""}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
      ▲ {estoque} un
    </span>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p className="py-8 text-center text-sm text-foreground/50">{texto}</p>;
}
