//AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useAuth } from './AuthContext.client.jsx';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ConfirmationModal from '../components/ConfirmationModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = ({ userRole }) => {
    const auth = useAuth();
    const [dailySales, setDailySales] = useState({ totalOrders: 0,
        incomeFromOrders: 0,
        totalReservations: 0,
        incomeFromReservations: 0,
        totalIncome: 0 });
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'mesero' });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isUserSectionVisible, setIsUserSectionVisible] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [isMenuManagementVisible, setIsMenuManagementVisible] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState(null);
    const [newMenuItem, setNewMenuItem] = useState({ nombre: '', categoria: 'Desayuno', precio: '', inventory: '' });
    const [detailedSalesReport, setDetailedSalesReport] = useState([]);
    const [tables, setTables] = useState([]);
    const [isTableManagementVisible, setIsTableManagementVisible] = useState(false);
    const [newTable, setNewTable] = useState({ nombre: '', capacidad: 2, descripcion: '' });
    const [editingTable, setEditingTable] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [tableToDelete, setTableToDelete] = useState(null);
    const [isUserDeleteModalOpen, setIsUserDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [reservations, setReservations] = useState([]);
    
    // NUEVO: Estado para el modal de eliminación de platos
    const [isMenuItemDeleteModalOpen, setIsMenuItemDeleteModalOpen] = useState(false);
    const [menuItemToDelete, setMenuItemToDelete] = useState(null);


    useEffect(() => {
        if (auth?.token) {
            fetchDailySales();
            fetchMenuItems();
            fetchTables();
            fetchReservations();
            if (userRole === 'dueno' || userRole === 'administrador') {
                fetchUsers();
            }
        }
    }, [auth, userRole]);

    if (!auth || !auth.token) {
        return <p className="p-8 text-center text-gray-500">Cargando autenticación...</p>;
    }
    const { token, authHeader } = auth;

    const fetchDailySales = async () => {
        try {
            const response = await fetch(`/api/sales/daily`, { headers: authHeader() });
            if (!response.ok) throw new Error('Error al obtener ventas diarias.');
            const data = await response.json();
            setDailySales(data);
        } catch (err) { setError(err.message); }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`/api/users`, { headers: authHeader() });
            if (!response.ok) throw new Error('Error al obtener la lista de usuarios.');
            const data = await response.json();
            setUsers(data);
        } catch (err) { setError(err.message); }
    };

    const fetchSalesByDate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/sales/by-date?startDate=${startDate}&endDate=${endDate}`, { headers: authHeader() });
            if (!response.ok) throw new Error('Error al obtener ventas por fecha.');
            const data = await response.json();
            setDetailedSalesReport(data);
        } catch (err) { setError(err.message); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(form.password)) {
            setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un caracter especial.');
            return;
        }
        try {
            const response = await fetch(`/api/users`, {
                method: 'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!response.ok) throw new Error('Error al crear el usuario.');
            setSuccess('Usuario creado con éxito.');
            setForm({ name: '', email: '', password: '', role: 'mesero' });
            fetchUsers();
        } catch (err) { setError(err.message); }
    };

    const handleDeleteUser = (user) => {
        setUserToDelete(user);
        setIsUserDeleteModalOpen(true);
    };

    const confirmDeleteUser = async () => {
        setIsUserDeleteModalOpen(false);
        if (!userToDelete) return;

        try {
            const response = await fetch(`/api/users/${userToDelete._id}`, {
                method: 'DELETE',
                headers: authHeader(),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Error al eliminar el usuario.');
            }

            toast.success(`Usuario "${userToDelete.name}" eliminado.`);
            fetchUsers();

        } catch (error) {
            toast.error(error.message);
            console.error("Error detallado:", error);
        } finally {
            setUserToDelete(null);
        }
    };

    const cancelDeleteUser = () => {
        setIsUserDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const handleUpdate = async (idToUpdate) => {
        const newPassword = prompt('Ingresa la nueva contraseña:');
        if (newPassword && window.confirm('¿Seguro que quieres actualizar la contraseña?')) {
            try {
                const response = await fetch(`/api/users/${idToUpdate}`, {
                    method: 'PUT',
                    headers: { ...authHeader(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: newPassword }),
                });
                if (!response.ok) throw new Error('Error al actualizar la contraseña.');
                setSuccess('Contraseña actualizada con éxito.');
                fetchUsers();
            } catch (err) { setError(err.message); }
        }
    };

    const fetchMenuItems = async () => {
        try {
            const response = await fetch(`/api/menu`, { headers: authHeader() });
            if (!response.ok) throw new Error('Error al obtener los platos del menú.');
            const data = await response.json();
            setMenuItems(data);
        } catch (err) { setError(err.message); }
    };

    const handleGenerateReport = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`/api/sales/daily-range?startDate=${startDate}&endDate=${endDate}`, { headers: authHeader() });
            if (!response.ok) throw new Error('Error al obtener ventas por fecha.');
            const data = await response.json();
            setDetailedSalesReport(data);
        } catch (err) { setError(err.message); }
    };

    const handleCreateMenuItem = async (e) => {
        e.preventDefault();
        const payload = {
            ...newMenuItem,
            precio: parseFloat(newMenuItem.precio),
            inventory: parseInt(newMenuItem.inventory, 10)
        };
        try {
            const response = await fetch(`/api/menu`, {
                method: 'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Error al crear el plato.');
            setSuccess('Plato creado con éxito.');
            setNewMenuItem({ nombre: '', categoria: 'Desayuno', precio: '', inventory: '' });
            fetchMenuItems();
        } catch (err) { setError(err.message); }
    };

    const handleUpdateMenuItem = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const payload = {
                ...newMenuItem,
                precio: parseFloat(newMenuItem.precio),
                inventory: parseInt(newMenuItem.inventory, 10)
            };

            const response = await fetch(`/api/menu/${editingMenuItem._id}`, {
                method: 'PUT',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Error al actualizar el plato.');

            setSuccess('Plato actualizado con éxito.');
            setNewMenuItem({ nombre: '', categoria: '', precio: '', inventory: '' });
            setEditingMenuItem(null);
            fetchMenuItems();
        } catch (err) {
            setError(err.message);
        }
    };
    
    // NUEVA LÓGICA: Eliminar plato con modal
    const handleDeleteMenuItem = (item) => {
        setMenuItemToDelete(item);
        setIsMenuItemDeleteModalOpen(true);
    };

    const confirmDeleteMenuItem = async () => {
        setIsMenuItemDeleteModalOpen(false);
        if (!menuItemToDelete) return;

        try {
            const response = await fetch(`/api/menu/${menuItemToDelete._id}`, {
                method: 'DELETE',
                headers: authHeader(),
            });
            if (!response.ok) throw new Error('Error al eliminar el plato.');
            toast.success(`Plato "${menuItemToDelete.nombre}" eliminado con éxito.`);
            fetchMenuItems();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setMenuItemToDelete(null);
        }
    };
    const cancelDeleteMenuItem = () => {
        setIsMenuItemDeleteModalOpen(false);
        setMenuItemToDelete(null);
    };


    const handleEditClick = (menuItem) => {
        setEditingMenuItem(menuItem);
        setNewMenuItem(menuItem);
    };

    const cancelEdit = () => {
        setEditingMenuItem(null);
        setNewMenuItem({ nombre: '', categoria: '', precio: '', inventory: '' });
    };

    const handleExport = () => {
        if (startDate && endDate) {
            const url = `/api/sales/export?startDate=${startDate}&endDate=${endDate}`;
            const token = localStorage.getItem('token');

            fetch(url, { headers: { 'x-auth-token': token } })
                .then(res => res.blob())
                .then(blob => {
                    const href = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = href;
                    link.setAttribute('download', `reporte_ventas_${startDate}_a_${endDate}.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                })
                .catch(() => setError("Error al descargar el archivo."));
        } else {
            setError("Por favor, genera un reporte primero.");
        }
    };
    const chartData = {
        labels: detailedSalesReport.map(item => new Date(item._id).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })),
        datasets: [{
            label: 'Ingresos por Día (S/)',
            data: detailedSalesReport.map(item => item.totalIncome),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }]
    };
    const totalIncomeOfPeriod = detailedSalesReport.reduce((sum, item) => sum + item.totalIncome, 0);

    const fetchTables = async () => {
        try {
            const response = await fetch(`/api/tables`, { headers: auth.authHeader() });
            if (!response.ok) throw new Error('Error al obtener las mesas.');
            const data = await response.json();
            setTables(data);
        } catch (err) { setError(err.message); }
    };

    const handleCreateTable = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/tables`, {
                method: 'POST',
                headers: { ...auth.authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(newTable),
            });
            if (!response.ok) throw new Error('Error al crear la mesa.');
            setSuccess('Mesa creada con éxito.');
            setNewTable({ nombre: '', capacidad: 2 });
            fetchTables();
        } catch (err) { setError(err.message); }
    };

    const handleUpdateTable = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/tables/${editingTable._id}`, {
                method: 'PUT',
                headers: { ...auth.authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(newTable),
            });
            if (!response.ok) throw new Error('Error al actualizar la mesa.');
            setSuccess('Mesa actualizada con éxito.');
            setNewTable({ nombre: '', capacidad: 2 });
            setEditingTable(null);
            fetchTables();
        } catch (err) { setError(err.message); }
    };

    const confirmDeleteTable = async () => {
        setIsDeleteModalOpen(false);
        if (!tableToDelete) return;

        try {
            const response = await fetch(`/api/tables/${tableToDelete}`, {
                method: 'DELETE',
                headers: authHeader(),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Error al eliminar la mesa.');
            }

            fetchTables();
            toast.success('Mesa eliminada correctamente!');

        } catch (error) {
            console.error('Error al eliminar mesa:', error);
            toast.error(error.message);
        } finally {
            setTableToDelete(null);
        }
    };

    const handleDeleteTable = (id) => {
        setTableToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const startEditTable = (table) => {
        setEditingTable(table);
        setNewTable({ nombre: table.nombre, capacidad: table.capacidad, descripcion: table.descripcion || '' });
    };

    const fetchReservations = async () => {
        try {
            const response = await fetch(`/api/reservations/all-active`, { headers: authHeader() });
            if (!response.ok) throw new Error('Error al obtener las reservas.');
            const data = await response.json();
            setReservations(data);
        } catch (err) {
            console.error(err.message);
        }
    };

    const cancelEditTable = () => {
        setEditingTable(null);
        setNewTable({ nombre: '', capacidad: 2, descripcion: '' });
    };

    const cancelDeleteTable = () => {
        setIsDeleteModalOpen(false);
        setTableToDelete(null);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-6 text-center">Panel de {userRole === 'dueno' ? 'Dueno' : 'Administrador'}</h1>

            {error && <p className="bg-red-100 text-red-700 p-2 rounded-md mb-4 text-center">{error}</p>}
            {success && <p className="bg-green-100 text-green-700 p-2 rounded-md mb-4 text-center">{success}</p>}

            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold mb-4">Resumen del Día</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-100 p-4 rounded-md">
                        <p className="text-gray-600">Pedidos Pagados</p>
                        <p className="text-4xl font-bold">{dailySales.totalOrders}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-md">
                        <p className="text-gray-600">Ingresos por Pedidos</p>
                        <p className="text-2xl font-bold text-blue-600">S/ {dailySales.incomeFromOrders.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-md">
                        <p className="text-gray-600">Ingresos por Reservas</p>
                        <p className="text-2xl font-bold text-green-600">S/ {dailySales.incomeFromReservations.toFixed(2)}</p>
                    </div>
                </div>
                <div className="mt-4 bg-gray-200 p-4 rounded-md text-center">
                    <p className="text-gray-700 font-bold text-xl">Ingreso Total del Día</p>
                    <p className="text-5xl font-bold text-gray-900">S/ {dailySales.totalIncome.toFixed(2)}</p>
                </div>
            </section>

            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold mb-4">Reporte de Ventas por Fecha</h2>
                <form onSubmit={handleGenerateReport} className="mb-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded" required />
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded" required />
                        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Generar Reporte</button>

                        {detailedSalesReport.length > 0 && (
                            <button type="button" onClick={handleExport} className="bg-green-600 text-white p-2 rounded hover:bg-green-700">
                                Exportar a Excel
                            </button>
                        )}
                    </div>
                </form>
                {detailedSalesReport.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-xl font-medium mb-2">Resumen del Período</h3>
                        <p>Ingresos Totales: <span className="font-bold text-green-600">S/ {totalIncomeOfPeriod.toFixed(2)}</span></p>
                        <div className="w-full mt-4" style={{ height: '400px' }}>
                            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </div>
                )}
            </section>

            <section className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Gestión de Usuarios</h2>
                    <button
                        onClick={() => setIsUserSectionVisible(!isUserSectionVisible)}
                        className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 font-medium"
                    >
                        {isUserSectionVisible ? 'Ocultar' : 'Mostrar'}
                    </button>
                </div>

                {isUserSectionVisible && (
                    <>
                        <div className="mb-8">
                            <h3 className="text-xl font-medium mb-2">Crear Nuevo Usuario</h3>
                            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Nombre"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="p-2 border rounded"
                                    required
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Correo Electrónico"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="p-2 border rounded"
                                    required
                                />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Contraseña"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="p-2 border rounded"
                                    required
                                />
                                <select
                                    name="role"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="p-2 border rounded"
                                >
                                    <option value="mesero">Mesero</option>
                                    <option value="caja">Cajero</option>
                                    <option value="cocinero">Cocinero</option>
                                    {userRole === 'dueno' && <option value="administrador">Administrador</option>}
                                </select>

                                <button type="submit" className="col-span-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Crear Usuario</button>
                            </form>
                        </div>

                        <div>
                            <h3 className="text-xl font-medium mb-2">Usuarios Existentes</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-200 text-gray-700">
                                            <th className="p-2 text-left">Nombre</th>
                                            <th className="p-2 text-left">Correo</th>
                                            <th className="p-2 text-left">Rol</th>
                                            <th className="p-2 text-left">Cambiar contraseña</th>
                                            <th className="p-2 text-left">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user._id} className="border-b">
                                                <td className="p-2">{user.name}</td>
                                                <td className="p-2">{user.email}</td>
                                                <td className="p-2 capitalize">{user.role}</td>
                                                <td className="p-2">
                                                    {user.role !== 'dueno' && (
                                                        <button
                                                            onClick={() => handleUpdate(user._id)}
                                                            className="text-yellow-600 hover:text-yellow-800 transition-colors">
                                                            Actualizar
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="p-2 ">
                                                    {user.role !== 'dueno' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="text-red-500 hover:text-red-700 transition-colors"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </section>
            
            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Gestión de Menú</h2>
                    <button
                        onClick={() => setIsMenuManagementVisible(!isMenuManagementVisible)}
                        className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 font-medium"
                    >
                        {isMenuManagementVisible ? 'Ocultar' : 'Mostrar'}
                    </button>
                </div>

                {isMenuManagementVisible && (
                    <>
                        <div className="mb-8">
                            <h3 className="text-xl font-medium mb-2">{editingMenuItem ? 'Editando Plato' : 'Agregar Nuevo Plato'}</h3>
                            <form onSubmit={editingMenuItem ? handleUpdateMenuItem : handleCreateMenuItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <input
                                    type="text"
                                    placeholder="Nombre del Plato"
                                    value={newMenuItem.nombre}
                                    onChange={(e) => setNewMenuItem({ ...newMenuItem, nombre: e.target.value })}
                                    className="p-2 border rounded" required
                                />
                                <select
                                    value={newMenuItem.categoria}
                                    onChange={(e) => setNewMenuItem({ ...newMenuItem, categoria: e.target.value })}
                                    className="p-2 border rounded" required
                                >
                                    <option value="Desayuno">Desayuno</option>
                                    <option value="Almuerzo">Almuerzo</option>
                                    <option value="Cena">Cena</option>
                                    <option value="Postres">Postres</option>
                                    <option value="Bebidas">Bebidas</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Precio"
                                    value={newMenuItem.precio}
                                    onChange={(e) => setNewMenuItem({ ...newMenuItem, precio: e.target.value })}
                                    className="p-2 border rounded" required
                                />
                                <input
                                    type="number"
                                    placeholder="Inventario"
                                    value={newMenuItem.inventory}
                                    onChange={(e) => setNewMenuItem({ ...newMenuItem, inventory: e.target.value })}
                                    className="p-2 border rounded" required
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                                        {editingMenuItem ? 'Actualizar' : 'Guardar'}
                                    </button>
                                    {editingMenuItem && (
                                        <button type="button" onClick={cancelEdit} className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div>
                            <h3 className="text-xl font-medium mb-2">Menú Actual</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-200 text-gray-700">
                                            <th className="p-2 text-left">Nombre</th>
                                            <th className="p-2 text-left">Categoría</th>
                                            <th className="p-2 text-left">Precio</th>
                                            <th className="p-2 text-left">Inventario</th>
                                            <th className="p-2 text-left">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {menuItems.map(item => (
                                            <tr key={item._id} className="border-b">
                                                <td className="p-2">{item.nombre}</td>
                                                <td className="p-2">{item.categoria}</td>
                                                <td className="p-2">S/. {Number(item.precio).toFixed(2)}</td>
                                                <td className="p-2">{item.inventory}</td>
                                                <td className="p-2 space-x-2">
                                                    <button onClick={() => handleEditClick(item)} className="text-yellow-600 hover:text-yellow-800">Editar</button>
                                                    <button onClick={() => handleDeleteMenuItem(item)} className="text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </section>
            
            <section className="bg-white p-6 rounded-lg shadow-md mb-8 text-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold font-serif">Gestión de Salón</h2>
                    <button
                        onClick={() => setIsTableManagementVisible(!isTableManagementVisible)}
                        className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 font-medium transition"
                    >
                        {isTableManagementVisible ? 'Cerrar Gestión' : 'Gestionar Mesas'}
                    </button>
                </div>

                {isTableManagementVisible && (
                    <div className="border-t pt-6">
                        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-xl font-medium mb-4 font-serif">{editingTable ? `Editando: ${editingTable.nombre}` : 'Agregar Nueva Mesa'}</h3>
                            <form onSubmit={editingTable ? handleUpdateTable : handleCreateTable} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label htmlFor="tableName" className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
                                    <input id="tableName" type="text" placeholder="Ej: Mesa 5" value={newTable.nombre}
                                        onChange={(e) => setNewTable({ ...newTable, nombre: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" required
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label htmlFor="tableCapacity" className="block text-sm font-medium text-gray-600 mb-1">Capacidad</label>
                                    <input id="tableCapacity" type="number" placeholder="Ej: 4" value={newTable.capacidad} min="1"
                                        onChange={(e) => setNewTable({ ...newTable, capacidad: parseInt(e.target.value) || 1 })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="tableDescription" className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
                                    <input id="tableDescription" type="text" placeholder="Ej: Junto a la ventana" value={newTable.descripcion}
                                        onChange={(e) => setNewTable({ ...newTable, descripcion: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                                    {editingTable && (
                                        <button type="button" onClick={cancelEditTable} className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition">
                                            Cancelar
                                        </button>
                                    )}
                                    <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
                                        {editingTable ? 'Actualizar Mesa' : 'Guardar Mesa'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium mb-4 font-serif">Mesas Actuales</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {tables.map(table => (
                                    <div key={table._id} className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-lg transition">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-bold text-lg">{table.nombre}</h4>
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${table.estado === 'disponible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {table.estado}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2 h-10">{table.descripcion || 'Sin descripción.'}</p>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0110 14a5 5 0 01-1.57-4.33A6.97 6.97 0 007 16c0 .34.024.673.07 1h5.86z"/></svg>
                                                <span>Capacidad: {table.capacidad}</span>
                                            </div>
                                        </div>
                                        <div className="border-t mt-4 pt-4 flex justify-end space-x-2">
                                            <button onClick={() => startEditTable(table)} className="text-sm font-medium text-yellow-600 hover:text-yellow-800">Editar</button>
                                            <button onClick={() => handleDeleteTable(table._id)} className="text-sm font-medium text-red-500 hover:text-red-700">Eliminar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </section>
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                message="¿Estás seguro de que quieres eliminar esta mesa? Esta acción no se puede deshacer."
                onConfirm={confirmDeleteTable}
                onCancel={cancelDeleteTable}
            />

            <ConfirmationModal
                isOpen={isUserDeleteModalOpen}
                message={`¿Estás seguro de que quieres eliminar al usuario "${userToDelete?.name}"? Esta acción no se puede deshacer.`}
                onConfirm={confirmDeleteUser}
                onCancel={cancelDeleteUser}
            />

            <ConfirmationModal
                isOpen={isMenuItemDeleteModalOpen}
                message={`¿Estás seguro de que quieres eliminar el plato "${menuItemToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                onConfirm={confirmDeleteMenuItem}
                onCancel={cancelDeleteMenuItem}
            />

            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default AdminDashboard;