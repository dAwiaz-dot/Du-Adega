import type { Metadata } from "next";
import { cookies } from "next/headers";
import { listarProdutosAtivos } from "@/lib/produtos";
import { listarCategorias } from "@/lib/categorias";
import { resumoVendasHoje } from "@/lib/pdv";
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

  const produtos = listarProdutosAtivos();
  const categorias = listarCategorias();
  const resumo = resumoVendasHoje();
  const adminNome = cookieStore.get("adega_admin_nome")?.value ?? "Admin";

  return (
    <PDV
      produtosIniciais={produtos}
      categoriasIniciais={categorias}
      resumoInicial={resumo}
      adminNome={adminNome}
    />
  );
}
