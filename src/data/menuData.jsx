// src/data/menuData.js

export const menuItems = [
  {
    id: "menu-nocturno",
    name: "Carta Nocturna",
  	description: "Empieza tu día con la inspiración de un nuevo lienzo...",
  	image: "/carta_nocturna.jpeg", 
  	price: "desde S/. 16",
  	slug: "cartanocturna",
    images: [
      "/cartas/nocturna/pagina-1.jpg",
      "/cartas/nocturna/pagina-2.jpg",
    ]
  },
  {
    id: "menu-dia",
  	name: "Carta del Día",
  	description: "Una pausa al mediodía llena de sabor y color...",
  	image: "/carta_nocturna.jpeg",
  	price: "desde S/. 19",
  	slug: "cartadeldial",
    // === NUEVA PROPIEDAD ===
    images: [
      "/cartas/dia/pagina-1.jpg"
    ]
  },
];