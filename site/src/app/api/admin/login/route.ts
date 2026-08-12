import { NextRequest, NextResponse } from "next/server";
import { encontrarAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { senha } = (await request.json()) as { senha: string };

  const admin = encontrarAdmin(senha ?? "");

  if (!admin) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, nome: admin.nome });
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  };

  response.cookies.set("adega_admin", "1", cookieOpts);
  response.cookies.set("adega_admin_nome", admin.nome, cookieOpts);

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("adega_admin");
  response.cookies.delete("adega_admin_nome");
  return response;
}
