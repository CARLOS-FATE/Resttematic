// mongoose.js

import mongoose from 'mongoose';

// Para evitar abrir múltiples conexiones, guardamos el estado de la conexión aquí.
let isConnected = false;

export const connectDB = async () => {
  // Si ya estamos conectados, no hacemos nada y reutilizamos la conexión.
  if (isConnected) {
    console.log('=> Usando conexión a la base de datos existente.');
    return;
  }

  // Si no estamos conectados, creamos una nueva conexión.
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('=> Nueva conexión a MongoDB establecida.');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    throw new Error('Error de conexión con la base de datos.');
  }
};