//[...catchall].js

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from './auth.js';
import ExcelJS from 'exceljs'; // Importa la librería al principio del archivo


// Importa los modelos que creaste
import MenuItem from './models/MenuItem.js';
import Order from './models/Order.js';
import User from './models/User.js';
import Reservation from './models/Reservation.js';
import Table from './models/Table.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configura CORS para permitir peticiones desde tu frontend
app.use(cors());
// Middleware para procesar JSON
app.use(express.json());

const DB_URI = process.env.MONGODB_URI;
if (!DB_URI) {
  console.error("MONGODB_URI no está definido. Asegúrate de configurarlo.");
  process.exit(1);
}
// Conectar a MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('¡Conexión a MongoDB exitosa!');
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error.message);
        process.exit(1);
    }
};

app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el menú.', error: error.message });
  }
});// CREAR un nuevo plato en el menú
app.post('/api/menu', auth(['dueño', 'administrador']), async (req, res) => {
  try {
    // Extraemos los datos del cuerpo de la petición
    const { nombre, descripcion, precio, categoria, inventory } = req.body;
    
    // Creamos una nueva instancia del modelo MenuItem
    const newMenuItem = new MenuItem({
      nombre,
      descripcion,
      precio,
      categoria,
      inventory
    });

    // Guardamos el nuevo plato en la base de datos
    const savedItem = await newMenuItem.save();
    
    // Respondemos con el plato creado y un estado 201 (Creado)
    res.status(201).json(savedItem);
  } catch (error) {
    // Si hay un error (ej. validación), respondemos con un error 400
    res.status(400).json({ message: 'Error al crear el plato.', error: error.message });
  }
});

// ACTUALIZAR un plato existente por su ID
app.put('/api/menu/:id', auth(['dueño', 'administrador']), async (req, res) => {
  try {
    // Usamos findByIdAndUpdate para encontrar y actualizar el plato en un solo paso
    // { new: true } hace que nos devuelva el documento ya actualizado
    const updatedMenuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Si no se encuentra el plato, devolvemos un error 404
    if (!updatedMenuItem) {
      return res.status(404).json({ message: 'Plato no encontrado.' });
    }
    
    // Respondemos con el plato actualizado
    res.status(200).json(updatedMenuItem);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el plato.', error: error.message });
  }
});

// ELIMINAR un plato del menú por su ID
app.delete('/api/menu/:id', auth(['dueño', 'administrador']), async (req, res) => {
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

// ▲▲▲ --- FIN DEL CÓDIGO NUEVO --- ▲▲▲
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

// =======================================================
//                    ENDPOINTS DE LA API
// =======================================================

// Endpoint para obtener todos los items del menú
// =======================================================
//                ENDPOINTS DE MESAS
// =======================================================

// OBTENER todas las mesas (para el mapa de mesas del mesero)
app.get('/api/tables', auth(['mesero', 'administrador', 'dueño']), async (req, res) => {
    try {
        const tables = await Table.find().sort({ nombre: 1 });
        res.status(200).json(tables);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las mesas.', error: error.message });
    }
});

// ACTUALIZAR el estado de una mesa (disponible/ocupada)
app.put('/api/tables/:id/status', auth(['mesero', 'administrador', 'dueño']), async (req, res) => {
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

// =======================================================
//                ENDPOINTS DE RESERVAS 
// =======================================================
// CREAR una nueva reserva (ruta pública)
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
        
        // --- CORRECCIÓN AQUÍ ---
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
app.put('/api/reservations/:id/cancel', auth(['administrador', 'dueño']), async (req, res) => {
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
// OBTENER todas las reservas con pago pendiente (para Caja/Admin)
app.get('/api/reservations/pending-payment', auth(['caja', 'administrador', 'dueño']), async (req, res) => {
    try {
        const pendingReservations = await Reservation.find({ estadoPago: 'pendiente' }).sort({ fecha: 1, hora: 1 });
        res.status(200).json(pendingReservations);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las reservas pendientes.', error: error.message });
    }
});

// OBTENER las reservas confirmadas para hoy (para Mesero)
app.get('/api/reservations/confirmed-for-today', auth(['mesero', 'administrador', 'dueño']), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const confirmedReservations = await Reservation.find({
            estadoPago: 'confirmado',
            fecha: { $gte: today, $lt: tomorrow }
        }).populate('mesaId').sort({ hora: 1 });

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).json(confirmedReservations);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las reservas confirmadas.', error: error.message });
    }
});

// CONFIRMAR el pago de una reserva (para Caja/Admin)
app.put('/api/reservations/:id/confirm-payment', auth(['caja', 'administrador', 'dueño']), async (req, res) => {
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

app.put('/api/reservations/:id/confirm-payment-with-details', auth(['caja', 'administrador', 'dueño']), async (req, res) => {
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
app.get('/api/reservations/all-active', auth(['administrador', 'dueño']), async (req, res) => {
    try {
        const activeReservations = await Reservation.find({ 
            estadoPago: { $in: ['pendiente', 'confirmado'] },
            fecha: { $gte: new Date().setHours(0,0,0,0) } // Solo de hoy en adelante
        }).sort({ fecha: 1, hora: 1 });
        res.status(200).json(activeReservations);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las reservas activas.', error: error.message });
    }
});
// Endpoint para crear un nuevo pedido
// En server.js, dentro de tus endpoints

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
app.get('/api/orders/my-orders', auth('mesero'), async (req, res) => {
  try {
    // Usamos req.user.id que viene del token, es más seguro
    const orders = await Order.find({ meseroId: req.user.id });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pedidos.', error: error.message });
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
// Endpoint para obtener TODOS los pedidos (para el cocinero)
app.get('/api/orders/all', auth(['cocinero', 'caja']), async (req, res) => {
  try {
    const orders = await Order.find();
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener todos los pedidos.', error: error.message });
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
// Endpoint para obtener el resumen de ventas del día
app.get('/api/sales/daily', auth(['dueño', 'administrador']), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const paidOrders = Order.find({ createdAt: { $gte: today }, esPagado: true });
        const confirmedReservations = Reservation.find({
            updatedAt: { $gte: today }, // Usamos updatedAt para saber cuándo se confirmó
            estadoPago: 'confirmado',
        });

        const [orders, reservations] = await Promise.all([paidOrders, confirmedReservations]);

        const incomeFromOrders = orders.reduce((sum, order) => sum + order.total, 0);
        const incomeFromReservations = reservations.reduce((sum, res) => sum + res.montoPagado, 0);

        res.status(200).json({ 
            totalOrders: orders.length, 
            incomeFromOrders,
            totalReservations: reservations.length,
            incomeFromReservations,
            totalIncome: incomeFromOrders + incomeFromReservations // Suma total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el resumen de ventas.', error: error.message });
    }
});

// Endpoint para obtener todos los usuarios (requiere autenticación de admin/dueño)
app.get('/api/users', auth(['dueño', 'administrador']), async (req, res) => {
  try {
    // En un futuro, aquí se agregará la lógica de autenticación
    const users = await User.find().select('-password'); // Excluir la contraseña por seguridad
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los usuarios.', error: error.message });
  }
});

// Change the POST /api/users endpoint
app.post('/api/users', auth(['dueño', 'administrador']), async (req, res) => {
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
// Endpoint para eliminar un usuario
app.delete('/api/users/:id', auth(['dueño', 'administrador']), async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (userToDelete.role === 'dueño') return res.status(403).json({ message: 'El dueño no puede ser eliminado.' });
    if (userToDelete.role === 'administrador' && req.user.role !== 'dueño') {
      return res.status(403).json({ message: 'Solo el dueño puede eliminar a un administrador.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Usuario eliminado con éxito.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el usuario.', error: error.message });
  }
});

// Endpoint para actualizar un usuario por su ID
app.put('/api/users/:id', auth(['dueño', 'administrador']), async (req, res) => {
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
// Endpoint de inicio de sesión
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas.' });
    }
    
    // 2. Comparar la contraseña ingresada con la contraseña cifrada
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas.' });
    }
    
    // 3. Crear y enviar un token JWT si la validación es exitosa
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };
    
    // Para este ejemplo, la clave secreta está aquí. En un proyecto real, estaría en una variable de entorno.
    const secret = process.env.JWT_SECRET;
    jwt.sign(payload, secret, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, role: user.role, name: user.name } });
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});
// Endpoint para obtener un resumen de ventas por fecha

app.get('/api/receipts/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }
    // Generate the receipt here
    const receipt = {
      orderId: order._id,
      total: order.total,
      items: order.items,
    };
    res.status(200).json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Error al generar el recibo.', error: error.message });
  }
});
// En tu server.js, junto a las otras rutas de ventas

app.get('/api/sales/daily-range', auth(['dueño', 'administrador']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Se requieren fechas de inicio y fin.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const salesByDay = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, esPagado: true } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalIncome: { $sum: '$total' },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json(salesByDay);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el reporte detallado.', error: error.message });
  }
});

// Endpoint para exportar las ventas a Excel
app.get('/api/sales/export', auth(['dueño', 'administrador']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Se requieren fechas.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      esPagado: true,
    }).sort({ createdAt: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ventas');

    // Definir columnas y sus encabezados
    worksheet.columns = [
      { header: 'Fecha', key: 'date', width: 25 },
      { header: 'Mesa', key: 'table', width: 10 },
      { header: 'Items', key: 'items', width: 60 },
      { header: 'Total (S/)', key: 'total', width: 15 },
    ];

    // Añadir una fila por cada pedido encontrado
    orders.forEach(order => {
      worksheet.addRow({
        date: new Date(order.createdAt).toLocaleString('es-PE'),
        table: order.numeroMesa,
        items: order.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', '),
        total: order.total,
      });
    });

    // Configurar la respuesta para que el navegador la trate como un archivo de descarga
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reporte_ventas_${startDate}_a_${endDate}.xlsx"`
    );
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    res.status(500).json({ message: 'Error al exportar a Excel.' });
  }
});

// =======================================================
//                ENDPOINTS DE MESAS 
// =======================================================

// OBTENER todas las mesas
app.get('/api/tables', auth(['mesero', 'administrador', 'dueño']), async (req, res) => {
    try {
        const tables = await Table.find().sort({ nombre: 1 });
        res.status(200).json(tables);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las mesas.', error: error.message });
    }
});

// CREAR una nueva mesa
app.post('/api/tables', auth(['administrador', 'dueño']), async (req, res) => {
    try {
        const { nombre, capacidad, descripcion } = req.body;
        const newTable = new Table({ nombre, capacidad, descripcion });
        await newTable.save();
        res.status(201).json(newTable);
    } catch (error) {
        res.status(400).json({ message: 'Error al crear la mesa.', error: error.message });
    }
});

// ACTUALIZAR una mesa por su ID
app.put('/api/tables/:id', auth(['administrador', 'dueño']), async (req, res) => {
    try {
        const updatedTable = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTable) return res.status(404).json({ message: 'Mesa no encontrada.' });
        res.status(200).json(updatedTable);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar la mesa.', error: error.message });
    }
});


// ACTUALIZAR el estado de una mesa (disponible/ocupada)
app.put('/api/tables/:id/status', auth(['mesero', 'administrador', 'dueño']), async (req, res) => {
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
// ELIMINAR una mesa por su ID
app.delete('/api/tables/:id', auth(['administrador', 'dueño']), async (req, res) => {
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

app.get('/api/tables/public', async (req, res) => {
    try {
        const tables = await Table.find().sort({ nombre: 1 });
        res.status(200).json(tables);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las mesas.', error: error.message });
    }
});
// Conectar a la base de datos y arrancar el servidor
export default async function handler(req, res) {
  await connectDB(); // Asegura que estemos conectados
  return app(req, res); // Luego, pasa la petición a tu app de Express
}
