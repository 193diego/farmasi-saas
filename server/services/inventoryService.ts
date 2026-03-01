import * as inventoryRepository from "../repositories/inventoryRepository.js";

export const getInventory = async (companyId: number) => {
  const items = await inventoryRepository.getInventoryByCompany(companyId);
  return items.map(item => ({
    id: item.id,
    nombre: item.producto.nombre_producto,
    categoria: item.producto.categoria,
    stock: item.stock,
    precio_venta: item.precio_venta,
    precio_compra: item.precio_compra,
    imagen_url: item.producto.imagen_url,
    marca: item.producto.marca,
    // ✅ FIX: Se agrega descripcion para mostrar en inventario y búsqueda
    descripcion: item.producto.descripcion,
    codigo_base: item.producto.codigo_base,
  }));
};

export const updateStock = async (id: number, stock: number) => {
  return await inventoryRepository.updateStock(id, stock);
};

// ✅ NUEVO: Actualizar precios e información del inventario de empresa
export const updateInventoryItem = async (
  id: number,
  data: { stock?: number; precio_venta?: number; precio_compra?: number }
) => {
  return await inventoryRepository.updateInventoryItem(id, data);
};
