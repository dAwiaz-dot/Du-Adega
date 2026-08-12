import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

const STATUS_VALIDOS = ["novo", "preparando", "a_caminho", "entregue", "cancelado"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adega_admin")?.value === "1";

  if (!isAdmin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const { status } = (await request.json()) as { status: string };

  if (!STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  db.prepare("UPDATE pedidos SET status = ? WHERE id = ?").run(status, id);

  return NextResponse.json({ ok: true });
}
