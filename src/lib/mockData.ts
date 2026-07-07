import type { Product } from '../types';

export const mockProducts: Product[] = [
  {
    id: 'mock-1',
    title: 'Camiseta Técnica FlexForm',
    slug: 'camiseta-tecnica-flexform',
    description: 'Una camiseta ligera y ultra-transpirable diseñada para entrenamientos de alta intensidad. Fabricada con poliéster reciclado de secado rápido.',
    price: 2999, // $29.99
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'],
    stock: 50,
    variants: [
      { sku: 'TSHIRT-FF-S', name: 'Talla S', price: 2999, stock: 15 },
      { sku: 'TSHIRT-FF-M', name: 'Talla M', price: 2999, stock: 20 },
      { sku: 'TSHIRT-FF-L', name: 'Talla L', price: 3299, stock: 15 },
    ],
    seo: {
      title: 'Camiseta Técnica FlexForm | Ropa Fitness Premium',
      description: 'Compra la camiseta de entrenamiento FlexForm de alto rendimiento.',
      keywords: ['camiseta', 'fitness', 'flexform', 'deporte'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-2',
    title: 'Mallas de Compresión AeroFlex',
    slug: 'mallas-compresion-aeroflex',
    description: 'Leggings de compresión de cintura alta diseñados para máxima sujeción y flexibilidad. Costuras planas para evitar rozaduras.',
    price: 5999, // $59.99
    images: ['https://images.unsplash.com/photo-1539185441755-769473a23570?w=800'],
    stock: 25,
    variants: [
      { sku: 'LEGGINGS-FF-XS', name: 'Talla XS', price: 5999, stock: 5 },
      { sku: 'LEGGINGS-FF-S', name: 'Talla S', price: 5999, stock: 10 },
      { sku: 'LEGGINGS-FF-M', name: 'Talla M', price: 5999, stock: 10 },
    ],
    seo: {
      title: 'Mallas de Compresión AeroFlex | Calzas Deportivas',
      description: 'Entrena con soporte completo usando las mallas AeroFlex de FlexForm.',
      keywords: ['mallas', 'leggings', 'compresion', 'fitness', 'yoga'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-3',
    title: 'Sudadera Hoodie Overland',
    slug: 'sudadera-hoodie-overland',
    description: 'Sudadera con capucha de corte oversized y algodón premium ultra suave. Ideal para antes de entrenar o tu look diario casual.',
    price: 7999, // $79.99
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'],
    stock: 30,
    variants: [
      { sku: 'HOODIE-FF-M', name: 'Talla M', price: 7999, stock: 15 },
      { sku: 'HOODIE-FF-L', name: 'Talla L', price: 7999, stock: 15 },
    ],
    seo: {
      title: 'Sudadera Hoodie Overland | Streetwear Premium',
      description: 'Sudadera oversized de algodón premium para entrenamiento o descanso.',
      keywords: ['sudadera', 'hoodie', 'oversized', 'abrigo'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-4',
    title: 'Shorts de Entrenamiento AeroFit',
    slug: 'shorts-entrenamiento-aerofit',
    description: 'Pantalones cortos de secado rápido con forro interior de compresión. Incorporan bolsillos con cremallera y tejido elástico de 4 vías.',
    price: 3499, // $34.99
    images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800'],
    stock: 40,
    variants: [
      { sku: 'SHORTS-FF-S', name: 'Talla S', price: 3499, stock: 10 },
      { sku: 'SHORTS-FF-M', name: 'Talla M', price: 3499, stock: 20 },
      { sku: 'SHORTS-FF-L', name: 'Talla L', price: 3499, stock: 10 },
    ],
    seo: {
      title: 'Shorts de Entrenamiento AeroFit | FlexForm Fitness',
      description: 'Entrena sin límites con los pantalones cortos AeroFit.',
      keywords: ['shorts', 'pantalones cortos', 'running', 'gym'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-5',
    title: 'Chaqueta Cortavientos Active Shield',
    slug: 'chaqueta-cortavientos-active-shield',
    description: 'Chaqueta impermeable y cortavientos ligera para entrenar al aire libre. Capucha ajustable y elementos reflectantes.',
    price: 8999, // $89.99
    images: ['https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800'],
    stock: 15,
    variants: [
      { sku: 'WINDBREAKER-FF-S', name: 'Talla S', price: 8999, stock: 5 },
      { sku: 'WINDBREAKER-FF-M', name: 'Talla M', price: 8999, stock: 10 },
    ],
    seo: {
      title: 'Chaqueta Cortavientos Active Shield | Outwear Premium',
      description: 'Chaqueta deportiva repelente al agua y cortavientos de FlexForm.',
      keywords: ['cortavientos', 'chaqueta', 'running', 'impermeable'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-6',
    title: 'Pantalón Jogger Tech Fleece',
    slug: 'pantalon-jogger-tech-fleece',
    description: 'Pantalones jogger entallados que combinan comodidad y estilo. Confeccionados en felpa técnica transpirable para retener calor.',
    price: 6499, // $64.99
    images: ['https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800'],
    stock: 20,
    variants: [
      { sku: 'JOGGER-FF-M', name: 'Talla M', price: 6499, stock: 10 },
      { sku: 'JOGGER-FF-L', name: 'Talla L', price: 6499, stock: 10 },
    ],
    seo: {
      title: 'Pantalón Jogger Tech Fleece | FlexForm Fitness',
      description: 'Disfruta de la comodidad diaria con los pantalones jogger Tech Fleece.',
      keywords: ['joggers', 'pantalon', 'sportswear', 'fleece'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-7',
    title: 'Top Deportivo Seamless Aura',
    slug: 'top-deportivo-seamless-aura',
    description: 'Sujetador deportivo sin costuras para soporte de impacto medio. Copas extraíbles y tiras cruzadas en la espalda para ventilación.',
    price: 3999, // $39.99
    images: ['https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800'],
    stock: 35,
    variants: [
      { sku: 'TOP-FF-S', name: 'Talla S', price: 3999, stock: 15 },
      { sku: 'TOP-FF-M', name: 'Talla M', price: 3999, stock: 20 },
    ],
    seo: {
      title: 'Top Deportivo Seamless Aura | Crop Top Fitness',
      description: 'Sujetador deportivo sin costuras con máxima ventilación.',
      keywords: ['top', 'crop top', 'deportivo', 'seamless', 'sujetador'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-8',
    title: 'Gorra Deportiva AeroCap',
    slug: 'gorra-deportiva-aerocap',
    description: 'Gorra ligera de secado rápido con protección UV. Tejido perforado con láser en los laterales para máxima circulación de aire.',
    price: 1999, // $19.99
    images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800'],
    stock: 60,
    variants: [],
    seo: {
      title: 'Gorra Deportiva AeroCap | Accesorios Fitness',
      description: 'Gorra para correr y entrenar transpirable con ajuste regulable.',
      keywords: ['gorra', 'gorra deportiva', 'running', 'accesorios'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
