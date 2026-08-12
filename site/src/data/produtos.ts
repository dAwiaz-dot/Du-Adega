// Catálogo provisório — substituir pelo catálogo real da Du Bebidas.
export type Produto = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  preco: number;
  imagem?: string;
  destaque?: string;
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
    descricao: "Corpo encorpado e final longo — daquele vinho que puxa assunto na mesa.",
    preco: 89.9,
    imagem: "/produtos/vinho-tinto-reserva.webp",
  },
  {
    id: "vinho-branco-seco",
    nome: "Vinho Branco Seco",
    categoria: "Vinhos",
    descricao: "Fresco e equilibrado, gelado na medida certa pra petiscar.",
    preco: 69.9,
    imagem: "/produtos/vinho-branco-seco.webp",
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
  },
  {
    id: "gin-nacional",
    nome: "Gin Nacional",
    categoria: "Destilados",
    descricao: "Botânicos cítricos que fazem qualquer drink render mais.",
    preco: 119.9,
  },
  {
    id: "vodka-nacional",
    nome: "Vodka Nacional",
    categoria: "Destilados",
    descricao: "Garrafa 1L, direto pra sua festa começar sem enrolação.",
    preco: 39.9,
    destaque: "Mais pedido",
  },
  {
    id: "gelo-pacote-5kg",
    nome: "Gelo em Pacote (5kg)",
    categoria: "Gelo e Carvão",
    descricao: "Gelo em cubo na hora — porque bebida quente ninguém merece.",
    preco: 12.0,
  },
  {
    id: "carvao-pacote-3kg",
    nome: "Carvão para Churrasco (3kg)",
    categoria: "Gelo e Carvão",
    descricao: "Acende rápido, queima uniforme, brasa até o último espeto.",
    preco: 18.0,
  },
  {
    id: "agua-mineral-500ml",
    nome: "Água Mineral (500ml)",
    categoria: "Água e Refrigerante",
    descricao: "Com ou sem gás, geladinha pra equilibrar a noite.",
    preco: 3.5,
  },
  {
    id: "refrigerante-2l",
    nome: "Refrigerante (2L)",
    categoria: "Água e Refrigerante",
    descricao: "Principais marcas disponíveis pra combinar com qualquer pedido.",
    preco: 12.9,
  },
];

export const categorias = Array.from(new Set(produtos.map((p) => p.categoria)));
