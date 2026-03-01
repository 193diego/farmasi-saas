import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Users, CreditCard, TrendingDown,
  LogOut, Menu, X, Plus, ArrowUpRight, ArrowDownRight, Trash2, Minus,
  CheckCircle2, DollarSign, BarChart3, AlertTriangle, FileText, Eye,
  UserPlus, Layers, Clock, CheckCircle, Info, TrendingUp, Calendar,
  Target, Filter, Star, Activity, Printer, Download, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { api, getUser } from "./hooks/useApi";
import { printThermal, downloadTxt, exportTableToPDF, exportToCSV } from "./utils/print";
import ReportsPage from "./pages/ReportsPage";
// ✅ CAMBIO 1: Import del panel de super admin
import SuperAdminPanel from "./pages/SuperAdminPanel";
// ─── FARMASI COLORS ──────────────────────────────────────────
const C = {
  primary:   "#F45B69",
  soft:      "#FAD4D8",
  bg:        "#FFF8F6",
  text:      "#2E2E2E",
  textSub:   "#6B6B6B",
  gold:      "#C9A227",
  white:     "#FFFFFF",
  emerald:   "#10b981",
  amber:     "#f59e0b",
  rose:      "#f43f5e",
  gray100:   "#f3f4f6",
  gray200:   "#e5e7eb",
  gray400:   "#9ca3af",
};

const GRADIENT = `linear-gradient(135deg, ${C.primary}, #e8394a)`;
const GRADIENT_SOFT = `linear-gradient(135deg, #fff5f6, #fff)`;

// ─── TYPES ────────────────────────────────────────────────────
interface Product { id: number; nombre: string; categoria: string; stock: number; precio_venta: number; precio_compra: number; imagen_url?: string; minStock?: number; marca?: string; description?: string; }
interface CartItem extends Product { quantity: number; discount: number; }
interface Customer { id: number; name: string; phone?: string; address?: string; saldo_pendiente: number; totalSpent: number; lastPurchase?: string; }
interface User { id: number; company_id: number | null; rol: string; nombre: string; email: string; token: string; }
interface Sale { id: string; customer: string; date: string; total: number; paidAmount: number; status: string; items: Array<{ productId: number; name: string; quantity: number; price: number; discount?: number }>; }
interface Expense { id: number; concept: string; description?: string; category: string; date: string; amount: number; }
interface Proveedora { id: number; nombre: string; telefono?: string; email?: string; notas?: string; }
interface ConsignacionItem { id: number; proveedora: { id: number; nombre: string }; producto: { id: number; nombre: string; imagen_url?: string }; cantidad_recibida: number; cantidad_disponible: number; cantidad_vendida: number; precio_costo: number; precio_venta_proveedora: number; precio_venta_tuyo: number; total_a_reportar_proveedora: number; tu_ganancia_total: number; estado: string; fecha_recepcion: string; }

// ─── SHARED UI ────────────────────────────────────────────────
const Modal = ({ isOpen, onClose, title, children, wide = false }: any) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]" />
        <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }} transition={{ type: "spring", damping: 26, stiffness: 360 }}
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${wide ? "max-w-2xl" : "max-w-lg"} bg-white rounded-3xl shadow-2xl z-[90] overflow-hidden max-h-[90vh] flex flex-col`}>
          <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0"
            style={{ background: GRADIENT_SOFT }}>
            <h3 className="text-lg font-bold" style={{ color: C.text }}>{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="p-7 overflow-y-auto">{children}</div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const Toast = ({ message, type, onClose }: { message: string; type: string; onClose: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 60, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }}
    exit={{ opacity: 0, y: 60, x: "-50%" }} transition={{ type: "spring", damping: 22 }}
    className={`fixed bottom-8 left-1/2 z-[200] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : type === "error" ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-orange-50 border-orange-200 text-orange-800"}`}>
    {type === "success" ? <CheckCircle className="w-4 h-4" /> : type === "error" ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
    {message}
    <button onClick={onClose} className="ml-1 p-0.5 hover:bg-black/5 rounded-lg"><X className="w-3 h-3" /></button>
  </motion.div>
);

const KPI = ({ title, value, sub, icon: Icon, trend, color = "primary", delay = 0 }: any) => {
  const colors: any = {
    primary: { bg: "#fff0f1", ic: C.primary, br: "#fad4d8" },
    emerald: { bg: "#ecfdf5", ic: "#059669", br: "#a7f3d0" },
    amber:   { bg: "#fffbeb", ic: "#d97706", br: "#fde68a" },
    gold:    { bg: "#fefce8", ic: C.gold, br: "#fef08a" },
    blue:    { bg: "#eff6ff", ic: "#2563eb", br: "#bfdbfe" },
    rose:    { bg: "#fff1f2", ic: "#e11d48", br: "#fecdd3" },
  };
  const c = colors[color] || colors.primary;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 22 }}
      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border"
      style={{ borderColor: c.br }}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: c.bg }}>
          <Icon className="w-5 h-5" style={{ color: c.ic }} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-0.5 ${trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black tracking-tight" style={{ color: C.text }}>{value}</p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: C.textSub }}>{title}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: C.gray400 }}>{sub}</p>}
    </motion.div>
  );
};

const btnPrimary = "flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 shadow-sm";
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm focus:border-[#F45B69] transition-colors";

// ─── SIDEBAR ──────────────────────────────────────────────────
const Sidebar = ({ user, onLogout, mobileOpen, setMobileOpen }: any) => {
  const loc = useLocation();
  const items = [
    { icon: LayoutDashboard, label: "Dashboard",    path: "/" },
    { icon: Package,          label: "Inventario",   path: "/inventario" },
    { icon: ShoppingCart,     label: "Ventas",       path: "/ventas" },
    { icon: Users,            label: "Clientes",     path: "/clientes" },
    { icon: CreditCard,       label: "Fiados",       path: "/fiados" },
    { icon: TrendingDown,     label: "Gastos",       path: "/gastos" },
    { icon: Layers,           label: "Consignación", path: "/consignacion" },
    { icon: BarChart3,        label: "Reportes",     path: "/reportes" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg"
            style={{ background: "rgba(255,255,255,.2)" }}>F</div>
          <div>
            <p className="text-white font-black text-sm">FARMASI</p>
            <p className="text-white/60 text-[10px] font-medium">SaaS · {user?.rol}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ icon: Icon, label, path }) => {
          const active = loc.pathname === path || (path !== "/" && loc.pathname.startsWith(path));
          return (
            <Link key={path} to={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${active ? "bg-white/20 text-white font-bold shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: C.soft, color: C.primary }}>
            {user?.nombre?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{user?.nombre}</p>
            <p className="text-white/50 text-[10px] truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs transition-all">
          <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0"
        style={{ background: `linear-gradient(180deg, #e04050, ${C.primary} 40%, #d63548)` }}>
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-60 z-50 lg:hidden flex flex-col"
              style={{ background: `linear-gradient(180deg, #e04050, ${C.primary} 40%, #d63548)` }}>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const Layout = ({ children, user, onLogout, cartCount, onOpenCart }: any) => {
  const [mob, setMob] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg }}>
      <Sidebar user={user} onLogout={onLogout} mobileOpen={mob} setMobileOpen={setMob} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <button onClick={() => setMob(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1" />
          {cartCount > 0 && (
            <button onClick={onOpenCart}
              className={`${btnPrimary} relative`} style={{ background: GRADIENT }}>
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            </button>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────
const LoginPage = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.login(form.email, form.password);
      localStorage.setItem("farmasi_token", res.token);
      localStorage.setItem("farmasi_user", JSON.stringify({ ...res.user, token: res.token }));
      onLogin({ ...res.user, token: res.token });
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="px-8 pt-10 pb-8 text-center" style={{ background: GRADIENT }}>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-3xl">F</span>
          </div>
          <h1 className="text-white font-black text-2xl">FARMASI</h1>
          <p className="text-white/80 text-sm mt-1">Sistema de Gestión</p>
        </div>
        <form onSubmit={submit} className="p-8 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Correo</label>
            <input type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className={inputCls} placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Contraseña</label>
            <input type="password" required value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className={inputCls} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 mt-2"
            style={{ background: GRADIENT }}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// ─── CART DRAWER ──────────────────────────────────────────────
const CartDrawer = ({ items, customers, onUpdateQuantity, onRemove, onCheckout, isOpen, onClose, empresa }: any) => {
  const [custId, setCustId] = useState<number | string>(0);
  const [fiado, setFiado] = useState(false);
  const [abono, setAbono] = useState("");
  const total = items.reduce((s: number, i: CartItem) => s + Math.max(0, i.precio_venta * i.quantity - (i.discount || 0)), 0);

  const checkout = () => {
    const cust = custId === 0 ? "Consumidor Final" : customers.find((c: Customer) => c.id === Number(custId))?.name;
    onCheckout(cust, Number(custId) || null, fiado ? "fiado" : "pagado", fiado ? Number(abono) || 0 : total);
    setCustId(0); setFiado(false); setAbono("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[110] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between" style={{ background: GRADIENT_SOFT }}>
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" style={{ color: C.primary }} />
                <h3 className="text-lg font-bold" style={{ color: C.text }}>Carrito</h3>
                <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: C.soft, color: C.primary }}>{items.length}</span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Carrito vacío</p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="block text-xs font-bold uppercase mb-2" style={{ color: C.textSub }}>Asignar a Cliente</label>
                    <select value={custId} onChange={e => setCustId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" style={{ borderColor: C.gray200 }}>
                      <option value={0}>Consumidor Final</option>
                      {customers.map((c: Customer) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input type="checkbox" checked={fiado} onChange={e => setFiado(e.target.checked)} className="rounded" />
                      <span className="text-sm font-medium text-amber-700">Venta a crédito (fiado)</span>
                    </label>
                    {fiado && (
                      <div className="mt-3">
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: C.textSub }}>Monto a Pagar Ahora</label>
                        <input type="number" step="0.01" value={abono} onChange={e => setAbono(e.target.value)}
                          className={inputCls} placeholder="0.00" max={total} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {items.map((item: CartItem) => (
                      <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3">
                        {item.imagen_url && (
                          <img src={item.imagen_url} alt={item.nombre}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: C.text }}>{item.nombre}</p>
                          <p className="text-xs font-bold" style={{ color: C.primary }}>${item.precio_venta.toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-white hover:opacity-90"
                              style={{ background: C.primary }}>
                              <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={() => onRemove(item.id)} className="ml-auto text-rose-400 hover:text-rose-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            {items.length > 0 && (
              <div className="p-5 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-lg font-black" style={{ color: C.text }}>
                  <span>Total</span>
                  <span style={{ color: C.primary }}>${total.toFixed(2)}</span>
                </div>
                {fiado && (
                  <div className="flex justify-between text-sm text-amber-700 font-bold">
                    <span>Quedaría pendiente:</span>
                    <span>${Math.max(0, total - (Number(abono) || 0)).toFixed(2)}</span>
                  </div>
                )}
                <button onClick={checkout}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: GRADIENT }}>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Venta
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────
const DashboardPage = ({ sales, products, expenses, customers }: any) => {
  const totalIngresos = sales.reduce((s: number, v: Sale) => s + v.total, 0);
  const totalGastos = expenses.reduce((s: number, e: Expense) => s + e.amount, 0);
  const invValue = products.reduce((s: number, p: Product) => s + p.stock * p.precio_compra, 0);
  const costoVentas = sales.reduce((s: number, v: Sale) => {
    return s + v.items.reduce((ss: number, i: any) => {
      const p = products.find((p: Product) => p.id === i.productId);
      return ss + i.quantity * (p?.precio_compra || 0);
    }, 0);
  }, 0);
  const ganancia = totalIngresos - costoVentas - totalGastos;
  const totalFiado = sales.filter((v: Sale) => v.status === "fiado").reduce((s: number, v: Sale) => s + (v.total - v.paidAmount), 0);
  const agotados = products.filter((p: Product) => p.stock === 0).length;

  const chart7d = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const key = d.toISOString().split("T")[0];
    const dayVentas = sales.filter((v: Sale) => v.date === key);
    return {
      name: d.toLocaleDateString("es-ES", { weekday: "short" }),
      ventas: dayVentas.reduce((s: number, v: Sale) => s + v.total, 0),
    };
  });

  const catData = products.reduce((acc: any, p: Product) => {
    const existing = acc.find((a: any) => a.name === p.categoria);
    if (existing) existing.value += p.stock * p.precio_venta;
    else acc.push({ name: p.categoria, value: p.stock * p.precio_venta });
    return acc;
  }, []);
  const PIE_COLORS = [C.primary, C.gold, "#10b981", "#3b82f6", "#8b5cf6", "#f97316"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: C.text }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: C.textSub }}>Resumen del negocio en tiempo real</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Ventas Totales" value={`$${totalIngresos.toFixed(0)}`} icon={TrendingUp} color="primary" delay={0} trend={12} />
        <KPI title="Ganancia Neta" value={`$${ganancia.toFixed(0)}`} icon={DollarSign} color={ganancia >= 0 ? "emerald" : "rose"} delay={0.05} trend={ganancia > 0 ? 8 : -5} />
        <KPI title="Total Fiado" value={`$${totalFiado.toFixed(0)}`} icon={CreditCard} color="amber" delay={0.1} />
        <KPI title="Inv. Invertido" value={`$${invValue.toFixed(0)}`} icon={Package} color="gold" delay={0.15} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-5" style={{ color: C.text }}>Ventas Últimos 7 Días</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chart7d}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.primary} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.gray100} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.gray400, fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: C.gray400, fontSize: 11 }} width={40} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}
                formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Ventas"]} />
              <Area type="monotone" dataKey="ventas" stroke={C.primary} strokeWidth={2.5} fill="url(#gv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-5" style={{ color: C.text }}>Inventario por Categoría</h3>
          {catData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {catData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {catData.map((c: any, i: number) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs font-medium" style={{ color: C.textSub }}>{c.name}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: C.text }}>${c.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-300">
              <Package className="w-10 h-10 mx-auto mb-2" />
              <p className="text-xs">Sin datos de inventario</p>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agotados > 0 && (
          <div className="bg-white border border-rose-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2.5 bg-rose-50 rounded-xl"><AlertTriangle className="w-5 h-5 text-rose-500" /></div>
            <div>
              <p className="font-bold text-rose-700">{agotados} producto(s) agotado(s)</p>
              <p className="text-sm text-rose-500 mt-0.5">
                {products.filter((p: Product) => p.stock === 0).map((p: Product) => p.nombre).join(", ")}
              </p>
            </div>
          </div>
        )}
        {totalFiado > 0 && (
          <div className="bg-white border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2.5 bg-amber-50 rounded-xl"><Clock className="w-5 h-5 text-amber-500" /></div>
            <div>
              <p className="font-bold text-amber-700">Tienes ${totalFiado.toFixed(2)} por cobrar</p>
              <p className="text-sm text-amber-500 mt-0.5">
                {sales.filter((v: Sale) => v.status === "fiado").length} venta(s) pendiente(s)
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold" style={{ color: C.text }}>Últimas Ventas</h3>
          <Link to="/ventas" className="text-xs font-bold" style={{ color: C.primary }}>Ver todas →</Link>
        </div>
        {sales.length === 0 ? (
          <div className="text-center py-10" style={{ color: C.gray400 }}>
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aún no hay ventas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sales.slice(0, 5).map((v: Sale) => (
              <div key={v.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white"
                    style={{ background: GRADIENT }}>
                    {v.customer?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: C.text }}>{v.customer}</p>
                    <p className="text-xs" style={{ color: C.gray400 }}>{v.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black" style={{ color: C.text }}>${v.total.toFixed(2)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.status === "pagado" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {v.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem("farmasi_user");
    return u ? JSON.parse(u) : null;
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [proveedoras, setProveedoras] = useState<Proveedora[]>([]);
  const [consignaciones, setConsignaciones] = useState<ConsignacionItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const [modals, setModals] = useState({ customer: false, expense: false, product: false, proveedora: false, consignacion: false });
  const m = (k: string, v: boolean) => setModals(p => ({ ...p, [k]: v }));

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ✅ CAMBIO 2: loadData solo corre si NO es super_admin
  const loadData = useCallback(async () => {
    if (!user || user.rol === "super_admin") return;
    setLoading(true);
    try {
      const [inv, s, c, e, p, cons] = await Promise.allSettled([
        api.getInventory(),
        api.getSales(),
        api.getCustomers(),
        api.getExpenses(),
        api.getProveedoras(),
        api.getConsignaciones(),
      ]);

      if (inv.status === "fulfilled") {
        setProducts(inv.value.map((i: any) => ({
          id: i.id, nombre: i.nombre, categoria: i.categoria, stock: i.stock,
          precio_venta: i.precio_venta, precio_compra: i.precio_compra,
          imagen_url: i.imagen_url, minStock: 5, marca: i.marca,
        })));
      }
      if (s.status === "fulfilled") {
        setSales(s.value.map((v: any) => ({
          id: `#V-${v.id}`, customer: v.customer, date: v.date?.split("T")[0] || v.date,
          total: v.total, paidAmount: v.paidAmount || v.monto_pagado || v.total,
          status: v.status || v.estado,
          items: v.items || [],
        })));
      }
      if (c.status === "fulfilled") {
        setCustomers(c.value.map((c: any) => ({
          id: c.id, name: c.name, phone: c.phone, address: c.address,
          saldo_pendiente: c.saldo_pendiente || 0,
          totalSpent: c.totalSpent || 0,
          lastPurchase: c.lastPurchase,
        })));
      }
      if (e.status === "fulfilled") setExpenses(e.value);
      if (p.status === "fulfilled") setProveedoras(p.value);
      if (cons.status === "fulfilled") setConsignaciones(cons.value);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const logout = () => {
    localStorage.removeItem("farmasi_token");
    localStorage.removeItem("farmasi_user");
    setUser(null);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1, discount: 0 }];
    });
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id));
    else setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const checkout = async (customerName: string, customerId: number | null, status: string, paid: number) => {
    try {
      const total = cart.reduce((s, i) => s + i.precio_venta * i.quantity - (i.discount || 0), 0);
      const saleData = {
        cliente_id: customerId,
        total,
        monto_pagado: paid,
        estado: status,
        items: cart.map(i => ({
          producto_global_id: i.id,
          cantidad: i.quantity,
          precio_unitario: i.precio_venta,
          descuento: i.discount || 0,
          subtotal: i.precio_venta * i.quantity - (i.discount || 0),
        }))
      };
      const newSale = await api.createSale(saleData);
      setSales(prev => [{
        id: `#V-${newSale.id}`, customer: customerName,
        date: new Date().toISOString().split("T")[0], total,
        paidAmount: paid, status,
        items: cart.map(i => ({ productId: i.id, name: i.nombre, quantity: i.quantity, price: i.precio_venta })),
      }, ...prev]);

      setProducts(prev => prev.map(p => {
        const ci = cart.find(c => c.id === p.id);
        return ci ? { ...p, stock: Math.max(0, p.stock - ci.quantity) } : p;
      }));

      setCart([]);
      setCartOpen(false);
      showToast(`✓ Venta registrada: $${total.toFixed(2)}`);
    } catch (err: any) {
      showToast(err.message || "Error al registrar venta", "error");
    }
  };

  // ── Sin sesión → Login
  if (!user) return <LoginPage onLogin={setUser} />;

  // ✅ CAMBIO 3: Super admin → su propio panel (NO ve ventas ni inventario)
  if (user.rol === "super_admin") {
    return <SuperAdminPanel user={user} onLogout={logout} />;
  }

  // ── Owner / Empleado → App normal de ventas
  return (
    <Router>
      <Layout user={user} onLogout={logout} cartCount={cart.length} onOpenCart={() => setCartOpen(true)}>
        <Routes>
          <Route path="/" element={
            <DashboardPage sales={sales} products={products} expenses={expenses} customers={customers} />
          } />

          <Route path="/inventario" element={
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black" style={{ color: C.text }}>Inventario</h1>
                  <p className="text-sm mt-0.5" style={{ color: C.textSub }}>{products.length} productos · {products.filter(p => p.stock === 0).length} agotados</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadData} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
                  <button onClick={() => m("product", true)} className={btnPrimary} style={{ background: GRADIENT }}>
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-16" style={{ color: C.gray400 }}>
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: C.primary, borderTopColor: "transparent" }} />
                  <p className="text-sm">Cargando inventario...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Package className="w-12 h-12 mx-auto mb-3" style={{ color: C.soft }} />
                  <p className="font-bold" style={{ color: C.text }}>Sin productos en inventario</p>
                  <p className="text-sm mt-1" style={{ color: C.textSub }}>Agrega tu primer producto para comenzar</p>
                  <button onClick={() => m("product", true)} className={`${btnPrimary} mx-auto mt-4`} style={{ background: GRADIENT }}>
                    <Plus className="w-4 h-4" /> Agregar Producto
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                      <div className="relative h-40 bg-gray-50">
                        {p.imagen_url ? (
                          <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${p.nombre}&background=FAD4D8&color=F45B69&size=200`; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: C.soft }}>
                            <Package className="w-10 h-10" style={{ color: C.primary }} />
                          </div>
                        )}
                        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full ${p.stock === 0 ? "bg-rose-500 text-white" : p.stock <= (p.minStock || 5) ? "bg-amber-400 text-white" : "bg-emerald-400 text-white"}`}>
                          {p.stock === 0 ? "Agotado" : `${p.stock} uds`}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="font-bold text-sm truncate" style={{ color: C.text }}>{p.nombre}</p>
                        <p className="text-xs mt-0.5" style={{ color: C.textSub }}>{p.categoria} {p.marca ? `· ${p.marca}` : ""}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div>
                            <p className="text-lg font-black" style={{ color: C.primary }}>${p.precio_venta.toFixed(2)}</p>
                            <p className="text-[10px]" style={{ color: C.gray400 }}>Costo: ${p.precio_compra.toFixed(2)}</p>
                          </div>
                          {p.stock > 0 && (
                            <button onClick={() => addToCart(p)}
                              className="px-3 py-2 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                              style={{ background: GRADIENT }}>
                              + Carrito
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          } />

          <Route path="/ventas" element={
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black" style={{ color: C.text }}>Ventas</h1>
                  <p className="text-sm mt-0.5" style={{ color: C.textSub }}>{sales.length} ventas registradas</p>
                </div>
                <button onClick={loadData} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
              </div>
              {sales.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3" style={{ color: C.soft }} />
                  <p className="font-bold" style={{ color: C.text }}>Aún no hay ventas</p>
                  <p className="text-sm mt-1" style={{ color: C.textSub }}>Ve a Inventario para agregar productos al carrito</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-100" style={{ background: C.bg }}>
                          <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>ID</th>
                          <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>Cliente</th>
                          <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>Fecha</th>
                          <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>Total</th>
                          <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>Estado</th>
                          <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {sales.map((v: Sale) => (
                          <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4 text-sm font-mono font-bold" style={{ color: C.primary }}>{v.id}</td>
                            <td className="px-5 py-4 text-sm font-bold" style={{ color: C.text }}>{v.customer}</td>
                            <td className="px-5 py-4 text-sm" style={{ color: C.textSub }}>{v.date}</td>
                            <td className="px-5 py-4 text-sm font-black" style={{ color: C.text }}>${v.total.toFixed(2)}</td>
                            <td className="px-5 py-4">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${v.status === "pagado" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <button title="Imprimir ticket"
                                  onClick={() => printThermal({
                                    id: v.id, empresa: user?.nombre || "Farmasi",
                                    cliente: v.customer, fecha: v.date,
                                    items: v.items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price })),
                                    total: v.total, pagado: v.paidAmount, pendiente: v.total - v.paidAmount,
                                    estado: v.status,
                                  })}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700">
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button title="Descargar TXT"
                                  onClick={() => downloadTxt({
                                    id: v.id, empresa: user?.nombre || "Farmasi",
                                    cliente: v.customer, fecha: v.date,
                                    items: v.items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price })),
                                    total: v.total, pagado: v.paidAmount, pendiente: v.total - v.paidAmount,
                                    estado: v.status,
                                  })}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700">
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          } />

          <Route path="/clientes" element={
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black" style={{ color: C.text }}>Clientes</h1>
                  <p className="text-sm mt-0.5" style={{ color: C.textSub }}>{customers.length} clientes registradas</p>
                </div>
                <button onClick={() => m("customer", true)} className={btnPrimary} style={{ background: GRADIENT }}>
                  <UserPlus className="w-4 h-4" /> Nueva Cliente
                </button>
              </div>
              {customers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Users className="w-12 h-12 mx-auto mb-3" style={{ color: C.soft }} />
                  <p className="font-bold" style={{ color: C.text }}>Sin clientes registradas</p>
                  <button onClick={() => m("customer", true)} className={`${btnPrimary} mx-auto mt-4`} style={{ background: GRADIENT }}>
                    <Plus className="w-4 h-4" /> Agregar Cliente
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map((c: Customer, i: number) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg"
                          style={{ background: GRADIENT }}>{c.name.charAt(0)}</div>
                        <div>
                          <p className="font-bold" style={{ color: C.text }}>{c.name}</p>
                          {c.phone && <p className="text-xs" style={{ color: C.textSub }}>{c.phone}</p>}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span style={{ color: C.textSub }}>Total compras</span>
                          <span className="font-bold" style={{ color: C.text }}>${c.totalSpent.toFixed(2)}</span>
                        </div>
                        {c.saldo_pendiente > 0 && (
                          <div className="flex justify-between">
                            <span className="text-amber-600">Saldo pendiente</span>
                            <span className="font-bold text-amber-600">${c.saldo_pendiente.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          } />

          <Route path="/fiados" element={
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black" style={{ color: C.text }}>Cuentas por Cobrar</h1>
                <p className="text-sm mt-0.5" style={{ color: C.textSub }}>Ventas pendientes de pago</p>
              </div>
              {sales.filter(v => v.status === "fiado").length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <CreditCard className="w-12 h-12 mx-auto mb-3" style={{ color: C.soft }} />
                  <p className="font-bold" style={{ color: C.text }}>No hay deudas pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sales.filter(v => v.status === "fiado").map(v => (
                    <div key={v.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex items-center justify-between">
                      <div>
                        <p className="font-bold" style={{ color: C.text }}>{v.customer}</p>
                        <p className="text-xs mt-0.5" style={{ color: C.textSub }}>{v.id} · {v.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-600">${(v.total - v.paidAmount).toFixed(2)}</p>
                        <p className="text-xs" style={{ color: C.textSub }}>de ${v.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                    <span className="font-bold text-amber-700">Total a cobrar</span>
                    <span className="font-black text-xl text-amber-700">
                      ${sales.filter(v => v.status === "fiado").reduce((s, v) => s + (v.total - v.paidAmount), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          } />

          <Route path="/gastos" element={
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black" style={{ color: C.text }}>Gastos</h1>
                  <p className="text-sm mt-0.5" style={{ color: C.textSub }}>
                    Total: ${expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}
                  </p>
                </div>
                <button onClick={() => m("expense", true)} className={btnPrimary} style={{ background: GRADIENT }}>
                  <Plus className="w-4 h-4" /> Registrar
                </button>
              </div>
              {expenses.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <TrendingDown className="w-12 h-12 mx-auto mb-3" style={{ color: C.soft }} />
                  <p className="font-bold" style={{ color: C.text }}>Sin gastos registrados</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {expenses.map((e: Expense) => (
                    <div key={e.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="font-bold text-sm" style={{ color: C.text }}>{e.concept}</p>
                        <p className="text-xs" style={{ color: C.textSub }}>{e.category} · {e.date}</p>
                        {e.description && <p className="text-xs mt-0.5 text-gray-400">{e.description}</p>}
                      </div>
                      <p className="font-black text-rose-500">${e.amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          } />

          <Route path="/consignacion" element={
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black" style={{ color: C.text }}>Consignaciones</h1>
                  <p className="text-sm mt-0.5" style={{ color: C.textSub }}>Productos de otras distribuidoras Farmasi</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => m("proveedora", true)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" /> Proveedora
                  </button>
                  <button onClick={() => m("consignacion", true)} className={btnPrimary} style={{ background: GRADIENT }}>
                    <Plus className="w-4 h-4" /> Consignación
                  </button>
                </div>
              </div>
              {proveedoras.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {proveedoras.map((p: Proveedora) => {
                    const consProv = consignaciones.filter(c => c.proveedora.id === p.id);
                    const deuda = consProv.reduce((s, c) => s + c.total_a_reportar_proveedora, 0);
                    const ganancia = consProv.reduce((s, c) => s + c.tu_ganancia_total, 0);
                    return (
                      <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black"
                            style={{ background: GRADIENT }}>{p.nombre.charAt(0)}</div>
                          <div>
                            <p className="font-bold" style={{ color: C.text }}>{p.nombre}</p>
                            {p.telefono && <p className="text-xs" style={{ color: C.textSub }}>{p.telefono}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-rose-50 rounded-xl p-2.5 text-center">
                            <p className="text-[10px] font-bold text-rose-500 uppercase">Le debes</p>
                            <p className="font-black text-rose-600">${deuda.toFixed(2)}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase">Tu ganancia</p>
                            <p className="font-black text-emerald-600">${ganancia.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {consignaciones.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <Layers className="w-12 h-12 mx-auto mb-3" style={{ color: C.soft }} />
                  <p className="font-bold" style={{ color: C.text }}>Sin consignaciones activas</p>
                  {proveedoras.length === 0 && <p className="text-sm mt-1" style={{ color: C.textSub }}>Primero agrega una proveedora</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {consignaciones.map((c: ConsignacionItem) => (
                    <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                            {c.producto.imagen_url ? (
                              <img src={c.producto.imagen_url} alt={c.producto.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 m-3" style={{ color: C.primary }} />
                            )}
                          </div>
                          <div>
                            <p className="font-bold" style={{ color: C.text }}>{c.producto.nombre}</p>
                            <p className="text-xs" style={{ color: C.textSub }}>De: {c.proveedora.nombre}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${c.estado === "activo" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                          {c.estado}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {[
                          { label: "Recibidas", val: c.cantidad_recibida, color: "text-blue-600" },
                          { label: "Disponibles", val: c.cantidad_disponible, color: "text-emerald-600" },
                          { label: "Vendidas", val: c.cantidad_vendida, color: C.primary },
                          { label: "Tu ganancia", val: `$${c.tu_ganancia_total.toFixed(2)}`, color: "text-emerald-700" },
                        ].map(({ label, val, color }) => (
                          <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                            <p className="text-[10px] font-bold uppercase" style={{ color: C.textSub }}>{label}</p>
                            <p className={`text-sm font-black ${color}`}>{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          } />

          <Route path="/reportes" element={
            <ReportsPage sales={sales} products={products} expenses={expenses} customers={customers} />
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>

      {cart.length > 0 && !cartOpen && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.95 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center z-50"
          style={{ background: GRADIENT, boxShadow: `0 8px 30px ${C.primary}66` }}>
          <ShoppingCart className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-amber-400 text-white w-5 h-5 rounded-full text-xs font-black flex items-center justify-center border-2 border-white">
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        </motion.button>
      )}

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} items={cart}
        customers={customers} onUpdateQuantity={updateQty}
        onRemove={(id: number) => setCart(p => p.filter(i => i.id !== id))}
        onCheckout={checkout} empresa={user?.nombre || "Farmasi"} />

      <Modal isOpen={modals.customer} onClose={() => m("customer", false)} title="Nueva Cliente">
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          try {
            const c = await api.createCustomer({ name: fd.get("name"), phone: fd.get("phone"), address: fd.get("address") });
            setCustomers(p => [...p, { ...c, saldo_pendiente: 0, totalSpent: 0 }]);
            m("customer", false);
            showToast("Cliente registrada ✓");
          } catch (err: any) { showToast(err.message, "error"); }
        }}>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Nombre *</label>
              <input name="name" required className={inputCls} /></div>
            <div><label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Teléfono</label>
              <input name="phone" className={inputCls} /></div>
          </div>
          <div><label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Dirección</label>
            <input name="address" className={inputCls} /></div>
          <button className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: GRADIENT }}>Guardar</button>
        </form>
      </Modal>

      <Modal isOpen={modals.expense} onClose={() => m("expense", false)} title="Registrar Gasto">
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          try {
            const g = await api.createExpense({ concept: fd.get("concept"), description: fd.get("desc"), amount: fd.get("amount"), category: fd.get("cat") });
            setExpenses(p => [g, ...p]);
            m("expense", false);
            showToast("Gasto registrado ✓");
          } catch (err: any) { showToast(err.message, "error"); }
        }}>
          <div><label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Concepto *</label>
            <input name="concept" required className={inputCls} /></div>
          <div><label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Descripción</label>
            <textarea name="desc" className={`${inputCls} h-16`} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Monto *</label>
              <input name="amount" type="number" step="0.01" required className={inputCls} /></div>
            <div><label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Categoría</label>
              <select name="cat" className={inputCls}>
                {["Local", "Servicios", "Marketing", "Logística", "Suministros", "Transporte", "Otros"].map(c => <option key={c}>{c}</option>)}
              </select></div>
          </div>
          <button className="w-full py-3 rounded-xl text-white font-bold text-sm bg-rose-500 hover:bg-rose-600">Guardar Gasto</button>
        </form>
      </Modal>

      <Modal isOpen={modals.proveedora} onClose={() => m("proveedora", false)} title="Nueva Proveedora">
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          try {
            const p = await api.createProveedora({ nombre: fd.get("nombre"), telefono: fd.get("tel"), email: fd.get("email"), notas: fd.get("notas") });
            setProveedoras(prev => [...prev, p]);
            m("proveedora", false);
            showToast("Proveedora agregada ✓");
          } catch (err: any) { showToast(err.message, "error"); }
        }}>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Nombre *</label>
              <input name="nombre" required className={inputCls} /></div>
            <div><label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Teléfono</label>
              <input name="tel" className={inputCls} /></div>
          </div>
          <div><label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Email</label>
            <input name="email" type="email" className={inputCls} /></div>
          <div><label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Notas</label>
            <textarea name="notas" className={`${inputCls} h-16`} /></div>
          <button className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: GRADIENT }}>Guardar Proveedora</button>
        </form>
      </Modal>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </Router>
  );
}
