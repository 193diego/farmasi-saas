import { Router } from "express";
import * as inventoryController from "../controllers/inventoryController";
import { authenticateToken } from "../middlewares/auth";

const router = Router();

router.get("/", authenticateToken, inventoryController.getInventory);
router.patch("/stock", authenticateToken, inventoryController.updateStock);

export default router;
