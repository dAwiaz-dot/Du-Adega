import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "pedidos.sqlite3");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const globalForDb = globalThis as unknown as { db?: Database.Database };

export const db = globalForDb.db ?? new Database(dbPath);
globalForDb.db = db;

db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 8000");

// Vários workers do build (ou do Next em dev) abrem essa mesma conexão de
// arquivo ao mesmo tempo no primeiro boot e tentam migrar o schema juntos.
// Em vez de brigar pela trava do SQLite (o que ainda escapava do
// busy_timeout com muita concorrência), usa um lock de arquivo simples:
// só um processo migra por vez — do início ao fim da migração inteira,
// sem soltar e pegar o lock de novo no meio — os outros esperam ele
// terminar e então seguem, já com tudo pronto.
const lockPath = `${dbPath}.setup-lock`;

function esperar(ms: number) {
  const buffer = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(buffer), 0, 0, ms);
}

function comLockDeSetup<T>(fn: () => T): T {
  let temLock = false;
  for (let i = 0; i < 300; i++) {
    try {
      fs.closeSync(fs.openSync(lockPath, "wx"));
      temLock = true;
      break;
    } catch {
      // se o lock já existe há muito tempo, o processo que segurava
      // provavelmente morreu (ex: build cancelado no meio) — remove e
      // tenta de novo, em vez de esperar pra sempre por um lock morto.
      try {
        const stat = fs.statSync(lockPath);
        if (Date.now() - stat.mtimeMs > 20000) {
          fs.unlinkSync(lockPath);
        }
      } catch {
        // sumiu entre o catch e o stat — outro processo já resolveu, segue o loop
      }
      esperar(100);
    }
  }
  if (!temLock) {
    throw new Error("Não foi possível obter o lock de setup do banco a tempo.");
  }
  try {
    return fn();
  } finally {
    try {
      fs.unlinkSync(lockPath);
    } catch {
      // já foi removido — tudo bem
    }
  }
}

function colunaExiste(tabela: string, coluna: string): boolean {
  const colunas = db.prepare(`PRAGMA table_info(${tabela})`).all() as { name: string }[];
  return colunas.some((c) => c.name === coluna);
}

function adicionarColunaSeFaltando(tabela: string, definicao: string) {
  const [coluna] = definicao.trim().split(/\s+/);
  if (colunaExiste(tabela, coluna)) return;
  db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${definicao}`);
}

// Semeia só se a tabela estiver vazia (primeiro boot). Isso garante que,
// depois de renomear ou apagar algo pelo admin, a semente não "ressuscita"
// o dado antigo — nem no mesmo processo, nem num redeploy futuro.
function semearSeVazio<T>(
  tabela: string,
  itens: T[],
  inserirUm: (item: T, index: number) => void
) {
  const { count } = db
    .prepare(`SELECT COUNT(*) as count FROM ${tabela}`)
    .get() as { count: number };
  if (count > 0) return;

  const transacao = db.transaction(() => {
    itens.forEach((item, index) => inserirUm(item, index));
  });
  transacao();
}

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

const SEED_CATEGORIAS = [
  { nome: "Vinhos" },
  { nome: "Cervejas" },
  { nome: "Destilados" },
  { nome: "Gelo e Carvão" },
  { nome: "Água e Refrigerante" },
];

comLockDeSetup(() => {
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

    CREATE TABLE IF NOT EXISTS categorias (
      nome TEXT PRIMARY KEY,
      icone TEXT NOT NULL DEFAULT '',
      ordem INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS caixa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aberto_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      fechado_em TEXT,
      valor_inicial REAL NOT NULL,
      valor_contado REAL,
      observacoes TEXT,
      status TEXT NOT NULL DEFAULT 'aberto'
    );

    CREATE TABLE IF NOT EXISTS estoque_movimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id TEXT NOT NULL,
      tipo TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      estoque_resultante INTEGER NOT NULL,
      pedido_id INTEGER,
      observacao TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS clientes (
      telefone TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      saldo_devedor REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS movimentos_saldo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telefone TEXT NOT NULL,
      tipo TEXT NOT NULL,
      valor REAL NOT NULL,
      pedido_id INTEGER,
      observacao TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // estoque nulo = produto sem controle de estoque (comportamento anterior, não bloqueia venda)
  adicionarColunaSeFaltando("produtos", "estoque INTEGER");
  adicionarColunaSeFaltando("produtos", "codigo_barras TEXT");
  // mostrar_site = aparece no site de pedidos. ativo=1 + mostrar_site=0 é um
  // produto que existe pro estoque/PDV mas não é vendido pra cliente online.
  adicionarColunaSeFaltando("produtos", "mostrar_site INTEGER NOT NULL DEFAULT 1");
  adicionarColunaSeFaltando("pedidos", "origem TEXT NOT NULL DEFAULT 'online'");
  adicionarColunaSeFaltando("pedidos", "forma_pagamento TEXT");
  adicionarColunaSeFaltando("pedidos", "caixa_id INTEGER");

  const inserirSemente = db.prepare(`
    INSERT OR IGNORE INTO produtos (id, nome, categoria, descricao, preco, imagem, destaque, ordem)
    VALUES (@id, @nome, @categoria, @descricao, @preco, @imagem, @destaque, @ordem)
  `);
  semearSeVazio("produtos", SEED_PRODUTOS, (item, index) =>
    inserirSemente.run({ ...item, ordem: index })
  );

  const inserirCategoriaSemente = db.prepare(`
    INSERT OR IGNORE INTO categorias (nome, icone, ordem) VALUES (@nome, '', @ordem)
  `);
  semearSeVazio("categorias", SEED_CATEGORIAS, (item, index) =>
    inserirCategoriaSemente.run({ ...item, ordem: index })
  );

  // Garante que toda categoria já usada em algum produto exista na tabela
  // (cobre bancos antigos, migrados antes dessa tabela existir).
  const categoriasEmUso = db
    .prepare("SELECT DISTINCT categoria FROM produtos")
    .all() as { categoria: string }[];
  const { count: maxOrdemCategoria } = db
    .prepare("SELECT COALESCE(MAX(ordem), -1) + 1 as count FROM categorias")
    .get() as { count: number };
  const garantirCategoria = db.prepare(
    "INSERT OR IGNORE INTO categorias (nome, icone, ordem) VALUES (@nome, '', @ordem)"
  );
  categoriasEmUso.forEach((c, index) =>
    garantirCategoria.run({ nome: c.categoria, ordem: maxOrdemCategoria + index })
  );
});

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
  origem: "online" | "pdv";
  forma_pagamento: string | null;
  caixa_id: number | null;
  criado_em: string;
};

export type Caixa = {
  id: number;
  aberto_em: string;
  fechado_em: string | null;
  valor_inicial: number;
  valor_contado: number | null;
  observacoes: string | null;
  status: "aberto" | "fechado";
};

export type EstoqueMovimento = {
  id: number;
  produto_id: string;
  tipo: "venda_online" | "venda_pdv" | "ajuste";
  quantidade: number;
  estoque_resultante: number;
  pedido_id: number | null;
  observacao: string | null;
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
  estoque: number | null;
  codigo_barras: string | null;
  mostrar_site: number;
  criado_em: string;
};

export type Categoria = {
  nome: string;
  icone: string;
  ordem: number;
};

export type ClienteFiado = {
  telefone: string;
  nome: string;
  saldo_devedor: number;
};

export type MovimentoSaldo = {
  id: number;
  telefone: string;
  tipo: "fiado" | "pagamento" | "ajuste";
  valor: number;
  pedido_id: number | null;
  observacao: string | null;
  criado_em: string;
};
