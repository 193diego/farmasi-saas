import prisma from "../prisma.js";
export const getInventoryByCompany = async (companyId) => {
    return await prisma.inventarioEmpresa.findMany({
        where: { company_id: companyId },
        include: { producto: true }
    });
};
export const updateStock = async (id, stock) => {
    return await prisma.inventarioEmpresa.update({
        where: { id },
        data: { stock }
    });
};
export const createInventoryItem = async (data) => {
    return await prisma.inventarioEmpresa.create({
        data
    });
};
