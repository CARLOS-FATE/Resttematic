import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
     trim: true,
    match: [/.+\@.+\..+/, 'Por favor, introduce un correo válido.']
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['dueno', 'administrador', 'mesero', 'caja', 'cocinero'],
  },
  name: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('User', userSchema);