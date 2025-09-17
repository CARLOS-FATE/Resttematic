// src/components/DashboardWrapper.client.jsx

import React from 'react';
import { AuthProvider } from './AuthContext.client.jsx';

// Importa TODOS tus dashboards
import AdminDashboard from './AdminDashboard.jsx';
import CookDashboard from './CookDashboard.jsx';
import CashierDashboard from './CashierDashboard.jsx';
import WaiterDashboard from './WaiterDashboard.jsx';

// Un mapa para seleccionar qué dashboard mostrar
const dashboardMap = {
  admin: AdminDashboard,
  cocinero: CookDashboard,
  caja: CashierDashboard,
  mesero: WaiterDashboard,
  // Añade aquí el rol 'dueño' para que apunte al AdminDashboard
  dueño: AdminDashboard, 
};

const DashboardWrapper = ({ userRole }) => {
  // Seleccionamos el componente correcto basado en el userRole
  const DashboardComponent = dashboardMap[userRole];

  if (!DashboardComponent) {
    return <p>Error: Dashboard para el rol '{userRole}' no encontrado.</p>;
  }

  // Aquí está la magia: envolvemos el dashboard correcto con el proveedor.
  // Todo esto ocurre dentro de una sola "isla" de React.
  return (
    <AuthProvider>
      <DashboardComponent userRole={userRole} />
    </AuthProvider>
  );
};

export default DashboardWrapper;