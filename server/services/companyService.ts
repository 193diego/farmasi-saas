import * as companyRepository from "../repositories/companyRepository.ts";
import prisma from "../prisma.ts";

export const createCompanyWithInventory = async (data: any) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Crear la empresa
    const company = await tx.company.create({
      data: {
        nombre_empresa: data.nombre_empresa,
        plan_id: data.plan_id,
        estado: "activo",
        fecha_vencimiento: new Date(data.fecha_vencimiento),
      }
    });

    // 2. Obtener todos los productos globales para inicializar el inventario en cero
    const globalProducts = await tx.productoGlobal.findMany();

    // 3. Crear registros de inventario en cero para la nueva empresa
    if (globalProducts.length > 0) {
      await tx.inventarioEmpresa.createMany({
        data: globalProducts.map(p => ({
          company_id: company.id,
          producto_global_id: p.id,
          stock: 0,
          precio_compra: 0, // Se actualizará cuando el dueño agregue stock
          precio_venta: 0,  // Se actualizará cuando el dueño agregue stock
        }))
      });
    }

    return company;
  });
};

export const getCompanies = async () => {
  return await companyRepository.getAllCompanies();
};

export const getPlans = async () => {
  return await companyRepository.getPlans();
};
