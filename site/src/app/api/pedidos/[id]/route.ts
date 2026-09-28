import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { devolverEstoqueDoPedido, rebaixarEstoqueDoPedido } from "@/lib/estoque";

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

  const atual = db.prepare("SELECT status, origem FROM pedidos WHERE id = ?").get(id) as
    | { status: string; origem: "online" | "pdv" }
    | undefined;

  if (!atual) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const pedidoId = Number(id);
  db.transaction(() => {
    db.prepare("UPDATE pedidos SET status = ? WHERE id = ?").run(status, id);

    // Cancelou → itens voltam pro estoque. Reabriu → baixa de novo.
    if (atual.status !== "cancelado" && status === "cancelado") {
      devolverEstoqueDoPedido(pedidoId);
    } else if (atual.status === "cancelado" && status !== "cancelado") {
      rebaixarEstoqueDoPedido(pedidoId, atual.origem === "pdv" ? "venda_pdv" : "venda_online");
    }
  })();

  return NextResponse.json({ ok: true });
}
