import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { contarProdutosNaCategoria } from "@/lib/categorias";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ nome: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { nome } = await params;
  const nomeAtual = decodeURIComponent(nome);
  const body = await request.json();
  const { icone, ordem, novoNome } = body as {
    icone?: string;
    ordem?: number;
    novoNome?: string;
  };

  const existe = db.prepare("SELECT 1 FROM categorias WHERE nome = ?").get(nomeAtual);
  if (!existe) {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }

  if (novoNome?.trim() && novoNome.trim() !== nomeAtual) {
    const jaExiste = db
      .prepare("SELECT 1 FROM categorias WHERE nome = ?")
      .get(novoNome.trim());
    if (jaExiste) {
      return NextResponse.json(
        { error: "Já existe uma categoria com esse nome." },
        { status: 400 }
      );
    }

    const renomear = db.transaction(() => {
      db.prepare("UPDATE produtos SET categoria = ? WHERE categoria = ?").run(
        novoNome.trim(),
        nomeAtual
      );
      db.prepare("UPDATE categorias SET nome = ? WHERE nome = ?").run(
        novoNome.trim(),
        nomeAtual
      );
    });
    renomear();
  }

  const nomeFinal = novoNome?.trim() || nomeAtual;
  const campos: string[] = [];
  const valores: Record<string, unknown> = { nome: nomeFinal };

  if (icone !== undefined) {
    campos.push("icone = @icone");
    valores.icone = icone;
  }
  if (ordem !== undefined) {
    campos.push("ordem = @ordem");
    valores.ordem = ordem;
  }

  if (campos.length > 0) {
    db.prepare(`UPDATE categorias SET ${campos.join(", ")} WHERE nome = @nome`).run(valores);
  }

  return NextResponse.json({ ok: true, nome: nomeFinal });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ nome: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { nome } = await params;
  const nomeAtual = decodeURIComponent(nome);

  const qtd = contarProdutosNaCategoria(nomeAtual);
  if (qtd > 0) {
    return NextResponse.json(
      { error: `Ainda tem ${qtd} produto(s) nessa categoria. Mova ou exclua eles antes.` },
      { status: 400 }
    );
  }

  db.prepare("DELETE FROM categorias WHERE nome = ?").run(nomeAtual);

  return NextResponse.json({ ok: true });
}
