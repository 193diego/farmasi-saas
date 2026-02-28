import { Router } from "express";
import * as dashboardController from "../controllers/dashboardController";
import { authenticateToken, authorizeRoles } from "../middlewares/auth";

const router = Router();

router.get("/financials", authenticateToken, dashboardController.getAdminFinancials);
router.get("/super-admin/stats", authenticateToken, authorizeRoles("super_admin"), dashboardController.getSuperAdminStats);

export default router;
