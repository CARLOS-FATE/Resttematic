// src/pages/api/mongoose.js
import mongoose from 'mongoose';

// Variable para almacenar el estado de la conexión
let isConnected = false; 

// Conecta a la base de datos solo si no está conectado
export const connectDB = async () => {
  if (isConnected) {
    console.log('=> Usando conexión a la base de datos existente.');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true; 
    console.log('=> Conexión a MongoDB exitosa.');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    throw error;
  }
};