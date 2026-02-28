import { Request, Response } from "express";
import * as inventoryService from "../services/inventoryService.ts";

export const getInventory = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id;
    if (!companyId) {
      return res.status(403).json({ message: "No tienes una empresa asignada" });
    }
    const inventory = await inventoryService.getInventory(companyId);
    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const { id, stock } = req.body;
    const result = await inventoryService.updateStock(Number(id), Number(stock));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
