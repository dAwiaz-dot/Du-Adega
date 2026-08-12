import { NextRequest, NextResponse } from "next/server";
import { encontrarAdmin } from "@/lib/auth";

const LIMITE_TENTATIVAS = 5;
const JANELA_MS = 10 * 60 * 1000;

const tentativas = new Map<string, { count: number; resetAt: number }>();

function bloqueado(ip: string) {
  const registro = tentativas.get(ip);
  if (!registro) return false;
  if (Date.now() > registro.resetAt) {
    tentativas.delete(ip);
    return false;
  }
  return registro.count >= LIMITE_TENTATIVAS;
}

function registrarFalha(ip: string) {
  const registro = tentativas.get(ip);
  if (!registro || Date.now() > registro.resetAt) {
    tentativas.set(ip, { count: 1, resetAt: Date.now() + JANELA_MS });
    return;
  }
  registro.count += 1;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";

  if (bloqueado(ip)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
      { status: 429 }
    );
  }

  const { senha } = (await request.json()) as { senha: string };

  const admin = encontrarAdmin(senha ?? "");

  if (!admin) {
    registrarFalha(ip);
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  tentativas.delete(ip);

  const response = NextResponse.json({ ok: true, nome: admin.nome });
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 48,
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
