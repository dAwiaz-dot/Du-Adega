import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { listarCategorias } from "@/lib/categorias";

export async function GET() {
  return NextResponse.json({ categorias: listarCategorias() });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { nome, icone } = (await request.json()) as { nome: string; icone?: string };

  if (!nome?.trim()) {
    return NextResponse.json({ error: "Digite um nome pra categoria." }, { status: 400 });
  }

  const jaExiste = db.prepare("SELECT 1 FROM categorias WHERE nome = ?").get(nome.trim());
  if (jaExiste) {
    return NextResponse.json({ error: "Essa categoria já existe." }, { status: 400 });
  }

  const { count: maxOrdem } = db
    .prepare("SELECT COALESCE(MAX(ordem), -1) + 1 as count FROM categorias")
    .get() as { count: number };

  db.prepare("INSERT INTO categorias (nome, icone, ordem) VALUES (?, ?, ?)").run(
    nome.trim(),
    icone?.trim() || "🍹",
    maxOrdem
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
