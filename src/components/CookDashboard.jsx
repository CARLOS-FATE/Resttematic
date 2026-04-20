//CookDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.client.jsx';



const CookDashboard = () => {
  const auth = useAuth();

  // 2. Si el contexto es nulo, mostramos la carga.
  if (!auth) {
    return <p className="p-8 text-center text-gray-500">Inicializando...</p>;
  }

  const { token, authHeader } = auth;

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  
  // Auditory settings
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const prevPendingRef = React.useRef([]);
  const [fetchCount, setFetchCount] = useState(0);

  const playNotificationSound = useCallback(() => {
    if (!isAudioEnabled) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        
        const playTone = (freq, startTime, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(1, startTime + 0.05);
            gain.gain.setValueAtTime(1, startTime + duration - 0.05);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        playTone(660, now, 0.15);       // Note E5
        playTone(880, now + 0.20, 0.3); // Note A5 (Double chime!)
    } catch(e) {
        console.log("Audio synthesis failed", e);
    }
  }, [isAudioEnabled]);

  useEffect(() => {
      const currentPending = orders.filter(o => o.estado === 'pendiente').map(o => o._id);
      
      if (fetchCount > 1) {
          const newArrivals = currentPending.filter(id => !prevPendingRef.current.includes(id));
          if (newArrivals.length > 0) {
              playNotificationSound();
          }
      }
      
      prevPendingRef.current = currentPending;
  }, [orders, fetchCount, playNotificationSound]);

  const fetchOrders = useCallback(async () => {
    if (token) { // Verificamos que el token exista antes de la llamada
      try {
        const response = await fetch(`/api/orders/all`,
          { headers: authHeader() });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'No se pudieron cargar los pedidos.');
        }
        const data = await response.json();
        setOrders(data);
        setFetchCount(prev => prev + 1);
      } catch (err) {
        setError('Error al cargar los pedidos.');
      }
    }
  }, [token, authHeader]);

  useEffect(() => {
    if (token) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [token, fetchOrders]);

  if (!token) {
    return <p className="p-8 text-center text-gray-500 text-lg">Cargando autenticación...</p>;
  }
  // Función para actualizar el estado de un pedido
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el estado del pedido.');
      fetchOrders(); // Recargamos los pedidos para reflejar el cambio
    } catch (err) {
      setError('Error al actualizar el estado del pedido.');
    }
  };

  // Filtramos los pedidos por estado para cada columna.
  // Los pedidos 'listo para pagar' ya no se muestran aquí.
  const pendingOrders = orders.filter(order => order.estado === 'pendiente');
  const preparingOrders = orders.filter(order => order.estado === 'en preparacion');

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
             <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white">Comandas de Cocina</h1>
             
             <button 
                 onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                 className={`mt-4 md:mt-0 flex items-center px-4 py-2 font-bold rounded-lg shadow transition ${isAudioEnabled ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'}`}
             >
                 <span className="mr-2 text-xl">{isAudioEnabled ? '🔊' : '🔇'}</span>
                 {isAudioEnabled ? 'Sonido Activado' : 'Activar Sonido'}
             </button>
        </div>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Columna de Pedidos Pendientes */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-colors duration-300">
            <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400 border-b dark:border-gray-700 pb-2">Pendientes ({pendingOrders.length})</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {pendingOrders.length > 0 ? (
                pendingOrders.map(order => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    actionText="Empezar Preparación"
                    actionHandler={() => handleUpdateStatus(order._id, 'en preparacion')}
                    buttonColor="bg-yellow-500 hover:bg-yellow-600"
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No hay pedidos pendientes.</p>
              )}
            </div>
          </div>

          {/* Columna de Pedidos En Preparación */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-colors duration-300">
            <h2 className="text-xl font-bold mb-4 text-blue-600 dark:text-blue-400 border-b dark:border-gray-700 pb-2">En Preparación ({preparingOrders.length})</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {preparingOrders.length > 0 ? (
                preparingOrders.map(order => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    actionText="Marcar como Listo"
                    actionHandler={() => handleUpdateStatus(order._id, 'listo para pagar')}
                    buttonColor="bg-green-500 hover:bg-green-600"
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No hay pedidos en preparación.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Componente para la tarjeta de pedido, optimizado para la cocina
const OrderCard = ({ order, actionText, actionHandler, buttonColor }) => (
  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm transition-colors duration-300">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white">Mesa #{order.numeroMesa}</h3>
      <span className="text-sm text-gray-500 dark:text-gray-300 font-medium">
        {new Date(order.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
    <ul className="mb-4 space-y-2">
      {order.items.map(item => (
        <li key={item.menuItemId} className="text-gray-800 dark:text-white text-lg">
          <span className="font-bold text-blue-600 dark:text-blue-400">{item.cantidad}x</span> {item.nombre}
        </li>
      ))}
    </ul>
    <button
      onClick={actionHandler}
      className={`w-full text-white font-bold py-2.5 px-4 rounded-md transition-transform transform hover:scale-105 ${buttonColor}`}
    >
      {actionText}
    </button>
  </div>
);

export default CookDashboard;