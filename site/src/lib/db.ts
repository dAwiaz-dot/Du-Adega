import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "pedidos.sqlite3");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const globalForDb = globalThis as unknown as { db?: Database.Database };

export const db = globalForDb.db ?? new Database(dbPath);
globalForDb.db = db;

db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

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

  CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    descricao TEXT NOT NULL DEFAULT '',
    preco REAL NOT NULL,
    imagem TEXT,
    destaque TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    ordem INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`);

const SEED_PRODUTOS = [
  {
    id: "vinho-tinto-reserva",
    nome: "Vinho Tinto Reserva",
    categoria: "Vinhos",
    descricao: "Corpo encorpado e final longo — daquele vinho que puxa assunto na mesa.",
    preco: 89.9,
    imagem: "/produtos/vinho-tinto-reserva.webp",
    destaque: null,
  },
  {
    id: "vinho-branco-seco",
    nome: "Vinho Branco Seco",
    categoria: "Vinhos",
    descricao: "Fresco e equilibrado, gelado na medida certa pra petiscar.",
    preco: 69.9,
    imagem: "/produtos/vinho-branco-seco.webp",
    destaque: null,
  },
  {
    id: "cerveja-long-neck",
    nome: "Cerveja Long Neck",
    categoria: "Cervejas",
    descricao: "Sempre geladíssima, saindo do freezer direto pro seu pedido.",
    preco: 8.9,
    imagem: "/produtos/cerveja-long-neck.webp",
    destaque: "Mais pedido",
  },
  {
    id: "cerveja-lata-fardo",
    nome: "Fardo de Cerveja (12 latas)",
    categoria: "Cervejas",
    descricao: "Fechou o churrasco, fechou o fardo — rende a noite inteira.",
    preco: 79.9,
    imagem: "/produtos/cerveja-lata-fardo.webp",
    destaque: "Combo",
  },
  {
    id: "whisky-12-anos",
    nome: "Whisky 12 anos",
    categoria: "Destilados",
    descricao: "12 anos de barril de carvalho num gole só — pra ocasião especial.",
    preco: 249.9,
    imagem: null,
    destaque: null,
  },
  {
    id: "gin-nacional",
    nome: "Gin Nacional",
    categoria: "Destilados",
    descricao: "Botânicos cítricos que fazem qualquer drink render mais.",
    preco: 119.9,
    imagem: null,
    destaque: null,
  },
  {
    id: "vodka-nacional",
    nome: "Vodka Nacional",
    categoria: "Destilados",
    descricao: "Garrafa 1L, direto pra sua festa começar sem enrolação.",
    preco: 39.9,
    imagem: null,
    destaque: "Mais pedido",
  },
  {
    id: "gelo-pacote-5kg",
    nome: "Gelo em Pacote (5kg)",
    categoria: "Gelo e Carvão",
    descricao: "Gelo em cubo na hora — porque bebida quente ninguém merece.",
    preco: 12.0,
    imagem: null,
    destaque: null,
  },
  {
    id: "carvao-pacote-3kg",
    nome: "Carvão para Churrasco (3kg)",
    categoria: "Gelo e Carvão",
    descricao: "Acende rápido, queima uniforme, brasa até o último espeto.",
    preco: 18.0,
    imagem: null,
    destaque: null,
  },
  {
    id: "agua-mineral-500ml",
    nome: "Água Mineral (500ml)",
    categoria: "Água e Refrigerante",
    descricao: "Com ou sem gás, geladinha pra equilibrar a noite.",
    preco: 3.5,
    imagem: null,
    destaque: null,
  },
  {
    id: "refrigerante-2l",
    nome: "Refrigerante (2L)",
    categoria: "Água e Refrigerante",
    descricao: "Principais marcas disponíveis pra combinar com qualquer pedido.",
    preco: 12.9,
    imagem: null,
    destaque: null,
  },
];

// INSERT OR IGNORE: seguro mesmo se múltiplos processos (ex: build com
// vários workers) tentarem semear o catálogo ao mesmo tempo.
const inserirSemente = db.prepare(`
  INSERT OR IGNORE INTO produtos (id, nome, categoria, descricao, preco, imagem, destaque, ordem)
  VALUES (@id, @nome, @categoria, @descricao, @preco, @imagem, @destaque, @ordem)
`);
const semear = db.transaction((itens: typeof SEED_PRODUTOS) => {
  itens.forEach((item, index) => inserirSemente.run({ ...item, ordem: index }));
});
semear(SEED_PRODUTOS);

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

export type Produto = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  preco: number;
  imagem: string | null;
  destaque: string | null;
  ativo: number;
  ordem: number;
  criado_em: string;
};
