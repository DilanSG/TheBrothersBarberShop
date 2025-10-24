import React from 'react';

function InventoryList({ items, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Vitrina</th>
            <th className="px-4 py-2 border">Nombre</th>
            <th className="px-4 py-2 border">Descripción</th>
            <th className="px-4 py-2 border">Inicial</th>
            <th className="px-4 py-2 border">Entradas</th>
            <th className="px-4 py-2 border">Salidas</th>
            <th className="px-4 py-2 border">Final</th>
            <th className="px-4 py-2 border">Estado</th>
            <th className="px-4 py-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center text-gray-400">No hay productos en inventario.</td>
            </tr>
          ) : (
            items.map(item => {
              const entradas = item.entradas || 0;
              const salidas = item.salidas || 0;
              const final = item.cantidad_actual;
              const esperado = item.cantidad_inicial + entradas - salidas;
              let diferencia = final - esperado;
              let estado = '';
              if (diferencia < 0) estado = `Faltante: ${Math.abs(diferencia)}`;
              else if (diferencia > 0) estado = `Sobrante: ${diferencia}`;
              else estado = 'OK';
              const vitrinaNames = {
                '1': 'Vitrina 1',
                '2': 'Vitrina 2',
                '3': 'Vitrina 3',
                '4': 'Vitrina 4'
              };

              return (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">
                    {vitrinaNames[String(item.vitrina || '1')] || 'No asignada'}
                  </td>
                  <td className="px-4 py-2 border">{item.name}</td>
                  <td className="px-4 py-2 border">{item.description}</td>
                  <td className="px-4 py-2 border">{item.cantidad_inicial}</td>
                  <td className="px-4 py-2 border">{entradas}</td>
                  <td className="px-4 py-2 border">{salidas}</td>
                  <td className="px-4 py-2 border">{final}</td>
                  <td className="px-4 py-2 border">{estado}</td>
                  <td className="px-4 py-2 border">
                    <button className="text-blue-600 hover:underline mr-2" onClick={() => onEdit(item)}>Editar</button>
                    <button className="text-red-600 hover:underline" onClick={() => onDelete(item._id)}>Eliminar</button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
export default InventoryList;
