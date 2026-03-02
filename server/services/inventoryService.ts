// server/services/inventoryService.ts
import * as inventoryRepository from "../repositories/inventoryRepository.js";

export const getInventory = async (companyId: number) => {
  const items = await inventoryRepository.getInventoryByCompany(companyId);
  return items.map(item => ({
    id: item.id,                                        // ID de InventarioEmpresa (para editar)
    producto_global_id: item.producto_global_id,        // ✅ ID real del ProductoGlobal (para vender)
    nombre: item.producto.nombre_producto,
    categoria: item.producto.categoria,
    stock: item.stock,
    precio_venta: item.precio_venta,
    precio_compra: item.precio_compra,
    imagen_url: item.producto.imagen_url,
    marca: item.producto.marca,
    descripcion: item.producto.descripcion,
  }));
};

export const updateStock = async (id: number, stock: number) => {
  return await inventoryRepository.updateStock(id, stock);
};