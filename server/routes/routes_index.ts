// server/routes/index.ts  (REEMPLAZA EL EXISTENTE)
import { Router } from "express";
import authRoutes from "./authRoutes.ts";
import inventoryRoutes from "./inventoryRoutes.ts";
import salesRoutes from "./salesRoutes.ts";
import companyRoutes from "./companyRoutes.ts";
import dashboardRoutes from "./dashboardRoutes.ts";
import consignacionRoutes from "./consignacionRoutes.ts";  // NUEVO

const router = Router();

router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/sales", salesRoutes);
router.use("/companies", companyRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/consignacion", consignacionRoutes);  // NUEVO

export default router;
