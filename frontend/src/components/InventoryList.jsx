import React from 'react';

function InventoryList({ items, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Nombre</th>
            <th className="px-4 py-2 border">Descripción</th>
            <th className="px-4 py-2 border">Inicial</th>
            <th className="px-4 py-2 border">Entradas/Compras</th>
            <th className="px-4 py-2 border">Salidas/Ventas</th>
            <th className="px-4 py-2 border">Final</th>
            <th className="px-4 py-2 border">Unidad</th>
            <th className="px-4 py-2 border">Tipo</th>
            <th className="px-4 py-2 border">Activo</th>
            <th className="px-4 py-2 border">Faltante/Sobrante</th>
            <th className="px-4 py-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            // Suponiendo que el modelo tiene cantidad_inicial, cantidad_actual, entradas, salidas
            // Si no existen entradas/salidas, se calculan:
            const entradas = item.entradas || 0;
            const salidas = item.salidas || 0;
            const final = item.cantidad_actual;
            const esperado = item.cantidad_inicial + entradas - salidas;
            let diferencia = final - esperado;
            let estado = '';
            if (diferencia < 0) estado = `Faltante: ${Math.abs(diferencia)}`;
            else if (diferencia > 0) estado = `Sobrante: ${diferencia}`;
            else estado = 'OK';
            return (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{item.name}</td>
                <td className="px-4 py-2 border">{item.description}</td>
                <td className="px-4 py-2 border">{item.cantidad_inicial}</td>
                <td className="px-4 py-2 border">{entradas}</td>
                <td className="px-4 py-2 border">{salidas}</td>
                <td className="px-4 py-2 border">{final}</td>
                <td className="px-4 py-2 border">{item.unidad}</td>
                <td className="px-4 py-2 border">{item.tipo === 'insumo' ? 'Insumo' : 'Producto final'}</td>
                <td className="px-4 py-2 border">{item.isActive ? 'Sí' : 'No'}</td>
                <td className={`px-4 py-2 border ${diferencia !== 0 ? 'text-red-600 font-bold' : 'text-green-600'}`}>{estado}</td>
                <td className="px-4 py-2 border">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => onEdit(item)}
                  >
                    Editar
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
                        onDelete(item._id);
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryList;
