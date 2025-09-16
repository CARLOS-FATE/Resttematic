import React from 'react';

const ConfirmationModal = ({ message, onConfirm, onCancel, isOpen }) => {
    if (!isOpen) return null; // No renderizar si no está abierto

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Fondo oscuro semi-transparente */}
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onCancel}></div>

            {/* Contenedor del modal */}
            <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto transform transition-all duration-300 ease-out scale-100 opacity-100">
                {/* Ícono de advertencia (opcional, pero mejora la UX) */}
                <div className="flex justify-center mb-4">
                    <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                
                {/* Mensaje */}
                <p className="text-center text-lg text-gray-800 mb-6 font-medium">{message}</p>
                
                {/* Botones de acción */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-semibold"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-semibold"
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;