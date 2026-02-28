import { Router } from "express";
import * as dashboardController from "../controllers/dashboardController.ts";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.ts";

const router = Router();

router.get("/financials", authenticateToken, dashboardController.getAdminFinancials);
router.get("/super-admin/stats", authenticateToken, authorizeRoles("super_admin"), dashboardController.getSuperAdminStats);

export default router;
