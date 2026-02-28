// server/routes/index.ts
import { Router } from "express";
import authRoutes from "./authRoutes";
import inventoryRoutes from "./inventoryRoutes";
import salesRoutes from "./salesRoutes";
import companyRoutes from "./companyRoutes";
import dashboardRoutes from "./dashboardRoutes";
import consignacionRoutes from "./consignacionRoutes";
import customerRoutes from "./customerRoutes";
import expenseRoutes from "./expenseRoutes";
import reportRoutes from "./reportRoutes";

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
