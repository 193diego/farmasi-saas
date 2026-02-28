import * as salesRepository from "../repositories/salesRepository.ts";
import * as inventoryRepository from "../repositories/inventoryRepository.ts";
import prisma from "../prisma.ts";

export const createSale = async (companyId: number, data: any) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Create the sale
    const sale = await tx.venta.create({
      data: {
        company_id: companyId,
        cliente_id: data.cliente_id,
        total: data.total,
        estado: data.estado,
        detalles: {
          create: data.items.map((item: any) => ({
            producto_global_id: item.producto_global_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal
          }))
        }
      },
      include: {
        detalles: true
      }
    });

    // 2. Update stock for each item
    for (const item of data.items) {
      const inventoryItem = await tx.inventarioEmpresa.findFirst({
        where: {
          company_id: companyId,
          producto_global_id: item.producto_global_id
        }
      });

      if (!inventoryItem || inventoryItem.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para el producto ID ${item.producto_global_id}`);
      }

      await tx.inventarioEmpresa.update({
        where: { id: inventoryItem.id },
        data: {
          stock: inventoryItem.stock - item.cantidad
        }
      });
    }

    // 3. If it's a debt (fiado), update customer balance
    if (data.estado === "fiado" && data.cliente_id) {
      const pendingAmount = data.total - (data.paidAmount || 0);
      await tx.cliente.update({
        where: { id: data.cliente_id },
        data: {
          saldo_pendiente: {
            increment: pendingAmount
          }
        }
      });

      // Create account receivable
      await tx.cuentaPorCobrar.create({
        data: {
          venta_id: sale.id,
          monto_pendiente: pendingAmount,
          fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          estado: "pendiente"
        }
      });
    }

    return sale;
  });
};

export const getSales = async (companyId: number) => {
  const sales = await salesRepository.getSalesByCompany(companyId);
  return sales.map(sale => ({
    id: `#V-${sale.id}`,
    customer: sale.cliente?.nombre || "Consumidor Final",
    date: sale.fecha_venta.toISOString().split('T')[0],
    total: sale.total,
    status: sale.estado,
    items: sale.detalles.map(d => ({
      productId: d.producto_global_id,
      name: d.producto.nombre_producto,
      quantity: d.cantidad,
      price: d.precio_unitario,
      subtotal: d.subtotal
    }))
  }));
};
