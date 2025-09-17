import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Carga manual del archivo .env para evitar dependencias
try {
  const envPath = path.resolve(process.cwd(), '.env');
  const envFileContent = fs.readFileSync(envPath, { encoding: 'utf8' });
  envFileContent.split('\n').forEach(line => {
    if (line) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/"/g, '');
      if (key) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (error) {
  console.warn('No se pudo cargar el archivo .env. Asegúrate de que exista en la carpeta electrical-event.');
}

// Ruta correcta al modelo User desde la nueva ubicación del script
import User from './api/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

// --- DEFINE TUS CREDENCIALES DE ADMINISTRADOR AQUÍ ---
const ADMIN_EMAIL = 'WalterABG12@VanGogh.com'; // O el email que quieras arreglar
const NEW_PLAIN_PASSWORD = '*W@lterRestUVANG1'; // Una contraseña simple y temporal
// ----------------------------------------------------

const updateAdminPassword = async () => {
  console.log('Conectando a la base de datos...');
  if (!MONGODB_URI) {
    throw new Error('La variable MONGODB_URI no está definida en tu archivo .env');
  }
  await mongoose.connect(MONGODB_URI);
  console.log('¡Conexión a MongoDB Atlas exitosa!');

  console.log(`Buscando al usuario: ${ADMIN_EMAIL}...`);
  const adminUser = await User.findOne({ email: ADMIN_EMAIL });

  if (!adminUser) {
    console.error('Error: No se encontró al usuario administrador.');
    await mongoose.disconnect();
    return;
  }

  console.log('Generando nueva contraseña encriptada...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(NEW_PLAIN_PASSWORD, salt);

  adminUser.password = hashedPassword;
  await adminUser.save();

  console.log('--------------------------------------------------');
  console.log('✅ Contraseña del administrador actualizada con éxito.');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Nueva Contraseña: ${NEW_PLAIN_PASSWORD}`);
  console.log('--------------------------------------------------');
  console.log('Por favor, inicia sesión en tu sitio de Vercel con estas credenciales y luego elimina este script.');

  await mongoose.disconnect();
  console.log('Desconectado de la base de datos.');
};

updateAdminPassword().catch(err => {
  console.error('Ocurrió un error:', err);
  mongoose.disconnect();
});