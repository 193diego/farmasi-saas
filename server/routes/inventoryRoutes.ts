// server/routes/inventoryRoutes.ts
import { Router } from "express";
import * as inventoryController from "../controllers/inventoryController.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.js";
import prisma from "../prisma.js";

const router = Router();

// ── GET /api/inventory ──
router.get("/", authenticateToken, inventoryController.getInventory);

// ── PATCH /api/inventory/stock ──
router.patch("/stock", authenticateToken, inventoryController.updateStock);

// ── PATCH /api/inventory/:id  →  editar stock + precios ──
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { stock, precio_venta, precio_compra } = req.body;
    const user = (req as any).user;

    const item = await prisma.inventarioEmpresa.findFirst({
      where: { id, company_id: user.company_id },
      include: { producto: true },
    });

    if (!item) {
      return res.status(404).json({ message: "Producto no encontrado en tu inventario" });
    }

    const updated = await prisma.inventarioEmpresa.update({
      where: { id },
      data: {
        ...(stock !== undefined ? { stock: Number(stock) } : {}),
        ...(precio_venta !== undefined ? { precio_venta: Number(precio_venta) } : {}),
        ...(precio_compra !== undefined ? { precio_compra: Number(precio_compra) } : {}),
      },
      include: { producto: true },
    });

    res.json({
      id: updated.id,
      nombre: updated.producto.nombre_producto,
      categoria: updated.producto.categoria,
      stock: updated.stock,
      precio_venta: updated.precio_venta,
      precio_compra: updated.precio_compra,
      imagen_url: updated.producto.imagen_url,
      marca: updated.producto.marca,
      descripcion: updated.producto.descripcion,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── GET /api/inventory/global  →  todos los roles pueden ver ──
router.get("/global", authenticateToken, async (_req, res) => {
  try {
    const products = await prisma.productoGlobal.findMany({
      where: { activo: true },
      orderBy: [{ categoria: "asc" }, { nombre_producto: "asc" }],
    });
    res.json(products);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── POST /api/inventory/global  →  super_admin Y owner pueden crear ──
router.post(
  "/global",
  authenticateToken,
  authorizeRoles("super_admin", "owner"),
  async (req, res) => {
    try {
      const { nombre_producto, categoria, marca, codigo_base, descripcion, imagen_url } = req.body;

      if (!nombre_producto || !categoria) {
        return res.status(400).json({ message: "Nombre y categoría son obligatorios" });
      }

      // Si no viene codigo_base generar uno automático
      const codigoFinal = codigo_base?.trim() ||
        `USR-${nombre_producto.substring(0, 3).toUpperCase()}-${Date.now()}`;

      const producto = await prisma.$transaction(async (tx) => {
        const p = await tx.productoGlobal.create({
          data: {
            nombre_producto,
            categoria,
            marca: marca || null,
            codigo_base: codigoFinal,
            descripcion: descripcion || null,
            imagen_url: imagen_url || null,
            activo: true,
          },
        });

        // ✅ Agregar al inventario de TODAS las empresas en cero automáticamente
        const companies = await tx.company.findMany({ select: { id: true } });
        if (companies.length > 0) {
          await tx.inventarioEmpresa.createMany({
            data: companies.map((c) => ({
              company_id: c.id,
              producto_global_id: p.id,
              stock: 0,
              precio_compra: 0,
              precio_venta: 0,
            })),
            skipDuplicates: true,
          });
        }

        return p;
      });

      res.status(201).json(producto);
    } catch (e: any) {
      if (e.code === "P2002") {
        return res.status(400).json({ message: "Ya existe un producto con ese código" });
      }
      res.status(400).json({ message: e.message });
    }
  }
);

export default router;
