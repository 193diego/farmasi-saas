import * as companyService from "../services/companyService";
export const createCompany = async (req, res) => {
    try {
        const company = await companyService.createCompanyWithInventory(req.body);
        res.status(201).json(company);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const getCompanies = async (req, res) => {
    try {
        const companies = await companyService.getCompanies();
        res.json(companies);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getPlans = async (req, res) => {
    try {
        const plans = await companyService.getPlans();
        res.json(plans);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
