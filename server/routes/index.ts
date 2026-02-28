// server/routes/index.ts
import { Router } from "express";
import authRoutes from "./authRoutes.js";
import inventoryRoutes from "./inventoryRoutes.js";
import salesRoutes from "./salesRoutes.js";
import companyRoutes from "./companyRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import consignacionRoutes from "./consignacionRoutes.js";
import customerRoutes from "./customerRoutes.js";
import expenseRoutes from "./expenseRoutes.js";
import reportRoutes from "./reportRoutes.js";

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

