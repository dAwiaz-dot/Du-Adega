import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { listarMovimentosEstoque } from "@/lib/estoque";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return NextResponse.json({ movimentos: listarMovimentosEstoque() });
}
