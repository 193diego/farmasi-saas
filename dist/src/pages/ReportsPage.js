// src/pages/ReportsPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, DollarSign, Package, Users, CreditCard, Layers, Download, FileText, RefreshCw, Filter, AlertTriangle, Activity, Target, ArrowUpRight, ArrowDownRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../hooks/useApi.ts";
import { exportTableToPDF, exportToCSV } from "../utils/print.ts";
const C = {
    primary: "#F45B69", soft: "#FAD4D8", bg: "#FFF8F6",
    text: "#2E2E2E", textSub: "#6B6B6B", gold: "#C9A227",
};
const GRADIENT = `linear-gradient(135deg, #F45B69, #e8394a)`;
const PIE_COLORS = [C.primary, C.gold, "#10b981", "#3b82f6", "#8b5cf6", "#f97316", "#06b6d4"];
const TABS = [
    { key: "ventas", label: "Ventas", icon: TrendingUp },
    { key: "financiero", label: "Financiero", icon: DollarSign },
    { key: "inventario", label: "Inventario", icon: Package },
    { key: "clientes", label: "Clientes", icon: Users },
    { key: "consignaciones", label: "Consignaciones", icon: Layers },
    { key: "cuentas", label: "Por Cobrar", icon: CreditCard },
];
const KPI = ({ title, value, sub, icon: Icon, trend, color = "primary" }) => {
    const colors = {
        primary: { bg: "#fff0f1", ic: C.primary, br: "#fad4d8" },
        emerald: { bg: "#ecfdf5", ic: "#059669", br: "#a7f3d0" },
        amber: { bg: "#fffbeb", ic: "#d97706", br: "#fde68a" },
        gold: { bg: "#fefce8", ic: C.gold, br: "#fef08a" },
        blue: { bg: "#eff6ff", ic: "#2563eb", br: "#bfdbfe" },
        rose: { bg: "#fff1f2", ic: "#e11d48", br: "#fecdd3" },
    };
    const c = colors[color] || colors.primary;
    return (<div className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-all" style={{ borderColor: c.br }}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: c.bg }}>
          <Icon className="w-5 h-5" style={{ color: c.ic }}/>
        </div>
        {trend !== undefined && (<span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-0.5 ${trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
            {Math.abs(trend)}%
          </span>)}
      </div>
      <p className="text-2xl font-black tracking-tight" style={{ color: C.text }}>{value}</p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: C.textSub }}>{title}</p>
      {sub && <p className="text-xs mt-0.5 text-gray-400">{sub}</p>}
    </div>);
};
export default function ReportsPage({ sales, products, expenses, customers }) {
    const [activeTab, setActiveTab] = useState("ventas");
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState("30d");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("todos");
    const [categoryFilter, setCategoryFilter] = useState("todas");
    const [showFilters, setShowFilters] = useState(false);
    // Datos desde la API
    const [dataVentas, setDataVentas] = useState(null);
    const [dataFinanciero, setDataFinanciero] = useState(null);
    const [dataInventario, setDataInventario] = useState(null);
    const [dataClientes, setDataClientes] = useState(null);
    const [dataConsig, setDataConsig] = useState(null);
    const [dataCuentas, setDataCuentas] = useState(null);
    const [tendencias, setTendencias] = useState([]);
    const getDias = () => {
        if (period === "7d")
            return 7;
        if (period === "30d")
            return 30;
        if (period === "90d")
            return 90;
        return 30;
    };
    const getRangoFechas = () => {
        if (desde && hasta)
            return { desde, hasta };
        const dias = getDias();
        const d = new Date(Date.now() - dias * 86400000);
        return {
            desde: d.toISOString().split("T")[0],
            hasta: new Date().toISOString().split("T")[0],
        };
    };
    const loadTabData = useCallback(async (tab) => {
        setLoading(true);
        try {
            const rango = getRangoFechas();
            if (tab === "ventas") {
                const [v, t] = await Promise.all([
                    api.getReporteVentas({ ...rango, estado: estadoFiltro !== "todos" ? estadoFiltro : undefined }),
                    api.getTendencias(getDias()),
                ]);
                setDataVentas(v);
                setTendencias(t);
            }
            else if (tab === "financiero") {
                const [f, t] = await Promise.all([
                    api.getReporteFinanciero(rango),
                    api.getTendencias(getDias()),
                ]);
                setDataFinanciero(f);
                setTendencias(t);
            }
            else if (tab === "inventario") {
                setDataInventario(await api.getReporteInventario());
            }
            else if (tab === "clientes") {
                setDataClientes(await api.getReporteClientes());
            }
            else if (tab === "consignaciones") {
                setDataConsig(await api.getReporteConsignaciones());
            }
            else if (tab === "cuentas") {
                setDataCuentas(await api.getReporteCuentasCobrar());
            }
        }
        catch (err) {
            console.error("Error cargando reporte:", err);
        }
        finally {
            setLoading(false);
        }
    }, [period, desde, hasta, estadoFiltro]);
    useEffect(() => { loadTabData(activeTab); }, [activeTab, period, desde, hasta, estadoFiltro]);
    const exportPDF = async (id, nombre, subtitulo) => {
        await exportTableToPDF(id, nombre, `Reporte ${nombre} · Farmasi`, subtitulo);
    };
    const cats = ["todas", ...Array.from(new Set(products.map((p) => p.categoria)))];
    // ── LOADING ──────────────────────────────────────────────────
    const LoadingState = () => (<div className="text-center py-16">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: C.primary, borderTopColor: "transparent" }}/>
      <p className="text-sm" style={{ color: C.textSub }}>Cargando reporte...</p>
    </div>);
    // ── EMPTY ────────────────────────────────────────────────────
    const EmptyState = ({ icon: Icon, msg }) => (<div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <Icon className="w-12 h-12 mx-auto mb-3" style={{ color: C.soft }}/>
      <p className="font-bold" style={{ color: C.text }}>{msg}</p>
      <p className="text-sm mt-1" style={{ color: C.textSub }}>Ajusta los filtros o registra más datos</p>
    </div>);
    return (<div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: C.text }}>Reportes</h1>
          <p className="text-sm mt-0.5" style={{ color: C.textSub }}>Análisis detallado de tu negocio</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowFilters(p => !p)} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
            <Filter className="w-4 h-4"/>Filtros
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`}/>
          </button>
          <button onClick={() => loadTabData(activeTab)} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <AnimatePresence>
        {showFilters && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Período</label>
                <select value={period} onChange={e => { setPeriod(e.target.value); setDesde(""); setHasta(""); }} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F45B69]">
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="90d">Últimos 90 días</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              {period === "custom" && (<>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Desde</label>
                    <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F45B69]"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Hasta</label>
                    <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F45B69]"/>
                  </div>
                </>)}
              {activeTab === "ventas" && (<div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Estado</label>
                  <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F45B69]">
                    <option value="todos">Todos</option>
                    <option value="pagado">Pagado</option>
                    <option value="fiado">Fiado</option>
                  </select>
                </div>)}
              {activeTab === "inventario" && (<div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Categoría</label>
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F45B69]">
                    {cats.map(c => <option key={c} value={c}>{c === "todas" ? "Todas" : c}</option>)}
                  </select>
                </div>)}
            </div>
          </motion.div>)}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (<button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeTab === key ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`} style={activeTab === key ? { background: GRADIENT } : {}}>
            <Icon className="w-4 h-4"/>{label}
          </button>))}
      </div>

      {/* ── TAB: VENTAS ─────────────────────────────────────────── */}
      {activeTab === "ventas" && (<div className="space-y-6">
          {loading ? <LoadingState /> : !dataVentas ? <EmptyState icon={TrendingUp} msg="No hay datos de ventas"/> : (<>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI title="Total Ventas" value={dataVentas.resumen.total_ventas} icon={TrendingUp} color="primary"/>
                <KPI title="Total Ingresos" value={`$${dataVentas.resumen.total_ingresos?.toFixed(2) || "0.00"}`} icon={DollarSign} color="emerald"/>
                <KPI title="Por Cobrar" value={`$${dataVentas.resumen.total_pendiente?.toFixed(2) || "0.00"}`} icon={CreditCard} color="amber"/>
                <KPI title="Ventas Fiadas" value={dataVentas.resumen.ventas_fiadas} icon={AlertTriangle} color="rose"/>
              </div>

              {/* Gráfica tendencia */}
              {tendencias.length > 0 && (<div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold" style={{ color: C.text }}>Tendencia de Ventas</h3>
                    <button onClick={() => exportPDF("chart-ventas", "Ventas")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white hover:opacity-90" style={{ background: GRADIENT }}>
                      <Download className="w-3.5 h-3.5"/>PDF
                    </button>
                  </div>
                  <div id="chart-ventas">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={tendencias}>
                        <defs>
                          <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C.primary} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={C.primary} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }}/>
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} width={45} tickFormatter={v => `$${v}`}/>
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }} formatter={(v) => [`$${Number(v).toFixed(2)}`, "Ventas"]}/>
                        <Area type="monotone" dataKey="ventas" stroke={C.primary} strokeWidth={2.5} fill="url(#gv)"/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>)}

              {/* Tabla detalle ventas */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold" style={{ color: C.text }}>Detalle de Ventas ({dataVentas.ventas?.length || 0})</h3>
                  <div className="flex gap-2">
                    <button onClick={() => exportToCSV(dataVentas.ventas, "ventas")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200">
                      <Download className="w-3.5 h-3.5"/>CSV
                    </button>
                    <button onClick={() => exportPDF("tabla-ventas", "Ventas", `Período: ${period}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white hover:opacity-90" style={{ background: GRADIENT }}>
                      <FileText className="w-3.5 h-3.5"/>PDF
                    </button>
                  </div>
                </div>
                <div id="tabla-ventas" className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100" style={{ background: "#FFF8F6" }}>
                        {["ID", "Cliente", "Fecha", "Total", "Pagado", "Pendiente", "Estado"].map(h => (<th key={h} className="px-5 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>{h}</th>))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(dataVentas.ventas || []).map((v) => (<tr key={v.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 text-xs font-mono font-bold" style={{ color: C.primary }}>#V-{v.id}</td>
                          <td className="px-5 py-3 text-sm font-bold" style={{ color: C.text }}>{v.cliente}</td>
                          <td className="px-5 py-3 text-xs" style={{ color: C.textSub }}>{new Date(v.fecha).toLocaleDateString("es-ES")}</td>
                          <td className="px-5 py-3 text-sm font-black" style={{ color: C.text }}>${v.total?.toFixed(2)}</td>
                          <td className="px-5 py-3 text-sm font-bold text-emerald-600">${v.monto_pagado?.toFixed(2)}</td>
                          <td className="px-5 py-3 text-sm font-black" style={{ color: v.pendiente > 0 ? "#f59e0b" : "#10b981" }}>
                            ${v.pendiente?.toFixed(2)}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${v.estado === "pagado" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                              {v.estado}
                            </span>
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                  {(!dataVentas.ventas || dataVentas.ventas.length === 0) && (<div className="text-center py-10" style={{ color: "#9ca3af" }}>
                      <p className="text-sm">No hay ventas en este período</p>
                    </div>)}
                </div>
              </div>
            </>)}
        </div>)}

      {/* ── TAB: FINANCIERO ─────────────────────────────────────── */}
      {activeTab === "financiero" && (<div className="space-y-6">
          {loading ? <LoadingState /> : !dataFinanciero ? <EmptyState icon={DollarSign} msg="Sin datos financieros"/> : (<>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI title="Ingresos Brutos" value={`$${dataFinanciero.resumen.total_ingresos?.toFixed(2)}`} icon={TrendingUp} color="primary"/>
                <KPI title="Ganancia Bruta" value={`$${dataFinanciero.resumen.ganancia_bruta?.toFixed(2)}`} icon={DollarSign} color="emerald"/>
                <KPI title="Ganancia Neta" value={`$${dataFinanciero.resumen.ganancia_neta?.toFixed(2)}`} icon={Target} color={dataFinanciero.resumen.ganancia_neta >= 0 ? "emerald" : "rose"}/>
                <KPI title="ROI" value={`${dataFinanciero.resumen.roi?.toFixed(1)}%`} icon={Activity} color="gold"/>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ingresos vs Gastos */}
                {tendencias.length > 0 && (<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold" style={{ color: C.text }}>Ingresos vs Gastos</h3>
                      <button onClick={() => exportPDF("chart-finanzas", "Financiero")} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: GRADIENT }}>
                        <Download className="w-3 h-3"/>PDF
                      </button>
                    </div>
                    <div id="chart-finanzas">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={tendencias.slice(-14)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 9 }}/>
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 9 }} width={38} tickFormatter={v => `$${v}`}/>
                          <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`]}/>
                          <Bar dataKey="ventas" name="Ingresos" fill={C.primary} radius={[4, 4, 0, 0]}/>
                          <Bar dataKey="gastos" name="Gastos" fill={C.gold} radius={[4, 4, 0, 0]}/>
                          <Legend wrapperStyle={{ fontSize: 11 }}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>)}
                {/* Resumen P&L */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold" style={{ color: C.text }}>Estado de Resultados</h3>
                    <button onClick={() => exportPDF("tabla-financiero", "Estado-Resultados")} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: GRADIENT }}>
                      <Download className="w-3 h-3"/>PDF
                    </button>
                  </div>
                  <div id="tabla-financiero" className="space-y-3">
                    {[
                    { label: "Ingresos Brutos", val: dataFinanciero.resumen.total_ingresos, color: "text-emerald-600", sign: "+" },
                    { label: "(-) Costo de Ventas", val: dataFinanciero.resumen.costo_ventas, color: "text-rose-500", sign: "-" },
                    { label: "Ganancia Bruta", val: dataFinanciero.resumen.ganancia_bruta, color: "text-blue-600", bold: true },
                    { label: "(-) Gastos Operativos", val: dataFinanciero.resumen.total_gastos, color: "text-rose-500", sign: "-" },
                ].map((r, i) => (<div key={i} className={`flex justify-between py-2.5 px-3 rounded-xl ${r.bold ? "bg-gray-50 border border-gray-100" : ""}`}>
                        <span className={`text-sm ${r.bold ? "font-black" : "font-medium"}`} style={{ color: r.bold ? C.text : C.textSub }}>{r.label}</span>
                        <span className={`text-sm font-black ${r.color}`}>
                          {r.sign === "-" ? "-" : ""}${r.val?.toFixed(2)}
                        </span>
                      </div>))}
                    <div className="border-t-2 border-gray-200 mt-2 pt-3 px-3 flex justify-between items-center">
                      <span className="font-black text-base" style={{ color: C.text }}>Ganancia Neta</span>
                      <span className={`font-black text-xl ${dataFinanciero.resumen.ganancia_neta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        ${dataFinanciero.resumen.ganancia_neta?.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-3 p-4 rounded-2xl text-center" style={{ background: "#fff0f1" }}>
                      <p className="text-xs font-medium" style={{ color: C.textSub }}>Margen Neto</p>
                      <p className={`text-3xl font-black mt-1 ${dataFinanciero.resumen.margen_neto >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {dataFinanciero.resumen.margen_neto?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Gastos por categoría */}
              {dataFinanciero.gastos_por_categoria?.length > 0 && (<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold" style={{ color: C.text }}>Gastos por Categoría</h3>
                    <button onClick={() => exportToCSV(dataFinanciero.detalle_gastos, "gastos")} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600">
                      <Download className="w-3 h-3"/>CSV
                    </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={dataFinanciero.gastos_por_categoria} cx="50%" cy="50%" outerRadius={80} dataKey="monto" nameKey="tipo">
                          {dataFinanciero.gastos_por_categoria.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>))}
                        </Pie>
                        <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`]}/>
                        <Legend wrapperStyle={{ fontSize: 11 }}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {dataFinanciero.gastos_por_categoria.map((g, i) => (<div key={g.tipo} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}/>
                            <span className="text-sm font-medium" style={{ color: C.textSub }}>{g.tipo}</span>
                          </div>
                          <span className="text-sm font-black" style={{ color: C.text }}>${g.monto?.toFixed(2)}</span>
                        </div>))}
                    </div>
                  </div>
                </div>)}
            </>)}
        </div>)}

      {/* ── TAB: INVENTARIO ─────────────────────────────────────── */}
      {activeTab === "inventario" && (<div className="space-y-6">
          {loading ? <LoadingState /> : !dataInventario ? <EmptyState icon={Package} msg="Sin datos de inventario"/> : (<>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI title="Valor en Stock" value={`$${dataInventario.totales.valor_total_costo?.toFixed(0)}`} sub="Al precio de costo" icon={Package} color="primary"/>
                <KPI title="Valor Potencial" value={`$${dataInventario.totales.valor_total_venta?.toFixed(0)}`} sub="Al precio de venta" icon={TrendingUp} color="emerald"/>
                <KPI title="Ganancia Potencial" value={`$${dataInventario.totales.ganancia_potencial?.toFixed(0)}`} sub="Si vendes todo" icon={Target} color="gold"/>
                <KPI title="Agotados" value={dataInventario.totales.productos_agotados} icon={AlertTriangle} color="rose"/>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold" style={{ color: C.text }}>Estado del Inventario</h3>
                  <div className="flex items-center gap-2">
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold outline-none">
                      {cats.map(c => <option key={c} value={c}>{c === "todas" ? "Todas" : c}</option>)}
                    </select>
                    <button onClick={() => exportPDF("tabla-inventario", "Inventario")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: GRADIENT }}>
                      <Download className="w-3 h-3"/>PDF
                    </button>
                    <button onClick={() => exportToCSV(dataInventario.productos, "inventario")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600">
                      <Download className="w-3 h-3"/>CSV
                    </button>
                  </div>
                </div>
                <div id="tabla-inventario" className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ background: "#FFF8F6" }}>
                        {["Producto", "Categoría", "Stock", "P. Costo", "P. Venta", "Val. Stock", "Val. Venta", "Margen %", "Estado"].map(h => (<th key={h} className="px-4 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>{h}</th>))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(dataInventario.productos || [])
                    .filter((p) => categoryFilter === "todas" || p.categoria === categoryFilter)
                    .map((p) => (<tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-bold" style={{ color: C.text }}>{p.producto}</td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "#fff0f1", color: C.primary }}>{p.categoria}</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: C.text }}>{p.stock}</td>
                            <td className="px-4 py-3 text-sm" style={{ color: C.textSub }}>${p.precio_compra?.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-bold" style={{ color: C.text }}>${p.precio_venta?.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-bold" style={{ color: C.text }}>${p.valor_stock?.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-bold text-emerald-600">${p.valor_potencial?.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold text-emerald-600">{p.margen?.toFixed(1)}%</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${p.estado === "agotado" ? "bg-rose-100 text-rose-600" : p.estado === "bajo" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                                {p.estado}
                              </span>
                            </td>
                          </tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>)}
        </div>)}

      {/* ── TAB: CLIENTES ────────────────────────────────────────── */}
      {activeTab === "clientes" && (<div className="space-y-6">
          {loading ? <LoadingState /> : !dataClientes || dataClientes.length === 0 ? <EmptyState icon={Users} msg="Sin datos de clientes"/> : (<>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI title="Total Clientes" value={dataClientes.length} icon={Users} color="primary"/>
                <KPI title="Ventas Totales" value={`$${dataClientes.reduce((s, c) => s + c.total_gastado, 0).toFixed(0)}`} icon={DollarSign} color="emerald"/>
                <KPI title="Por Cobrar" value={`$${dataClientes.reduce((s, c) => s + c.saldo_pendiente, 0).toFixed(0)}`} icon={CreditCard} color="amber"/>
                <KPI title="Ticket Promedio" value={`$${dataClientes.length > 0 ? (dataClientes.reduce((s, c) => s + c.ticket_promedio, 0) / dataClientes.length).toFixed(0) : 0}`} icon={Target} color="gold"/>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold" style={{ color: C.text }}>Ranking de Clientes</h3>
                  <div className="flex gap-2">
                    <button onClick={() => exportToCSV(dataClientes, "clientes")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600">
                      <Download className="w-3 h-3"/>CSV
                    </button>
                    <button onClick={() => exportPDF("tabla-clientes", "Clientes")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: GRADIENT }}>
                      <Download className="w-3 h-3"/>PDF
                    </button>
                  </div>
                </div>
                <div id="tabla-clientes" className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ background: "#FFF8F6" }}>
                        {["#", "Cliente", "Compras", "Total Gastado", "Saldo Pendiente", "Ticket Prom.", "Último Pedido", "Prod. Favorito"].map(h => (<th key={h} className="px-4 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>{h}</th>))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dataClientes.map((c, i) => (<tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white ${i === 0 ? "bg-amber-400" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-500" : "bg-gray-200"}`} style={i > 2 ? { color: "#6b6b6b" } : {}}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: GRADIENT }}>
                                {c.nombre?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold" style={{ color: C.text }}>{c.nombre}</p>
                                {c.telefono && <p className="text-xs text-gray-400">{c.telefono}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: C.text }}>{c.total_compras}</td>
                          <td className="px-4 py-3 text-sm font-black" style={{ color: C.text }}>${c.total_gastado?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-black" style={{ color: c.saldo_pendiente > 0 ? "#f59e0b" : "#9ca3af" }}>
                            {c.saldo_pendiente > 0 ? `$${c.saldo_pendiente?.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: C.text }}>${c.ticket_promedio?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: C.textSub }}>
                            {c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString("es-ES") : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: C.textSub }}>{c.producto_favorito || "—"}</td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>)}
        </div>)}

      {/* ── TAB: CONSIGNACIONES ──────────────────────────────────── */}
      {activeTab === "consignaciones" && (<div className="space-y-6">
          {loading ? <LoadingState /> : !dataConsig ? <EmptyState icon={Layers} msg="Sin datos de consignaciones"/> : (<>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI title="Consignaciones" value={dataConsig.resumen.total_consignaciones} icon={Layers} color="primary"/>
                <KPI title="Uds. Vendidas" value={dataConsig.resumen.total_unidades_vendidas} icon={TrendingUp} color="emerald"/>
                <KPI title="Deuda Proveedoras" value={`$${dataConsig.resumen.total_deuda_proveedoras?.toFixed(2)}`} icon={CreditCard} color="amber"/>
                <KPI title="Tu Ganancia Total" value={`$${dataConsig.resumen.tu_ganancia_total?.toFixed(2)}`} icon={DollarSign} color="gold"/>
              </div>
              {/* Por proveedora */}
              {dataConsig.por_proveedora?.length > 0 && (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dataConsig.por_proveedora.map((p) => (<div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{ background: GRADIENT }}>{p.nombre?.charAt(0)}</div>
                        <div>
                          <p className="font-bold" style={{ color: C.text }}>{p.nombre}</p>
                          {p.telefono && <p className="text-xs" style={{ color: C.textSub }}>{p.telefono}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-rose-50 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] font-bold text-rose-500 uppercase">Deuda</p>
                          <p className="font-black text-rose-600">${p.deuda_pendiente?.toFixed(2)}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] font-bold text-emerald-500 uppercase">Ganancia</p>
                          <p className="font-black text-emerald-600">${p.tu_ganancia_pendiente?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>))}
                </div>)}
              {/* Detalle */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold" style={{ color: C.text }}>Detalle de Consignaciones</h3>
                  <div className="flex gap-2">
                    <button onClick={() => exportToCSV(dataConsig.detalle, "consignaciones")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600">
                      <Download className="w-3 h-3"/>CSV
                    </button>
                    <button onClick={() => exportPDF("tabla-consig", "Consignaciones")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: GRADIENT }}>
                      <Download className="w-3 h-3"/>PDF
                    </button>
                  </div>
                </div>
                <div id="tabla-consig" className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ background: "#FFF8F6" }}>
                        {["Proveedora", "Producto", "Recibidas", "Vendidas", "Disponibles", "P. Proveedora", "P. Tuyo", "Ganancia/u", "Total Reportar", "Tu Ganancia", "Estado"].map(h => (<th key={h} className="px-4 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>{h}</th>))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(dataConsig.detalle || []).map((c) => (<tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: C.text }}>{c.proveedora}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: C.textSub }}>{c.producto}</td>
                          <td className="px-4 py-3 text-sm text-center font-bold" style={{ color: C.text }}>{c.recibidas}</td>
                          <td className="px-4 py-3 text-sm text-center font-bold" style={{ color: C.primary }}>{c.vendidas}</td>
                          <td className="px-4 py-3 text-sm text-center font-bold text-emerald-600">{c.disponibles}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: C.textSub }}>${c.precio_proveedora?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: C.text }}>${c.precio_tuyo?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-bold text-emerald-600">${c.ganancia_por_unidad?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-black text-rose-600">${c.total_reportar?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-black text-emerald-600">${c.tu_ganancia?.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${c.estado === "activo" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                              {c.estado}
                            </span>
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                  {(!dataConsig.detalle || dataConsig.detalle.length === 0) && (<div className="text-center py-10" style={{ color: "#9ca3af" }}>
                      <p className="text-sm">Sin consignaciones registradas</p>
                    </div>)}
                </div>
              </div>
            </>)}
        </div>)}

      {/* ── TAB: CUENTAS POR COBRAR ──────────────────────────────── */}
      {activeTab === "cuentas" && (<div className="space-y-6">
          {loading ? <LoadingState /> : !dataCuentas ? <EmptyState icon={CreditCard} msg="Sin cuentas pendientes"/> : (<>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPI title="Total Pendiente" value={`$${dataCuentas.resumen.total_pendiente?.toFixed(2)}`} icon={CreditCard} color="amber"/>
                <KPI title="Total en Mora" value={`$${dataCuentas.resumen.total_en_mora?.toFixed(2)}`} icon={AlertTriangle} color="rose"/>
                <KPI title="Clientes con Deuda" value={dataCuentas.resumen.clientes_con_deuda} icon={Users} color="primary"/>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold" style={{ color: C.text }}>Cuentas por Cobrar Pendientes</h3>
                  <div className="flex gap-2">
                    <button onClick={() => exportToCSV(dataCuentas.cuentas, "cuentas-cobrar")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600">
                      <Download className="w-3 h-3"/>CSV
                    </button>
                    <button onClick={() => exportPDF("tabla-cuentas", "Cuentas-Cobrar")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: GRADIENT }}>
                      <Download className="w-3 h-3"/>PDF
                    </button>
                  </div>
                </div>
                <div id="tabla-cuentas" className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ background: "#FFF8F6" }}>
                        {["Cliente", "Venta #", "Monto Original", "Monto Pendiente", "Pagado", "Vencimiento", "Días Mora", "Estado"].map(h => (<th key={h} className="px-4 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>{h}</th>))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(dataCuentas.cuentas || []).map((c) => (<tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.en_mora ? "bg-rose-50/30" : ""}`}>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: C.text }}>{c.cliente}</td>
                          <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: C.primary }}>#V-{c.venta_id}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: C.textSub }}>${c.monto_original?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-black text-amber-600">${c.monto_pendiente?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-bold text-emerald-600">${c.monto_pagado?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: C.textSub }}>
                            {new Date(c.fecha_vencimiento).toLocaleDateString("es-ES")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {c.dias_vencida > 0 ? (<span className="text-xs font-black text-rose-600">{c.dias_vencida} días</span>) : <span className="text-xs text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${c.en_mora ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
                              {c.en_mora ? "En mora" : "Pendiente"}
                            </span>
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                  {(!dataCuentas.cuentas || dataCuentas.cuentas.length === 0) && (<div className="text-center py-10" style={{ color: "#9ca3af" }}>
                      <p className="text-sm">¡No hay cuentas pendientes!</p>
                    </div>)}
                </div>
              </div>
            </>)}
        </div>)}
    </div>);
}
