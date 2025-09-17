//Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    // --- CORRECCIÓN 1: Añadimos la referencia al ID de la mesa ---
    mesaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table', // Referencia directa al modelo Table
        required: true,
    },
    // --- CORRECCIÓN 2: Cambiamos el tipo a String ---
    numeroMesa: {
        type: String, // Debe ser String para aceptar nombres como "Mesa 1" o "Terraza"
        required: true,
    },
    meseroId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [{
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true,
        },
        nombre: {
            type: String,
            required: true,
        },
        cantidad: {
            type: Number,
            required: true,
        },
        precioUnitario: {
            type: Number,
            required: true,
        },
    }],
    estado: {
        type: String,
        enum: ['pendiente', 'en preparacion', 'listo para pagar', 'completado'],
        default: 'pendiente',
    },
    total: {
        type: Number,
        required: true,
    },
    esPagado: {
        type: Boolean,
        default: false,
    },
    metodoPago: {
    type: String,
    enum: ['efectivo', 'yape', 'plin', 'tarjeta', 'otro'],
    default: 'efectivo'
    } ,
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;