// models/Table.js
import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true,
        unique: true // <-- SUGERENCIA 1
    },
    capacidad: { 
        type: Number, 
        required: true,
        min: 1 // <-- SUGERENCIA 2
    },
    estado: {
        type: String,
        enum: ['disponible', 'ocupada'],
        default: 'disponible'
    },
    descripcion: { type: String, default: '' }
});

const Table = mongoose.model('Table', tableSchema);
export default Table;