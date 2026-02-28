// server/repositories/consignacionRepository.ts
import prisma from "../prisma.ts";

// ---- PROVEEDORAS ----

export const getProveedorasByCompany = async (companyId: number) => {
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

export const createProveedora = async (data: {
  company_id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  notas?: string;
}) => {
  return await prisma.proveedora.create({ data });
};

export const updateProveedora = async (id: number, data: any) => {
  return await prisma.proveedora.update({ where: { id }, data });
};

// ---- CONSIGNACIONES ----

export const getConsignacionesByCompany = async (companyId: number) => {
  return await prisma.consignacion.findMany({
    where: { company_id: companyId },
    include: {
      proveedora: true,
      producto: true,
      ventas_consignacion: true
    },
    orderBy: { fecha_recepcion: "desc" }
  });
};

export const getConsignacionesByProveedora = async (companyId: number, proveedoraId: number) => {
  return await prisma.consignacion.findMany({
    where: { company_id: companyId, proveedora_id: proveedoraId },
    include: {
      producto: true,
      ventas_consignacion: true
    },
    orderBy: { fecha_recepcion: "desc" }
  });
};

export const createConsignacion = async (data: {
  company_id: number;
  proveedora_id: number;
  producto_global_id: number;
  cantidad_recibida: number;
  precio_costo: number;
  precio_venta_proveedora: number;
  precio_venta_tuyo: number;
  notas?: string;
}) => {
  return await prisma.consignacion.create({
    data: {
      ...data,
      cantidad_disponible: data.cantidad_recibida
    },
    include: { producto: true, proveedora: true }
  });
};

export const updateConsignacionStock = async (id: number, cantidadVendida: number) => {
  return await prisma.consignacion.update({
    where: { id },
    data: {
      cantidad_disponible: { decrement: cantidadVendida }
    }
  });
};

// Busca consignaciones activas de un producto para una empresa
export const findConsignacionActiva = async (companyId: number, productoGlobalId: number) => {
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

// ---- VENTAS CONSIGNACION ----

export const createVentaConsignacion = async (data: {
  consignacion_id: number;
  venta_id: number;
  detalle_venta_id: number;
  cantidad_vendida: number;
  precio_venta_usado: number;
  precio_proveedora: number;
  monto_a_reportar: number;
  tu_ganancia: number;
}) => {
  return await prisma.ventaConsignacion.create({ data });
};

export const getVentasConsignacionByProveedora = async (companyId: number, proveedoraId: number) => {
  return await prisma.ventaConsignacion.findMany({
    where: {
      consignacion: {
        company_id: companyId,
        proveedora_id: proveedoraId
      }
    },
    include: {
      consignacion: { include: { producto: true } },
      venta: true
    },
    orderBy: { fecha_venta: "desc" }
  });
};

// ---- REPORTE / LIQUIDACION ----

// Calcula cuanto se le debe a una proveedora (ventas sin liquidar)
export const calcularDeudaProveedora = async (companyId: number, proveedoraId: number) => {
  const ventas = await prisma.ventaConsignacion.findMany({
    where: {
      consignacion: {
        company_id: companyId,
        proveedora_id: proveedoraId,
        estado: "activo"
      }
    },
    include: {
      consignacion: { include: { producto: true } }
    }
  });

  const totalDeuda = ventas.reduce((sum, v) => sum + v.monto_a_reportar, 0);
  const totalGanancia = ventas.reduce((sum, v) => sum + v.tu_ganancia, 0);
  const totalVendido = ventas.reduce((sum, v) => sum + (v.precio_venta_usado * v.cantidad_vendida), 0);

  return { ventas, totalDeuda, totalGanancia, totalVendido };
};

export const createLiquidacion = async (data: {
  company_id: number;
  proveedora_id: number;
  monto_total: number;
  fecha_corte: Date;
  notas?: string;
  detalles: Array<{
    consignacion_id: number;
    ventas_incluidas: number;
    monto_consignacion: number;
  }>;
}) => {
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
      detalles: { include: { consignacion: { include: { producto: true } } } }
    }
  });
};

export const getLiquidacionesByProveedora = async (companyId: number, proveedoraId: number) => {
  return await prisma.liquidacionProveedora.findMany({
    where: { company_id: companyId, proveedora_id: proveedoraId },
    include: {
      detalles: { include: { consignacion: { include: { producto: true } } } }
    },
    orderBy: { fecha_creacion: "desc" }
  });
};

export const registrarPagoLiquidacion = async (liquidacionId: number, montoPagado: number) => {
  const liquidacion = await prisma.liquidacionProveedora.findUnique({
    where: { id: liquidacionId }
  });
  if (!liquidacion) throw new Error("Liquidacion no encontrada");

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
