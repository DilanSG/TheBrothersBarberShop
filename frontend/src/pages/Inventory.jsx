import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import InventoryList from '../components/InventoryList.jsx';
import InventoryForm from '../components/InventoryForm.jsx';

function Inventory() {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    cantidad_inicial: 0,
    entradas: 0,
    salidas: 0,
    cantidad_actual: 0,
    unidad: 'unidades',
    tipo: 'insumo',
    isActive: true
  });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchInventory = async () => {
    const res = await fetch('http://localhost:5000/api/inventory');
    const data = await res.json();
    setItems(data.data || []);
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleAdd = async data => {
    try {
      const payload = {
        name: data.name,
        description: data.description,
        cantidad_inicial: Number(data.cantidad_inicial),
        entradas: Number(data.entradas),
        salidas: Number(data.salidas),
        cantidad_actual: Number(data.cantidad_actual),
        unidad: data.unidad,
        tipo: data.tipo,
        isActive: data.isActive
      };
      const res = await fetch('http://localhost:5000/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Error al agregar producto');
      const result = await res.json();
      setItems(items => [...items, result.data]);
      setShowForm(false);
      setForm({
        name: '',
        description: '',
        cantidad_inicial: 0,
        entradas: 0,
        salidas: 0,
        cantidad_actual: 0,
        unidad: 'unidades',
        tipo: 'insumo',
        isActive: true
      });
      setSuccess('✅ Producto agregado exitosamente.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = item => {
    setEditing(item);
    setShowForm(true);
    setForm({
      name: item.name,
      description: item.description,
      cantidad_inicial: item.cantidad_inicial,
      entradas: item.entradas || 0,
      salidas: item.salidas || 0,
      cantidad_actual: item.cantidad_actual,
      unidad: item.unidad,
      tipo: item.tipo,
      isActive: item.isActive
    });
  };

  const handleUpdate = async data => {
    try {
      const payload = {
        name: data.name,
        description: data.description,
        cantidad_inicial: Number(data.cantidad_inicial),
        entradas: Number(data.entradas),
        salidas: Number(data.salidas),
        cantidad_actual: Number(data.cantidad_actual),
        unidad: data.unidad,
        tipo: data.tipo,
        isActive: data.isActive
      };
      const res = await fetch(`http://localhost:5000/api/inventory/${editing._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Error al actualizar producto');
      const result = await res.json();
      setItems(items => items.map(i => (i._id === editing._id ? result.data : i)));
      setEditing(null);
      setShowForm(false);
      setForm({
        name: '',
        description: '',
        cantidad_inicial: 0,
        entradas: 0,
        salidas: 0,
        cantidad_actual: 0,
        unidad: 'unidades',
        tipo: 'insumo',
        isActive: true
      });
      setSuccess('✅ Producto actualizado exitosamente.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setShowForm(false);
    setForm({
      name: '',
      description: '',
      cantidad_inicial: 0,
      cantidad_actual: 0,
      unidad: 'unidades',
      tipo: 'insumo',
      isActive: true
    });
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDelete = async id => {
    try {
      const res = await fetch(`http://localhost:5000/api/inventory/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Error al eliminar producto');
      setItems(items => items.filter(i => i._id !== id));
      setSuccess('✅ Producto eliminado exitosamente.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 2500);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'barber')) {
    return <p className="text-center text-red-500 mt-10">No autorizado</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inventario</h1>
      <InventoryForm
        form={form}
        onChange={handleChange}
        onSubmit={editing ? (e => { e.preventDefault(); handleUpdate(form); }) : (e => { e.preventDefault(); handleAdd(form); })}
        editing={editing}
        onCancel={handleCancel}
        error={error}
        success={success}
      />
      <InventoryList
        items={items}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease;
        }
      `}</style>
    </div>
  );
}

export default Inventory;
