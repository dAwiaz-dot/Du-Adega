import type { Metadata } from "next";
import { cookies } from "next/headers";
import { carregarDashboard } from "@/lib/dashboard";
import { AdminLogin } from "../AdminLogin";
import { AdminNav } from "../AdminNav";
import { PainelDashboard } from "./PainelDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — Admin",
  robots: { index: false, follow: false },
};

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
      <PainelDashboard dados={dados} adminNome={adminNome} />
    </div>
  );
}
