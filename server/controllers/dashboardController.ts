import { Request, Response } from "express";
import * as dashboardService from "../services/dashboardService";

export const getAdminFinancials = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id;
    if (!companyId) return res.status(403).json({ message: "No tienes una empresa asignada" });
    const data = await dashboardService.getAdminDashboardData(companyId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSuperAdminStats = async (req: Request, res: Response) => {
  try {
    const data = await dashboardService.getSuperAdminDashboardData();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
