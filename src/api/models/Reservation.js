//Reservation.js

import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
    nombreCliente: {
        type: String,
        required: [true, 'El nombre del cliente es obligatorio.']
    },
    email: {
        type: String,
        required: [true, 'El correo electrónico es obligatorio.'],
        match: [/.+\@.+\..+/, 'Por favor, introduce un correo electrónico válido.']
    },
    telefono: {
        type: String,
        required: [true, 'El número de teléfono es obligatorio.']
    },
    fecha: {
        type: Date,
        required: [true, 'La fecha es obligatoria.']
    },
    hora: {
        type: String, // Guardamos la hora como texto (ej: "19:30")
        required: [true, 'La hora es obligatoria.']
    },
    numeroPersonas: {
        type: Number,
        required: [true, 'El número de personas es obligatorio.'],
        min: 1
    },
    mesaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: [true, 'La mesa es obligatoria.']
    },
    estadoPago: {
        type: String,
        enum: ['pendiente', 'confirmado', 'cancelado'],
        default: 'pendiente'
    },
     montoPagado: { type: Number, default: 0 },
    comprobantePago: { type: String, default: '' }, // Podría ser un ID de transacción o una URL a una imagen
    notasCajero: { type: String, default: '' }
}, {
    timestamps: true 
});

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;