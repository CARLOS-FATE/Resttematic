import React, { useState, useMemo } from 'react';
import { ComboModal, ParrillaComboModal, AnticuchoModal, TermolinModal, VasoModal } from './WaiterDashboard.jsx';

const EditOrderForm = ({ order, onUpdate, onClose, menuItems, authHeader, tables }) => {
  const [editedTableNumber, setEditedTableNumber] = useState(order.numeroMesa);
  const [editedItems, setEditedItems] = useState(order.items.map(item => ({ ...item })));

  // States for Modals
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [isParrillaModalOpen, setIsParrillaModalOpen] = useState(false);
  const [activeParrillaCombo, setActiveParrillaCombo] = useState(null);
  const [activeParrillaMeatCount, setActiveParrillaMeatCount] = useState(2);

  const [isAnticuchoModalOpen, setIsAnticuchoModalOpen] = useState(false);
  const [activeAnticucho, setActiveAnticucho] = useState(null);

  const [isTermolinModalOpen, setIsTermolinModalOpen] = useState(false);
  const [activeTermolin, setActiveTermolin] = useState(null);

  const [isVasoModalOpen, setIsVasoModalOpen] = useState(false);
  const [activeVaso, setActiveVaso] = useState(null);

  const alitasMenu = menuItems.filter(item => item.categoria === 'Alitas');

  const selectableTables = tables.filter(
    table => table.estado === 'disponible' || table.nombre === order.numeroMesa
  );
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    const itemsWithQuantity = editedItems.filter(i => i.cantidad > 0);
    const newTotal = itemsWithQuantity.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    
    if (itemsWithQuantity.length === 0) {
        alert("El pedido no puede quedar vacío.");
        return;
    }

    const updatedOrder = {
      ...order,
      numeroMesa: editedTableNumber,
      items: itemsWithQuantity,
      total: newTotal,
    };

    try {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: 'PUT',
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

  const handleItemQuantityChange = (itemNombre, quantity) => {
    const newQuantity = parseInt(quantity) || 0; // Si es NaN o 0, puede removerse luego
    setEditedItems(prevItems =>
      prevItems.map(item =>
        item.nombre === itemNombre ? { ...item, cantidad: newQuantity } : item
      )
    );
  };
  
  const handleRemoveItem = (itemNombre) => {
      setEditedItems(prevItems => prevItems.filter(item => item.nombre !== itemNombre));
  };

  const handleAddCombo = (comboData) => {
    const formattedName = comboData.name;
    const existingItem = editedItems.find(item => item.nombre === formattedName);
    if (existingItem) {
        handleItemQuantityChange(formattedName, existingItem.cantidad + 1);
    } else {
        setEditedItems(prevItems => [
            ...prevItems,
            {
               menuItemId: comboData.inventoryItemId,
               nombre: formattedName,
               cantidad: 1,
               precioUnitario: comboData.price
            }
        ]);
    }
  };

  const handleAddItem = (e) => {
    const val = e.target.value;
    if (!val) return;

    if (val === 'ALITAS_COMBO') {
        setIsComboModalOpen(true);
        e.target.value = '';
        return;
    }

    if (val.startsWith('PARRILLA_COMBO|')) {
        const itemId = val.split('|')[1];
        const item = menuItems.find(mi => mi._id === itemId);
        if (item) {
            const nameL = item.nombre.toLowerCase();
            let meats = 2; 
            if (nameL.includes('girasol') || nameL.includes('3') || nameL.includes('tres')) meats = 3;
            if (nameL.includes('4') || nameL.includes('cuatro')) meats = 4;
            setActiveParrillaCombo(item);
            setActiveParrillaMeatCount(meats);
            setIsParrillaModalOpen(true);
        }
        e.target.value = '';
        return;
    }
    
    if (val.startsWith('ANTICUCHO_COMBO|')) {
        const itemId = val.split('|')[1];
        const item = menuItems.find(mi => mi._id === itemId);
        if (item) {
            setActiveAnticucho(item);
            setIsAnticuchoModalOpen(true);
        }
        e.target.value = '';
        return;
    }

    if (val.startsWith('TERMOLIN_COMBO|')) {
        const itemId = val.split('|')[1];
        const item = menuItems.find(mi => mi._id === itemId);
        if (item) {
            setActiveTermolin(item);
            setIsTermolinModalOpen(true);
        }
        e.target.value = '';
        return;
    }

    if (val.startsWith('VASO_COMBO|')) {
        const itemId = val.split('|')[1];
        const item = menuItems.find(mi => mi._id === itemId);
        if (item) {
            setActiveVaso(item);
            setIsVasoModalOpen(true);
        }
        e.target.value = '';
        return;
    }

    let itemId = val;
    let variant = 'Normal';
    if (val.includes('|')) {
        const parts = val.split('|');
        itemId = parts[0];
        variant = parts[1];
    }

    const newItem = menuItems.find(item => item._id === itemId);
    if (!newItem) return;

    const formattedName = variant === 'Normal' ? newItem.nombre : `${newItem.nombre} [${variant}]`;

    const existingItem = editedItems.find(item => item.nombre === formattedName);
    if (existingItem) {
        handleItemQuantityChange(formattedName, existingItem.cantidad + 1);
    } else {
        setEditedItems(prevItems => [
            ...prevItems,
            {
                menuItemId: newItem._id,
                nombre: formattedName,
                cantidad: 1,
                precioUnitario: newItem.precio
            }
        ]);
    }
    e.target.value = '';
  };

  const generatedOptions = useMemo(() => {
    const options = [];
    if (menuItems.some(i => i.categoria === 'Alitas')) {
        options.push({ value: 'ALITAS_COMBO', label: '🍗 Armar Combo Mixto Alitas' });
    }
    
    // Sort array so combos appear at top of options visually and variants are clear
    menuItems.forEach(item => {
        const nameL = item.nombre.toLowerCase();
        if (nameL.includes('termolin')) {
            options.push({ value: `TERMOLIN_COMBO|${item._id}`, label: `🍹 ${item.nombre} (Elegir Sabor)` });
        } else if (nameL.includes('vaso')) {
            options.push({ value: `VASO_COMBO|${item._id}`, label: `🥤 ${item.nombre} (Elegir Sabor)` });
        } else if (nameL.includes('anticucho') || nameL.includes('oreja de van gogh')) {
            options.push({ value: `ANTICUCHO_COMBO|${item._id}`, label: `🍢 ${item.nombre} (Configurar Anticucho)` });
        } else if (item.categoria === 'Parrillas' && nameL.includes('combo') && !nameL.includes('oreja de van gogh')) {
            options.push({ value: `PARRILLA_COMBO|${item._id}`, label: `🥩 ${item.nombre} (Configurar Carnes)` });
        } else if (item.categoria === 'Parrillas' || item.categoria === 'Alitas') {
            options.push({ value: `${item._id}|Papa Frita`, label: `${item.nombre} [🥔 Frita]` });
            options.push({ value: `${item._id}|Papa Sancochada`, label: `${item.nombre} [🥔 Sancoch.]` });
        } else {
            options.push({ value: item._id, label: item.nombre });
        }
    });

    return options.sort((a,b) => {
        if (a.value === 'ALITAS_COMBO') return -1;
        if (b.value === 'ALITAS_COMBO') return 1;
        
        const isSpecialA = a.label.startsWith('🥩') || a.label.startsWith('🍢') || a.label.startsWith('🍹');
        const isSpecialB = b.label.startsWith('🥩') || b.label.startsWith('🍢') || b.label.startsWith('🍹');
        if (isSpecialA && !isSpecialB) return -1;
        if (!isSpecialA && isSpecialB) return 1;
        
        return a.label.localeCompare(b.label);
    });
  }, [menuItems]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-40 flex items-center justify-center">
      <div className="relative p-6 border w-full max-w-lg shadow-xl outline-none rounded-xl bg-white max-h-[95vh] flex flex-col">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Editar Pedido</h3>
        
        <div className="overflow-y-auto pr-2 mb-4">
            <form id="editOrderForm" onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-1">Número de Mesa</label>
                <select
                  value={editedTableNumber}
                  onChange={(e) => setEditedTableNumber(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-400 outline-none"
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
                <label className="block text-gray-700 font-bold mb-2">Desglose de Items</label>
                <ul className="mb-4 space-y-2">
                  {editedItems.map(item => (
                    <li key={`${item.menuItemId}-${item.nombre}`} className="flex justify-between items-center bg-gray-50 p-2 rounded border shadow-sm gap-2">
                      <span className="text-sm font-medium flex-1 break-words">{item.nombre}</span>
                      <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => handleItemQuantityChange(item.nombre, e.target.value)}
                            className="w-16 p-1 border rounded text-center outline-none focus:border-blue-500 font-bold"
                          />
                          <button type="button" onClick={() => handleRemoveItem(item.nombre)} className="text-red-500 font-bold hover:text-red-700 bg-red-100 rounded px-2 py-1">
                              X
                          </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <select onChange={handleAddItem} className="w-full p-2 border rounded font-medium focus:ring-2 focus:ring-blue-400 outline-none">
                  <option value="">+ Añadir Variante o Combo Completo...</option>
                  {generatedOptions.map((opt, idx) => (
                    <option key={idx} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </form>
        </div>

        <div className="flex justify-end space-x-3 border-t pt-4 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-md hover:bg-gray-400 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="editOrderForm"
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Guardar Cambios
          </button>
        </div>

        {/* REUSE MODALS FROM WAITER DASHBOARD */}
        <ComboModal 
            isOpen={isComboModalOpen}
            onClose={() => setIsComboModalOpen(false)}
            alitasItems={alitasMenu}
            onAddCombo={handleAddCombo}
        />

        <ParrillaComboModal
            isOpen={isParrillaModalOpen}
            onClose={() => setIsParrillaModalOpen(false)}
            comboItem={activeParrillaCombo}
            meatCount={activeParrillaMeatCount}
            onAddCombo={handleAddCombo}
        />
        
        <AnticuchoModal
            isOpen={isAnticuchoModalOpen}
            onClose={() => setIsAnticuchoModalOpen(false)}
            anticuchoItem={activeAnticucho}
            onAddVariant={handleAddCombo}
        />

        <TermolinModal
            isOpen={isTermolinModalOpen}
            onClose={() => setIsTermolinModalOpen(false)}
            termolinItem={activeTermolin}
            onAddVariant={handleAddCombo}
        />

        <VasoModal
            isOpen={isVasoModalOpen}
            onClose={() => setIsVasoModalOpen(false)}
            vasoItem={activeVaso}
            onAddVariant={handleAddCombo}
        />
      </div>
    </div>
  );
};

export default EditOrderForm;
