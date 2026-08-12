import type { Metadata } from "next";
import { cookies } from "next/headers";
import { db, type Pedido } from "@/lib/db";
import { AdminLogin } from "./AdminLogin";
import { PainelPedidos } from "./PainelPedidos";

export const metadata: Metadata = {
  title: "Painel administrativo",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adega_admin")?.value === "1";

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const pedidos = db
    .prepare("SELECT * FROM pedidos ORDER BY criado_em DESC")
    .all() as Pedido[];

  const adminNome = cookieStore.get("adega_admin_nome")?.value ?? "Admin";

  return <PainelPedidos pedidosIniciais={pedidos} adminNome={adminNome} />;
}
