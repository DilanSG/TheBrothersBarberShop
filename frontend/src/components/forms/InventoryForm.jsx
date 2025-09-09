import React from 'react';

function InventoryForm({ form, onChange, onSubmit, editing, onCancel, error, success }) {
  return (
    <form onSubmit={onSubmit} className="card mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Código</label>
          <input 
            name="code" 
            value={form.code} 
            onChange={onChange} 
            className="form-input" 
          />
        </div>
        <div>
          <label className="form-label">Nombre</label>
          <input 
            name="name" 
            value={form.name} 
            onChange={onChange} 
            className="form-input" 
            required 
          />
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Descripción</label>
          <input 
            name="description" 
            value={form.description} 
            onChange={onChange} 
            className="form-input" 
          />
        </div>
        <div>
          <label className="form-label">Stock</label>
          <input 
            name="stock" 
            type="number" 
            value={form.stock} 
            onChange={onChange} 
            className="form-input" 
            min="0" 
            required 
          />
        </div>
        <div>
          <label className="form-label">Stock Mínimo</label>
          <input 
            name="minStock" 
            type="number" 
            value={form.minStock} 
            onChange={onChange} 
            className="form-input" 
            min="0" 
          />
        </div>
        <div>
          <label className="form-label">Precio</label>
          <input 
            name="price" 
            type="number" 
            step="0.01" 
            value={form.price} 
            onChange={onChange} 
            className="form-input" 
            min="0" 
            required 
          />
        </div>
        <div>
          <label className="form-label">Unidad</label>
          <select 
            name="unit" 
            value={form.unit} 
            onChange={onChange} 
            className="form-input" 
            required
          >
            <option value="unidad">Unidades</option>
            <option value="ml">ml</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="l">l</option>
            <option value="otros">Otros</option>
          </select>
        </div>
        <div>
          <label className="form-label">Categoría</label>
          <select 
            name="category" 
            value={form.category} 
            onChange={onChange} 
            className="form-input" 
            required
          >
            <option value="productos">Productos</option>
            <option value="insumos">Insumos</option>
            <option value="herramientas">Herramientas</option>
            <option value="otros">Otros</option>
          </select>
        </div>
        <div>
          <label className="form-label">Ubicación</label>
          <select 
            name="location" 
            value={form.location} 
            onChange={onChange} 
            className="form-input" 
            required
          >
            <option value="vitrina1">Vitrina 1</option>
            <option value="vitrina2">Vitrina 2</option>
            <option value="vitrina3">Vitrina 3</option>
            <option value="bodega">Bodega</option>
            <option value="otros">Otros</option>
          </select>
        </div>
        <div>
          <label className="form-label">Prioridad</label>
          <select 
            name="priority" 
            value={form.priority} 
            onChange={onChange} 
            className="form-input" 
            required
          >
            <option value="baja">Baja</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
      </div>
      
      {error && <p className="form-error text-center mt-4">{error}</p>}
      {success && <p className="form-success text-center mt-4">{success}</p>}
      
      <div className="mt-6">
        <button type="submit" className="btn-primary w-full">
          {editing ? 'Actualizar' : 'Agregar'}
        </button>
        {editing && (
          <button 
            type="button" 
            className="btn-secondary w-full mt-2" 
            onClick={onCancel}
          >
            Cancelar edición
          </button>
        )}
      </div>
    </form>
  );
}

export default InventoryForm;
