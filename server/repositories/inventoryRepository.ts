import prisma from "../prisma.js";

export const getInventoryByCompany = async (companyId: number) => {
  return await prisma.inventarioEmpresa.findMany({
    where: { company_id: companyId },
    include: { producto: true }
  });
};

export const updateStock = async (id: number, stock: number) => {
  return await prisma.inventarioEmpresa.update({
    where: { id },
    data: { stock }
  });
};

// ✅ NUEVO: Actualizar stock, precio_venta y precio_compra en una sola llamada
export const updateInventoryItem = async (
  id: number,
  data: { stock?: number; precio_venta?: number; precio_compra?: number }
) => {
  return await prisma.inventarioEmpresa.update({
    where: { id },
    data,
    include: { producto: true }
  });
};

export const createInventoryItem = async (data: any) => {
  return await prisma.inventarioEmpresa.create({
    data
  });
};
