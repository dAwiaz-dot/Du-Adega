import type { Metadata } from "next";
import { cookies } from "next/headers";
import { listarMovimentosEstoque } from "@/lib/estoque";
import { listarTodosProdutos } from "@/lib/produtos";
import { AdminLogin } from "../AdminLogin";
import { HistoricoEstoque } from "./HistoricoEstoque";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estoque — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminEstoquePage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adega_admin")?.value === "1";

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const movimentos = listarMovimentosEstoque();
  const produtos = listarTodosProdutos().filter((p) => p.estoque !== null);
  const adminNome = cookieStore.get("adega_admin_nome")?.value ?? "Admin";

  return (
    <HistoricoEstoque movimentosIniciais={movimentos} produtosControlados={produtos} adminNome={adminNome} />
  );
}
