// server/routes/index.ts
import { Router } from "express";
import authRoutes from "./authRoutes.ts";
import inventoryRoutes from "./inventoryRoutes.ts";
import salesRoutes from "./salesRoutes.ts";
import companyRoutes from "./companyRoutes.ts";
import dashboardRoutes from "./dashboardRoutes.ts";
import consignacionRoutes from "./consignacionRoutes.ts";
import customerRoutes from "./customerRoutes.ts";
import expenseRoutes from "./expenseRoutes.ts";
import reportRoutes from "./reportRoutes.ts";

const router = Router();

router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/sales", salesRoutes);
router.use("/companies", companyRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/consignacion", consignacionRoutes);
router.use("/customers", customerRoutes);
router.use("/expenses", expenseRoutes);
router.use("/reports", reportRoutes);

export default router;