import { Router } from "express";
import * as companyController from "../controllers/companyController";
import { authenticateToken, authorizeRoles } from "../middlewares/auth";

const router = Router();

router.post("/", authenticateToken, authorizeRoles("super_admin"), companyController.createCompany);
router.get("/", authenticateToken, authorizeRoles("super_admin"), companyController.getCompanies);
router.get("/plans", authenticateToken, companyController.getPlans);

export default router;
