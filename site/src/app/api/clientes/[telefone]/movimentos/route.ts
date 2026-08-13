import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { listarMovimentosSaldo } from "@/lib/clientes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ telefone: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { telefone } = await params;
  return NextResponse.json({ movimentos: listarMovimentosSaldo(decodeURIComponent(telefone)) });
}
