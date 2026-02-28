// server/services/consignacionService.ts
import * as repo from "../repositories/consignacionRepository";
import prisma from "../prisma";

// ===================================================
//  PROVEEDORAS
// ===================================================

export const getProveedoras = async (companyId: number) => {
  const proveedoras = await repo.getProveedorasByCompany(companyId);

  return proveedoras.map(p => ({
    id: p.id,
    nombre: p.nombre,
    telefono: p.telefono,
    email: p.email,
    notas: p.notas,
    activo: p.activo,
    consignaciones_activas: p.consignaciones.length,
    productos_en_consignacion: p.consignaciones.map(c => ({
      id: c.id,
      producto: c.producto.nombre_producto,
      disponibles: c.cantidad_disponible
    }))
  }));
};

export const createProveedora = async (companyId: number, data: any) => {
  return await repo.createProveedora({
    company_id: companyId,
    nombre: data.nombre,
    telefono: data.telefono,
    email: data.email,
    notas: data.notas
  });
};

// ===================================================
//  CONSIGNACIONES
// ===================================================

export const getConsignaciones = async (companyId: number) => {
  const items = await repo.getConsignacionesByCompany(companyId);

  return items.map(c => {
    const totalVendido = c.cantidad_recibida - c.cantidad_disponible;

    // ✔ CORREGIDO: era c.ventaConsignacion → c.ventas_consignacion
    const totalReportarProveedora = c.ventas_consignacion.reduce(
      (sum: number, v) => sum + v.monto_a_reportar,
      0
    );

    // ✔ CORREGIDO: era c.ventaConsignacion → c.ventas_consignacion
    const tuGananciaTotal = c.ventas_consignacion.reduce(
      (sum: number, v) => sum + v.tu_ganancia,
      0
    );

    return {
      id: c.id,
      // ✔ CORREGIDO: c.proveedora ahora existe porque el repo hace include: { proveedora: true }
      proveedora: {
        id: c.proveedora.id,
        nombre: c.proveedora.nombre
      },
      // ✔ CORREGIDO: c.producto ahora existe porque el repo hace include: { producto: true }
      producto: {
        id: c.producto_global_id,
        nombre: c.producto.nombre_producto,
        imagen_url: c.producto.imagen_url
      },
      cantidad_recibida: c.cantidad_recibida,
      cantidad_disponible: c.cantidad_disponible,
      cantidad_vendida: totalVendido,
      precio_costo: c.precio_costo,
      precio_venta_proveedora: c.precio_venta_proveedora,
      precio_venta_tuyo: c.precio_venta_tuyo,
      total_a_reportar_proveedora: totalReportarProveedora,
      tu_ganancia_total: tuGananciaTotal,
      estado: c.estado,
      fecha_recepcion: c.fecha_recepcion,
      notas: c.notas
    };
  });
};

export const createConsignacion = async (companyId: number, data: any) => {
  return await repo.createConsignacion({
    company_id: companyId,
    proveedora_id: Number(data.proveedora_id),
    producto_global_id: Number(data.producto_global_id),
    cantidad_recibida: Number(data.cantidad_recibida),
    precio_costo: Number(data.precio_costo),
    precio_venta_proveedora: Number(data.precio_venta_proveedora),
    precio_venta_tuyo: Number(data.precio_venta_tuyo),
    notas: data.notas
  });
};

// ===================================================
//  REPORTE A PROVEEDORA
// ===================================================

export const getReporteProveedora = async (companyId: number, proveedoraId: number) => {
  const proveedora = await prisma.proveedora.findFirst({
    where: { id: proveedoraId, company_id: companyId }
  });

  if (!proveedora) throw new Error("Proveedora no encontrada");

  const consignaciones = await repo.getConsignacionesByProveedora(
    companyId,
    proveedoraId
  );

  const { ventas, totalDeuda, totalGanancia, totalVendido } =
    await repo.calcularDeudaProveedora(companyId, proveedoraId);

  const liquidaciones = await repo.getLiquidacionesByProveedora(
    companyId,
    proveedoraId
  );

  const detallePorConsignacion = consignaciones.map(c => {
    const ventasDeEsta = ventas.filter(v => v.consignacion_id === c.id);

    return {
      consignacion_id: c.id,
      // ✔ CORREGIDO: c.producto existe porque getConsignacionesByProveedora incluye producto
      producto: c.producto.nombre_producto,
      imagen_url: c.producto.imagen_url,
      recibidos: c.cantidad_recibida,
      disponibles: c.cantidad_disponible,
      vendidos: ventasDeEsta.reduce((s: number, v) => s + v.cantidad_vendida, 0),
      precio_proveedora: c.precio_venta_proveedora,
      precio_tuyo: c.precio_venta_tuyo,
      deuda_a_proveedora: ventasDeEsta.reduce((s: number, v) => s + v.monto_a_reportar, 0),
      tu_ganancia: ventasDeEsta.reduce((s: number, v) => s + v.tu_ganancia, 0),
      ventas: ventasDeEsta.map(v => ({
        fecha: v.fecha_venta,
        cantidad: v.cantidad_vendida,
        precio_vendido: v.precio_venta_usado,
        monto_reportar: v.monto_a_reportar,
        ganancia: v.tu_ganancia
      }))
    };
  });

  return {
    proveedora: {
      id: proveedora.id,
      nombre: proveedora.nombre,
      telefono: proveedora.telefono,
      email: proveedora.email
    },
    resumen: {
      total_deuda_actual: totalDeuda,
      tu_ganancia_total: totalGanancia,
      total_vendido: totalVendido,
      productos_en_consignacion: consignaciones.filter(c => c.estado === "activo").length
    },
    detalle: detallePorConsignacion,
    liquidaciones_anteriores: liquidaciones.map(l => ({
      id: l.id,
      monto_total: l.monto_total,
      monto_pagado: l.monto_pagado,
      estado: l.estado,
      fecha_corte: l.fecha_corte,
      fecha_pago: l.fecha_pago
    }))
  };
};

// ===================================================
//  CREAR LIQUIDACIÓN
// ===================================================

export const crearLiquidacion = async (companyId: number, proveedoraId: number, notas?: string) => {
  const { ventas, totalDeuda } = await repo.calcularDeudaProveedora(
    companyId,
    proveedoraId
  );

  if (totalDeuda <= 0)
    throw new Error("No hay deuda pendiente con esta proveedora");

  const agrupadas = new Map<number, { ventas: number; monto: number }>();

  ventas.forEach(v => {
    const prev = agrupadas.get(v.consignacion_id) || { ventas: 0, monto: 0 };
    agrupadas.set(v.consignacion_id, {
      ventas: prev.ventas + 1,
      monto: prev.monto + v.monto_a_reportar
    });
  });

  const detalles = Array.from(agrupadas.entries()).map(
    ([consignacion_id, data]) => ({
      consignacion_id,
      ventas_incluidas: data.ventas,
      monto_consignacion: data.monto
    })
  );

  return await repo.createLiquidacion({
    company_id: companyId,
    proveedora_id: proveedoraId,
    monto_total: totalDeuda,
    fecha_corte: new Date(),
    notas,
    detalles
  });
};

export const registrarPago = async (liquidacionId: number, montoPagado: number) => {
  return repo.registrarPagoLiquidacion(liquidacionId, montoPagado);
};