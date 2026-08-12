import { NextRequest, NextResponse } from "next/server";
import { db, type PedidoItem } from "@/lib/db";
import { cookies } from "next/headers";

type NovoPedidoBody = {
  clienteNome: string;
  clienteTelefone: string;
  endereco: string;
  observacoes?: string;
  itens: PedidoItem[];
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as NovoPedidoBody;

  if (
    !body.clienteNome?.trim() ||
    !body.clienteTelefone?.trim() ||
    !body.endereco?.trim() ||
    !Array.isArray(body.itens) ||
    body.itens.length === 0
  ) {
    return NextResponse.json(
      { error: "Preencha nome, telefone, endereço e adicione ao menos um item." },
      { status: 400 }
    );
  }

  const total = body.itens.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );

  const stmt = db.prepare(`
    INSERT INTO pedidos (cliente_nome, cliente_telefone, endereco, observacoes, itens, total)
    VALUES (@clienteNome, @clienteTelefone, @endereco, @observacoes, @itens, @total)
  `);

  const result = stmt.run({
    clienteNome: body.clienteNome.trim(),
    clienteTelefone: body.clienteTelefone.trim(),
    endereco: body.endereco.trim(),
    observacoes: body.observacoes?.trim() ?? "",
    itens: JSON.stringify(body.itens),
    total,
  });

  return NextResponse.json({ id: result.lastInsertRowid, total }, { status: 201 });
}

export async function GET() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adega_admin")?.value === "1";

  if (!isAdmin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const pedidos = db
    .prepare("SELECT * FROM pedidos ORDER BY criado_em DESC")
    .all();

  return NextResponse.json({ pedidos });
}
