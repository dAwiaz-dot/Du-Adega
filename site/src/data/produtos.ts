// Catálogo provisório — substituir pelo catálogo real da Du Bebidas.
export type Produto = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  preco: number;
  imagem?: string;
};

export const categoriaIcone: Record<string, string> = {
  Vinhos: "🍷",
  Cervejas: "🍺",
  Destilados: "🥃",
  "Gelo e Carvão": "🧊",
  "Água e Refrigerante": "🥤",
};

export const produtos: Produto[] = [
  {
    id: "vinho-tinto-reserva",
    nome: "Vinho Tinto Reserva",
    categoria: "Vinhos",
    descricao: "Corpo encorpado, notas de frutas vermelhas e carvalho.",
    preco: 89.9,
    imagem: "/produtos/vinho-tinto-reserva.webp",
  },
  {
    id: "vinho-branco-seco",
    nome: "Vinho Branco Seco",
    categoria: "Vinhos",
    descricao: "Leve e refrescante, ideal para petiscos e frutos do mar.",
    preco: 69.9,
    imagem: "/produtos/vinho-branco-seco.webp",
  },
  {
    id: "cerveja-long-neck",
    nome: "Cerveja Long Neck",
    categoria: "Cervejas",
    descricao: "Geladinha, pronta pra entrega.",
    preco: 8.9,
    imagem: "/produtos/cerveja-long-neck.webp",
  },
  {
    id: "cerveja-lata-fardo",
    nome: "Fardo de Cerveja (12 latas)",
    categoria: "Cervejas",
    descricao: "Fardo fechado, ideal pra churrasco e reunião com amigos.",
    preco: 79.9,
    imagem: "/produtos/cerveja-lata-fardo.webp",
  },
  {
    id: "whisky-12-anos",
    nome: "Whisky 12 anos",
    categoria: "Destilados",
    descricao: "Envelhecido em barril de carvalho, notas amadeiradas.",
    preco: 249.9,
  },
  {
    id: "gin-nacional",
    nome: "Gin Nacional",
    categoria: "Destilados",
    descricao: "Botânicos cítricos, ótimo para drinks.",
    preco: 119.9,
  },
  {
    id: "vodka-nacional",
    nome: "Vodka Nacional",
    categoria: "Destilados",
    descricao: "Garrafa 1L, direto pra sua festa.",
    preco: 39.9,
  },
  {
    id: "gelo-pacote-5kg",
    nome: "Gelo em Pacote (5kg)",
    categoria: "Gelo e Carvão",
    descricao: "Gelo em cubo, pronto pra usar.",
    preco: 12.0,
  },
  {
    id: "carvao-pacote-3kg",
    nome: "Carvão para Churrasco (3kg)",
    categoria: "Gelo e Carvão",
    descricao: "Carvão vegetal, queima uniforme.",
    preco: 18.0,
  },
  {
    id: "agua-mineral-500ml",
    nome: "Água Mineral (500ml)",
    categoria: "Água e Refrigerante",
    descricao: "Com ou sem gás.",
    preco: 3.5,
  },
  {
    id: "refrigerante-2l",
    nome: "Refrigerante (2L)",
    categoria: "Água e Refrigerante",
    descricao: "Principais marcas disponíveis.",
    preco: 12.9,
  },
];

export const categorias = Array.from(new Set(produtos.map((p) => p.categoria)));
