//[...catchall].js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import auth from './auth.js';
import { connectDB } from './mongoose.js';

// Importa los modelos
import MenuItem from './models/MenuItem.js';
import Order from './models/Order.js';
import User from './models/User.js';
import Reservation from './models/Reservation.js';
import Table from './models/Table.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ===========================================
// RUTAS DE LA APLICACIÓN
// ==========================================

// --- RUTAS PROTEGIDAS (Requieren token) ---

app.get('/api/menu', auth(['mesero', 'administrador', 'dueno', 'caja', 'cocinero']), async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.status(200).json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el menú.' });
    }
});

app.get('/api/tables', auth(['mesero', 'administrador', 'dueno']), async (req, res) => {
    try {
        const tables = await Table.find().sort({ nombre: 1 });
        res.status(200).json(tables);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las mesas.' });
    }
});

app.get('/api/orders/my-orders', auth(['mesero']), async (req, res) => {
    try {
        const orders = await Order.find({ meseroId: req.user.id });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los pedidos del mesero.' });
    }
});

app.get('/api/orders/all', auth(['cocinero', 'caja']), async (req, res) => {
    try {
        const orders = await Order.find();
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener todos los pedidos.' });
    }
});

// ===========================================
// RUTAS POST
// ===========================================


app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }
        const payload = { user: { id: user.id, role: user.role } };
        const secret = process.env.JWT_SECRET;
        jwt.sign(payload, secret, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, role: user.role, name: user.name } });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

app.post('/api/menu', auth(['dueno', 'administrador']), async (req, res) => {
    try {
        const newMenuItem = new MenuItem(req.body);
        const savedItem = await newMenuItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(400).json({ message: 'Error al crear el plato.', error: error.message });
    }
});

app.post('/api/reservations', async (req, res) => {
    try {
        const { nombreCliente, email, telefono, fecha, hora, numeroPersonas, mesaId } = req.body;
        
        if (!mesaId) {
            return res.status(400).json({ message: "Por favor, selecciona una mesa." });
        }

        const duracionReservaHoras = 2;
        const fechaInicio = new Date(`${fecha}T${hora}:00`);
        const fechaFin = new Date(fechaInicio.getTime() + duracionReservaHoras * 60 * 60 * 1000);

        const reservasConflictivas = await Reservation.find({
            mesaId: mesaId,
            estadoPago: { $in: ['pendiente', 'confirmado'] },
            fecha: {
                $gte: new Date(fecha).setHours(0, 0, 0, 0),
                $lt: new Date(fecha).setHours(23, 59, 59, 999)
            },
        });

        const haySolapamiento = reservasConflictivas.some(reservaExistente => {
            const inicioExistente = new Date(`${new Date(reservaExistente.fecha).toISOString().split('T')[0]}T${reservaExistente.hora}:00`);
            const finExistente = new Date(inicioExistente.getTime() + duracionReservaHoras * 60 * 60 * 1000);
            return fechaInicio < finExistente && fechaFin > inicioExistente;
        });

        if (haySolapamiento) {
            return res.status(400).json({ message: 'Lo sentimos, esta mesa ya está reservada para ese horario.' });
        }
        
        // Pasamos todos los campos del body al crear la nueva reserva
        const newReservation = new Reservation({
            nombreCliente,
            email,
            telefono,
            fecha,
            hora,
            numeroPersonas,
            mesaId
        });
        
        await newReservation.save();
        res.status(201).json({ message: 'Reserva creada con éxito.', reservation: newReservation });

    } catch (error) {
        res.status(400).json({ message: 'Error al procesar la reserva.', error: error.message });
    }
});

app.post('/api/orders', auth('mesero'), async (req, res) => {
    try {
        const { numeroMesa, items } = req.body;
        const meseroId = req.user.id;

        // --- CORRECCIÓN AQUÍ ---
        // La verificación de inventario debe estar DENTRO del bucle.
        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItemId);
            if (!menuItem || menuItem.inventory < item.cantidad) {
                return res.status(400).json({ 
                    message: `Inventario insuficiente para ${item.nombre}. Solo quedan ${menuItem ? menuItem.inventory : 0}.` 
                });
            }
        }
        
        const table = await Table.findOne({ nombre: numeroMesa });
        if (!table) return res.status(404).json({ message: 'La mesa seleccionada no existe.' });
        if (table.estado === 'ocupada') return res.status(400).json({ message: `La mesa "${numeroMesa}" ya está ocupada.` });

        table.estado = 'ocupada';
        await table.save();

        const total = items.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
        
        const newOrder = new Order({
            mesaId: table._id, 
            numeroMesa: table.nombre,
            meseroId, 
            items, 
            total, 
            estado: 'pendiente'
        });

        const savedOrder = await newOrder.save();
        for (const item of savedOrder.items) {
            await MenuItem.findByIdAndUpdate(item.menuItemId, { $inc: { inventory: -item.cantidad } });
        }
        
        res.status(201).json(savedOrder);
    } catch (error) {
        // Añadimos un console.log para ver errores inesperados en la terminal del backend
        console.error("Error detallado al crear pedido:", error); 
        res.status(400).json({ message: 'Error al crear el pedido.', error: error.message });
    }
});

// Endpoint de inicio de sesión


app.post('/api/tables', auth(['administrador', 'dueno']), async (req, res) => {
    try {
        const newTable = new Table(req.body);
        await newTable.save();
        res.status(201).json(newTable);
    } catch (error) {
        res.status(400).json({ message: 'Error al crear la mesa.', error: error.message });
    }
});

app.post('/api/users', auth(['dueno', 'administrador']), async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    
    const allowedRoles = ['administrador', 'mesero', 'caja', 'cocinero'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'El rol especificado no es válido.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({ email, password: hashedPassword, role, name });
    await newUser.save();
    
    const userWithoutPassword = newUser.toObject();
    delete userWithoutPassword.password;
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el usuario.', error: error.message });
  }
});

//End points -PUT

// ACTUALIZAR un plato existente por su ID
app.put('/api/menu/:id', auth(['dueno', 'administrador']), async (req, res) => {
  try {
    const updatedMenuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updatedMenuItem) {
      return res.status(404).json({ message: 'Plato no encontrado.' });
    }
    
    res.status(200).json(updatedMenuItem);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el plato.', error: error.message });
  }
});

// ACTUALIZAR el estado de una mesa (disponible/ocupada)
app.put('/api/tables/:id/status', auth(['mesero', 'administrador', 'dueno']), async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['disponible', 'ocupada'].includes(estado)) {
            return res.status(400).json({ message: 'Estado no válido.' });
        }
        const updatedTable = await Table.findByIdAndUpdate(req.params.id, { estado }, { new: true });
        if (!updatedTable) return res.status(404).json({ message: 'Mesa no encontrada.' });
        res.status(200).json(updatedTable);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el estado de la mesa.', error: error.message });
    }
});

app.put('/api/reservations/:id/cancel', auth(['administrador', 'dueno']), async (req, res) => {
    try {
        const updatedReservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            // En lugar de borrar, cambiamos el estado. Esto mantiene un historial.
            { estadoPago: 'cancelado' }, // O un nuevo campo 'estadoReserva'
            { new: true }
        );

        if (!updatedReservation) {
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }
        res.status(200).json({ message: 'Reserva cancelada con éxito.' });
    } catch (error) {
        res.status(400).json({ message: 'Error al cancelar la reserva.', error: error.message });
    }
});

// CONFIRMAR el pago de una reserva (para Caja/Admin)
app.put('/api/reservations/:id/confirm-payment', auth(['caja', 'administrador', 'dueno']), async (req, res) => {
    try {
        const updatedReservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { estadoPago: 'confirmado' },
            { new: true }
        );

        if (!updatedReservation) {
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }
        res.status(200).json({ message: 'Pago de la reserva confirmado.', reservation: updatedReservation });

    } catch (error) {
        res.status(400).json({ message: 'Error al confirmar el pago.', error: error.message });
    }
});

app.put('/api/reservations/:id/confirm-payment-with-details', auth(['caja', 'administrador', 'dueno']), async (req, res) => {
    try {
        const { montoPagado, comprobantePago, notasCajero } = req.body;
        
        const updatedReservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { 
                estadoPago: 'confirmado',
                montoPagado,
                comprobantePago,
                notasCajero
            },
            { new: true }
        );

        if (!updatedReservation) {
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }
        res.status(200).json({ message: 'Pago de la reserva confirmado con éxito.', reservation: updatedReservation });

    } catch (error) {
        res.status(400).json({ message: 'Error al confirmar el pago.', error: error.message });
    }
});

// Endpoint para actualizar un pedido por su ID
app.put('/api/orders/:id', auth('mesero'), async (req, res) => {
try {
    const originalOrder = await Order.findById(req.params.id);
    if (!originalOrder) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    const updatedData = req.body;

    // Si se están actualizando los items, ajustamos el inventario
    if (updatedData.items) {
      // Un mapa para calcular las diferencias de cantidad
      const inventoryChanges = new Map();

      // Restar las cantidades originales
      originalOrder.items.forEach(item => {
        inventoryChanges.set(item.menuItemId.toString(), (inventoryChanges.get(item.menuItemId.toString()) || 0) + item.cantidad);
      });

      // Sumar las nuevas cantidades
      updatedData.items.forEach(item => {
        inventoryChanges.set(item.menuItemId.toString(), (inventoryChanges.get(item.menuItemId.toString()) || 0) - item.cantidad);
      });

      // Aplicar los cambios al inventario y validar que haya stock suficiente
      for (const [menuItemId, qtyChange] of inventoryChanges.entries()) {
        if (qtyChange !== 0) {
          const menuItem = await MenuItem.findById(menuItemId);
          // Si la diferencia es negativa, significa que se están pidiendo más items
          if (qtyChange < 0 && menuItem.inventory < -qtyChange) {
            return res.status(400).json({ message: `Stock insuficiente para ${menuItem.nombre}.` });
          }
          await MenuItem.findByIdAndUpdate(menuItemId, { $inc: { inventory: qtyChange } });
        }
      }
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.status(200).json(updatedOrder);

  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el pedido.', error: error.message });
  }
});

// Endpoint para que el cocinero actualice el estado del pedido
app.put('/api/orders/:id/status', auth('cocinero'), async (req, res) => {
  try {
    const { estado } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { estado }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el estado del pedido.', error: error.message });
  }
});
// Endpoint para que el cajero marque un pedido como pagado

app.put('/api/orders/:id/paid', auth('caja'), async (req, res) => {
    try {
        // Ahora esperamos 'esPagado' y 'metodoPago'
        const { esPagado, metodoPago } = req.body;

        if (typeof esPagado !== 'boolean' || !metodoPago) {
            return res.status(400).json({ message: 'Datos incompletos. Se requiere estado de pago y método.' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        order.esPagado = esPagado;
        order.metodoPago = metodoPago;
        order.estado = 'completado'; // Guardamos el método de pago
        await order.save();

        // Liberamos la mesa asociada
        if (order.mesaId) {
            await Table.findByIdAndUpdate(order.mesaId, { estado: 'disponible' });
        }
        
        res.status(200).json(order);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el estado del pedido.', error: error.message });
    }
});

// Endpoint para actualizar un usuario por su ID
app.put('/api/users/:id', auth(['dueno', 'administrador']), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    let updateFields = { ...rest };
    
    // Si se envió una nueva contraseña, cifrarla antes de actualizar
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const userWithoutPassword = updatedUser.toObject();
    delete userWithoutPassword.password;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el usuario.', error: error.message });
  }
});

// ACTUALIZAR una mesa por su ID

app.put('/api/tables/:id', auth(['administrador', 'dueno']), async (req, res) => {
    try {
        const updatedTable = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTable) return res.status(404).json({ message: 'Mesa no encontrada.' });
        res.status(200).json(updatedTable);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar la mesa.', error: error.message });
    }
});

// ACTUALIZAR el estado de una mesa (disponible/ocupada)
app.put('/api/tables/:id/status', auth(['mesero', 'administrador', 'dueno']), async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['disponible', 'ocupada'].includes(estado)) {
            return res.status(400).json({ message: 'Estado no válido.' });
        }
        const updatedTable = await Table.findByIdAndUpdate(req.params.id, { estado }, { new: true });
        if (!updatedTable) return res.status(404).json({ message: 'Mesa no encontrada.' });
        res.status(200).json(updatedTable);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el estado de la mesa.', error: error.message });
    }
});

//End points -DELETED

// ELIMINAR un plato del menú por su ID
app.delete('/api/menu/:id', auth(['dueno', 'administrador']), async (req, res) => {
  try {
    const deletedMenuItem = await MenuItem.findByIdAndDelete(req.params.id);

    // Si no se encuentra el plato para eliminar, devolvemos 404
    if (!deletedMenuItem) {
      return res.status(404).json({ message: 'Plato no encontrado.' });
    }
    
    // Respondemos con un mensaje de éxito
    res.status(200).json({ message: 'Plato eliminado con éxito.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el plato.', error: error.message });
  }
});


// Función para poblar la base de datos con items de menú de prueba
const populateMenu = async () => {
    const count = await MenuItem.countDocuments();
    if (count === 0) {
        console.log('Poblando la base de datos con items de menú...');
        const items = [
            { nombre: 'Pizza Pepperoni', descripcion: 'Pizza con pepperoni', precio: 15.50, categoria: 'Entradas', inventory: 10 },
            { nombre: 'Jugo de Naranja', descripcion: 'Jugo natural de naranja', precio: 4.00, categoria: 'Bebidas', inventory: 5 },
            { nombre: 'Pastel de Chocolate', descripcion: 'Porción de pastel de chocolate', precio: 7.00, categoria: 'Postres', inventory: 8 },
            { nombre: 'Huevos Revueltos', descripcion: 'Huevos revueltos con tocino', precio: 8.50, categoria: 'Desayuno', inventory: 15 },
            { nombre: 'Sopa de Pollo', descripcion: 'Sopa de pollo con fideos', precio: 12.00, categoria: 'Almuerzo', inventory: 12 },
            { nombre: 'Lasagna', descripcion: 'Lasagna de carne con queso', precio: 18.00, categoria: 'Cena', inventory: 10 },
        ];
        await MenuItem.insertMany(items);
        console.log('Menú poblado exitosamente.');
    }
};

// Endpoint para eliminar un pedido por su ID
app.delete('/api/orders/:id', auth('mesero'), async (req, res) => {
 try {
    // Primero, encontramos el pedido que se va a eliminar
    const orderToDelete = await Order.findById(req.params.id);

    if (!orderToDelete) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    // Si el pedido no fue pagado, devolvemos el stock al inventario
    if (!orderToDelete.esPagado) {
      for (const item of orderToDelete.items) {
        await MenuItem.findByIdAndUpdate(item.menuItemId, {
          $inc: { inventory: +item.cantidad } // Usamos + para sumar la cantidad
        });
      }
    }
    
    // Ahora sí, eliminamos el pedido
    await Order.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Pedido eliminado y stock devuelto con éxito.' });

  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el pedido.', error: error.message });
  }
});

// Endpoint para eliminar un usuario
app.delete('/api/users/:id', auth(['dueno', 'administrador']), async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (userToDelete.role === 'dueno') return res.status(403).json({ message: 'El dueno no puede ser eliminado.' });
    if (userToDelete.role === 'administrador' && req.user.role !== 'dueno') {
      return res.status(403).json({ message: 'Solo el dueno puede eliminar a un administrador.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Usuario eliminado con éxito.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el usuario.', error: error.message });
  }
});

// ELIMINAR una mesa por su ID
app.delete('/api/tables/:id', auth(['administrador', 'dueno']), async (req, res) => {
    try {
        const tableId = req.params.id;
        const futureReservations = await Reservation.find({ 
            mesaId: tableId,
            fecha: { $gte: new Date() }
        });
        if (futureReservations.length > 0) {
            return res.status(400).json({ message: 'No se puede eliminar la mesa porque tiene reservas futuras asociadas.' });
        }
        const deletedTable = await Table.findByIdAndDelete(tableId);
        if (!deletedTable) return res.status(404).json({ message: 'Mesa no encontrada.' });
        res.status(200).json({ message: 'Mesa eliminada con éxito.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la mesa.', error: error.message });
    }
});



// Conectar a la base de datos y arrancar el servidor
export default async function handler(req, res) {
  await connectDB(); 
  return app(req, res);
}
