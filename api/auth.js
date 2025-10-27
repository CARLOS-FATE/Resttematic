
// Archivo: electrical-event/api/auth.js (Versión Mejorada)
import jwt from 'jsonwebtoken';

const normalizeRole = (role = '') => {
    return role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

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

    // Si no se especifican roles, solo verificamos que esté logueado.
    if (!allowedRoles || allowedRoles.length === 0) {
        return next();
    }

    const rolesToCheck = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRoleNormalized = normalizeRole(req.user.role);

    // Verificamos si el rol normalizado del usuario está INCLUIDO en la lista de roles permitidos
    if (!rolesToCheck.includes(userRoleNormalized)) {
      return res.status(403).json({ message: `Acceso prohibido. Rol '${req.user.role}' no tiene permiso.` });
    }

    next();
  } catch (e) {
    res.status(401).json({ message: 'Token no válido.' });
  }
};

export default auth;