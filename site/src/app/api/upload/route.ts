import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "pedidos.sqlite3");
const UPLOADS_DIR = path.join(path.dirname(dbPath), "uploads");

const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const TAMANHO_MAX = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const extensao = TIPOS_PERMITIDOS[arquivo.type];
  if (!extensao) {
    return NextResponse.json(
      { error: "Formato não suportado. Use PNG, JPG, WEBP ou GIF." },
      { status: 400 }
    );
  }

  if (arquivo.size > TAMANHO_MAX) {
    return NextResponse.json(
      { error: "Arquivo muito grande (máximo 5MB)." },
      { status: 400 }
    );
  }

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const nomeArquivo = `${crypto.randomUUID()}.${extensao}`;
  const bytes = Buffer.from(await arquivo.arrayBuffer());
  fs.writeFileSync(path.join(UPLOADS_DIR, nomeArquivo), bytes);

  return NextResponse.json({ url: `/api/uploads/${nomeArquivo}` }, { status: 201 });
}
