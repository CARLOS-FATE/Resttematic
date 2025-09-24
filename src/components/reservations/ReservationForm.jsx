// src/components/reservations/ReservationForm.jsx
import React, { useState , useEffect} from 'react';

const ReservationForm = () => {
    const [formData, setFormData] = useState({
        nombreCliente: '',
        email: '',
        telefono: '',
        fecha: '',
        hora: '',
        numeroPersonas: 2,
        mesaId: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
     const [availableTables, setAvailableTables] = useState([]);


    useEffect(() => {
        const fetchAvailableTables = async () => {
            if (formData.fecha && formData.hora) {
                try {
                    const response = await fetch(`/api/tables/available?fecha=${formData.fecha}&hora=${formData.hora}`);
                    if (!response.ok) throw new Error('No se pudo verificar la disponibilidad de mesas.');
                    
                    const data = await response.json();
                    
                    setAvailableTables(data);
                } catch (err) {
                    console.error("Error al cargar mesas disponibles:", err.message);
                    setAvailableTables([]); 
                }
            } else {
                
                setAvailableTables([]);
            }
        };

        fetchAvailableTables();
    }, [formData.fecha, formData.hora]);

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.mesaId) {
        setError("Por favor, selecciona una mesa disponible.");
        return;
    }
    try {
        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const resData = await response.json();
        if (!response.ok) {
            throw new Error(resData.message || 'No se pudo crear la reserva. Inténtelo más tarde.');
        }
        
        setSuccess('¡Reserva creada con éxito! Nos pondremos en contacto para confirmar el pago.');
        setFormData({ nombreCliente: '', email: '', telefono: '', fecha: '', hora: '', numeroPersonas: 2, mesaId: '' });

    } catch (err) {
        // 3. El bloque 'catch' ahora recibirá y mostrará el mensaje de error detallado.
        setError(err.message);
    }
};
    
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const processedValue = type === 'range' ? parseInt(value, 10) : value;
        if (name === 'fecha' || name === 'hora') {
             setFormData({ ...formData, [name]: processedValue, mesaId: '' });
        } else {
             setFormData({ ...formData, [name]: processedValue });
        }
    };

    return (
        <div className="bg-[#122a51] p-8 rounded-lg shadow-xl">
            <h3 className="text-3xl font-bold text-yellow-300 mb-4">Haz tu Reservación</h3>
            <p className="mb-6 text-gray-300">Asegura tu mesa. Las reservas requieren un pequeño pago por adelantado.</p>
            
            {error && <p className="bg-red-200 text-red-800 p-3 rounded mb-4">{error}</p>}
            {success && <p className="bg-green-200 text-green-800 p-3 rounded mb-4">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="nombreCliente" placeholder="Nombre Completo" value={formData.nombreCliente} onChange={handleChange} className="w-full p-3 bg-blue-900 rounded border border-blue-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" required />
                <input type="email" name="email" placeholder="Correo Electrónico" value={formData.email} onChange={handleChange} className="w-full p-3 bg-blue-900 rounded border border-blue-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" required />
                <input type="tel" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} className="w-full p-3 bg-blue-900 rounded border border-blue-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" required />
                <div className="flex gap-4">
                    <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-1/2 p-3 bg-blue-900 rounded border border-blue-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" required />
                    <input type="time" name="hora" value={formData.hora} onChange={handleChange} className="w-1/2 p-3 bg-blue-900 rounded border border-blue-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" required />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="numeroPersonas" className="mb-2 text-gray-300">Número de Personas: {formData.numeroPersonas}</label>
                    <input type="range" id="numeroPersonas" name="numeroPersonas" min="1" max="12" value={formData.numeroPersonas} onChange={handleChange} className="w-full" />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="mesaId" className="mb-2 text-gray-300">Selecciona una Mesa</label>
                    <select 
                        name="mesaId" 
                        id="mesaId" 
                        value={formData.mesaId} 
                        onChange={handleChange}
                        className="w-full p-3 bg-blue-900 rounded border border-blue-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        required
                    >
                        <option value="">-- Ver mesas disponibles --</option>
                        {availableTables
                            .filter(table => table.capacidad >= formData.numeroPersonas)
                            .map(table => (
                                <option key={table._id} value={table._id}>
                                    {table.nombre} (Capacidad: {table.capacidad}) - {table.descripcion}
                                </option>
                            ))
                        }
                    </select>
                </div>
                <button type="submit" className="w-full bg-yellow-400 text-blue-900 font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-300 transition-colors duration-300">Confirmar Reserva</button>
            </form>
        </div>
    );
};

export default ReservationForm;