import * as salesRepository from "../repositories/salesRepository.js";
import prisma from "../prisma.js";

export const createSale = async (companyId: number, data: any) => {
  return await prisma.$transaction(async (tx) => {
    // Calcular total con descuentos
    const totalConDescuento = data.items.reduce((s: number, item: any) => {
      const subtotal = item.precio_unitario * item.cantidad;
      const descItem = item.descuento || 0;
      return s + subtotal - descItem;
    }, 0);
    // Aplicar descuento global de factura si existe
    const descuentoGlobal = Number(data.descuento_global) || 0;
    const totalFinal = Math.max(0, totalConDescuento - descuentoGlobal);

    const sale = await tx.venta.create({
      data: {
        company_id: companyId,
        cliente_id: data.cliente_id || null,
        total: totalFinal,
        monto_pagado: Number(data.monto_pagado) || totalFinal,
        estado: data.estado || "pagado",
        detalles: {
          create: data.items.map((item: any) => ({
            // ✅ FIX CRÍTICO: producto_global_id viene resuelto desde el frontend
            producto_global_id: item.producto_global_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            descuento: item.descuento || 0,
            subtotal: (item.precio_unitario * item.cantidad) - (item.descuento || 0),
          }))
        }
      },
      include: { detalles: true }
    });

    // Descontar stock
    for (const item of data.items) {
      const invItem = await tx.inventarioEmpresa.findFirst({
        where: { company_id: companyId, producto_global_id: item.producto_global_id }
      });
      if (!invItem || invItem.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para producto ID ${item.producto_global_id}`);
      }
      await tx.inventarioEmpresa.update({
        where: { id: invItem.id },
        data: { stock: invItem.stock - item.cantidad }
      });
    }

    // Si es fiado, actualizar saldo del cliente
    if (data.estado === "fiado" && data.cliente_id) {
      const pendiente = totalFinal - (Number(data.monto_pagado) || 0);
      if (pendiente > 0) {
        await tx.cliente.update({
          where: { id: data.cliente_id },
          data: { saldo_pendiente: { increment: pendiente } }
        });
        await tx.cuentaPorCobrar.create({
          data: {
            venta_id: sale.id,
            monto_pendiente: pendiente,
            fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            estado: "pendiente"
          }
        });
      }
    }

    return sale;
  });
};

export const getSales = async (companyId: number) => {
  const sales = await salesRepository.getSalesByCompany(companyId);
  return sales.map(sale => ({
    id: sale.id,
    customer: sale.cliente?.nombre || "Consumidor Final",
    date: sale.fecha_venta.toISOString().split("T")[0],
    total: sale.total,
    monto_pagado: sale.monto_pagado,
    status: sale.estado,
    items: sale.detalles.map((d: any) => ({
      productId: d.producto_global_id,
      name: d.producto.nombre_producto,
      quantity: d.cantidad,
      price: d.precio_unitario,
      discount: d.descuento || 0,
      subtotal: d.subtotal
    }))
  }));
};