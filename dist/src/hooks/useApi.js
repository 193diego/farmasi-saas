// src/hooks/useApi.ts
// Hook central para todas las llamadas a la API
const BASE = "/api";
export function getToken() {
    return localStorage.getItem("farmasi_token") || "";
}
export function getUser() {
    const u = localStorage.getItem("farmasi_user");
    return u ? JSON.parse(u) : null;
}
async function req(method, path, body) {
    const token = getToken();
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
        localStorage.removeItem("farmasi_token");
        localStorage.removeItem("farmasi_user");
        window.location.href = "/";
        throw new Error("Sesión expirada");
    }
    const data = await res.json();
    if (!res.ok)
        throw new Error(data.message || "Error en la solicitud");
    return data;
}
export const api = {
    // Auth
    login: (email, password) => req("POST", "/auth/login", { email, password }),
    // Inventario
    getInventory: () => req("GET", "/inventory"),
    updateStock: (id, stock) => req("PATCH", "/inventory/stock", { id, stock }),
    // Ventas
    getSales: () => req("GET", "/sales"),
    createSale: (data) => req("POST", "/sales", data),
    // Clientes
    getCustomers: () => req("GET", "/customers"),
    createCustomer: (data) => req("POST", "/customers", data),
    abonarCliente: (id, monto) => req("PATCH", `/customers/${id}/abono`, { monto }),
    // Gastos
    getExpenses: () => req("GET", "/expenses"),
    createExpense: (data) => req("POST", "/expenses", data),
    // Dashboard
    getDashboard: () => req("GET", "/dashboard/financials"),
    // Consignaciones
    getProveedoras: () => req("GET", "/consignacion/proveedoras"),
    createProveedora: (data) => req("POST", "/consignacion/proveedoras", data),
    getConsignaciones: () => req("GET", "/consignacion"),
    createConsignacion: (data) => req("POST", "/consignacion", data),
    getReporteProveedora: (id) => req("GET", `/consignacion/reporte/${id}`),
    crearLiquidacion: (provId, notas) => req("POST", `/consignacion/liquidar/${provId}`, { notas }),
    registrarPagoLiquidacion: (liqId, monto) => req("PATCH", `/consignacion/pago/${liqId}`, { monto_pagado: monto }),
    // Reportes
    getReporteVentas: (params) => {
        const q = new URLSearchParams(params).toString();
        return req("GET", `/reports/ventas${q ? "?" + q : ""}`);
    },
    getReporteProductosTop: (params) => {
        const q = new URLSearchParams(params).toString();
        return req("GET", `/reports/productos-top${q ? "?" + q : ""}`);
    },
    getReporteClientes: () => req("GET", "/reports/clientes"),
    getReporteFinanciero: (params) => {
        const q = new URLSearchParams(params).toString();
        return req("GET", `/reports/financiero${q ? "?" + q : ""}`);
    },
    getReporteInventario: () => req("GET", "/reports/inventario"),
    getReporteCuentasCobrar: () => req("GET", "/reports/cuentas-cobrar"),
    getReporteConsignaciones: () => req("GET", "/reports/consignaciones"),
    getTendencias: (dias) => req("GET", `/reports/tendencias${dias ? "?dias=" + dias : ""}`),
};
