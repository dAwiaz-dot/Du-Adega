import type { Metadata } from "next";
import { cookies } from "next/headers";
import { listarProdutosVenda } from "@/lib/produtos";
import { listarCategorias } from "@/lib/categorias";
import { resumoVendasHoje } from "@/lib/pdv";
import { caixaAberto, resumoCaixa } from "@/lib/caixa";
import { AdminLogin } from "../AdminLogin";
import { PDV } from "./PDV";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PDV — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPDVPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adega_admin")?.value === "1";

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const produtos = listarProdutosVenda();
  const categorias = listarCategorias();
  const resumoHoje = resumoVendasHoje();
  const caixa = caixaAberto();
  const resumoCaixaAtual = caixa ? resumoCaixa(caixa.id) : null;
  const adminNome = cookieStore.get("adega_admin_nome")?.value ?? "Admin";

  return (
    <PDV
      produtosIniciais={produtos}
      categoriasIniciais={categorias}
      resumoInicial={resumoHoje}
      caixaInicial={caixa}
      resumoCaixaInicial={resumoCaixaAtual}
      adminNome={adminNome}
    />
  );
}
