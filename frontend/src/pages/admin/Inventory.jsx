import React, { useEffect, useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import InventoryList from '../../components/InventoryList';
import InventoryForm from '../../components/InventoryForm';
import * as XLSX from 'xlsx';

function Inventory() {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedVitrina, setSelectedVitrina] = useState('todas');
  const [form, setForm] = useState({
    name: '',
    description: '',
    cantidad_inicial: 0,
    entradas: 0,
    salidas: 0,
    cantidad_actual: 0,
    unidad: 'unidades',
    tipo: 'insumo',
    vitrina: '1',
    prioridad: 'normal',
    isActive: true
  });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const vitrinaNames = {
    '1': 'Vitrina 1',
    '2': 'Vitrina 2',
    '3': 'Vitrina 3',
    '4': 'Vitrina 4'
  };

  const fetchInventory = async () => {
    const res = await fetch('http://localhost:5000/api/inventory');
    const data = await res.json();
    setItems(data.data || []);
  };

  // Filtrar items cuando cambie la vitrina seleccionada o los items
  useEffect(() => {
    if (selectedVitrina === 'todas') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.vitrina === selectedVitrina));
    }
  }, [selectedVitrina, items]);

  useEffect(() => { fetchInventory(); }, []);

  const handleAdd = async data => {
    try {
      console.log('Datos a enviar:', data);
      const payload = {
        name: data.name,
        description: data.description,
        cantidad_inicial: Number(data.cantidad_inicial),
        entradas: Number(data.entradas),
        salidas: Number(data.salidas),
        cantidad_actual: Number(data.cantidad_actual),
        unidad: data.unidad,
        tipo: data.tipo,
        vitrina: data.vitrina,  // Ya viene como string del formulario
        prioridad: data.prioridad,
        isActive: data.isActive
      };
      console.log('Payload a enviar:', payload);
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
      console.log('Respuesta del servidor:', result);
      
      const newItem = result.data;
      console.log('Nuevo item a agregar:', newItem);
      
      setItems(items => [...items, newItem]);
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
        vitrina: '1',
        prioridad: 'normal',
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
      vitrina: item.vitrina || '1',
      prioridad: item.prioridad || 'normal',
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
        vitrina: String(data.vitrina),  // Asegurar que vitrina sea string
        prioridad: data.prioridad,
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
      entradas: 0,
      salidas: 0,
      cantidad_actual: 0,
      unidad: 'unidades',
      tipo: 'insumo',
      vitrina: '1',
      prioridad: 'normal',
      isActive: true
    });
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    console.log('Campo cambiado:', name, value, type);
    
    const newValue = type === 'checkbox' ? checked : value;
    console.log('Nuevo valor:', newValue);
    
    setForm(f => {
      const newForm = {
        ...f,
        [name]: newValue
      };
      console.log('Nuevo form:', newForm);
      return newForm;
    });
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

  const exportToExcel = () => {
    try {
      // Preparar los datos para Excel
      const getVitrinaName = (vitrina) => {
        const vitrinaNames = {
          '1': 'Vitrina 1',
          '2': 'Vitrina 2',
          '3': 'Vitrina 3',
          '4': 'Vitrina 4'
        };
        return vitrinaNames[vitrina] || "No asignada";
      };

      const exportData = items.map(item => ({
        'Producto': item.name,
        'Descripción': item.description,
        'Vitrina': `${getVitrinaName(item.vitrina)} (${item.vitrina})`,
        'Stock Inicial': item.cantidad_inicial,
        'Compras': item.entradas || 0,
        'Ventas': item.salidas || 0,
        'Stock Final': item.cantidad_actual,
        'Diferencia': Math.abs((item.entradas || 0) - (item.salidas || 0) - item.cantidad_actual),
        'Unidad': item.unidad,
        'Tipo': item.tipo,
        'Estado': item.cantidad_actual <= item.cantidad_inicial * 0.2 ? 'Stock Bajo' : 'Normal',
        'Prioridad': item.prioridad
      }));

      // Crear el libro de Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Ajustar el ancho de las columnas
      const columnWidths = [
        { wch: 20 }, // Producto
        { wch: 30 }, // Descripción
        { wch: 8 },  // Vitrina
        { wch: 12 }, // Stock Inicial
        { wch: 10 }, // Compras
        { wch: 10 }, // Ventas
        { wch: 12 }, // Stock Final
        { wch: 12 }, // Diferencia
        { wch: 10 }, // Unidad
        { wch: 12 }, // Tipo
        { wch: 12 }, // Estado
        { wch: 12 }  // Prioridad
      ];
      ws['!cols'] = columnWidths;

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

      // Generar el archivo y descargarlo
      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      XLSX.writeFile(wb, `Inventario_TheBrothers_${fecha}.xlsx`);
      
      setSuccess('✅ Inventario exportado exitosamente.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError('Error al exportar el inventario: ' + err.message);
      setTimeout(() => setError(''), 2500);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'barber')) {
    return <p className="text-center text-red-500 mt-10">No autorizado</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-10">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold text-blue-400">Control de Inventario</h1>
            
            {/* Selector de Vitrina */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-300">Vitrina:</label>
              <select
                value={selectedVitrina}
                onChange={(e) => setSelectedVitrina(e.target.value)}
                className="px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="todas">Todas las vitrinas</option>
                {Object.entries(vitrinaNames).map(([value, name]) => (
                  <option key={value} value={value}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar a Excel
            </button>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Producto
              </button>
            )}
          </div>
        </div>

        {(error || success) && (
          <div className="mb-4">
            {error && (
              <div className="bg-red-900/50 backdrop-blur border border-red-700 text-red-200 px-4 py-3 rounded-lg shadow animate-fade-in flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-900/50 backdrop-blur border border-green-700 text-green-200 px-4 py-3 rounded-lg shadow animate-fade-in flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                {success}
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">
              {editing ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <form onSubmit={editing ? (e => { e.preventDefault(); handleUpdate(form); }) : (e => { e.preventDefault(); handleAdd(form); })}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Descripción
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Cantidad Inicial
                  </label>
                  <input
                    type="number"
                    name="cantidad_inicial"
                    value={form.cantidad_inicial}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Compras / Entradas
                  </label>
                  <input
                    type="number"
                    name="entradas"
                    value={form.entradas}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Ventas / Salidas
                  </label>
                  <input
                    type="number"
                    name="salidas"
                    value={form.salidas}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Cantidad Actual
                  </label>
                  <input
                    type="number"
                    name="cantidad_actual"
                    value={form.cantidad_actual}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Tipo de Producto
                  </label>
                  <select
                    name="tipo"
                    value={form.tipo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  >
                    <option value="insumo">Insumo</option>
                    <option value="herramienta">Herramienta</option>
                    <option value="producto">Producto</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Unidad de Medida
                  </label>
                  <select
                    name="unidad"
                    value={form.unidad}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  >
                    <option value="unidades">Unidades</option>
                    <option value="ml">Mililitros</option>
                    <option value="gramos">Gramos</option>
                    <option value="piezas">Piezas</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Número de Vitrina
                  </label>
                  <select
                    name="vitrina"
                    value={form.vitrina}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  >
                    <option value="1">Vitrina 1</option>
                    <option value="2">Vitrina 2</option>
                    <option value="3">Vitrina 3</option>
                    <option value="4">Vitrina 4</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Importancia del Producto
                  </label>
                  <select
                    name="prioridad"
                    value={form.prioridad}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  >
                    <option value="baja">Producto Secundario</option>
                    <option value="normal">Producto Regular</option>
                    <option value="alta">Producto Principal</option>
                    <option value="urgente">Producto Esencial</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  {editing ? 'Actualizar' : 'Guardar'} Producto
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800/50 backdrop-blur rounded-lg overflow-hidden border border-gray-700">
            <thead>
              <tr className="bg-gray-700/50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-300">Producto</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-300">Vitrina</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-300">Stock Inicial</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-300">Compras</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-300">Ventas</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-300">Stock Final</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-300">Diferencia</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-300">Tipo</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-300">Estado</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredItems.map(item => (
                <tr 
                  key={item._id}
                  className="hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-blue-400">{item.name}</span>
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium text-blue-400">
                      {(() => {
                        const vitrinaName = {
                          '1': "Vitrina 1",
                          '2': "Vitrina 2",
                          '3': "Vitrina 3",
                          '4': "Vitrina 4"
                        }[String(item.vitrina)] || "No asignada";
                        return vitrinaName;
                      })()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-medium text-gray-300">
                        {item.cantidad_inicial}
                      </span>
                      <span className="text-xs text-gray-400">{item.unidad}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-medium text-blue-400">
                        {item.entradas || 0}
                      </span>
                      <span className="text-xs text-gray-400">{item.unidad}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-medium text-yellow-400">
                        {item.salidas || 0}
                      </span>
                      <span className="text-xs text-gray-400">{item.unidad}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-lg font-medium ${
                        item.cantidad_actual <= item.cantidad_inicial * 0.2 
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }`}>
                        {item.cantidad_actual}
                      </span>
                      <span className="text-xs text-gray-400">{item.unidad}</span>
                      {item.cantidad_actual <= item.cantidad_inicial * 0.2 && (
                        <span className="text-xs text-red-400 mt-1">Stock Bajo</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      {(() => {
                        // Nueva fórmula: Stock Final - (Inicial + Entradas - Salidas)
                        const stockTeorico = Number(item.cantidad_inicial || 0) + Number(item.entradas || 0) - Number(item.salidas || 0);
                        const diferencia = Number(item.cantidad_actual || 0) - stockTeorico;
                        return (
                          <>
                            <span className={`text-lg font-medium ${
                              diferencia === 0 
                                ? 'text-green-400' 
                                : diferencia < 0 
                                  ? 'text-red-400'   // Faltan productos
                                  : 'text-blue-400'  // Sobran productos
                            }`}>
                              {diferencia === 0 ? '0' : 
                               diferencia < 0 ? diferencia : // Ya tiene el signo -
                               `+${diferencia}`}           
                            </span>
                            <span className="text-xs text-gray-400">{item.unidad}</span>
                            <span className="text-xs mt-1">
                              {diferencia === 0 ? (
                                <span className="text-green-400">✓ Correcto</span>
                              ) : diferencia < 0 ? (
                                <span className="text-red-400">Faltan {Math.abs(diferencia)}</span>
                              ) : (
                                <span className="text-blue-400">Sobran {diferencia}</span>
                              )}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 capitalize">
                      {item.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {(() => {
                        // Calcular el stock teórico y porcentaje actual
                        const stockActual = Number(item.cantidad_actual || 0);
                        const stockInicial = Number(item.cantidad_inicial || 0);
                        const porcentajeStock = (stockActual / stockInicial) * 100;

                        if (stockActual === 0) {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400">
                              Sin Stock
                            </span>
                          );
                        } else if (porcentajeStock <= 20) {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400">
                              Stock Crítico ({Math.round(porcentajeStock)}%)
                            </span>
                          );
                        } else if (porcentajeStock <= 40) {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-yellow-600/20 text-yellow-400">
                              Stock Bajo ({Math.round(porcentajeStock)}%)
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-green-600/20 text-green-400">
                              Stock Normal ({Math.round(porcentajeStock)}%)
                            </span>
                          );
                        }
                      })()}
                      {item.prioridad === 'alta' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-yellow-600/20 text-yellow-400">
                          Principal
                        </span>
                      )}
                      {item.prioridad === 'urgente' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400">
                          Esencial
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
