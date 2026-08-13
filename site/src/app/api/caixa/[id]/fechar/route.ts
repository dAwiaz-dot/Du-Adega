import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { fecharCaixa } from "@/lib/caixa";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const valorContado =
    body.valorContado === undefined || body.valorContado === null || body.valorContado === ""
      ? null
      : Number(body.valorContado);
  const observacoes = typeof body.observacoes === "string" ? body.observacoes.trim() || null : null;

  try {
    const caixa = fecharCaixa(Number(id), valorContado, observacoes);
    return NextResponse.json({ caixa });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível fechar o caixa." },
      { status: 400 }
    );
  }
}
