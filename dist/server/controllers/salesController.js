import * as salesService from "../services/salesService.js";
export const createSale = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const sale = await salesService.createSale(companyId, req.body);
        res.status(201).json(sale);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const getSales = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const sales = await salesService.getSales(companyId);
        res.json(sales);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
