import { Router } from "express";
import * as salesController from "../controllers/salesController.js";
import { authenticateToken } from "../middlewares/auth.js";
const router = Router();
router.post("/", authenticateToken, salesController.createSale);
router.get("/", authenticateToken, salesController.getSales);
export default router;
