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
    enum: ['Desayuno','Almuerzo','Cena', 'Bebidas', 'Postres', 'Entradas', 'Platos Principales'],
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