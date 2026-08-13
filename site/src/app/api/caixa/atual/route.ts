import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { caixaAberto, resumoCaixa } from "@/lib/caixa";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const caixa = caixaAberto();
  if (!caixa) {
    return NextResponse.json({ caixa: null });
  }

  return NextResponse.json({ resumo: resumoCaixa(caixa.id) });
}
