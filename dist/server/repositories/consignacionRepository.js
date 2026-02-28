// server/repositories/consignacionRepository.ts
import prisma from "../prisma";
// ===================================================
//  PROVEEDORAS
// ===================================================
export const getProveedorasByCompany = async (companyId) => {
    return await prisma.proveedora.findMany({
        where: { company_id: companyId, activo: true },
        include: {
            consignaciones: {
                where: { estado: "activo" },
                include: { producto: true }
            }
        }
    });
};
export const createProveedora = async (data) => {
    return await prisma.proveedora.create({ data });
};
export const updateProveedora = async (id, data) => {
    return await prisma.proveedora.update({ where: { id }, data });
};
// ===================================================
//  CONSIGNACIONES
// ===================================================
export const getConsignacionesByCompany = async (companyId) => {
    return await prisma.consignacion.findMany({
        where: { company_id: companyId },
        include: {
            proveedora: true,
            producto: true,
            ventas_consignacion: true // ✔ CORREGIDO: era ventaConsignacion
        },
        orderBy: { fecha_recepcion: "desc" }
    });
};
export const getConsignacionesByProveedora = async (companyId, proveedoraId) => {
    return await prisma.consignacion.findMany({
        where: { company_id: companyId, proveedora_id: proveedoraId },
        include: {
            producto: true,
            ventas_consignacion: true // ✔ CORREGIDO: era ventaConsignacion
        },
        orderBy: { fecha_recepcion: "desc" }
    });
};
export const createConsignacion = async (data) => {
    return await prisma.consignacion.create({
        data: {
            ...data,
            cantidad_disponible: data.cantidad_recibida
        },
        include: { producto: true, proveedora: true }
    });
};
export const updateConsignacionStock = async (id, cantidadVendida) => {
    return await prisma.consignacion.update({
        where: { id },
        data: {
            cantidad_disponible: { decrement: cantidadVendida }
        }
    });
};
export const findConsignacionActiva = async (companyId, productoGlobalId) => {
    return await prisma.consignacion.findFirst({
        where: {
            company_id: companyId,
            producto_global_id: productoGlobalId,
            estado: "activo",
            cantidad_disponible: { gt: 0 }
        },
        include: { proveedora: true, producto: true }
    });
};
// ===================================================
//  VENTAS CONSIGNACION
// ===================================================
export const createVentaConsignacion = async (data) => {
    return await prisma.ventaConsignacion.create({ data });
};
export const getVentasConsignacionByProveedora = async (companyId, proveedoraId) => {
    return await prisma.ventaConsignacion.findMany({
        where: {
            company_id: companyId, // ✔ CORREGIDO: query directa en lugar de nested
            proveedora_id: proveedoraId // ✔ CORREGIDO: query directa en lugar de nested
        },
        include: {
            consignacion: { include: { producto: true } },
            venta: true
        },
        orderBy: { fecha_venta: "desc" }
    });
};
// ===================================================
//  REPORTES Y LIQUIDACIONES
// ===================================================
export const calcularDeudaProveedora = async (companyId, proveedoraId) => {
    const ventas = await prisma.ventaConsignacion.findMany({
        where: {
            company_id: companyId, // ✔ CORREGIDO: query directa
            proveedora_id: proveedoraId, // ✔ CORREGIDO: query directa
            liquidada: false
        },
        include: {
            consignacion: { include: { producto: true } }
        }
    });
    const totalDeuda = ventas.reduce((sum, v) => sum + v.monto_a_reportar, 0);
    const totalGanancia = ventas.reduce((sum, v) => sum + v.tu_ganancia, 0);
    const totalVendido = ventas.reduce((sum, v) => sum + v.precio_venta_usado * v.cantidad_vendida, 0);
    return { ventas, totalDeuda, totalGanancia, totalVendido };
};
export const createLiquidacion = async (data) => {
    return await prisma.liquidacionProveedora.create({
        data: {
            company_id: data.company_id,
            proveedora_id: data.proveedora_id,
            monto_total: data.monto_total,
            fecha_corte: data.fecha_corte,
            notas: data.notas,
            detalles: {
                create: data.detalles
            }
        },
        include: {
            proveedora: true,
            detalles: {
                include: {
                    consignacion: { include: { producto: true } }
                }
            }
        }
    });
};
export const getLiquidacionesByProveedora = async (companyId, proveedoraId) => {
    return await prisma.liquidacionProveedora.findMany({
        where: { company_id: companyId, proveedora_id: proveedoraId },
        include: {
            detalles: {
                include: {
                    consignacion: { include: { producto: true } }
                }
            }
        },
        orderBy: { fecha_creacion: "desc" }
    });
};
export const registrarPagoLiquidacion = async (liquidacionId, montoPagado) => {
    const liquidacion = await prisma.liquidacionProveedora.findUnique({
        where: { id: liquidacionId }
    });
    if (!liquidacion)
        throw new Error("Liquidación no encontrada");
    const nuevoPagado = liquidacion.monto_pagado + montoPagado;
    const nuevoEstado = nuevoPagado >= liquidacion.monto_total ? "pagado" : "parcial";
    return await prisma.liquidacionProveedora.update({
        where: { id: liquidacionId },
        data: {
            monto_pagado: nuevoPagado,
            estado: nuevoEstado,
            fecha_pago: nuevoEstado === "pagado" ? new Date() : undefined
        }
    });
};
