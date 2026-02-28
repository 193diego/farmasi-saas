import { Request, Response } from "express";
import * as companyService from "../services/companyService";

export const createCompany = async (req: Request, res: Response) => {
  try {
    const company = await companyService.createCompanyWithInventory(req.body);
    res.status(201).json(company);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await companyService.getCompanies();
    res.json(companies);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await companyService.getPlans();
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
