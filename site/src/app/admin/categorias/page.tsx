import type { Metadata } from "next";
import { cookies } from "next/headers";
import { listarCategorias } from "@/lib/categorias";
import { db } from "@/lib/db";
import { AdminLogin } from "../AdminLogin";
import { GerenciarCategorias } from "./GerenciarCategorias";

export const metadata: Metadata = {
  title: "Categorias — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriasPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adega_admin")?.value === "1";

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const categorias = listarCategorias();
  const contagens = db
    .prepare("SELECT categoria, COUNT(*) as qtd FROM produtos GROUP BY categoria")
    .all() as { categoria: string; qtd: number }[];
  const qtdPorCategoria = Object.fromEntries(
    contagens.map((c) => [c.categoria, c.qtd])
  );
  const adminNome = cookieStore.get("adega_admin_nome")?.value ?? "Admin";

  return (
    <GerenciarCategorias
      categoriasIniciais={categorias}
      qtdPorCategoria={qtdPorCategoria}
      adminNome={adminNome}
    />
  );
}
