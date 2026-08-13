import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { listarProdutosSite, listarTodosProdutos, gerarIdProduto } from "@/lib/produtos";
import { garantirCategoria } from "@/lib/categorias";

export async function GET(request: NextRequest) {
  const todos = request.nextUrl.searchParams.get("todos") === "1";

  if (todos) {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    return NextResponse.json({ produtos: listarTodosProdutos() });
  }

  return NextResponse.json({ produtos: listarProdutosSite() });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const { nome, categoria, descricao, preco, imagem, destaque, estoque, codigo_barras, mostrar_site } =
    body as {
      nome: string;
      categoria: string;
      descricao?: string;
      preco: number;
      imagem?: string | null;
      destaque?: string | null;
      estoque?: number | null;
      codigo_barras?: string | null;
      mostrar_site?: boolean;
    };

  if (!nome?.trim() || !categoria?.trim() || !preco || preco <= 0) {
    return NextResponse.json(
      { error: "Preencha nome, categoria e um preço válido." },
      { status: 400 }
    );
  }

  const id = gerarIdProduto(nome);
  const { count: maxOrdem } = db
    .prepare("SELECT COALESCE(MAX(ordem), -1) + 1 as count FROM produtos")
    .get() as { count: number };

  db.prepare(
    `INSERT INTO produtos (id, nome, categoria, descricao, preco, imagem, destaque, ordem, estoque, codigo_barras, mostrar_site)
     VALUES (@id, @nome, @categoria, @descricao, @preco, @imagem, @destaque, @ordem, @estoque, @codigoBarras, @mostrarSite)`
  ).run({
    id,
    nome: nome.trim(),
    categoria: categoria.trim(),
    descricao: descricao?.trim() ?? "",
    preco,
    imagem: imagem?.trim() || null,
    destaque: destaque?.trim() || null,
    ordem: maxOrdem,
    estoque: estoque === undefined || estoque === null ? null : Number(estoque),
    codigoBarras: codigo_barras?.trim() || null,
    mostrarSite: mostrar_site === false ? 0 : 1,
  });

  garantirCategoria(categoria.trim());

  return NextResponse.json({ id }, { status: 201 });
}
