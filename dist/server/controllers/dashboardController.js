import * as dashboardService from "../services/dashboardService";
export const getAdminFinancials = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        if (!companyId)
            return res.status(403).json({ message: "No tienes una empresa asignada" });
        const data = await dashboardService.getAdminDashboardData(companyId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getSuperAdminStats = async (req, res) => {
    try {
        const data = await dashboardService.getSuperAdminDashboardData();
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
