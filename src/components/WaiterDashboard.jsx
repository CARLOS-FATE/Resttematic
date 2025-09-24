//WaiterDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import EditOrderForm from './EditOrderForm.jsx';
import { useAuth } from './AuthContext.client.jsx';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm mx-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
                <div className="text-gray-600 mb-6">{children}</div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 font-semibold transition">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

const WaiterDashboard = ({ userRole }) => {
  // 1. Obtenemos el contexto completo. En el primer render será 'null'.
  const auth = useAuth();

    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [tableNumber, setTableNumber] = useState('');
    const [selectedItems, setSelectedItems] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingOrder, setEditingOrder] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');

    // NUEVOS ESTADOS PARA MESAS Y RESERVAS
    const [tables, setTables] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [view, setView] = useState('tables');

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [tableToFree, setTableToFree] = useState(null);

  if (!auth) {
    return <p className="p-8 text-center text-gray-500">Inicializando...</p>;
  }
const { token, authHeader } = auth;
  const fetchOrders = useCallback(async () => {
    if (!auth?.token) return;
     try {
    const response = await fetch(`/api/orders/my-orders`, { 
      headers: auth.authHeader() 
    });
    if (!response.ok) {
      const errorData = await response.json(); // <-- Intenta obtener el JSON aquí
      throw new Error(errorData.message || 'No se pudieron obtener los pedidos.');
    }
    const data = await response.json();
    setOrders(data);
  } catch (err) {
    console.error(err); // <-- Agrega esta línea para depurar
    setError('Error al cargar los pedidos.');
  }
  }, [auth]);

const fetchMenu = async () => {
    try {
      const response = await fetch(`/api/menu`, { headers: authHeader() });
      if (!response.ok) throw new Error('No se pudo obtener el menú.');
      const data = await response.json();
      setMenuItems(data);
      if (data.length > 0) {
        const uniqueCategories = [...new Set(data.map(item => item.categoria))];
        if (uniqueCategories.length > 0) {
          setFilterCategory(uniqueCategories[0]);
        }
      }
    } catch (err) {
      setError('Error al cargar el menú.');
    }
  };
   const fetchTables = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/tables`, { headers: auth.authHeader() }); // Correcto
      if (!response.ok) throw new Error('No se pudo obtener el estado de las mesas.');
      const data = await response.json();
      setTables(data);
    } catch (err) { setError(err.message); }
}, [token, authHeader]);

  const handleEditOrder = (order) => {
    setEditingOrder(order);
  };
 const fetchTodaysReservations = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`/api/reservations/confirmed-for-today`, { headers: authHeader() });
            if (!response.ok) throw new Error('No se pudieron obtener las reservas de hoy.');
            const data = await response.json();
            setReservations(data);
        } catch (err) { setError(err.message); }
    }, [token, authHeader]);
    
    // --- LÓGICA PARA ACTUALIZAR EL ESTADO DE UNA MESA ---
    const toggleTableStatus = async (tableId, currentStatus) => {
        const newStatus = currentStatus === 'disponible' ? 'ocupada' : 'disponible';
        try {
            await fetch(`/api/tables/${tableId}/status`, {
                method: 'PUT',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus })
            });
            fetchTables(); // Recargamos el estado de las mesas para ver el cambio
        } catch (err) { setError('Error al actualizar el estado de la mesa.'); }
    };

useEffect(() => {
        
        if (token) {
            fetchOrders();
            fetchTables();
            fetchTodaysReservations();
            fetchMenu();
            const interval = setInterval(() => {
                fetchOrders();
                fetchTables();
                fetchTodaysReservations();
            }, 10000); // Actualizamos cada 10 segundos
            
            return () => clearInterval(interval);
        }
    }, [token, fetchOrders, fetchTables, fetchTodaysReservations]);

   const handleCreateOrder = async (e) => {
    e.preventDefault();
    const orderItems = Object.keys(selectedItems)
      .filter(itemId => selectedItems[itemId]?.cantidad > 0)
      .map(itemId => {
        const item = menuItems.find(menuItem => menuItem._id === itemId);
        if (!item) return null;
        return {
          menuItemId: item._id,
          nombre: item.nombre,
          cantidad: parseInt(selectedItems[itemId].cantidad),
          precioUnitario: item.precio,
        };
      }).filter(Boolean); // Filtra cualquier item nulo por seguridad
    
    if (orderItems.length === 0) {
      setError("Por favor, selecciona al menos un item.");
      return;
    }
    if (!tableNumber) {
            setError("Por favor, selecciona una mesa.");
            return;
        }
    try {
    const response = await fetch(`/api/orders`, {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
                numeroMesa: tableNumber, 
                items: orderItems,
                estado: 'pendiente'
            }),
    });
    
    if (!response.ok) {
            const errData = await response.json(); // Leemos el mensaje de error del backend
            throw new Error(errData.message || 'Error al crear el pedido.');
        }
        setSuccess('¡Pedido creado con éxito!');
        setTableNumber('');
        setSelectedItems({});
        fetchOrders();
        fetchTables(); // <-- IMPORTANTE: Refrescamos el estado de las mesas
    } catch (err) { 
        setError(err.message); 
    }
};

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este pedido?')) return;
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!response.ok) throw new Error('Error al eliminar el pedido.');
      setSuccess('¡Pedido eliminado con éxito!');
      fetchOrders();
      fetchTables();
    } catch (err) { setError(err.message); }
  };
  
  const handleItemQuantityChange = (itemId, quantity) => {
    setSelectedItems(prevItems => ({
      ...prevItems,
      [itemId]: {
        ...prevItems[itemId],
        cantidad: parseInt(quantity)
      }
    }));
  };
  
  const getCategories = () => {
    return [...new Set(menuItems.map(item => item.categoria))];
  };
 const handleOpenConfirmModal = (table) => {
        setTableToFree(table);
        setIsConfirmModalOpen(true);
    };

    const handleCloseConfirmModal = () => {
        setTableToFree(null);
        setIsConfirmModalOpen(false);
    };

    const handleConfirmFreeTable = () => {
        if (tableToFree) {
            toggleTableStatus(tableToFree._id, 'ocupada');
        }
        handleCloseConfirmModal();
    };


  const filteredMenuItems = menuItems.filter(item => item.categoria === filterCategory);
     if (!token) {
    return <p className="p-8 text-center text-gray-500 text-lg">Cargando autenticación...</p>;
  }
  return (
    <>
    <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-6 text-center">Dashboard del Mesero</h1>
        
        {error && <p className="bg-red-100 text-red-700 p-2 rounded-md mb-4 text-center">{error}</p>}
        {success && <p className="bg-green-100 text-green-700 p-2 rounded-md mb-4 text-center">{success}</p>}

        {/* --- PESTAÑAS DE NAVEGACIÓN --- */}
        <div className="mb-6 flex justify-center border-b-2">
            <button onClick={() => setView('tables')} className={`py-2 px-6 font-semibold ${view === 'tables' ? 'border-b-4 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
                Gestión de Mesas
            </button>
            <button onClick={() => setView('orders')} className={`py-2 px-6 font-semibold ${view === 'orders' ? 'border-b-4 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
                Pedidos
            </button>
            <button onClick={() => setView('menu')} className={`py-2 px-6 font-semibold ${view === 'menu' ? 'border-b-4 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
                Ver Menú
            </button>
        </div>

        {/* --- VISTA: GESTIÓN DE MESAS Y RESERVAS --- */}
        {view === 'tables' && (
            <>
                <section className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">Estado de Mesas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map(table => {
                                const reservationForTable = reservations.find(res => String(res.mesaId) === String(table._id));
                                
                                // --- LÓGICA CORREGIDA ---
                                let status = table.estado; // Empezamos con el estado real de la BD
                                let buttonClass = '';

                                if (status === 'ocupada') {
                                    buttonClass = 'bg-red-500 hover:bg-red-600';
                                } else if (reservationForTable) {
                                    // Si está disponible PERO reservada, cambiamos el estado visual
                                    status = 'reservada';
                                    buttonClass = 'bg-yellow-500 cursor-not-allowed';
                                } else {
                                    buttonClass = 'bg-green-500 hover:bg-green-600';
                                }

                                return (
                                    <button
                                        key={table._id}
                                        onClick={() => {
                                            if (table.estado === 'ocupada') {
                                                            handleOpenConfirmModal(table);
                                            }
                                        }}

                                        disabled={table.estado !== 'ocupada' || !!reservationForTable}
                                        className={`p-4 rounded-lg text-white font-bold text-center transition ${buttonClass}`}
                                        title={
                                            reservationForTable ? `Reservada para ${reservationForTable.nombreCliente}` :
                                            table.estado === 'ocupada' ? `Clic para liberar manualmente` :
                                            `Mesa ${table.estado}`
                                        }
                                    >
                                        <p className="text-xl">{table.nombre}</p>
                                        <p className="text-sm capitalize">{status}</p>
                                    </button>
                                );
                            })}
            </div>
        </section>
                <section className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">Reservas Confirmadas para Hoy</h2>
                    <div className="overflow-x-auto">
                         <table className="w-full table-auto">
                                <thead>
                                    {/* --- CABECERA ACTUALIZADA --- */}
                                    <tr className="bg-gray-200 text-gray-700">
                                        <th className="p-2 text-left">Fecha</th>
                                        <th className="p-2 text-left">Hora</th>
                                        <th className="p-2 text-left">Mesa</th>
                                        <th className="p-2 text-left">Nombre Cliente</th>
                                        <th className="p-2 text-left">Personas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.length > 0 ? (
                                        reservations.map(res => (
                                            <tr key={res._id} className="border-b">
                                                {/* --- FILA ACTUALIZADA --- */}
                                                {/* Formateamos la fecha para que se vea bien */}
                                                <td className="p-2">{new Date(res.fecha).toLocaleDateString('es-PE', { timeZone: 'UTC' })}</td>
                                                <td className="p-2 font-semibold">{res.hora}</td>
                                                <td className="p-2">{res.mesaId?.nombre || 'N/A'}</td>
                                                <td className="p-2">{res.nombreCliente}</td>
                                                <td className="p-2">{res.numeroPersonas}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        // Ajustamos el colSpan al nuevo número de columnas
                                        <tr><td colSpan="5" className="p-4 text-center text-gray-500">No hay reservas confirmadas para hoy.</td></tr>
                                    )}
                                </tbody>
                            </table>
                    </div>
                </section>
            </>
        )}

        {/* --- VISTA: GESTIÓN DE PEDIDOS --- */}
        {view === 'orders' && (
            <>
                <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Crear Nuevo Pedido</h2>
                    <form onSubmit={handleCreateOrder}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2">Mesa</label>
                            {/* ESTE ES EL SELECTOR DE MESAS CORRECTO */}
                            <select
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full p-2 border rounded-md"
                                required
                            >
                                <option value="">-- Selecciona una mesa disponible --</option>
                                {tables
                                    .filter(table => table.estado === 'disponible')
                                    .map(table => (
                                        <option key={table._id} value={table.nombre}>
                                            {table.nombre} (Capacidad: {table.capacidad})
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2">Seleccionar Items</label>
                            {/* AQUÍ YA NO ESTÁ EL SELECT DUPLICADO */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {getCategories().map(category => (
                                    <button key={category} type="button" onClick={() => setFilterCategory(category)} className={`py-2 px-4 rounded-md font-medium transition ${filterCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                        {category}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredMenuItems.map(item => (
                                    <div key={item._id} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="font-bold">{item.nombre}</p>
                                            <p className="text-gray-600 text-sm">S/. {item.precio.toFixed(2)}</p>
                                        </div>
                                        <input type="number" min="0" max={item.inventory} value={selectedItems[item._id]?.cantidad || 0} onChange={(e) => handleItemQuantityChange(item._id, e.target.value)} className="w-20 p-2 border rounded-md text-center" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition">
                            Guardar Pedido
                        </button>
                    </form>
                </section>
                <section className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4">Mis Pedidos</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-200 text-gray-700">
                                    <th className="p-2 text-left">Mesa</th>
                                    <th className="p-2 text-left">Items</th>
                                    <th className="p-2 text-left">Estado</th>
                                    <th className="p-2 text-left">Total</th>
                                    <th className="p-2 text-left">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order._id} className="border-b">
                                        <td className="p-2">{order.numeroMesa}</td>
                                        <td className="p-2">{order.items.map(item => `${item.nombre} (${item.cantidad})`).join(', ')}</td>
                                        <td className="p-2 capitalize">
                                            {order.esPagado ? 'Pagado' : order.estado}
                                        </td>
                                        <td className="p-2">S/. {order.total.toFixed(2)}</td>
                                        <td className="p-2 space-x-2">
                                            <button onClick={() => handleEditOrder(order)} className="text-blue-500 hover:text-blue-700">Editar</button>
                                            <button onClick={() => handleDeleteOrder(order._id)} className="text-red-500 hover:text-red-700">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {editingOrder && <EditOrderForm order={editingOrder} onUpdate={() => { fetchOrders(); setEditingOrder(null); }} onClose={() => setEditingOrder(null)} menuItems={menuItems} authHeader={authHeader} tables={tables}/>}
                </section>
            </>
        )}

        {/* --- VISTA: VER MENÚ --- */}
        {view === 'menu' && (
            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold mb-4">Menú del Restaurante</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {getCategories().map(category => (
                        <button key={category} type="button" onClick={() => setFilterCategory(category)} className={`py-2 px-4 rounded-md font-medium transition ${filterCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                            {category}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMenuItems.map(item => (
                        <div key={item._id} className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-bold text-lg">{item.nombre}</p>
                            <p className="text-green-600 font-semibold">S/. {item.precio.toFixed(2)}</p>
                            <p className="text-gray-600 text-sm">Disponibles: {item.inventory}</p>
                        </div>
                    ))}
                </div>
            </section>
        )}
    </div>
    <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={handleCloseConfirmModal}
            onConfirm={handleConfirmFreeTable}
            title="Confirmar Liberación"
        >
            ¿Estás seguro de que quieres liberar manualmente la <strong>{tableToFree?.nombre}</strong>?
            <br />
            <span className="text-sm text-gray-500">Usa esta opción solo si la mesa está realmente vacía.</span>
        </ConfirmationModal>

    </>
);
};

export default WaiterDashboard;