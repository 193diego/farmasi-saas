import { Router } from "express";
import * as inventoryController from "../controllers/inventoryController.ts";
import { authenticateToken } from "../middlewares/auth.ts";

const router = Router();

router.get("/", authenticateToken, inventoryController.getInventory);
router.patch("/stock", authenticateToken, inventoryController.updateStock);

export default router;
