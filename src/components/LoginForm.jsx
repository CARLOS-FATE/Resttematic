//LoginForm.jsx

import React, { useState } from 'react';
import Cookies from 'js-cookie';


const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Error al iniciar sesión.');
        return;
      }

      const data = await response.json();

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const normalizeRole = (role) => {
        if (!role) return '';
        return role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      };

      const userRole = normalizeRole(data.user.role);

      document.cookie = `token=${data.token}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `role=${userRole}; path=/; max-age=3600; SameSite=Lax`;


      let destination;

      if (userRole === 'dueno' || userRole === 'administrador') {
        destination = '/dashboard/admin';
      } else if (userRole === 'mesero') {
        destination = '/dashboard/waiter';
      } else if (userRole === 'caja') {
        destination = '/dashboard/cashier';
      } else if (userRole === 'cocinero') {
        destination = '/dashboard/cook';
      } else {
        // Si el rol es desconocido, enviar a la página de login para evitar errores
        destination = '/login';
      }

      window.location.href = destination;

    } catch (err) {
      setError('Error de conexión. Por favor, revisa el servidor.');
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-sm w-full transition-colors duration-300">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Iniciar Sesión</h2>
        {error && <p className="bg-red-100 text-red-700 p-2 rounded-md mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-300"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;