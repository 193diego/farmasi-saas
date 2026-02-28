// server/routes/index.ts  (REEMPLAZA EL EXISTENTE)
import { Router } from "express";
import authRoutes from "./authRoutes";
import inventoryRoutes from "./inventoryRoutes";
import salesRoutes from "./salesRoutes";
import companyRoutes from "./companyRoutes";
import dashboardRoutes from "./dashboardRoutes";
import consignacionRoutes from "./consignacionRoutes"; // NUEVO
const router = Router();
router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/sales", salesRoutes);
router.use("/companies", companyRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/consignacion", consignacionRoutes); // NUEVO
export default router;
