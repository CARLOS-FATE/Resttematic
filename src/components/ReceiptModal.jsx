//ReceiptModal.jsx

import React from 'react';


const ReceiptModal = ({ order, documentType, onClose }) => {
  
  const restaurant = {
    name: 'Restaurante Vang Ghog',
    ruc: '20123456789',
    address: 'Sucre / plazuela Tauricuxi, Huamachuco, Perú',
  };

  
  const total = order.total;
  const subtotal = total / 1.18;
  const igv = total - subtotal;
  
  const isBoleta = documentType === 'boleta';
  const title = isBoleta ? 'BOLETA DE VENTA ELECTRÓNICA' : 'RECIBO DE CONSUMO';

  return (
    
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="receipt-container bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative">
        {/* Contenido del comprobante */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{restaurant.name}</h2>
          <p className="text-sm text-gray-600">{restaurant.address}</p>
          {isBoleta && <p className="text-sm text-gray-600">RUC: {restaurant.ruc}</p>}
        </div>
        
        <div className="border-y-2 border-dashed border-gray-300 py-4 mb-4">
          <h3 className="text-center font-bold text-lg mb-2">{title}</h3>
          <div className="flex justify-between text-sm text-gray-700">
            <span>Fecha: {new Date(order.createdAt).toLocaleDateString('es-PE')}</span>
            <span>Mesa: {order.numeroMesa}</span>
          </div>
        </div>
  
  
        {/* Detalle de items */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b">
              <th className="text-left font-semibold p-1">Cant.</th>
              <th className="text-left font-semibold p-1">Descripción</th>
              <th className="text-right font-semibold p-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.menuItemId}>
                <td className="p-1">{item.cantidad}</td>
                <td className="p-1">{item.nombre}</td>
                <td className="p-1 text-right">S/ {(item.cantidad * item.precioUnitario).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="border-t-2 border-dashed border-gray-300 pt-4 mt-4 text-sm">
          {isBoleta && (
            <>
              <div className="flex justify-between"><span>SUBTOTAL:</span><span>S/ {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>IGV (18%):</span><span>S/ {igv.toFixed(2)}</span></div>
            </>
          )}
          <div className="flex justify-between font-bold text-lg mt-2">
            <span>TOTAL:</span>
            <span>S/ {total.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">¡Gracias por su preferencia!</p>

        {/* Botones de acción (no se imprimen) */}
        <div className="no-print mt-8 flex justify-center gap-4">
          <button onClick={window.print} className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700 transition">Imprimir</button>
          <button onClick={onClose} className="bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded hover:bg-gray-400 transition">Cerrar</button>
        </div>
      </div>

      {/* Estilos para controlar la impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-container, .receipt-container * {
            visibility: visible;
          }
          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            box-shadow: none;
            border-radius: 0;
            margin: 0;
            padding: 10px;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptModal;