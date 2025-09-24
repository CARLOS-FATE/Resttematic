  // EditOrderForm.jsx
  import React, { useState } from 'react';

const EditOrderForm = ({ order, onUpdate, onClose, menuItems, authHeader }) => {
  const [editedTableNumber, setEditedTableNumber] = useState(order.numeroMesa);
  const [editedItems, setEditedItems] = useState(order.items.map(item => ({ ...item })));

  const handleUpdate = async (e) => {
    e.preventDefault();
    const newTotal = editedItems.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    const updatedOrder = {
      ...order,
      numeroMesa: editedTableNumber,
      items: editedItems,
      total: newTotal,
    };

    try {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: 'PUT',
        // 2. Añadimos los headers a la petición de actualización
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      });

      if (!response.ok) throw new Error('Error al actualizar el pedido.');
      
      const result = await response.json();
      onUpdate(result);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al actualizar el pedido.');
    }
  };

  const handleItemQuantityChange = (itemId, quantity) => {
    const newQuantity = parseInt(quantity) || 0; // Asegurarse de que es un número
    setEditedItems(prevItems =>
      prevItems.map(item =>
        item.menuItemId === itemId ? { ...item, cantidad: newQuantity } : item
      )
    );
  };
  const handleAddItem = (e) => {
    const selectedMenuItemId = e.target.value;
    if (selectedMenuItemId) {
      const existingItem = editedItems.find(item => item.menuItemId === selectedMenuItemId);
      if (existingItem) {
        // Si el ítem ya existe, aumenta la cantidad
        handleItemQuantityChange(selectedMenuItemId, existingItem.cantidad + 1);
      } else {
        // Si no existe, lo agrega con cantidad 1
        const newItem = menuItems.find(item => item._id === selectedMenuItemId);
        setEditedItems(prevItems => [
          ...prevItems,
          {
            menuItemId: newItem._id,
            nombre: newItem.nombre,
            cantidad: 1,
            precioUnitario: newItem.precio
          }
        ]);
      }
      e.target.value = ''; // Resetea el selector
    }
  };
const handleRemoveItem = (itemId) => {
    setEditedItems(prevItems => prevItems.filter(item => item.menuItemId !== itemId));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative p-8 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-xl font-bold mb-4">Editar Pedido</h3>
        <form onSubmit={handleUpdate}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold">Número de Mesa</label>
            <select
              value={editedTableNumber}
              onChange={(e) => setEditedTableNumber(e.target.value)}
              className="w-full p-2 border rounded-md bg-white"
              required
            >
              {selectableTables.map(table => (
                <option key={table._id} value={table.nombre}>
                  {table.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold">Items</label>
            <ul className="mb-2">
              {editedItems.map(item => (
                <li key={item.menuItemId} className="flex justify-between items-center py-1">
                  <span>{item.nombre}</span>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => handleItemQuantityChange(item.menuItemId, e.target.value)}
                    className="w-16 p-1 border rounded text-center"
                  />
                </li>
              ))}
            </ul>
            <select onChange={handleAddItem} className="w-full p-2 border rounded">
              <option value="">Añadir item...</option>
              {menuItems.map(item => (
                <option key={item._id} value={item._id}>{item.nombre} - ${item.precio}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrderForm;