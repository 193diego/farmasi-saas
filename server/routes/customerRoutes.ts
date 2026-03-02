// server/routes/customerRoutes.ts
// ✅ ACTUALIZADO: Agrega campos cedula y email al modelo Cliente
// IMPORTANTE: Debes agregar estas columnas al schema de Prisma:
//   cedula  String?
//   email   String?
// Y luego correr: npx prisma db push
import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import prisma from "../prisma.js";

const router = Router();

// GET /api/customers
router.get("/", authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    const clientes = await prisma.cliente.findMany({
      where: { company_id: companyId },
      include: {
        ventas: {
          select: { total: true, estado: true, fecha_venta: true }
        }
      },
      orderBy: { fecha_creacion: "desc" }
    });

    const result = clientes.map((c: any) => ({
      id: c.id,
      name: c.nombre,
      phone: c.telefono,
      address: c.direccion,
      email: c.email || null,       // ✅ NUEVO
      cedula: c.cedula || null,     // ✅ NUEVO
      saldo_pendiente: c.saldo_pendiente,
      fecha_creacion: c.fecha_creacion,
      totalSpent: c.ventas.reduce((s: number, v: any) => s + v.total, 0),
      totalPurchases: c.ventas.length,
      lastPurchase: c.ventas.length > 0
        ? c.ventas.sort((a: any, b: any) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())[0].fecha_venta
        : null
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/customers
router.post("/", authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    const { name, phone, address, email, cedula } = req.body;

    const cliente = await prisma.cliente.create({
      data: {
        company_id: companyId,
        nombre: name,
        telefono: phone || null,
        direccion: address || null,
        email: email || null,       // ✅ NUEVO
        cedula: cedula || null,     // ✅ NUEVO
      } as any,  // "as any" hasta que prisma regenere con los nuevos campos
    });

    res.status(201).json({ ...cliente, name: (cliente as any).nombre, email: (cliente as any).email, cedula: (cliente as any).cedula });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH /api/customers/:id/abono
router.patch("/:id/abono", authenticateToken, async (req: any, res) => {
  try {
    const clienteId = Number(req.params.id);
    const { monto } = req.body;
    const cliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: { saldo_pendiente: { decrement: Number(monto) } }
    });
    res.json(cliente);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;