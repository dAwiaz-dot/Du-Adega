import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { ajustarSaldoDevedor } from "@/lib/clientes";

type Body = {
  telefone: string;
  nome: string;
  valor: number;
  tipo: "divida" | "pagamento";
  observacao?: string;
};

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const telefone = body.telefone?.trim();
  const nome = body.nome?.trim();
  const valor = Number(body.valor);

  if (!telefone || !nome) {
    return NextResponse.json({ error: "Preencha nome e telefone." }, { status: 400 });
  }
  if (!valor || valor <= 0) {
    return NextResponse.json({ error: "Informe um valor válido." }, { status: 400 });
  }
  if (body.tipo !== "divida" && body.tipo !== "pagamento") {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }

  const delta = body.tipo === "divida" ? valor : -valor;
  ajustarSaldoDevedor(
    telefone,
    nome,
    delta,
    body.tipo === "divida" ? "ajuste" : "pagamento",
    null,
    body.observacao?.trim() || null
  );

  return NextResponse.json({ ok: true });
}
