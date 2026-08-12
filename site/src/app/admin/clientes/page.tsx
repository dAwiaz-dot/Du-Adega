import type { Metadata } from "next";
import { cookies } from "next/headers";
import { listarClientes } from "@/lib/clientes";
import { AdminLogin } from "../AdminLogin";
import { VerClientes } from "./VerClientes";

export const metadata: Metadata = {
  title: "Clientes — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminClientesPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adega_admin")?.value === "1";

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const clientes = listarClientes();
  const adminNome = cookieStore.get("adega_admin_nome")?.value ?? "Admin";

  return <VerClientes clientesIniciais={clientes} adminNome={adminNome} />;
}
