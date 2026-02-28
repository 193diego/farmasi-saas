import * as consignacionService from "../services/consignacionService.js";
// ---- PROVEEDORAS ----
export const getProveedoras = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const data = await consignacionService.getProveedoras(companyId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const createProveedora = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const proveedora = await consignacionService.createProveedora(companyId, req.body);
        res.status(201).json(proveedora);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// ---- CONSIGNACIONES ----
export const getConsignaciones = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const data = await consignacionService.getConsignaciones(companyId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const createConsignacion = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const consignacion = await consignacionService.createConsignacion(companyId, req.body);
        res.status(201).json(consignacion);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// ---- REPORTE ----
export const getReporteProveedora = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const proveedoraId = Number(req.params.proveedoraId);
        const reporte = await consignacionService.getReporteProveedora(companyId, proveedoraId);
        res.json(reporte);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const crearLiquidacion = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const proveedoraId = Number(req.params.proveedoraId);
        const { notas } = req.body;
        const liquidacion = await consignacionService.crearLiquidacion(companyId, proveedoraId, notas);
        res.status(201).json(liquidacion);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const registrarPago = async (req, res) => {
    try {
        const liquidacionId = Number(req.params.liquidacionId);
        const { monto_pagado } = req.body;
        const result = await consignacionService.registrarPago(liquidacionId, Number(monto_pagado));
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
