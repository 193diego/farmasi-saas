// server/routes/index.ts  (REEMPLAZA EL EXISTENTE)
import { Router } from "express";
import authRoutes from "./authRoutes.js";
import inventoryRoutes from "./inventoryRoutes.js";
import salesRoutes from "./salesRoutes.js";
import companyRoutes from "./companyRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import consignacionRoutes from "./consignacionRoutes.js";  // NUEVO

const router = Router();

router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/sales", salesRoutes);
router.use("/companies", companyRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/consignacion", consignacionRoutes);  // NUEVO

export default router;

