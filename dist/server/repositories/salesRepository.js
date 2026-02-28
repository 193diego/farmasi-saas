import prisma from "../prisma.js";
export const createSale = async (data) => {
    return await prisma.venta.create({
        data: {
            company_id: data.company_id,
            cliente_id: data.cliente_id,
            total: data.total,
            estado: data.estado,
            detalles: {
                create: data.items.map((item) => ({
                    producto_global_id: item.producto_global_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    subtotal: item.subtotal
                }))
            }
        },
        include: {
            detalles: {
                include: {
                    producto: true
                }
            },
            cliente: true
        }
    });
};
export const getSalesByCompany = async (companyId) => {
    return await prisma.venta.findMany({
        where: { company_id: companyId },
        include: {
            detalles: {
                include: {
                    producto: true
                }
            },
            cliente: true
        },
        orderBy: {
            fecha_venta: 'desc'
        }
    });
};
