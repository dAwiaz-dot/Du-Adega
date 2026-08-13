import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { abrirCaixa } from "@/lib/caixa";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const valorInicial = Number(body.valorInicial);

  if (Number.isNaN(valorInicial) || valorInicial < 0) {
    return NextResponse.json({ error: "Informe um valor inicial válido." }, { status: 400 });
  }

  try {
    const caixa = abrirCaixa(valorInicial);
    return NextResponse.json({ caixa }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível abrir o caixa." },
      { status: 400 }
    );
  }
}
