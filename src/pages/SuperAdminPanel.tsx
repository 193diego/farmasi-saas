// src/pages/SuperAdminPanel.tsx
import React, { useState, useEffect } from "react";
import {
  Building2, Users, Package, Plus, LogOut, RefreshCw,
  CheckCircle, AlertTriangle, X, Eye, EyeOff, Crown,
  TrendingUp, Activity, ToggleLeft, ToggleRight, Copy, Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const C = {
  primary: "#F45B69", soft: "#FAD4D8", bg: "#FFF8F6",
  text: "#2E2E2E", textSub: "#6B6B6B",
  gray400: "#9ca3af",
};
const GRADIENT = `linear-gradient(135deg, ${C.primary}, #e8394a)`;
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm focus:border-[#F45B69] transition-colors";

const BASE = "/api";
const hdrs = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("farmasi_token") || ""}`,
});
const call = async (url: string, opts?: RequestInit) => {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || "Error");
  return d;
};
const adminApi = {
  getCompanies:        () => call(`${BASE}/companies`),
  getPlans:            () => call(`${BASE}/companies/plans`),
  createCompany:       (data: any) => call(`${BASE}/companies`, { method: "POST", body: JSON.stringify(data) }),
  createOwner:         (data: any) => call(`${BASE}/companies/create-owner`, { method: "POST", body: JSON.stringify(data) }),
  toggleCompany:       (id: number, estado: string) => call(`${BASE}/companies/${id}/estado`, { method: "PATCH", body: JSON.stringify({ estado }) }),
  getGlobalProducts:   () => call(`${BASE}/inventory/global`),
  createGlobalProduct: (data: any) => call(`${BASE}/inventory/global`, { method: "POST", body: JSON.stringify(data) }),
};

interface Plan { id: number; nombre_plan: string; precio: number; }
interface Company { id: number; nombre_empresa: string; estado: string; fecha_vencimiento: string; plan: Plan; _count?: { users: number }; }
interface GlobalProduct { id: number; nombre_producto: string; categoria: string; marca?: string; codigo_base: string; activo: boolean; }

const Toast = ({ message, type, onClose }: any) => (
  <motion.div initial={{ opacity: 0, y: 60, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }}
    exit={{ opacity: 0, y: 60, x: "-50%" }}
    className={`fixed bottom-8 left-1/2 z-[200] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
    {type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
    {message}
    <button onClick={onClose}><X className="w-3 h-3" /></button>
  </motion.div>
);

const Modal = ({ isOpen, onClose, title, children }: any) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]" />
        <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-[90] overflow-hidden max-h-[90vh] flex flex-col">
          <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h3 className="text-lg font-bold" style={{ color: C.text }}>{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="p-7 overflow-y-auto">{children}</div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// Pantalla que muestra credenciales listas para copiar y enviar al cliente
const CredencialesBox = ({ nombre, email, password, empresa, onClose }: any) => {
  const [copied, setCopied] = useState(false);
  const texto = `🌸 FARMASI - Tus credenciales de acceso\n\nEmpresa: ${empresa}\nNombre: ${nombre}\nEmail: ${email}\nContraseña: ${password}\n\nIngresa en: ${window.location.origin}`;
  const copiar = () => {
    navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[100] p-7">
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-black" style={{ color: C.text }}>¡Empresa creada!</h3>
        <p className="text-sm mt-1" style={{ color: C.textSub }}>Copia estas credenciales y envíaselas a tu cliente</p>
      </div>
      <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
        {[
          { label: "Empresa", value: empresa },
          { label: "Nombre", value: nombre },
          { label: "Email / Usuario", value: email },
          { label: "Contraseña", value: password },
          { label: "URL de acceso", value: window.location.origin },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center gap-4">
            <span className="text-xs font-bold uppercase flex-shrink-0" style={{ color: C.textSub }}>{label}</span>
            <span className="text-sm font-bold text-right" style={{ color: C.text }}>{value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={copiar}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${copied ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          {copied ? <><Check className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar todo</>}
        </button>
        <button onClick={onClose} className="flex-1 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90" style={{ background: GRADIENT }}>
          Listo
        </button>
      </div>
    </motion.div>
  );
};

export default function SuperAdminPanel({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [tab, setTab] = useState<"empresas" | "productos">("empresas");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [globalProducts, setGlobalProducts] = useState<GlobalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [credenciales, setCredenciales] = useState<any>(null);
  const [modalEmpresa, setModalEmpresa] = useState(false);
  const [modalOwner, setModalOwner] = useState<Company | null>(null);
  const [modalProducto, setModalProducto] = useState(false);

  const emptyE = { nombre_empresa: "", plan_id: "", fecha_vencimiento: "", nombre_owner: "", email_owner: "", password_owner: "" };
  const emptyO = { nombre: "", email: "", password: "" };
  const emptyP = { nombre_producto: "", categoria: "", marca: "", codigo_base: "", descripcion: "", imagen_url: "" };

  const [formE, setFormE] = useState(emptyE);
  const [formO, setFormO] = useState(emptyO);
  const [formP, setFormP] = useState(emptyP);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, p, gp] = await Promise.allSettled([adminApi.getCompanies(), adminApi.getPlans(), adminApi.getGlobalProducts()]);
      if (c.status === "fulfilled") setCompanies(Array.isArray(c.value) ? c.value : []);
      if (p.status === "fulfilled") setPlans(Array.isArray(p.value) ? p.value : []);
      if (gp.status === "fulfilled") setGlobalProducts(Array.isArray(gp.value) ? gp.value : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCrearEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const empresa = await adminApi.createCompany({
        nombre_empresa: formE.nombre_empresa,
        plan_id: Number(formE.plan_id),
        fecha_vencimiento: formE.fecha_vencimiento,
      });
      await adminApi.createOwner({
        company_id: empresa.id,
        nombre: formE.nombre_owner,
        email: formE.email_owner,
        password: formE.password_owner,
      });
      const creds = { empresa: formE.nombre_empresa, nombre: formE.nombre_owner, email: formE.email_owner, password: formE.password_owner };
      setModalEmpresa(false);
      setFormE(emptyE);
      loadData();
      setCredenciales(creds);
    } catch (err: any) {
      showToast(err.message || "Error al crear empresa", "error");
    } finally { setSaving(false); }
  };

  const handleCrearOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalOwner) return;
    setSaving(true);
    try {
      await adminApi.createOwner({ company_id: modalOwner.id, ...formO });
      const creds = { empresa: modalOwner.nombre_empresa, ...formO };
      setModalOwner(null);
      setFormO(emptyO);
      loadData();
      setCredenciales(creds);
    } catch (err: any) {
      showToast(err.message || "Error", "error");
    } finally { setSaving(false); }
  };

  const handleToggle = async (company: Company) => {
    const nuevo = company.estado === "activo" ? "inactivo" : "activo";
    try {
      await adminApi.toggleCompany(company.id, nuevo);
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, estado: nuevo } : c));
      showToast(`Empresa ${nuevo === "activo" ? "activada ✓" : "desactivada"}`);
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createGlobalProduct(formP);
      setModalProducto(false);
      setFormP(emptyP);
      showToast("✅ Producto agregado al catálogo de todas las empresas");
      loadData();
    } catch (err: any) {
      showToast(err.message || "Error", "error");
    } finally { setSaving(false); }
  };

  const activas = companies.filter(c => c.estado === "activo").length;
  const ingresosMes = companies.filter(c => c.estado === "activo").reduce((s, c) => s + (c.plan?.precio || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl" style={{ background: GRADIENT }}>F</div>
            <div>
              <p className="font-black text-sm" style={{ color: C.text }}>FARMASI SaaS</p>
              <p className="text-[10px] font-bold flex items-center gap-1" style={{ color: C.primary }}>
                <Crown className="w-3 h-3" /> Super Admin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold" style={{ color: C.text }}>{user?.nombre}</p>
              <p className="text-xs" style={{ color: C.textSub }}>{user?.email}</p>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Empresas Activas", value: activas, icon: Building2, color: "#10b981", bg: "#ecfdf5" },
            { label: "Total Empresas", value: companies.length, icon: Activity, color: "#3b82f6", bg: "#eff6ff" },
            { label: "Ingresos / Mes", value: `$${ingresosMes.toFixed(0)}`, icon: TrendingUp, color: C.primary, bg: C.soft },
            { label: "Productos Globales", value: globalProducts.length, icon: Package, color: "#8b5cf6", bg: "#f5f3ff" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="p-2.5 rounded-xl w-fit mb-3" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: C.textSub }}>{label}</p>
            </motion.div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm w-fit">
          {[{ key: "empresas", label: "Empresas & Accesos", icon: Building2 }, { key: "productos", label: "Catálogo Global", icon: Package }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === key ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              style={tab === key ? { background: GRADIENT } : {}}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* TAB EMPRESAS */}
        {tab === "empresas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-black" style={{ color: C.text }}>Empresas Registradas</h2>
                <p className="text-sm" style={{ color: C.textSub }}>Al crear una empresa defines las credenciales que le entregas al cliente para que entre al sistema</p>
              </div>
              <div className="flex gap-2">
                <button onClick={loadData} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => { setFormE(emptyE); setShowPass(false); setModalEmpresa(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90" style={{ background: GRADIENT }}>
                  <Plus className="w-4 h-4" /> Nueva Empresa
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: C.primary, borderTopColor: "transparent" }} />
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: C.soft }} />
                <p className="font-bold text-lg" style={{ color: C.text }}>Sin empresas aún</p>
                <p className="text-sm mt-1 mb-5" style={{ color: C.textSub }}>Crea la primera empresa para comenzar a ofrecer el sistema</p>
                <button onClick={() => setModalEmpresa(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold hover:opacity-90 mx-auto" style={{ background: GRADIENT }}>
                  <Plus className="w-4 h-4" /> Crear Primera Empresa
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {companies.map((company) => (
                  <motion.div key={company.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                          style={{ background: company.estado === "activo" ? GRADIENT : "#e5e7eb", color: company.estado === "activo" ? "white" : "#9ca3af" }}>
                          {company.nombre_empresa.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold" style={{ color: C.text }}>{company.nombre_empresa}</p>
                          <p className="text-xs" style={{ color: C.textSub }}>
                            <span className="font-bold" style={{ color: C.primary }}>{company.plan?.nombre_plan}</span>{" · "}${company.plan?.precio}/mes
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex-shrink-0 ${company.estado === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {company.estado}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="font-bold uppercase text-[10px]" style={{ color: C.textSub }}>Usuarios</p>
                        <p className="font-black text-lg mt-0.5" style={{ color: C.text }}>{company._count?.users ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="font-bold uppercase text-[10px]" style={{ color: C.textSub }}>Plan</p>
                        <p className="font-black text-sm mt-0.5 truncate" style={{ color: C.text }}>{company.plan?.nombre_plan}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="font-bold uppercase text-[10px]" style={{ color: C.textSub }}>Vence</p>
                        <p className="font-black text-xs mt-0.5" style={{ color: C.text }}>
                          {new Date(company.fecha_vencimiento).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => { setModalOwner(company); setFormO(emptyO); setShowPass(false); }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border-2 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: C.soft, color: C.primary }}>
                        <Users className="w-3.5 h-3.5" /> Dar Credenciales
                      </button>
                      <button onClick={() => handleToggle(company)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${company.estado === "activo" ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                        {company.estado === "activo"
                          ? <><ToggleRight className="w-3.5 h-3.5" /> Desactivar</>
                          : <><ToggleLeft className="w-3.5 h-3.5" /> Activar</>}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB PRODUCTOS */}
        {tab === "productos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-black" style={{ color: C.text }}>Catálogo Global Farmasi</h2>
                <p className="text-sm" style={{ color: C.textSub }}>Cada producto se agrega con stock 0 en todas las empresas. Cada dueña pone sus precios y stock.</p>
              </div>
              <button onClick={() => { setFormP(emptyP); setModalProducto(true); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90" style={{ background: GRADIENT }}>
                <Plus className="w-4 h-4" /> Agregar Producto
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ background: C.bg }}>
                    {["Producto", "Categoría", "Marca", "Código", "Estado"].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-bold uppercase" style={{ color: C.textSub }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {globalProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-bold" style={{ color: C.text }}>{p.nombre_producto}</td>
                      <td className="px-5 py-3"><span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: C.soft, color: C.primary }}>{p.categoria}</span></td>
                      <td className="px-5 py-3 text-sm" style={{ color: C.textSub }}>{p.marca || "—"}</td>
                      <td className="px-5 py-3 text-xs font-mono font-bold" style={{ color: C.textSub }}>{p.codigo_base}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.activo ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && globalProducts.length === 0 && (
                <div className="text-center py-14" style={{ color: C.gray400 }}>
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Sin productos en el catálogo</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL NUEVA EMPRESA */}
      <Modal isOpen={modalEmpresa} onClose={() => setModalEmpresa(false)} title="Nueva Empresa + Acceso">
        <form onSubmit={handleCrearEmpresa} className="space-y-4">
          <div className="flex items-center gap-2"><Building2 className="w-4 h-4" style={{ color: C.primary }} /><p className="text-xs font-black uppercase" style={{ color: C.textSub }}>Datos de la Empresa</p></div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Nombre de la Empresa *</label>
            <input value={formE.nombre_empresa} onChange={e => setFormE(p => ({ ...p, nombre_empresa: e.target.value }))} required className={inputCls} placeholder="Ej: Farmasi Ana García" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Plan *</label>
              <select value={formE.plan_id} onChange={e => setFormE(p => ({ ...p, plan_id: e.target.value }))} required className={inputCls}>
                <option value="">Seleccionar...</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.nombre_plan} — ${p.precio}/mes</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Vence el *</label>
              <input type="date" value={formE.fecha_vencimiento} onChange={e => setFormE(p => ({ ...p, fecha_vencimiento: e.target.value }))} required className={inputCls} min={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4" style={{ color: C.primary }} /><p className="text-xs font-black uppercase" style={{ color: C.textSub }}>Credenciales para el cliente</p></div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl mb-3">
              <p className="text-xs text-amber-700 font-medium">Estas son las credenciales que le entregas. Después de crear verás una pantalla para copiarlas.</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Nombre del Dueño *</label>
            <input value={formE.nombre_owner} onChange={e => setFormE(p => ({ ...p, nombre_owner: e.target.value }))} required className={inputCls} placeholder="Nombre completo" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Email (usuario) *</label>
            <input type="email" value={formE.email_owner} onChange={e => setFormE(p => ({ ...p, email_owner: e.target.value }))} required className={inputCls} placeholder="cliente@email.com" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Contraseña *</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={formE.password_owner} onChange={e => setFormE(p => ({ ...p, password_owner: e.target.value }))} required className={inputCls} placeholder="Mínimo 6 caracteres" minLength={6} />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 mt-2" style={{ background: GRADIENT }}>
            {saving ? "Creando..." : "Crear Empresa y Generar Acceso"}
          </button>
        </form>
      </Modal>

      {/* MODAL DAR CREDENCIALES A EMPRESA EXISTENTE */}
      <Modal isOpen={!!modalOwner} onClose={() => setModalOwner(null)} title={`Credenciales para: ${modalOwner?.nombre_empresa}`}>
        <form onSubmit={handleCrearOwner} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs text-amber-700 font-medium">El cliente usará este email y contraseña para ingresar al sistema de <strong>{modalOwner?.nombre_empresa}</strong>.</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Nombre *</label>
            <input value={formO.nombre} onChange={e => setFormO(p => ({ ...p, nombre: e.target.value }))} required className={inputCls} placeholder="Nombre del usuario" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Email *</label>
            <input type="email" value={formO.email} onChange={e => setFormO(p => ({ ...p, email: e.target.value }))} required className={inputCls} placeholder="email@ejemplo.com" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Contraseña *</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={formO.password} onChange={e => setFormO(p => ({ ...p, password: e.target.value }))} required className={inputCls} placeholder="Mínimo 6 caracteres" minLength={6} />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-60" style={{ background: GRADIENT }}>
            {saving ? "Creando..." : "Crear y Ver Credenciales"}
          </button>
        </form>
      </Modal>

      {/* MODAL NUEVO PRODUCTO */}
      <Modal isOpen={modalProducto} onClose={() => setModalProducto(false)} title="Agregar al Catálogo Global">
        <form onSubmit={handleCrearProducto} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-700 font-medium">Se agrega con stock 0 en <strong>todas las empresas</strong>. Cada dueña pone su precio y stock.</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Nombre del Producto *</label>
            <input value={formP.nombre_producto} onChange={e => setFormP(p => ({ ...p, nombre_producto: e.target.value }))} required className={inputCls} placeholder="Ej: Labial Matte Ruby Red" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Categoría *</label>
              <select value={formP.categoria} onChange={e => setFormP(p => ({ ...p, categoria: e.target.value }))} required className={inputCls}>
                <option value="">Seleccionar...</option>
                {["Maquillaje", "Cuidado Piel", "Fragancias", "Cabello", "Cuidado Personal", "Suplementos", "Otros"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Marca</label>
              <input value={formP.marca} onChange={e => setFormP(p => ({ ...p, marca: e.target.value }))} className={inputCls} placeholder="Farmasi, Dr. C. Tuna..." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Código Base * (único)</label>
            <input value={formP.codigo_base} onChange={e => setFormP(p => ({ ...p, codigo_base: e.target.value.toUpperCase() }))} required className={inputCls} placeholder="Ej: FAR-LM-001" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>Descripción</label>
            <textarea value={formP.descripcion} onChange={e => setFormP(p => ({ ...p, descripcion: e.target.value }))} className={`${inputCls} h-16 resize-none`} placeholder="Descripción breve..." />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.textSub }}>URL Imagen</label>
            <input value={formP.imagen_url} onChange={e => setFormP(p => ({ ...p, imagen_url: e.target.value }))} className={inputCls} placeholder="https://..." />
          </div>
          <button type="submit" disabled={saving} className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-60" style={{ background: GRADIENT }}>
            {saving ? "Guardando..." : "Agregar al Catálogo"}
          </button>
        </form>
      </Modal>

      {/* PANTALLA CREDENCIALES */}
      <AnimatePresence>
        {credenciales && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" />
            <CredencialesBox {...credenciales} onClose={() => setCredenciales(null)} />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
