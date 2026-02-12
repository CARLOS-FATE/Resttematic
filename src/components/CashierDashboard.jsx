// CashierDashboard
import React, { useState, useEffect, useCallback } from 'react';
import OrderCard from './OrderCard';
import ReceiptModal from './ReceiptModal';
import { useAuth } from './AuthContext.client.jsx';


// Este componente encapsula el selector de método de pago y el botón de "Marcar como Pagado"
const PaymentForm = ({ orderId, onMarkAsPaid, setError }) => {
    const [paymentMethod, setPaymentMethod] = useState('efectivo');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(''); // Limpiamos errores previos al intentar pagar
        if (!paymentMethod) {
            setError("Por favor, selecciona un método de pago.");
            return;
        }
        onMarkAsPaid(orderId, paymentMethod);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg border-t border-gray-200 dark:border-gray-600 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <label htmlFor={`payment-method-${orderId}`} className="sr-only">Método de Pago</label>
                <select
                    id={`payment-method-${orderId}`}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full sm:w-auto flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700 dark:text-white bg-white dark:bg-gray-600 transition-colors duration-300"
                >
                    <option value="efectivo">Efectivo</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                </select>
                <button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-semibold transition duration-200 ease-in-out shadow-md"
                >
                    Marcar como Pagado
                </button>
            </div>
        </form>
    );
};
const CashierDashboard = () => {
    const auth = useAuth();
    const [view, setView] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [documentType, setDocumentType] = useState('recibo');
    const [selectedReservation, setSelectedReservation] = useState(null); // para el modal de pago
    const [paymentDetails, setPaymentDetails] = useState({ montoPagado: '', comprobantePago: '', notasCajero: '' });


    if (!auth) {
        return <p className="p-8 text-center text-gray-500">Inicializando...</p>;
    }

    const { token, authHeader } = auth;

    const fetchOrders = useCallback(async () => {
        if (token) {
            try {
                const response = await fetch(`/api/orders/all`, { headers: authHeader() });
                if (!response.ok) throw new Error('No se pudieron cargar los pedidos.');
                const data = await response.json();
                setOrders(data.sort((a, b) => {
                    // Mueve los pedidos pagados al final de la lista
                    if (a.esPagado && !b.esPagado) return 1;
                    if (!a.esPagado && b.esPagado) return -1;
                    return 0; // Mantener el orden original si ambos están pagados o no pagados
                }));
            } catch (err) {
                setError("Error al cargar los pedidos. Asegúrate de que el backend está funcionando.");
            }
        }
    }, [token, authHeader]);

    const fetchPendingReservations = useCallback(async () => {
        if (token) {
            try {
                const response = await fetch(`/api/reservations/pending-payment`, { headers: authHeader() });
                if (!response.ok) throw new Error('No se pudieron cargar las reservas.');
                const data = await response.json();
                setReservations(data); // Ahora sí se guardan en su estado
            } catch (err) {
                setError("Error al cargar las reservas.");
            }
        }
    }, [token, authHeader]);

    useEffect(() => {
        if (token) {
            fetchOrders();
            fetchPendingReservations();
            const interval = setInterval(() => {
                fetchOrders();
                fetchPendingReservations();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [token, fetchOrders, fetchPendingReservations]);

    const markAsPaid = async (orderId, paymentMethod) => {
        setError(''); // Limpiamos errores previos
        try {
            const response = await fetch(`/api/orders/${orderId}/paid`, {
                method: 'PUT',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    esPagado: true,
                    metodoPago: paymentMethod // <-- ¡Ahora sí enviamos el método de pago!
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'No se pudo actualizar el pedido.');
            }
            fetchOrders(); // Refrescamos la lista de pedidos para reflejar el cambio
        } catch (err) {
            setError(err.message);
        }
    };
    const handleConfirmReservationPayment = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`/api/reservations/${selectedReservation._id}/confirm-payment-with-details`, {
                method: 'PUT',
                headers: { ...auth.authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    montoPagado: parseFloat(paymentDetails.montoPagado), // Aseguramos que sea un número
                    comprobantePago: paymentDetails.comprobantePago,
                    notasCajero: paymentDetails.notasCajero
                })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'No se pudo confirmar el pago.');
            }

            fetchPendingReservations(); // Refresca la lista de reservas pendientes
            setSelectedReservation(null); // Cierra el modal
        } catch (err) { setError(err.message); }
    };

    const handleShowReceipt = (order, type) => {
        setSelectedOrder(order);
        setDocumentType(type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const pendingOrders = orders.filter(order => order.estado === 'listo para pagar' && !order.esPagado);

    // Pedidos pagados son todos los que tienen la marca esPagado = true.
    const paidOrders = orders.filter(order => order.esPagado);
    return (
        <>
            <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
                <div className="container mx-auto p-4 md:p-6">
                    <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-gray-800 dark:text-white">Panel de Caja</h1>

                    <div className="mb-6 flex justify-center border-b-2 dark:border-gray-700">
                        <button onClick={() => setView('orders')} className={`py-2 px-6 font-semibold ${view === 'orders' ? 'border-b-4 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            Pedidos del Día
                        </button>
                        <button onClick={() => setView('reservations')} className={`py-2 px-6 font-semibold ${view === 'reservations' ? 'border-b-4 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            Reservas Pendientes
                        </button>
                    </div>
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}

                    {view === 'orders' && (
                        <>
                            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Pedidos Pendientes de Pago</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                {/* Usamos la variable correcta 'pendingOrders' */}
                                {pendingOrders.length > 0 ? (
                                    pendingOrders.map(order => (
                                        <div key={order._id} className="rounded-lg shadow-md bg-blue-50 dark:bg-blue-900/20 transition-shadow hover:shadow-xl dark:border dark:border-blue-800">
                                            <OrderCard order={order} onGenerateReceipt={handleShowReceipt} />
                                            <PaymentForm
                                                orderId={order._id}
                                                onMarkAsPaid={markAsPaid}
                                                setError={setError}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="col-span-full ...">No hay pedidos listos para cobrar.</p>
                                )}
                            </div>

                            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200 mt-8 border-t dark:border-gray-700 pt-8">Pedidos Ya Pagados</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {paidOrders.length > 0 ? (
                                    paidOrders.map(order => (
                                        <div key={order._id} className="rounded-lg shadow-md bg-white dark:bg-gray-800 transition-shadow hover:shadow-xl">
                                            <OrderCard order={order} onGenerateReceipt={handleShowReceipt} />
                                        </div>
                                    ))
                                ) : (
                                    <p className="col-span-full ...">No hay pedidos pagados aún.</p>
                                )}
                            </div>
                        </>
                    )}

                    {view === 'reservations' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {reservations.length > 0 ? (
                                reservations.map(res => (
                                    <div key={res._id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-gray-800 dark:text-white flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-xl mb-2">{res.nombreCliente}</h3>
                                            <p><strong>Fecha:</strong> {new Date(res.fecha).toLocaleDateString('es-PE', { timeZone: 'UTC' })}</p>
                                            <p><strong>Hora:</strong> {res.hora}</p>
                                            <p><strong>Personas:</strong> {res.numeroPersonas}</p>
                                            <p className="mt-2 text-red-600 dark:text-red-400 font-semibold">Estado: Pendiente de Pago</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedReservation(res);
                                                setPaymentDetails({ montoPagado: '', comprobantePago: '', notasCajero: '' }); // Resetea el formulario
                                            }}
                                            className="mt-4 w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
                                        >
                                            Registrar  Pago
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="col-span-full text-center text-gray-500 mt-8">No hay reservas pendientes de pago.</p>
                            )}
                        </div>
                    )}
                    {selectedReservation && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-gray-800 dark:text-white w-full max-w-md transition-colors duration-300">
                                <h3 className="text-2xl font-bold mb-4">Confirmar Pago de Reserva</h3>
                                <p className="mb-4">Para: <strong>{selectedReservation.nombreCliente}</strong></p>
                                <form onSubmit={handleConfirmReservationPayment} className="space-y-4">
                                    <input type="number" placeholder="Monto Pagado (S/)" onChange={e => setPaymentDetails({ ...paymentDetails, montoPagado: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                                    <input type="text" placeholder="ID de Transacción / Comprobante" onChange={e => setPaymentDetails({ ...paymentDetails, comprobantePago: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                                    <textarea placeholder="Notas adicionales..." onChange={e => setPaymentDetails({ ...paymentDetails, notasCajero: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
                                    <div className="flex justify-end gap-4">
                                        <button type="button" onClick={() => setSelectedReservation(null)} className="bg-gray-300 dark:bg-gray-600 py-2 px-4 rounded text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500">Cancelar</button>
                                        <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">Confirmar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Renderizamos el Modal solo si está abierto */}
            {isModalOpen && (
                <ReceiptModal
                    order={selectedOrder}
                    documentType={documentType}
                    onClose={closeModal}
                />
            )}
        </>
    );
};

export default CashierDashboard;