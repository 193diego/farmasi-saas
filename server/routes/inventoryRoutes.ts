// server/routes/inventoryRoutes.ts
import { Router } from "express";
import * as inventoryController from "../controllers/inventoryController.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.js";
import prisma from "../prisma.js";

const router = Router();

router.get("/", authenticateToken, inventoryController.getInventory);
router.patch("/stock", authenticateToken, inventoryController.updateStock);

// ── PATCH /api/inventory/:id → editar stock + precios + imagen ──
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { stock, precio_venta, precio_compra, imagen_url } = req.body;
    const user = (req as any).user;

    const item = await prisma.inventarioEmpresa.findFirst({
      where: { id, company_id: user.company_id },
      include: { producto: true },
    });

    if (!item) return res.status(404).json({ message: "Producto no encontrado" });

    // Actualizar inventario de la empresa (stock + precios)
    const updated = await prisma.inventarioEmpresa.update({
      where: { id },
      data: {
        ...(stock !== undefined ? { stock: Number(stock) } : {}),
        ...(precio_venta !== undefined ? { precio_venta: Number(precio_venta) } : {}),
        ...(precio_compra !== undefined ? { precio_compra: Number(precio_compra) } : {}),
      },
      include: { producto: true },
    });

    // ✅ Si viene imagen_url, actualizar el ProductoGlobal (afecta a todas las empresas)
    if (imagen_url !== undefined) {
      await prisma.productoGlobal.update({
        where: { id: item.producto_global_id },
        data: { imagen_url: imagen_url?.trim() || null },
      });
    }

    res.json({
      id: updated.id,
      nombre: updated.producto.nombre_producto,
      categoria: updated.producto.categoria,
      descripcion: updated.producto.descripcion,
      stock: updated.stock,
      precio_venta: updated.precio_venta,
      precio_compra: updated.precio_compra,
      // Devolver la imagen actualizada
      imagen_url: imagen_url !== undefined ? (imagen_url?.trim() || null) : updated.producto.imagen_url,
      marca: updated.producto.marca,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── GET /api/inventory/global → catálogo global ──
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

// ── POST /api/inventory/global → crear producto global ──
router.post(
  "/global",
  authenticateToken,
  authorizeRoles("super_admin", "owner"),
  async (req, res) => {
    try {
      const { nombre_producto, categoria, descripcion, imagen_url, codigo_base, precio_venta, precio_compra, stock } = req.body;
      const user = (req as any).user;

      if (!nombre_producto?.trim() || !categoria?.trim()) {
        return res.status(400).json({ message: "Nombre y categoría son obligatorios" });
      }

      const codigoFinal =
        codigo_base?.trim() ||
        `USR-${nombre_producto.substring(0, 4).toUpperCase().replace(/\s/g, "")}-${Date.now()}`;

      const producto = await prisma.$transaction(async (tx) => {
        // 1. Crear el producto global
        const p = await tx.productoGlobal.create({
          data: {
            nombre_producto: nombre_producto.trim(),
            categoria: categoria.trim(),
            marca: "Farmasi",
            codigo_base: codigoFinal,
            descripcion: descripcion?.trim() || null,
            imagen_url: imagen_url?.trim() || null,
            activo: true,
          },
        });

        // 2. Agregar al inventario de TODAS las empresas en cero
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

        // 3. Si el owner que crea manda precios/stock, actualizarlos solo en su empresa
        if (user.company_id && (precio_venta || precio_compra || stock)) {
          await tx.inventarioEmpresa.updateMany({
            where: { company_id: user.company_id, producto_global_id: p.id },
            data: {
              stock: Number(stock) || 0,
              precio_venta: Number(precio_venta) || 0,
              precio_compra: Number(precio_compra) || 0,
            },
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