import { Router } from "express";
import * as salesController from "../controllers/salesController";
import { authenticateToken } from "../middlewares/auth";
const router = Router();
router.post("/", authenticateToken, salesController.createSale);
router.get("/", authenticateToken, salesController.getSales);
export default router;
