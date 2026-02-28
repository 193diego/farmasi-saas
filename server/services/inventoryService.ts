import * as inventoryRepository from "../repositories/inventoryRepository";

export const getInventory = async (companyId: number) => {
  const items = await inventoryRepository.getInventoryByCompany(companyId);
  return items.map(item => ({
    id: item.id,
    nombre: item.producto.nombre_producto,
    categoria: item.producto.categoria,
    stock: item.stock,
    precio_venta: item.precio_venta,
    precio_compra: item.precio_compra,
    imagen_url: item.producto.imagen_url
  }));
};

export const updateStock = async (id: number, stock: number) => {
  return await inventoryRepository.updateStock(id, stock);
};
