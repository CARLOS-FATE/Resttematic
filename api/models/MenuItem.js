//MenuItem.js

import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true
  },
  descripcion: {
    type: String,
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  categoria: {
    type: String,
    required: true,
    enum: ['Desayunos', 'Almuerzos', 'Cenas', 'Bebidas', 'Postres', 'Entradas', 'Platos Principales', 'Parrillas', 'Alitas', 'Hamburguesas', 'Barista', 'Bartender', 'Sandwiches'],
  },
  inventory: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
});

export default mongoose.model('MenuItem', menuItemSchema);