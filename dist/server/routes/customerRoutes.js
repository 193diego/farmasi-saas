// server/routes/customerRoutes.ts
import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import prisma from "../prisma.js";
const router = Router();
// GET /api/customers
router.get("/", authenticateToken, async (req, res) => {
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
        const result = clientes.map(c => ({
            id: c.id,
            name: c.nombre,
            phone: c.telefono,
            address: c.direccion,
            saldo_pendiente: c.saldo_pendiente,
            fecha_creacion: c.fecha_creacion,
            totalSpent: c.ventas.reduce((s, v) => s + v.total, 0),
            totalPurchases: c.ventas.length,
            lastPurchase: c.ventas.length > 0
                ? c.ventas.sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())[0].fecha_venta
                : null
        }));
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// POST /api/customers
router.post("/", authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { name, phone, address } = req.body;
        const cliente = await prisma.cliente.create({
            data: {
                company_id: companyId,
                nombre: name,
                telefono: phone,
                direccion: address,
            }
        });
        res.status(201).json({ ...cliente, name: cliente.nombre });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// PATCH /api/customers/:id/abono
router.patch("/:id/abono", authenticateToken, async (req, res) => {
    try {
        const clienteId = Number(req.params.id);
        const { monto } = req.body;
        const cliente = await prisma.cliente.update({
            where: { id: clienteId },
            data: { saldo_pendiente: { decrement: Number(monto) } }
        });
        res.json(cliente);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
export default router;
