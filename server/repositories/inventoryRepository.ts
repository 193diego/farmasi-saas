import prisma from "../prisma";

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

export const createInventoryItem = async (data: any) => {
  return await prisma.inventarioEmpresa.create({
    data
  });
};
