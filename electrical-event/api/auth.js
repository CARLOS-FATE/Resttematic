import jwt from 'jsonwebtoken';

// Ahora la función acepta uno o varios roles permitidos
const auth = (allowedRoles) => (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET no está definido.');
    }
    const decoded = jwt.verify(token, secret);
    req.user = decoded.user;

    if (!allowedRoles || allowedRoles.length === 0) {
        return next();
    }
    
    const rolesToCheck = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!rolesToCheck.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso prohibido. No tienes los permisos necesarios.' });
    }
    
   
    next();
  } catch (e) {
    res.status(401).json({ message: 'Token no válido.' });
  }
};

export default auth;