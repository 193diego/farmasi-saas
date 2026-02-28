import { Router } from "express";
import * as inventoryController from "../controllers/inventoryController.js";
import { authenticateToken } from "../middlewares/auth.js";
const router = Router();
router.get("/", authenticateToken, inventoryController.getInventory);
router.patch("/stock", authenticateToken, inventoryController.updateStock);
export default router;
