import { Request, Response } from "express";
import * as salesService from "../services/salesService.js";

export const createSale = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id;
    const sale = await salesService.createSale(companyId, req.body);
    res.status(201).json(sale);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getSales = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id;
    const sales = await salesService.getSales(companyId);
    res.json(sales);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

