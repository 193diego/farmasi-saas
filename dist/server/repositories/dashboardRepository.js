import prisma from "../prisma";
export const getFinancialStats = async (companyId) => {
    const sales = await prisma.venta.findMany({
        where: { company_id: companyId },
        include: { detalles: true }
    });
    const expenses = await prisma.gasto.findMany({
        where: { company_id: companyId }
    });
    const inventory = await prisma.inventarioEmpresa.findMany({
        where: { company_id: companyId }
    });
    return { sales, expenses, inventory };
};
export const getSuperAdminStats = async () => {
    const companies = await prisma.company.findMany({
        include: { plan: true }
    });
    const totalIncome = companies.reduce((sum, c) => sum + (c.plan?.precio || 0), 0);
    return { companies, totalIncome };
};
