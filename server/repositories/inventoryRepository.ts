// server/repositories/inventoryRepository.ts
import prisma from "../prisma.js";

export const getInventoryByCompany = async (companyId: number) => {
  return await prisma.inventarioEmpresa.findMany({
    where: { company_id: companyId },
    include: { producto: true },
    orderBy: [
      { producto: { categoria: "asc" } },
      { producto: { nombre_producto: "asc" } },
    ],
  });
};

export const updateStock = async (id: number, stock: number) => {
  return await prisma.inventarioEmpresa.update({
    where: { id },
    data: { stock },
  });
};

export const createInventoryItem = async (data: any) => {
  return await prisma.inventarioEmpresa.create({ data });
};
