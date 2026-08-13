import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { garantirCategoria } from "@/lib/categorias";
import { registrarAjusteEstoque } from "@/lib/estoque";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const campos: string[] = [];
  const valores: Record<string, unknown> = { id };

  const permitidos = [
    "nome",
    "categoria",
    "descricao",
    "preco",
    "imagem",
    "destaque",
    "ativo",
    "ordem",
    "estoque",
  ];
  for (const campo of permitidos) {
    if (campo in body) {
      campos.push(`${campo} = @${campo}`);
      valores[campo] = body[campo];
    }
  }

  if (campos.length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  let estoqueAntes: number | null = null;
  if ("estoque" in body) {
    const atual = db.prepare("SELECT estoque FROM produtos WHERE id = ?").get(id) as
      | { estoque: number | null }
      | undefined;
    estoqueAntes = atual?.estoque ?? null;
  }

  db.prepare(`UPDATE produtos SET ${campos.join(", ")} WHERE id = @id`).run(valores);

  if ("estoque" in body && estoqueAntes !== null && typeof body.estoque === "number") {
    registrarAjusteEstoque(id, estoqueAntes, body.estoque);
  }

  if (typeof body.categoria === "string" && body.categoria.trim()) {
    garantirCategoria(body.categoria.trim());
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  db.prepare("DELETE FROM produtos WHERE id = ?").run(id);

  return NextResponse.json({ ok: true });
}
