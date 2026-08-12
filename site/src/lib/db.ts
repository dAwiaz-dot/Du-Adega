import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "pedidos.sqlite3");

const globalForDb = globalThis as unknown as { db?: Database.Database };

export const db = globalForDb.db ?? new Database(dbPath);
globalForDb.db = db;

db.exec(`
  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_nome TEXT NOT NULL,
    cliente_telefone TEXT NOT NULL,
    endereco TEXT NOT NULL,
    observacoes TEXT,
    itens TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'novo',
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`);

export type PedidoItem = {
  id: string;
  nome: string;
  quantidade: number;
  preco: number;
};

export type Pedido = {
  id: number;
  cliente_nome: string;
  cliente_telefone: string;
  endereco: string;
  observacoes: string | null;
  itens: string;
  total: number;
  status: "novo" | "preparando" | "a_caminho" | "entregue" | "cancelado";
  criado_em: string;
};
