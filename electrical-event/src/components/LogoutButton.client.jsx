// src/components/LogoutButton.client.jsx

import React from 'react';
import { useAuth } from './AuthContext.client.jsx';

const LogoutButton = () => {
  const auth = useAuth();
  
  // No mostramos el botón si el contexto no está listo o si no hay usuario
  if (!auth || !auth.user) {
    return null;
  }

  const { user, logout } = auth;

  return (
    <div className="flex items-center gap-4">
      <span className="text-white font-medium hidden sm:block">Hola, {user.name}</span>
      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
      >
        Cerrar Sesión
      </button>
    </div>
  );
};

export default LogoutButton;