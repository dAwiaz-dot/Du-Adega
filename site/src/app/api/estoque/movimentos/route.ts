import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { listarMovimentosEstoque, movimentarEstoque, type TipoMovimentoManual } from "@/lib/estoque";

const TIPOS: TipoMovimentoManual[] = ["entrada", "perda", "contagem"];

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return NextResponse.json({ movimentos: listarMovimentosEstoque() });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    produtoId?: string;
    tipo?: TipoMovimentoManual;
    quantidade?: number;
    observacao?: string | null;
  };

  const quantidade = Number(body.quantidade);
  if (
    !body.produtoId ||
    !body.tipo ||
    !TIPOS.includes(body.tipo) ||
    !Number.isInteger(quantidade) ||
    quantidade < 0 ||
    (body.tipo !== "contagem" && quantidade === 0)
  ) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    const estoque = movimentarEstoque(
      body.produtoId,
      body.tipo,
      quantidade,
      body.observacao?.trim() || null
    );
    return NextResponse.json({ estoque });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível movimentar." },
      { status: 400 }
    );
  }
}
