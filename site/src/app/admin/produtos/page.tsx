import type { Metadata } from "next";
import { cookies } from "next/headers";
import { listarTodosProdutos } from "@/lib/produtos";
import { AdminLogin } from "../AdminLogin";
import { GerenciarProdutos } from "./GerenciarProdutos";

export const metadata: Metadata = {
  title: "Produtos — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProdutosPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adega_admin")?.value === "1";

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const produtos = listarTodosProdutos();
  const adminNome = cookieStore.get("adega_admin_nome")?.value ?? "Admin";

  return <GerenciarProdutos produtosIniciais={produtos} adminNome={adminNome} />;
}
