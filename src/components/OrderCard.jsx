//Ordercard.jsx

import React from 'react';

const OrderCard = ({ order, onGenerateReceipt }) => {
    const cardBgColor = order.esPagado ? 'bg-white' : 'bg-blue-50';
    const statusTextColor = order.esPagado ? 'text-green-600' : 'text-blue-600';
    const statusBgColor = order.esPagado ? 'bg-green-100' : 'bg-blue-100';


  
  return (
        <div className={`rounded-lg shadow-md transition-shadow hover:shadow-xl ${cardBgColor}`}>
            <div className={`p-4 border-b border-gray-200 flex justify-between items-center`}>
                <h3 className="text-xl font-bold text-gray-800">Mesa {order.numeroMesa}</h3>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusBgColor} ${statusTextColor}`}>
                    {order.esPagado ? `Pagado (${order.metodoPago || 'N/A'})` : 'Listo para Pagar'}
                </span>
            </div>
            
            <div className="p-4">
                <ul className="space-y-1 text-gray-600 mb-4">
                    {order.items.map(item => (
                        <li key={item.menuItemId || item._id} className="flex justify-between">
                            <span>{item.cantidad}x {item.nombre}</span>
                            <span>S/ {(item.cantidad * item.precioUnitario).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <div className="border-t pt-2 mt-2 flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Total:</span>
                    <span className="text-2xl font-bold text-gray-900">S/ {order.total.toFixed(2)}</span>
                </div>
            </div>

            {/* --- LÓGICA MODIFICADA --- */}
            {order.esPagado && (
                <div className="p-4 bg-gray-50 rounded-b-lg">
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