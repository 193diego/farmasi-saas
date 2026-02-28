import prisma from "../prisma";
export const createCompany = async (data) => {
    return await prisma.company.create({
        data: {
            nombre_empresa: data.nombre_empresa,
            plan_id: data.plan_id,
            estado: "activo",
            fecha_vencimiento: data.fecha_vencimiento,
        }
    });
};
export const getAllCompanies = async () => {
    return await prisma.company.findMany({
        include: {
            plan: true,
            users: {
                where: { rol: "owner" }
            }
        }
    });
};
export const getPlans = async () => {
    return await prisma.plan.findMany();
};
