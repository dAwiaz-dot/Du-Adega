import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "pedidos.sqlite3");
const UPLOADS_DIR = path.join(path.dirname(dbPath), "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Inválido." }, { status: 400 });
  }

  const caminho = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(caminho)) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const extensao = path.extname(filename).toLowerCase();
  const bytes = fs.readFileSync(caminho);

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": CONTENT_TYPES[extensao] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
