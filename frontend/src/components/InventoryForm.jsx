import React from 'react';

function InventoryForm({ form, onChange, onSubmit, editing, onCancel, error, success }) {
  return (
    <form onSubmit={onSubmit} className="card mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Nombre</label>
          <input name="name" value={form.name} onChange={onChange} className="form-input" required />
        </div>
        <div>
          <label className="form-label">Descripción</label>
          <input name="description" value={form.description} onChange={onChange} className="form-input" />
        </div>
          <div>
            <label className="form-label">Cantidad inicial</label>
            <input name="cantidad_inicial" type="number" value={form.cantidad_inicial} onChange={onChange} className="form-input" min="0" required />
          </div>
          <div>
            <label className="form-label">Entradas / Compras</label>
            <input name="entradas" type="number" value={form.entradas} onChange={onChange} className="form-input" min="0" />
          </div>
          <div>
            <label className="form-label">Salidas / Ventas</label>
            <input name="salidas" type="number" value={form.salidas} onChange={onChange} className="form-input" min="0" />
          </div>
          <div>
            <label className="form-label">Cantidad final</label>
            <input name="cantidad_actual" type="number" value={form.cantidad_actual} onChange={onChange} className="form-input" min="0" required />
          </div>
          <div>
            <label className="form-label">Unidad</label>
            <select name="unidad" value={form.unidad} onChange={onChange} className="form-input" required>
              <option value="unidades">Unidades</option>
              <option value="ml">ml</option>
              <option value="g">g</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          <div>
            <label className="form-label">Tipo</label>
            <select name="tipo" value={form.tipo} onChange={onChange} className="form-input" required>
              <option value="insumo">Insumo</option>
              <option value="producto_final">Producto final</option>
            </select>
          </div>
      </div>
      {error && <p className="form-error text-center">{error}</p>}
      {success && <p className="form-success text-center">{success}</p>}
      <button type="submit" className="btn-primary w-full mt-4">{editing ? 'Actualizar' : 'Agregar'}</button>
      {editing && <button type="button" className="btn-secondary w-full mt-2" onClick={onCancel}>Cancelar edición</button>}
    </form>
  );
}

export default InventoryForm;
