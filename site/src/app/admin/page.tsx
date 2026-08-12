import { cookies } from "next/headers";
import { db, type Pedido } from "@/lib/db";
import { AdminLogin } from "./AdminLogin";
import { PainelPedidos } from "./PainelPedidos";

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
