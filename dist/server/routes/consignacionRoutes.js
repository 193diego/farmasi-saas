// server/routes/consignacionRoutes.ts
import { Router } from "express";
import * as ctrl from "../controllers/consignacionController";
import { authenticateToken } from "../middlewares/auth";
const router = Router();
// Proveedoras
router.get("/proveedoras", authenticateToken, ctrl.getProveedoras);
router.post("/proveedoras", authenticateToken, ctrl.createProveedora);
// Consignaciones
router.get("/", authenticateToken, ctrl.getConsignaciones);
router.post("/", authenticateToken, ctrl.createConsignacion);
// Reporte por proveedora
router.get("/reporte/:proveedoraId", authenticateToken, ctrl.getReporteProveedora);
// Liquidaciones
router.post("/liquidar/:proveedoraId", authenticateToken, ctrl.crearLiquidacion);
router.patch("/pago/:liquidacionId", authenticateToken, ctrl.registrarPago);
export default router;
