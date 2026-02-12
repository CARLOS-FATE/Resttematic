//Ordercard.jsx

import React from 'react';

const OrderCard = ({ order, onGenerateReceipt }) => {
    const cardBgColor = order.esPagado ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20';
    const statusTextColor = order.esPagado ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400';
    const statusBgColor = order.esPagado ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900';



    return (
        <div className={`rounded-lg shadow-md transition-shadow hover:shadow-xl ${cardBgColor} dark:border dark:border-gray-700 transition-colors duration-300`}>
            <div className={`p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center`}>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Mesa {order.numeroMesa}</h3>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusBgColor} ${statusTextColor}`}>
                    {order.esPagado ? `Pagado (${order.metodoPago || 'N/A'})` : 'Listo para Pagar'}
                </span>
            </div>

            <div className="p-4">
                <ul className="space-y-1 text-gray-600 dark:text-gray-300 mb-4">
                    {order.items.map(item => (
                        <li key={item.menuItemId || item._id} className="flex justify-between">
                            <span>{item.cantidad}x {item.nombre}</span>
                            <span>S/ {(item.cantidad * item.precioUnitario).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total:</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">S/ {order.total.toFixed(2)}</span>
                </div>
            </div>

            {/* --- LÓGICA MODIFICADA --- */}
            {order.esPagado && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg transition-colors duration-300">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => onGenerateReceipt(order, 'boleta')}
                            className="w-full bg-teal-500 text-white p-2 rounded-md hover:bg-teal-600 font-semibold transition"
                        >
                            Generar Boleta
                        </button>
                        <button
                            onClick={() => onGenerateReceipt(order, 'recibo')}
                            className="w-full bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 font-semibold transition"
                        >
                            Generar Recibo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderCard;