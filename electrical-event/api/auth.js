import jwt from 'jsonwebtoken';

// Ahora la función acepta uno o varios roles permitidos
const auth = (allowedRoles) => (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const secret = 'mi_clave_secreta_super_segura';
    const decoded = jwt.verify(token, secret);
    req.user = decoded.user;

    // Si no se especifican roles, solo verificamos que esté logueado.
    if (!allowedRoles || allowedRoles.length === 0) {
        return next();
    }
    
    // Nos aseguramos de que los roles permitidos siempre sean un array para poder usar .includes()
    const rolesToCheck = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Verificamos si el rol del usuario está INCLUIDO en la lista de roles permitidos
    if (!rolesToCheck.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso prohibido. No tienes los permisos necesarios.' });
    }
    
    // Si el rol es correcto, continuamos
    next();
  } catch (e) {
    res.status(401).json({ message: 'Token no válido.' });
  }
};

export default auth;