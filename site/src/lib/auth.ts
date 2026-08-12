import { cookies } from "next/headers";

export type AdminUser = { nome: string; senha: string };

export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("adega_admin")?.value === "1";
}

export function getAdminUsers(): AdminUser[] {
  const lista = process.env.ADMIN_USERS?.trim();

  if (lista) {
    return lista
      .split(",")
      .map((par) => par.trim())
      .filter(Boolean)
      .map((par) => {
        const [nome, ...resto] = par.split(":");
        return { nome: nome.trim(), senha: resto.join(":").trim() };
      })
      .filter((u) => u.nome && u.senha);
  }

  if (process.env.ADMIN_PASSWORD) {
    return [{ nome: "Admin", senha: process.env.ADMIN_PASSWORD }];
  }

  return [];
}

export function encontrarAdmin(senha: string): AdminUser | null {
  return getAdminUsers().find((u) => u.senha === senha) ?? null;
}
