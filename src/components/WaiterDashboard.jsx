import React, { useState, useEffect, useCallback } from 'react';
import EditOrderForm from './EditOrderForm.jsx';
import { useAuth } from './AuthContext.client.jsx';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid';

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

export const ParrillaComboModal = ({ isOpen, onClose, comboItem, meatCount, onAddCombo }) => {
    // Array of meat objects. We use primitive initialization inside the component 
    // to map over them properly.
    const [meats, setMeats] = useState([]);
    const [guarnicion, setGuarnicion] = useState('Papa Frita');

    useEffect(() => {
        if (isOpen) {
            setMeats(Array.from({ length: meatCount }, () => ({ tipo: '', coccion: '' })));
            setGuarnicion('Papa Frita');
        }
    }, [isOpen, meatCount]);

    if (!isOpen || !comboItem) return null;

    const handleMeatChange = (index, field, value) => {
        const newMeats = [...meats];
        newMeats[index][field] = value;
        // Sanitary enforcement: Pollo MUST be fully cooked.
        if (field === 'tipo') {
            if (value === 'Pollo') {
                newMeats[index].coccion = 'Bien cocido';
            } else if (value !== 'Pollo' && newMeats[index].coccion === 'Bien cocido') {
                // optional: reset or let it be 'Bien cocido' for Res/Cerdo too. Letting it be is fine,
                // but usually better feeling if it clears to force read.
                newMeats[index].coccion = ''; 
            }
        }
        setMeats(newMeats);
    };

    const isFormValid = () => {
        if (!guarnicion) return false;
        return meats.every((meat) => {
            if (!meat.tipo) return false;
            if (meat.tipo === 'Pollo') return meat.coccion === 'Bien cocido';
            return ['Inglés', 'Medio', '3/4', 'Bien cocido'].includes(meat.coccion);
        });
    };

    const handleAdd = () => {
        if (!isFormValid()) return;
        
        // Exact ticket instruction building
        const meatsDesc = meats.map((m, i) => `1x ${m.tipo} (${m.coccion})`).join(', ');
        const fullName = `${comboItem.nombre} [🍟 ${guarnicion}] | 🥩 ${meatsDesc}`;

        onAddCombo({
            inventoryItemId: comboItem._id,
            price: comboItem.precio,
            name: fullName,
            variant: 'Parrilla_Especial'
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold text-red-900 mb-2">Armar {comboItem.nombre}</h3>
                
                <div className="mb-4 bg-gray-50 p-3 rounded border">
                    <h4 className="font-semibold text-gray-800 mb-2">1. Guarnición Base:</h4>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="Papa Frita" checked={guarnicion === 'Papa Frita'} onChange={(e) => setGuarnicion(e.target.value)} />
                            <span className="font-medium">🍟 Papa Frita</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="Papa Sancochada" checked={guarnicion === 'Papa Sancochada'} onChange={(e) => setGuarnicion(e.target.value)} />
                            <span className="font-medium">🥔 Papa Sancochada</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-gray-800 border-b pb-1">2. Configura las Carnes ({meatCount}):</h4>
                    {meats.map((meat, index) => (
                        <div key={index} className="p-4 border border-red-100 rounded-md bg-red-50 flex flex-col sm:flex-row gap-4 shadow-sm">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-red-800 mb-1">Tipo de Carne {index + 1}</label>
                                <select 
                                    value={meat.tipo} 
                                    onChange={(e) => handleMeatChange(index, 'tipo', e.target.value)}
                                    className="w-full p-2 border border-red-200 rounded outline-none focus:ring-2 focus:ring-red-400"
                                >
                                    <option value="">-- Seleccionar --</option>
                                    <option value="Pollo">Pollo</option>
                                    <option value="Res">Res</option>
                                    <option value="Cerdo">Cerdo</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-red-800 mb-1">Término de Cocción</label>
                                <select
                                    value={meat.coccion}
                                    onChange={(e) => handleMeatChange(index, 'coccion', e.target.value)}
                                    disabled={meat.tipo === 'Pollo'}
                                    className={`w-full p-2 border rounded outline-none focus:ring-2 focus:ring-red-400 ${meat.tipo === 'Pollo' ? 'bg-gray-200 text-gray-500 border-gray-300 font-semibold' : 'bg-white border-red-200'}`}
                                >
                                    <option value="">-- Término --</option>
                                    <option value="Inglés">Inglés</option>
                                    <option value="Medio">Medio</option>
                                    <option value="3/4">3/4</option>
                                    <option value="Bien cocido">Bien cocido</option>
                                </select>
                                {meat.tipo === 'Pollo' && <p className="text-xs text-red-600 mt-1 italic">*Pollo exige bien cocido de fábrica.</p>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-700 font-bold rounded-md hover:bg-gray-300 transition">Cancelar</button>
                    <button type="button" onClick={handleAdd} disabled={!isFormValid()} className="px-5 py-2 bg-red-600 text-white font-bold rounded-md disabled:bg-gray-400 hover:bg-red-700 transition">
                        Agregar Variante al Ticket
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ComboModal = ({ isOpen, onClose, alitasItems, onAddCombo }) => {
    const [selectedFlavors, setSelectedFlavors] = useState([]);
    const [guarnicion, setGuarnicion] = useState('Papa Frita');

    if (!isOpen) return null;

    const toggleFlavor = (flavor) => {
        if (selectedFlavors.find(f => f._id === flavor._id)) {
            setSelectedFlavors(selectedFlavors.filter(f => f._id !== flavor._id));
        } else {
            if (selectedFlavors.length < 2) {
                setSelectedFlavors([...selectedFlavors, flavor]);
            }
        }
    };

    const handleAdd = () => {
        if (selectedFlavors.length !== 2) {
            alert('Por favor selecciona exactamente 2 sabores de alitas.');
            return;
        }
        const f1 = selectedFlavors[0];
        const f2 = selectedFlavors[1];
        const maxPrice = Math.max(f1.precio, f2.precio);
        const minAccepter = f1.precio < f2.precio ? f1 : f2;

        onAddCombo({
            inventoryItemId: minAccepter._id,
            price: maxPrice,
            name: `Combo Mixto (${f1.nombre.replace('Alitas ', '')} + ${f2.nombre.replace('Alitas ', '')}) [🍟 ${guarnicion}]`,
            variant: guarnicion
        });
        setSelectedFlavors([]);
        setGuarnicion('Papa Frita');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Armar Combo Mixto de Alitas</h3>
                
                <h4 className="font-semibold text-gray-700 mb-2">1. Selecciona 2 sabores ({selectedFlavors.length}/2):</h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {alitasItems.map(alita => {
                        const isSelected = !!selectedFlavors.find(f => f._id === alita._id);
                        return (
                            <button 
                                key={alita._id}
                                type="button"
                                onClick={() => toggleFlavor(alita)}
                                className={`p-2 border rounded-md text-left transition ${isSelected ? 'bg-orange-100 border-orange-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                            >
                                <p className="font-medium text-sm">{alita.nombre}</p>
                                <p className="text-xs text-gray-500">S/. {alita.precio.toFixed(2)}</p>
                            </button>
                        );
                    })}
                </div>

                <h4 className="font-semibold text-gray-700 mb-2">2. Elige Guarnición Obligatoria:</h4>
                <div className="flex gap-4 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="guarnicion" value="Papa Frita" checked={guarnicion === 'Papa Frita'} onChange={(e) => setGuarnicion(e.target.value)} />
                        <span>🥔 Papa Frita</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="guarnicion" value="Papa Sancochada" checked={guarnicion === 'Papa Sancochada'} onChange={(e) => setGuarnicion(e.target.value)} />
                        <span>🥔 Papa Sancochada</span>
                    </label>
                </div>

                <div className="flex justify-end gap-4 border-t pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Cancelar</button>
                    <button type="button" onClick={handleAdd} className="px-4 py-2 rounded-md bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed" disabled={selectedFlavors.length !== 2}>
                        Agregar al Pedido
                    </button>
                </div>
            </div>
        </div>
    );
};

const TicketVirtualModal = ({ isOpen, onClose, onConfirm, orderItems, tableNumber }) => {
    if (!isOpen) return null;
    const total = orderItems.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm mx-4">
                <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">🎟️ Ticket Virtual</h3>
                    <p className="text-gray-500 font-medium">Mesa seleccionada: {tableNumber}</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mb-6 max-h-60 overflow-y-auto">
                    <ul className="space-y-3">
                        {orderItems.map((item, idx) => (
                            <li key={idx} className="text-gray-700 text-sm flex flex-col border-b border-yellow-100 pb-2 last:border-0 last:pb-0">
                                <span className="font-semibold block">{item.cantidad}x {item.nombre}</span>
                                <span className="text-right text-gray-500 font-medium whitespace-nowrap">S/. {(item.precioUnitario * item.cantidad).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="flex justify-between items-center mb-6 px-2">
                    <span className="font-bold text-lg text-gray-700">Total:</span>
                    <span className="font-bold text-2xl text-green-600">S/. {total.toFixed(2)}</span>
                </div>

                <div className="flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="w-full px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition">
                        Corregir
                    </button>
                    <button type="button" onClick={onConfirm} className="w-full px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 font-semibold transition">
                        Confirmar Pedido
                    </button>
                </div>
            </div>
        </div>
    );
};

const WaiterDashboard = ({ userRole }) => {
  const auth = useAuth();

    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [tableNumber, setTableNumber] = useState('');
    const [selectedItems, setSelectedItems] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingOrder, setEditingOrder] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');

    const [tables, setTables] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [view, setView] = useState('tables');

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [tableToFree, setTableToFree] = useState(null);

    const [isComboModalOpen, setIsComboModalOpen] = useState(false);
    
    // Parrilla Modal state
    const [isParrillaModalOpen, setIsParrillaModalOpen] = useState(false);
    const [activeParrillaCombo, setActiveParrillaCombo] = useState(null);
    const [activeParrillaMeatCount, setActiveParrillaMeatCount] = useState(2);

    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [pendingOrderItems, setPendingOrderItems] = useState([]);

  if (!auth) return <p className="p-8 text-center text-gray-500">Inicializando...</p>;

  const { token, authHeader } = auth;

  const fetchOrders = useCallback(async () => {
    if (!auth?.token) return;
     try {
    const response = await fetch(`/api/orders/my-orders`, { headers: auth.authHeader() });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'No se pudieron obtener los pedidos.');
    }
    const data = await response.json();
    setOrders(data);
  } catch (err) {
    console.error(err);
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
        if (uniqueCategories.length > 0) setFilterCategory(uniqueCategories[0]);
      }
    } catch (err) { setError('Error al cargar el menú.'); }
  };

   const fetchTables = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/tables`, { headers: auth.authHeader() });
      if (!response.ok) throw new Error('No se pudo obtener el estado de las mesas.');
      const data = await response.json();
      setTables(data);
    } catch (err) { setError(err.message); }
}, [token, authHeader]);

  const handleEditOrder = (order) => setEditingOrder(order);

 const fetchTodaysReservations = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`/api/reservations/confirmed-for-today`, { headers: authHeader() });
            if (!response.ok) throw new Error('No se pudieron obtener las reservas de hoy.');
            const data = await response.json();
            setReservations(data);
        } catch (err) { setError(err.message); }
    }, [token, authHeader]);
    
    const toggleTableStatus = async (tableId, currentStatus) => {
        const newStatus = currentStatus === 'disponible' ? 'ocupada' : 'disponible';
        try {
            await fetch(`/api/tables/${tableId}/status`, {
                method: 'PUT',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus })
            });
            fetchTables();
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
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [token, fetchOrders, fetchTables, fetchTodaysReservations]);

   const handlePrepareOrder = (e) => {
        e.preventDefault();
        
        const orderItems = Object.keys(selectedItems)
          .filter(key => selectedItems[key]?.cantidad > 0)
          .map(key => {
            const data = selectedItems[key];
            if (key.includes('COMBO|')) {
                return {
                    menuItemId: data.inventoryItemId,
                    nombre: data.name, // Name is fully pre-formatted from the Modals!
                    cantidad: data.cantidad,
                    precioUnitario: data.price,
                };
            } else {
                const item = menuItems.find(mi => mi._id === data.itemId);
                if (!item) return null;
                const formattedName = data.variant === 'Normal' ? item.nombre : `${item.nombre} [${data.variant}]`;
                return {
                    menuItemId: item._id,
                    nombre: formattedName,
                    cantidad: data.cantidad,
                    precioUnitario: item.precio,
                };
            }
          }).filter(Boolean);
        
        if (orderItems.length === 0) {
            setError("Por favor, selecciona al menos un item.");
            return;
        }
        if (!tableNumber) {
            setError("Por favor, selecciona una mesa.");
            return;
        }
        setPendingOrderItems(orderItems);
        setIsTicketModalOpen(true);
   };

   const handleConfirmOrder = async () => {
    try {
        const response = await fetch(`/api/orders`, {
                method: 'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numeroMesa: tableNumber, 
                    items: pendingOrderItems,
                    estado: 'pendiente'
                }),
        });
        
        if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Error al crear el pedido.');
        }
        setSuccess('¡Pedido creado con éxito!');
        setTableNumber('');
        setSelectedItems({});
        setIsTicketModalOpen(false);
        setPendingOrderItems([]);
        fetchOrders();
        fetchTables();
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
  
  const handleItemQuantityChange = (itemId, variant, quantity) => {
    const key = `${itemId}|${variant}`;
    const newQty = parseInt(quantity) || 0;
    setSelectedItems(prev => {
        const copy = { ...prev };
        if (newQty <= 0) {
            delete copy[key];
        } else {
            copy[key] = { itemId, variant, cantidad: newQty };
        }
        return copy;
    });
  };

  const handleAddCombo = (comboData) => {
      // Usar btoa or string parsing to uniquely identify the entire signature avoids collision if same variants are added exactly
      const stringifiedCombo = JSON.stringify({nm: comboData.name, id: comboData.inventoryItemId});
      const key = `COMBO|${stringifiedCombo}`;
      setSelectedItems(prev => ({
          ...prev,
          [key]: {
              ...comboData,
              cantidad: (prev[key]?.cantidad || 0) + 1
          }
      }));
      setSuccess(`Agregado visualmente. Revisa el pedido.`);
      setTimeout(() => setSuccess(''), 2000);
  };

  const handleOpenParrillaModal = (item) => {
      const nameL = item.nombre.toLowerCase();
      let meats = 2; // Default to 2
      if (nameL.includes('girasol') || nameL.includes('3') || nameL.includes('tres')) meats = 3;
      if (nameL.includes('4') || nameL.includes('cuatro')) meats = 4;
      
      setActiveParrillaCombo(item);
      setActiveParrillaMeatCount(meats);
      setIsParrillaModalOpen(true);
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
  const alitasMenu = menuItems.filter(item => item.categoria === 'Alitas');

  if (!token) return <p className="p-8 text-center text-gray-500 text-lg">Cargando autenticación...</p>;

  // Filtrar todos los items compuestos marcados por COMBO| para el carrito visual
  const comboSelectedItemKeys = Object.keys(selectedItems).filter(k => k.includes('COMBO|'));

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
                                
                                let status = table.estado; 
                                let buttonClass = '';

                                if (status === 'ocupada') {
                                    buttonClass = 'bg-red-500 hover:bg-red-600';
                                } else if (reservationForTable) {
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
                                                <td className="p-2">{new Date(res.fecha).toLocaleDateString('es-PE', { timeZone: 'UTC' })}</td>
                                                <td className="p-2 font-semibold">{res.hora}</td>
                                                <td className="p-2">{res.mesaId?.nombre || 'N/A'}</td>
                                                <td className="p-2">{res.nombreCliente}</td>
                                                <td className="p-2">{res.numeroPersonas}</td>
                                            </tr>
                                        ))
                                    ) : (
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
                    <form onSubmit={handlePrepareOrder}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2">Mesa</label>
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
                            <div className="flex flex-wrap gap-2 mb-4">
                                {getCategories().map(category => (
                                    <button key={category} type="button" onClick={() => setFilterCategory(category)} className={`py-2 px-4 rounded-md font-medium transition ${filterCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                        {category}
                                    </button>
                                ))}
                            </div>

                            {/* Mostrar carrito compuesto dinámico */}
                            {comboSelectedItemKeys.length > 0 && (filterCategory === 'Alitas' || filterCategory === 'Parrillas') && (
                                <div className="mb-4 bg-orange-50 rounded-md p-4 border border-orange-200">
                                    <h4 className="font-bold text-orange-800 mb-2">Variantes Añadidas en esta categoría:</h4>
                                    <ul>
                                        {comboSelectedItemKeys.map(k => {
                                            const data = selectedItems[k];
                                            return (
                                                <li key={k} className="flex justify-between items-center border-b border-orange-100 py-1 gap-2">
                                                    <span className="text-sm font-medium">{data.cantidad}x {data.name}</span>
                                                    <button type="button" onClickCapture={() => {
                                                        const copy = { ...selectedItems };
                                                        delete copy[k];
                                                        setSelectedItems(copy);
                                                    }} className="text-red-500 font-bold px-2 whitespace-nowrap bg-red-100 rounded hover:bg-red-200">Quitar</button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filterCategory === 'Alitas' && (
                                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 mb-4">
                                        <button 
                                            type="button"
                                            onClick={() => setIsComboModalOpen(true)}
                                            className="w-full bg-orange-500 text-white font-bold py-4 rounded-lg shadow hover:bg-orange-600 transition text-lg flex justify-center items-center gap-2"
                                        >
                                            🍗 Armar Combo Mixto de Alitas (Opción Especial)
                                        </button>
                                    </div>
                                )}

                                {filteredMenuItems.map(item => {
                                    const isParrillaOrAlita = filterCategory === 'Parrillas' || filterCategory === 'Alitas';
                                    
                                    if (isParrillaOrAlita) {
                                        // LOGICA DE COMBOS ESPECIALES DE PARRILLA
                                        if (filterCategory === 'Parrillas' && item.nombre.toLowerCase().includes('combo')) {
                                            return (
                                                <div key={item._id} className="bg-red-50 p-4 rounded-lg flex flex-col justify-between shadow-sm border border-red-200">
                                                    <div className="mb-3 border-b border-red-100 pb-2 flex justify-between items-start">
                                                        <p className="font-bold text-lg text-red-900">{item.nombre}</p>
                                                        <p className="text-red-700 font-semibold bg-red-100 px-2 rounded">S/. {item.precio.toFixed(2)}</p>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleOpenParrillaModal(item)}
                                                        className="w-full bg-red-600 text-white font-bold py-3 rounded-lg shadow-sm hover:bg-red-700 transition flex justify-center items-center gap-2 mt-2"
                                                    >
                                                        🥩 Armar Combo de Carnes
                                                    </button>
                                                </div>
                                            );
                                        }

                                        // ITEMS NORMALES DE PARRILLA O ALITAS
                                        return (
                                            <div key={item._id} className="bg-gray-50 p-4 rounded-lg flex flex-col justify-between shadow-sm border">
                                                <div className="mb-3 border-b pb-2">
                                                    <p className="font-bold text-lg">{item.nombre}</p>
                                                    <p className="text-gray-600 text-md">S/. {item.precio.toFixed(2)}</p>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center text-sm font-medium">
                                                        <span>🥔 Papa Frita:</span>
                                                        <input type="number" min="0" max={item.inventory} value={selectedItems[`${item._id}|Papa Frita`]?.cantidad || ''} placeholder="0" onChange={(e) => handleItemQuantityChange(item._id, 'Papa Frita', e.target.value)} className="w-16 p-2 border rounded-md text-center bg-white outline-none focus:ring-1" />
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm font-medium">
                                                        <span>🥔 Papa Sancochada:</span>
                                                        <input type="number" min="0" max={item.inventory} value={selectedItems[`${item._id}|Papa Sancochada`]?.cantidad || ''} placeholder="0" onChange={(e) => handleItemQuantityChange(item._id, 'Papa Sancochada', e.target.value)} className="w-16 p-2 border rounded-md text-center bg-white outline-none focus:ring-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={item._id} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between shadow-sm border">
                                            <div>
                                                <p className="font-bold text-lg">{item.nombre}</p>
                                                <p className="text-gray-600 text-md">S/. {item.precio.toFixed(2)}</p>
                                            </div>
                                            <input type="number" min="0" max={item.inventory} value={selectedItems[`${item._id}|Normal`]?.cantidad || ''} placeholder="0" onChange={(e) => handleItemQuantityChange(item._id, 'Normal', e.target.value)} className="w-16 p-2 border rounded-md text-center bg-white outline-none focus:ring-1" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-green-500 text-white font-bold py-3 rounded-lg shadow-md hover:bg-green-600 transition text-lg mt-4">
                            Revisar y Guardar Pedido
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
                                        <td className="p-2">{order.items.map(item => `${item.cantidad}x ${item.nombre}`).join(', ')}</td>
                                        <td className="p-2 capitalize">
                                            {order.esPagado ? 'Pagado' : order.estado}
                                        </td>
                                        <td className="p-2 font-bold whitespace-nowrap">S/. {order.total.toFixed(2)}</td>
                                        <td className="p-2 space-x-2">
                                            <button 
                                                onClick={() => handleEditOrder(order)} 
                                                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                <PencilSquareIcon className="h-5 w-5 mr-1" />
                                                <span>Editar</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteOrder(order._id)} 
                                                className="flex items-center text-red-600 hover:text-red-800 transition-colors mt-2"
                                            >
                                                <TrashIcon className="h-5 w-5 mr-1" />
                                                <span>Eliminar</span>
                                            </button>
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
                        <div key={item._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border">
                            <p className="font-bold text-lg">{item.nombre}</p>
                            <p className="text-green-600 font-semibold">S/. {item.precio.toFixed(2)}</p>
                            <p className="text-gray-600 text-sm">Disponibles: {item.inventory}</p>
                        </div>
                    ))}
                </div>
            </section>
        )}
    </div>

    {/* --- MODALES --- */}
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

    <ComboModal 
        isOpen={isComboModalOpen}
        onClose={() => setIsComboModalOpen(false)}
        alitasItems={alitasMenu}
        onAddCombo={handleAddCombo}
    />

    <ParrillaComboModal
        isOpen={isParrillaModalOpen}
        onClose={() => setIsParrillaModalOpen(false)}
        comboItem={activeParrillaCombo}
        meatCount={activeParrillaMeatCount}
        onAddCombo={handleAddCombo}
    />

    <TicketVirtualModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onConfirm={handleConfirmOrder}
        orderItems={pendingOrderItems}
        tableNumber={tableNumber}
    />
    </>
);
};

export default WaiterDashboard;
