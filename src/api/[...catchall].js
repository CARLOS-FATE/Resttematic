// Archivo: electrical-event/api/[...catchall].js (Versión Final, Completa y Corregida)

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
app.use(cors());
app.use(express.json());

// ===========================================
// RUTAS DE LOGIN Y USUARIOS
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
        jwt.sign(payload, secret, { expiresIn: '8h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, role: user.role, name: user.name } });
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Error del servidor en login.' });
    }
});

app.get('/api/users', auth(['dueno', 'administrador']), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios.' });
    }
});

app.post('/api/users', auth(['dueno', 'administrador']), async (req, res) => {
    try {
        const { email, password, role, name } = req.body;
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

app.put('/api/users/:id', auth(['dueno', 'administrador']), async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        let updateFields = { ...rest };
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateFields.password = await bcrypt.hash(password, salt);
        }
        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true }).select('-password');
        if (!updatedUser) return res.status(404).json({ message: 'Usuario no encontrado.' });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el usuario.' });
    }
});

app.delete('/api/users/:id', auth(['dueno', 'administrador']), async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) return res.status(404).json({ message: 'Usuario no encontrado.' });
        if (userToDelete.role === 'dueno') return res.status(403).json({ message: 'El dueño no puede ser eliminado.' });
        if (userToDelete.role === 'administrador' && req.user.role !== 'dueno') {
            return res.status(403).json({ message: 'Solo el dueño puede eliminar a un administrador.' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Usuario eliminado con éxito.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario.' });
    }
});

// ===========================================
// RUTAS DE MENÚ
// ===========================================

app.get('/api/menu', auth(['mesero', 'administrador', 'dueno', 'caja', 'cocinero']), async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.status(200).json(menuItems);
    } catch (error) { res.status(500).json({ message: 'Error al obtener el menú.' }); }
});

app.post('/api/menu', auth(['dueno', 'administrador']), async (req, res) => {
    try {
        const newMenuItem = new MenuItem(req.body);
        const savedItem = await newMenuItem.save();
        res.status(201).json(savedItem);
    } catch (error) { res.status(400).json({ message: 'Error al crear el plato.', error: error.message }); }
});

app.put('/api/menu/:id', auth(['dueno', 'administrador']), async (req, res) => {
    try {
        const updatedMenuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMenuItem) return res.status(404).json({ message: 'Plato no encontrado.' });
        res.status(200).json(updatedMenuItem);
    } catch (error) { res.status(400).json({ message: 'Error al actualizar el plato.' }); }
});

app.delete('/api/menu/:id', auth(['dueno', 'administrador']), async (req, res) => {
    try {
        const deletedMenuItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!deletedMenuItem) return res.status(404).json({ message: 'Plato no encontrado.' });
        res.status(200).json({ message: 'Plato eliminado con éxito.' });
    } catch (error) { res.status(500).json({ message: 'Error al eliminar el plato.' }); }
});

// ===========================================
// RUTAS DE MESAS (TABLES)
// ===========================================

app.get('/api/tables', auth(['mesero', 'administrador', 'dueno']), async (req, res) => {
    try {
        const tables = await Table.find().sort({ nombre: 1 });
        res.status(200).json(tables);
    } catch (error) { res.status(500).json({ message: 'Error al obtener las mesas.' }); }
});

app.post('/api/tables', auth(['administrador', 'dueno']), async (req, res) => {
    try {
        const newTable = new Table(req.body);
        await newTable.save();
        res.status(201).json(newTable);
    } catch (error) { res.status(400).json({ message: 'Error al crear la mesa.', error: error.message }); }
});

app.put('/api/tables/:id', auth(['administrador', 'dueno']), async (req, res) => {
    try {
        const updatedTable = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTable) return res.status(404).json({ message: 'Mesa no encontrada.' });
        res.status(200).json(updatedTable);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar la mesa.', error: error.message });
    }
});

app.put('/api/tables/:id/status', auth(['mesero', 'administrador', 'dueno']), async (req, res) => {
    try {
        const { estado } = req.body;
        const updatedTable = await Table.findByIdAndUpdate(req.params.id, { estado }, { new: true });
        if (!updatedTable) return res.status(404).json({ message: 'Mesa no encontrada.' });
        res.status(200).json(updatedTable);
    } catch (error) { res.status(400).json({ message: 'Error al actualizar el estado de la mesa.' }); }
});

app.delete('/api/tables/:id', auth(['administrador', 'dueno']), async (req, res) => {
    try {
        const deletedTable = await Table.findByIdAndDelete(req.params.id);
        if (!deletedTable) return res.status(404).json({ message: 'Mesa no encontrada.' });
        res.status(200).json({ message: 'Mesa eliminada con éxito.' });
    } catch (error) { res.status(500).json({ message: 'Error al eliminar la mesa.' }); }
});

// ===========================================
// RUTAS DE PEDIDOS (ORDERS)
// ===========================================

app.get('/api/orders/my-orders', auth(['mesero']), async (req, res) => {
    try {
        const orders = await Order.find({ meseroId: req.user.id });
        res.status(200).json(orders);
    } catch (error) { res.status(500).json({ message: 'Error al obtener los pedidos del mesero.' }); }
});

app.get('/api/orders/all', auth(['cocinero', 'caja']), async (req, res) => {
    try {
        const orders = await Order.find();
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).json(orders);
    } catch (error) { res.status(500).json({ message: 'Error al obtener todos los pedidos.' }); }
});

app.post('/api/orders', auth(['mesero']), async (req, res) => {
    try {
        const { numeroMesa, items } = req.body;
        const table = await Table.findOne({ nombre: numeroMesa });
        if (!table || table.estado === 'ocupada') {
            return res.status(400).json({ message: `La mesa "${numeroMesa}" no está disponible.` });
        }
        table.estado = 'ocupada';
        await table.save();
        
        const newOrderData = {
            mesaId: table._id,
            numeroMesa: table.nombre,
            meseroId: req.user.id,
            items,
            total: items.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0),
        };
        const newOrder = new Order(newOrderData);
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) { res.status(400).json({ message: 'Error al crear el pedido.', error: error.message }); }
});

app.put('/api/orders/:id', auth(['mesero']), async (req, res) => {
    try {
        const updatedData = req.body;
        const originalOrder = await Order.findById(req.params.id);
        if (!originalOrder) return res.status(404).json({ message: 'Pedido original no encontrado.' });
        
        for (const item of originalOrder.items) {
            await MenuItem.findByIdAndUpdate(item.menuItemId, { $inc: { inventory: +item.cantidad } });
        }
        for (const item of updatedData.items) {
            await MenuItem.findByIdAndUpdate(item.menuItemId, { $inc: { inventory: -item.cantidad } });
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        res.status(200).json(updatedOrder);
    } catch (error) { res.status(400).json({ message: 'Error al actualizar el pedido.', error: error.message }); }
});

app.put('/api/orders/:id/status', auth(['cocinero']), async (req, res) => {
    try {
        const { estado } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { estado }, { new: true });
        if (!updatedOrder) return res.status(404).json({ message: 'Pedido no encontrado.' });
        res.status(200).json(updatedOrder);
    } catch (error) { res.status(400).json({ message: 'Error al actualizar el estado del pedido.' }); }
});

app.put('/api/orders/:id/paid', auth(['caja']), async (req, res) => {
    try {
        const { esPagado, metodoPago } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });
        order.esPagado = esPagado;
        order.metodoPago = metodoPago;
        order.estado = 'completado';
        await order.save();
        if (order.mesaId) {
            await Table.findByIdAndUpdate(order.mesaId, { estado: 'disponible' });
        }
        res.status(200).json(order);
    } catch (error) { res.status(400).json({ message: 'Error al actualizar el estado de pago.' }); }
});

app.delete('/api/orders/:id', auth(['mesero']), async (req, res) => {
    try {
        const orderToDelete = await Order.findById(req.params.id);
        if (!orderToDelete) return res.status(404).json({ message: 'Pedido no encontrado.' });
        
        if (!orderToDelete.esPagado) {
            for (const item of orderToDelete.items) {
                await MenuItem.findByIdAndUpdate(item.menuItemId, { $inc: { inventory: +item.cantidad } });
            }
        }
        if (orderToDelete.mesaId && !orderToDelete.esPagado) {
            await Table.findByIdAndUpdate(orderToDelete.mesaId, { estado: 'disponible' });
        }
        
        await Order.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Pedido eliminado y mesa liberada con éxito.' });
    } catch (error) { res.status(500).json({ message: 'Error al eliminar el pedido.' }); }
});

// ===========================================
// RUTAS DE RESERVAS
// ===========================================

app.get('/api/reservations/confirmed-for-today', auth(['mesero', 'administrador', 'dueno']), async (req, res) => {
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
    } catch (error) { res.status(500).json({ message: 'Error al obtener las reservas confirmadas.' }); }
});

app.get('/api/reservations/pending-payment', auth(['caja', 'administrador', 'dueno']), async (req, res) => {
    try {
        const pendingReservations = await Reservation.find({ estadoPago: 'pendiente' }).sort({ fecha: 1, hora: 1 });
        res.status(200).json(pendingReservations);
    } catch (error) { res.status(500).json({ message: 'Error al obtener las reservas pendientes de pago.' }); }
});

// ===========================================
// RUTAS DE REPORTES (SALES)
// ===========================================

app.get('/api/sales/daily', auth(['dueno', 'administrador']), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const paidOrders = await Order.find({ createdAt: { $gte: today }, esPagado: true });
        const confirmedReservations = await Reservation.find({
            updatedAt: { $gte: today },
            estadoPago: 'confirmado',
        });
        const incomeFromOrders = paidOrders.reduce((sum, order) => sum + order.total, 0);
        const incomeFromReservations = confirmedReservations.reduce((sum, res) => sum + res.montoPagado, 0);
        res.status(200).json({
            totalOrders: paidOrders.length,
            incomeFromOrders,
            totalReservations: confirmedReservations.length,
            incomeFromReservations,
            totalIncome: incomeFromOrders + incomeFromReservations
        });
    } catch (error) { res.status(500).json({ message: 'Error al obtener el resumen de ventas.' }); }
});

// ===========================================
// HANDLER FINAL PARA VERCEL
// ===========================================

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}