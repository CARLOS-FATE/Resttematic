import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Credenciales inválidas');
      
      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const userRole = data.user.role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      document.cookie = `token=${data.token}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `role=${userRole}; path=/; max-age=3600; SameSite=Lax`;
      
      setToken(data.token);
      setUser(data.user);
      
      let destination;
      if (userRole === 'dueño' || userRole === 'administrador') {
        destination = '/dashboard/admin';
      } else if (userRole === 'mesero') {
        destination = '/dashboard/waiter';
      } else {
        destination = `/dashboard/${userRole}`;
      }
      
      window.location.href = destination;

    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };
  
  const authHeader = () => ({
    'Content-Type': 'application/json',
    'x-auth-token': token,
  });

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};