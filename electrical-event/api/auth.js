// En tu archivo auth.js
import jwt from 'jsonwebtoken';

// Asegúrate de que esta línea esté al principio del archivo
// para que la variable de entorno se cargue si la ejecutas localmente.
// Si ya tienes un archivo .env en la raíz del proyecto, puedes usar una librería como dotenv.
// Pero en Vercel, las variables ya están disponibles en process.env

const auth = (allowedRoles) => (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    // CAMBIO CLAVE AQUÍ: Usa la variable de entorno
    const secret = process.env.JWT_SECRET; 
    if (!secret) {
        throw new Error('JWT_SECRET no está definido.');
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded.user;
    
    // ... el resto de tu lógica de roles
  } catch (e) {
    res.status(401).json({ message: 'Token no válido.' });
  }
};

export default auth;