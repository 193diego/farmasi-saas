// server/routes/companyRoutes.ts
import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.js";
import prisma from "../prisma.js";
import bcrypt from "bcryptjs";

const router = Router();

// ── GET /api/companies  →  listar todas las empresas (super_admin) ──
router.get(
  "/",
  authenticateToken,
  authorizeRoles("super_admin"),
  async (_req, res) => {
    try {
      const companies = await prisma.company.findMany({
        include: {
          plan: true,
          _count: { select: { users: true } },
        },
        orderBy: { fecha_creacion: "desc" },
      });
      res.json(companies);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }
);

// ── GET /api/companies/plans  →  listar planes disponibles ──
router.get("/plans", authenticateToken, async (_req, res) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { precio: "asc" } });
    res.json(plans);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── POST /api/companies  →  crear empresa + inventario inicial ──
router.post(
  "/",
  authenticateToken,
  authorizeRoles("super_admin"),
  async (req, res) => {
    try {
      const { nombre_empresa, plan_id, fecha_vencimiento } = req.body;

      const company = await prisma.$transaction(async (tx) => {
        const c = await tx.company.create({
          data: {
            nombre_empresa,
            plan_id: Number(plan_id),
            estado: "activo",
            fecha_vencimiento: new Date(fecha_vencimiento),
          },
        });

        // Crear registros de inventario en cero para todos los productos globales
        const globalProducts = await tx.productoGlobal.findMany({
          where: { activo: true },
        });

        if (globalProducts.length > 0) {
          await tx.inventarioEmpresa.createMany({
            data: globalProducts.map((p) => ({
              company_id: c.id,
              producto_global_id: p.id,
              stock: 0,
              precio_compra: 0,
              precio_venta: 0,
            })),
          });
        }

        return c;
      });

      res.status(201).json(company);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// ── POST /api/companies/create-owner  →  crear usuario owner para una empresa ──
router.post(
  "/create-owner",
  authenticateToken,
  authorizeRoles("super_admin"),
  async (req, res) => {
    try {
      const { company_id, nombre, email, password } = req.body;

      if (!company_id || !nombre || !email || !password) {
        return res.status(400).json({ message: "Todos los campos son requeridos" });
      }

      // Verificar que la empresa exista
      const company = await prisma.company.findUnique({
        where: { id: Number(company_id) },
      });
      if (!company) {
        return res.status(404).json({ message: "Empresa no encontrada" });
      }

      // Verificar que el email no exista
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: "Ya existe un usuario con ese email" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          company_id: Number(company_id),
          nombre,
          email,
          password: hashedPassword,
          rol: "owner",
          activo: true,
        },
      });

      res.status(201).json({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        company_id: user.company_id,
      });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// ── PATCH /api/companies/:id/estado  →  activar/desactivar empresa ──
router.patch(
  "/:id/estado",
  authenticateToken,
  authorizeRoles("super_admin"),
  async (req, res) => {
    try {
      const { estado } = req.body;
      const company = await prisma.company.update({
        where: { id: Number(req.params.id) },
        data: { estado },
      });
      res.json(company);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

export default router;
