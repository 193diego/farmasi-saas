// server/routes/expenseRoutes.ts
import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import prisma from "../prisma";
const router = Router();
// GET /api/expenses
router.get("/", authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const gastos = await prisma.gasto.findMany({
            where: { company_id: companyId },
            orderBy: { fecha_gasto: "desc" }
        });
        const result = gastos.map(g => ({
            id: g.id,
            concept: g.tipo_gasto,
            description: g.descripcion,
            category: g.tipo_gasto,
            amount: g.monto,
            date: g.fecha_gasto.toISOString().split("T")[0]
        }));
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// POST /api/expenses
router.post("/", authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { concept, description, amount, category } = req.body;
        const gasto = await prisma.gasto.create({
            data: {
                company_id: companyId,
                tipo_gasto: category || concept,
                descripcion: description,
                monto: Number(amount),
            }
        });
        res.status(201).json({
            id: gasto.id,
            concept: gasto.tipo_gasto,
            description: gasto.descripcion,
            category: gasto.tipo_gasto,
            amount: gasto.monto,
            date: gasto.fecha_gasto.toISOString().split("T")[0]
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
export default router;
