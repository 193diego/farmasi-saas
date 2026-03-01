// src/hooks/useApi.ts
// Hook central para todas las llamadas a la API

const BASE = "/api";

export function getToken(): string {
  return localStorage.getItem("farmasi_token") || "";
}

export function getUser(): any {
  const u = localStorage.getItem("farmasi_user");
  return u ? JSON.parse(u) : null;
}

async function req(method: string, path: string, body?: any) {
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
  if (!res.ok) throw new Error(data.message || "Error en la solicitud");
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    req("POST", "/auth/login", { email, password }),

  // Inventario
  getInventory: () => req("GET", "/inventory"),
  updateStock: (id: number, stock: number) =>
    req("PATCH", "/inventory/stock", { id, stock }),
  // ✅ NUEVO: actualizar precio, stock e imagen de un producto del inventario
  updateProduct: (id: number, data: { precio_venta: number; precio_compra: number; stock: number; imagen_url?: string | null }) =>
    req("PATCH", "/inventory/product", { id, ...data }),

  // Ventas
  getSales: () => req("GET", "/sales"),
  createSale: (data: any) => req("POST", "/sales", data),

  // Clientes
  getCustomers: () => req("GET", "/customers"),
  createCustomer: (data: any) => req("POST", "/customers", data),
  abonarCliente: (id: number, monto: number) =>
    req("PATCH", `/customers/${id}/abono`, { monto }),

  // Gastos
  getExpenses: () => req("GET", "/expenses"),
  createExpense: (data: any) => req("POST", "/expenses", data),

  // Dashboard
  getDashboard: () => req("GET", "/dashboard/financials"),

  // Consignaciones
  getProveedoras: () => req("GET", "/consignacion/proveedoras"),
  createProveedora: (data: any) => req("POST", "/consignacion/proveedoras", data),
  getConsignaciones: () => req("GET", "/consignacion"),
  createConsignacion: (data: any) => req("POST", "/consignacion", data),
  getReporteProveedora: (id: number) => req("GET", `/consignacion/reporte/${id}`),
  crearLiquidacion: (provId: number, notas?: string) =>
    req("POST", `/consignacion/liquidar/${provId}`, { notas }),
  registrarPagoLiquidacion: (liqId: number, monto: number) =>
    req("PATCH", `/consignacion/pago/${liqId}`, { monto_pagado: monto }),

  // Reportes
  getReporteVentas: (params?: { desde?: string; hasta?: string; estado?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return req("GET", `/reports/ventas${q ? "?" + q : ""}`);
  },
  getReporteProductosTop: (params?: { desde?: string; hasta?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return req("GET", `/reports/productos-top${q ? "?" + q : ""}`);
  },
  getReporteClientes: () => req("GET", "/reports/clientes"),
  getReporteFinanciero: (params?: { desde?: string; hasta?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return req("GET", `/reports/financiero${q ? "?" + q : ""}`);
  },
  getReporteInventario: () => req("GET", "/reports/inventario"),
  getReporteCuentasCobrar: () => req("GET", "/reports/cuentas-cobrar"),
  getReporteConsignaciones: () => req("GET", "/reports/consignaciones"),
  getTendencias: (dias?: number) =>
    req("GET", `/reports/tendencias${dias ? "?dias=" + dias : ""}`),
};
