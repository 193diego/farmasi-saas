// server/routes/salesRoutes.ts
import { Router } from "express";
import * as salesController from "../controllers/salesController.js";
import { authenticateToken } from "../middlewares/auth.js";
import prisma from "../prisma.js";

const router = Router();

router.post("/", authenticateToken, salesController.createSale);
router.get("/", authenticateToken, salesController.getSales);

// ✅ NUEVO: DELETE /api/sales/:id — Eliminar venta y restaurar stock
router.delete("/:id", authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    const saleId = Number(req.params.id);

    // Buscar la venta con sus detalles (nombre correcto del schema: detalles)
    const venta = await prisma.venta.findFirst({
      where: { id: saleId, company_id: companyId },
      include: {
        detalles: true,
      },
    });

    if (!venta) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Restaurar stock en inventario por cada detalle
      for (const detalle of venta.detalles) {
        await tx.inventarioEmpresa.updateMany({
          where: {
            company_id: companyId,
            producto_global_id: detalle.producto_global_id,
          },
          data: {
            stock: { increment: detalle.cantidad },
          },
        });
      }

      // 2. Eliminar ventas consignacion relacionadas si existen
      await tx.ventaConsignacion.deleteMany({ where: { venta_id: saleId } });

      // 3. Eliminar detalles de la venta
      await tx.detalleVenta.deleteMany({ where: { venta_id: saleId } });

      // 4. Eliminar cuenta por cobrar si existe
      await tx.cuentaPorCobrar.deleteMany({ where: { venta_id: saleId } });

      // 5. Eliminar la venta
      await tx.venta.delete({ where: { id: saleId } });
    });

    res.json({ success: true, message: "Venta eliminada y stock restaurado" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;