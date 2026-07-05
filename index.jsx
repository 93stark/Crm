import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Package, Users, Receipt, BookOpen, Settings as SettingsIcon,
  Plus, Trash2, Pencil, Download, Printer, AlertTriangle, ShieldCheck, UserCog,
  X, Check, TrendingUp, Wallet, Boxes, ChevronRight, LogOut
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

// ---------- fonts ----------
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@500;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    .font-display { font-family: 'Roboto Slab', serif; }
    .font-body { font-family: 'Inter', sans-serif; }
    .font-ledger { font-family: 'IBM Plex Mono', monospace; }
    .ledger-bg {
      background-color: #f5f5f4;
      background-image: repeating-linear-gradient(to bottom, transparent, transparent 35px, rgba(120,113,108,0.12) 36px);
    }
    .stamp {
      border: 3px dashed currentColor;
      border-radius: 10px;
      transform: rotate(-2deg);
      transition: transform 0.15s ease;
    }
    .stamp:hover { transform: rotate(0deg) scale(1.03); }
    .stamp:active { transform: rotate(0deg) scale(0.97); }
  `}</style>
);

// ---------- helpers ----------
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const inr = (n) => "\u20B9" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);

async function loadKey(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    return res ? JSON.parse(res.value) : fallback;
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch (e) {
    console.error("save failed", key, e);
  }
}

const SEED_PRODUCTS = [
  { id: uid(), name: "Copper Pipe Fitting 1\"", category: "Plumbing", price: 145, cost: 95, stock: 40, lowStock: 10, unit: "pcs" },
  { id: uid(), name: "LED Panel Light 18W", category: "Electrical", price: 320, cost: 210, stock: 6, lowStock: 8, unit: "pcs" },
  { id: uid(), name: "PVC Cement 250ml", category: "Plumbing", price: 90, cost: 55, stock: 25, lowStock: 5, unit: "bottle" },
];
const SEED_CUSTOMERS = [
  { id: uid(), name: "Rahul Traders", phone: "9876500011", discount: 5, defaultTax: "taxable" },
  { id: uid(), name: "Sunrise Hardware", phone: "9876500022", discount: 0, defaultTax: "non-taxable" },
];

// ---------- root ----------
export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null); // { role, name }
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [managers, setManagers] = useState([]);
  const [settings, setSettings] = useState({ gstRate: 18 });
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    (async () => {
      let p = await loadKey("smv:products", null);
      if (!p) { p = SEED_PRODUCTS; await saveKey("smv:products", p); }
      let c = await loadKey("smv:customers", null);
      if (!c) { c = SEED_CUSTOMERS; await saveKey("smv:customers", c); }
      const inv = await loadKey("smv:invoices", []);
      const mgrs = await loadKey("smv:managers", [{ id: uid(), name: "Manager 1", pin: "1111" }]);
      const set = await loadKey("smv:settings", { gstRate: 18 });
      setProducts(p); setCustomers(c); setInvoices(inv); setManagers(mgrs); setSettings(set);
      setReady(true);
    })();
  }, []);

  useEffect(() => { if (ready) saveKey("smv:products", products); }, [products, ready]);
  useEffect(() => { if (ready) saveKey("smv:customers", customers); }, [customers, ready]);
  useEffect(() => { if (ready) saveKey("smv:invoices", invoices); }, [invoices, ready]);
  useEffect(() => { if (ready) saveKey("smv:managers", managers); }, [managers, ready]);
  useEffect(() => { if (ready) saveKey("smv:settings", settings); }, [settings, ready]);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center font-body text-slate-500">Loading ledger…</div>;
  }
  if (!session) {
    return <Login managers={managers} onLogin={setSession} />;
  }

  return (
    <div className="min-h-screen flex font-body">
      <FontStyle />
      <Sidebar role={session.role} view={view} setView={setView} onLogout={() => setSession(null)} name={session.name} />
      <main className="flex-1 ledger-bg min-h-screen overflow-y-auto">
        {session.role === "admin" ? (
          <AdminViews view={view} products={products} setProducts={setProducts} customers={customers} setCustomers={setCustomers}
            invoices={invoices} managers={managers} setManagers={setManagers} settings={settings} setSettings={setSettings} />
        ) : (
          <ManagerViews view={view} products={products} setProducts={setProducts} customers={customers} setCustomers={setCustomers}
            invoices={invoices} setInvoices={setInvoices} settings={settings} session={session} />
        )}
      </main>
    </div>
  );
}

// ---------- login ----------
function Login({ managers, onLogin }) {
  const [pickedManager, setPickedManager] = useState(managers[0]?.id || "");
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full">
        <p className="text-stone-400 font-ledger text-xs tracking-[0.3em] text-center mb-2">SMV PROJECT PLATFORM</p>
        <h1 className="font-display text-4xl text-white text-center mb-10">Sign in to the ledger</h1>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={() => onLogin({ role: "admin", name: "Owner" })}
            className="stamp text-rose-400 bg-slate-800/60 py-8 flex flex-col items-center gap-2 hover:bg-slate-800">
            <ShieldCheck size={28} />
            <span className="font-display text-lg">Super Admin</span>
            <span className="text-xs text-stone-400">Full control</span>
          </button>
          <button onClick={() => {
              const m = managers.find(x => x.id === pickedManager);
              onLogin({ role: "manager", name: m ? m.name : "Manager" });
            }}
            className="stamp text-teal-400 bg-slate-800/60 py-8 flex flex-col items-center gap-2 hover:bg-slate-800">
            <UserCog size={28} />
            <span className="font-display text-lg">Manager</span>
            <span className="text-xs text-stone-400">Daily operations</span>
          </button>
        </div>
        {managers.length > 0 && (
          <div className="bg-slate-800/60 rounded-lg p-3">
            <label className="text-xs text-stone-400 font-ledger tracking-wide">MANAGER PROFILE</label>
            <select value={pickedManager} onChange={(e) => setPickedManager(e.target.value)}
              className="w-full mt-1 bg-slate-900 text-white rounded px-3 py-2 text-sm border border-slate-700">
              {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- sidebar ----------
function Sidebar({ role, view, setView, onLogout, name }) {
  const adminNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products & Services", icon: Package },
    { id: "customers", label: "Customers", icon: Users },
    { id: "ledger", label: "All Invoices", icon: BookOpen },
    { id: "managers", label: "Manager Accounts", icon: UserCog },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];
  const managerNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "sales", label: "New Sale", icon: Receipt },
    { id: "products", label: "Catalog & Stock", icon: Boxes },
    { id: "customers", label: "Customers", icon: Users },
    { id: "ledger", label: "Customer Ledger", icon: BookOpen },
  ];
  const nav = role === "admin" ? adminNav : managerNav;
  return (
    <aside className="w-64 bg-slate-900 text-stone-200 flex flex-col shrink-0">
      <div className="px-6 py-6 border-b border-slate-800">
        <p className="font-ledger text-xs tracking-[0.3em] text-stone-500">SMV PLATFORM</p>
        <p className="font-display text-lg text-white mt-1">{role === "admin" ? "Super Admin" : name}</p>
      </div>
      <nav className="flex-1 py-4">
        {nav.map(item => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                active ? "bg-slate-800 text-white border-l-2 border-rose-500" : "text-stone-400 hover:text-white hover:bg-slate-800/50 border-l-2 border-transparent"
              }`}>
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <button onClick={onLogout} className="flex items-center gap-3 px-6 py-4 text-sm text-stone-500 hover:text-white border-t border-slate-800">
        <LogOut size={16} /> Switch account
      </button>
    </aside>
  );
}

// ================= ADMIN =================
function AdminViews({ view, products, setProducts, customers, setCustomers, invoices, managers, setManagers, settings, setSettings }) {
  if (view === "dashboard") return <AdminDashboard products={products} invoices={invoices} />;
  if (view === "products") return <ProductsView products={products} setProducts={setProducts} role="admin" />;
  if (view === "customers") return <CustomersView customers={customers} setCustomers={setCustomers} />;
  if (view === "ledger") return <LedgerView invoices={invoices} customers={customers} title="All Invoices" />;
  if (view === "managers") return <ManagersView managers={managers} setManagers={setManagers} />;
  if (view === "settings") return <SettingsView settings={settings} setSettings={setSettings} />;
  return null;
}

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    slate: "text-slate-700 bg-slate-100",
    rose: "text-rose-700 bg-rose-100",
    teal: "text-teal-700 bg-teal-100",
    amber: "text-amber-700 bg-amber-100",
  };
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 flex items-start justify-between shadow-sm">
      <div>
        <p className="text-xs font-ledger tracking-wide text-stone-500 uppercase">{label}</p>
        <p className="font-display text-2xl mt-2 text-slate-800">{value}</p>
      </div>
      <div className={`p-2 rounded-lg ${tones[tone]}`}><Icon size={20} /></div>
    </div>
  );
}

function AdminDashboard({ products, invoices }) {
  const totalSales = invoices.reduce((s, i) => s + i.total, 0);
  const inventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const pending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.total, 0);
  const lowStock = products.filter(p => p.stock <= p.lowStock);

  const last7 = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    return days.map(d => ({
      day: d.slice(5),
      sales: invoices.filter(inv => inv.date === d).reduce((s, i) => s + i.total, 0),
    }));
  }, [invoices]);

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl text-slate-800 mb-1">Owner Dashboard</h1>
      <p className="text-stone-500 text-sm mb-6">Aggregate view across every manager and register.</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Sales" value={inr(totalSales)} icon={TrendingUp} tone="teal" />
        <StatCard label="Inventory Value" value={inr(inventoryValue)} icon={Boxes} tone="slate" />
        <StatCard label="Pending Payments" value={inr(pending)} icon={Wallet} tone="amber" />
        <StatCard label="Low Stock Alerts" value={lowStock.length} icon={AlertTriangle} tone="rose" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
          <p className="font-display text-lg text-slate-800 mb-3">Sales — last 7 days</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => inr(v)} />
                <Bar dataKey="sales" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
          <p className="font-display text-lg text-slate-800 mb-3">Stock deficit alerts</p>
          {lowStock.length === 0 && <p className="text-sm text-stone-400">No products below threshold.</p>}
          <ul className="space-y-2">
            {lowStock.map(p => (
              <li key={p.id} className="flex justify-between text-sm border-b border-stone-100 pb-2">
                <span className="text-slate-700">{p.name}</span>
                <span className="font-ledger text-rose-600">{p.stock} {p.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ---------- products (shared admin/manager) ----------
function ProductsView({ products, setProducts, role }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", price: "", cost: "", stock: "", lowStock: "5", unit: "pcs" });
  const [showForm, setShowForm] = useState(false);

  const openNew = () => { setEditing(null); setForm({ name: "", category: "", price: "", cost: "", stock: "", lowStock: "5", unit: "pcs" }); setShowForm(true); };
  const openEdit = (p) => { setEditing(p.id); setForm({ ...p, price: String(p.price), cost: String(p.cost), stock: String(p.stock), lowStock: String(p.lowStock) }); setShowForm(true); };

  const submit = () => {
    if (!form.name || form.price === "") return;
    const payload = {
      name: form.name, category: form.category || "General", unit: form.unit || "pcs",
      price: Number(form.price) || 0, cost: Number(form.cost) || 0,
      stock: Number(form.stock) || 0, lowStock: Number(form.lowStock) || 5,
    };
    if (editing) {
      setProducts(products.map(p => p.id === editing ? { ...p, ...payload } : p));
    } else {
      setProducts([...products, { id: uid(), ...payload }]);
    }
    setShowForm(false);
  };

  const adjustStock = (id, delta) => {
    setProducts(products.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-slate-800">{role === "admin" ? "Products & Services" : "Catalog & Stock"}</h1>
          <p className="text-stone-500 text-sm">{role === "admin" ? "Master directory and profit margins." : "Add products and adjust live stock."}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800">
          <Plus size={16} /> Add product
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase text-xs font-ledger tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Category</th>
              <th className="text-right px-5 py-3">Price</th>
              {role === "admin" && <th className="text-right px-5 py-3">Margin</th>}
              <th className="text-right px-5 py-3">Stock</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-t border-stone-100">
                <td className="px-5 py-3 text-slate-800">{p.name}</td>
                <td className="px-5 py-3 text-stone-500">{p.category}</td>
                <td className="px-5 py-3 text-right font-ledger">{inr(p.price)}</td>
                {role === "admin" && <td className="px-5 py-3 text-right font-ledger text-teal-700">{inr(p.price - p.cost)}</td>}
                <td className="px-5 py-3 text-right">
                  <span className={`font-ledger px-2 py-0.5 rounded ${p.stock <= p.lowStock ? "bg-rose-100 text-rose-700" : "text-slate-700"}`}>
                    {p.stock} {p.unit}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => adjustStock(p.id, -1)} className="w-7 h-7 rounded border border-stone-300 text-stone-600 hover:bg-stone-100">–</button>
                    <button onClick={() => adjustStock(p.id, 1)} className="w-7 h-7 rounded border border-stone-300 text-stone-600 hover:bg-stone-100">+</button>
                    <button onClick={() => openEdit(p)} className="text-slate-500 hover:text-slate-800"><Pencil size={15} /></button>
                    {role === "admin" && <button onClick={() => setProducts(products.filter(x => x.id !== p.id))} className="text-rose-500 hover:text-rose-700"><Trash2 size={15} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? "Edit product" : "Add product"}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Category"><input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label="Price"><input type="number" className="input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Field>
            {role === "admin" && <Field label="Cost (for margin)"><input type="number" className="input" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} /></Field>}
            <Field label="Stock qty"><input type="number" className="input" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></Field>
            <Field label="Low stock alert at"><input type="number" className="input" value={form.lowStock} onChange={e => setForm({ ...form, lowStock: e.target.value })} /></Field>
            <Field label="Unit"><input className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></Field>
          </div>
          <button onClick={submit} className="mt-4 w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm hover:bg-slate-800">Save product</button>
        </Modal>
      )}
      <style>{`.input { border:1px solid #d6d3d1; border-radius:8px; padding:8px 10px; font-size:14px; width:100%; }`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="text-xs text-stone-500 font-ledger tracking-wide">{label.toUpperCase()}</span><div className="mt-1">{children}</div></label>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-xl p-6 ${wide ? "max-w-2xl" : "max-w-md"} w-full max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-slate-700"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- customers ----------
function CustomersView({ customers, setCustomers }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", discount: "0", defaultTax: "taxable" });

  const submit = () => {
    if (!form.name) return;
    setCustomers([...customers, { id: uid(), name: form.name, phone: form.phone, discount: Number(form.discount) || 0, defaultTax: form.defaultTax }]);
    setForm({ name: "", phone: "", discount: "0", defaultTax: "taxable" });
    setShowForm(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-slate-800">Customers</h1>
          <p className="text-stone-500 text-sm">Discount profiles apply automatically at billing.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800">
          <Plus size={16} /> Add customer
        </button>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase text-xs font-ledger tracking-wide">
            <tr><th className="text-left px-5 py-3">Name</th><th className="text-left px-5 py-3">Phone</th><th className="text-right px-5 py-3">Discount</th><th className="text-left px-5 py-3">Default format</th><th className="px-5 py-3"></th></tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-t border-stone-100">
                <td className="px-5 py-3 text-slate-800">{c.name}</td>
                <td className="px-5 py-3 text-stone-500 font-ledger">{c.phone}</td>
                <td className="px-5 py-3 text-right font-ledger">{c.discount}%</td>
                <td className="px-5 py-3 capitalize text-stone-600">{c.defaultTax}</td>
                <td className="px-5 py-3 text-right"><button onClick={() => setCustomers(customers.filter(x => x.id !== c.id))} className="text-rose-500 hover:text-rose-700"><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <Modal title="Add customer" onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <Field label="Name"><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Discount %"><input type="number" className="input" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} /></Field>
            <Field label="Default invoice format">
              <select className="input" value={form.defaultTax} onChange={e => setForm({ ...form, defaultTax: e.target.value })}>
                <option value="taxable">Taxable</option>
                <option value="non-taxable">Non-taxable</option>
              </select>
            </Field>
          </div>
          <button onClick={submit} className="mt-4 w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm hover:bg-slate-800">Save customer</button>
        </Modal>
      )}
      <style>{`.input { border:1px solid #d6d3d1; border-radius:8px; padding:8px 10px; font-size:14px; width:100%; }`}</style>
    </div>
  );
}

// ---------- managers (admin only) ----------
function ManagersView({ managers, setManagers }) {
  const [name, setName] = useState("");
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-3xl text-slate-800 mb-1">Manager Accounts</h1>
      <p className="text-stone-500 text-sm mb-6">Provision or restrict operational staff profiles.</p>
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 mb-4">
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Manager name" value={name} onChange={e => setName(e.target.value)} />
          <button onClick={() => { if (name) { setManagers([...managers, { id: uid(), name, pin: "1111" }]); setName(""); } }}
            className="bg-slate-900 text-white px-4 rounded-lg text-sm hover:bg-slate-800 flex items-center gap-2"><Plus size={16} />Add</button>
        </div>
      </div>
      <ul className="space-y-2">
        {managers.map(m => (
          <li key={m.id} className="bg-white border border-stone-200 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-slate-800">{m.name}</span>
            <button onClick={() => setManagers(managers.filter(x => x.id !== m.id))} className="text-rose-500 hover:text-rose-700"><Trash2 size={15} /></button>
          </li>
        ))}
      </ul>
      <style>{`.input { border:1px solid #d6d3d1; border-radius:8px; padding:8px 10px; font-size:14px; }`}</style>
    </div>
  );
}

function SettingsView({ settings, setSettings }) {
  return (
    <div className="p-8 max-w-md">
      <h1 className="font-display text-3xl text-slate-800 mb-1">Settings</h1>
      <p className="text-stone-500 text-sm mb-6">Applies to every taxable invoice platform-wide.</p>
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
        <Field label="GST rate (%)">
          <input type="number" className="input" value={settings.gstRate} onChange={e => setSettings({ ...settings, gstRate: Number(e.target.value) || 0 })} />
        </Field>
      </div>
      <style>{`.input { border:1px solid #d6d3d1; border-radius:8px; padding:8px 10px; font-size:14px; width:100%; }`}</style>
    </div>
  );
}

// ================= MANAGER =================
function ManagerViews({ view, products, setProducts, customers, invoices, setInvoices, settings, session }) {
  if (view === "dashboard") return <ManagerDashboard invoices={invoices} products={products} />;
  if (view === "sales") return <SalesFlow products={products} setProducts={setProducts} customers={customers} invoices={invoices} setInvoices={setInvoices} settings={settings} />;
  if (view === "products") return <ProductsView products={products} setProducts={setProducts} role="manager" />;
  if (view === "customers") return <CustomersView customers={customers} setCustomers={() => {}} />;
  if (view === "ledger") return <LedgerView invoices={invoices} customers={customers} title="Customer Ledger" exportable />;
  return null;
}

function ManagerDashboard({ invoices, products }) {
  const today = todayISO();
  const todaySales = invoices.filter(i => i.date === today).reduce((s, i) => s + i.total, 0);
  const pendingCount = invoices.filter(i => i.status === "pending").length;
  const lowStock = products.filter(p => p.stock <= p.lowStock);
  return (
    <div className="p-8">
      <h1 className="font-display text-3xl text-slate-800 mb-1">Today's Register</h1>
      <p className="text-stone-500 text-sm mb-6">Quick view of sales and stock health.</p>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Today's Sales" value={inr(todaySales)} icon={TrendingUp} tone="teal" />
        <StatCard label="Pending Invoices" value={pendingCount} icon={Wallet} tone="amber" />
        <StatCard label="Low Stock Items" value={lowStock.length} icon={AlertTriangle} tone="rose" />
      </div>
    </div>
  );
}

// ---------- sales flow: stamp modal -> invoice builder ----------
function SalesFlow({ products, setProducts, customers, invoices, setInvoices, settings }) {
  const [stage, setStage] = useState("idle"); // idle | choose | build
  const [taxType, setTaxType] = useState(null);
  const [lastInvoice, setLastInvoice] = useState(null);

  const finalize = (invoice) => {
    setInvoices([...invoices, invoice]);
    setProducts(products.map(p => {
      const line = invoice.items.find(l => l.productId === p.id);
      return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
    }));
    setLastInvoice(invoice);
    setStage("idle");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-slate-800">New Sale</h1>
          <p className="text-stone-500 text-sm">Every sale starts with a format stamp.</p>
        </div>
        <button onClick={() => setStage("choose")} className="flex items-center gap-2 bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-rose-800">
          <Receipt size={16} /> Start new invoice
        </button>
      </div>

      {lastInvoice && <InvoicePrintCard invoice={lastInvoice} />}

      {stage === "choose" && (
        <Modal title="Choose invoice format" onClose={() => setStage("idle")}>
          <p className="text-sm text-stone-500 mb-5">This decides whether GST is calculated on the bill.</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { setTaxType("taxable"); setStage("build"); }}
              className="stamp text-rose-700 py-10 flex flex-col items-center gap-2 hover:bg-rose-50">
              <span className="font-display text-xl tracking-wide">TAXABLE</span>
              <span className="text-xs font-ledger">GST {settings.gstRate}% applied</span>
            </button>
            <button onClick={() => { setTaxType("non-taxable"); setStage("build"); }}
              className="stamp text-teal-700 py-10 flex flex-col items-center gap-2 hover:bg-teal-50">
              <span className="font-display text-xl tracking-wide">NON-TAXABLE</span>
              <span className="text-xs font-ledger">No GST applied</span>
            </button>
          </div>
        </Modal>
      )}

      {stage === "build" && (
        <InvoiceBuilder taxType={taxType} products={products} customers={customers} settings={settings}
          onClose={() => setStage("idle")} onSave={finalize} />
      )}
    </div>
  );
}

function InvoiceBuilder({ taxType, products, customers, settings, onClose, onSave }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [status, setStatus] = useState("paid");
  const [lines, setLines] = useState([]);
  const [productPick, setProductPick] = useState(products[0]?.id || "");
  const [qty, setQty] = useState(1);

  const customer = customers.find(c => c.id === customerId);
  const addLine = () => {
    const p = products.find(x => x.id === productPick);
    if (!p || qty <= 0) return;
    setLines([...lines, { productId: p.id, name: p.name, qty: Number(qty), price: p.price, lineTotal: p.price * qty }]);
    setQty(1);
  };
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const discountPct = customer?.discount || 0;
  const discountAmount = subtotal * (discountPct / 100);
  const taxable = subtotal - discountAmount;
  const gstRate = taxType === "taxable" ? settings.gstRate : 0;
  const gstAmount = taxable * (gstRate / 100);
  const total = taxable + gstAmount;

  const save = () => {
    if (!customer || lines.length === 0) return;
    onSave({
      id: uid(), date: todayISO(), customerId: customer.id, customerName: customer.name,
      type: taxType, items: lines, subtotal, discountPercent: discountPct, discountAmount,
      gstRate, gstAmount, total, status,
    });
  };

  return (
    <Modal title={`${taxType === "taxable" ? "Taxable" : "Non-taxable"} invoice`} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="Customer">
          <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.discount ? `(${c.discount}% off)` : ""}</option>)}
          </select>
        </Field>
        <Field label="Payment status">
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </Field>
      </div>

      <div className="flex gap-2 items-end mb-3">
        <div className="flex-1">
          <Field label="Product">
            <select className="input" value={productPick} onChange={e => setProductPick(e.target.value)}>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} — {inr(p.price)} ({p.stock} in stock)</option>)}
            </select>
          </Field>
        </div>
        <div className="w-24">
          <Field label="Qty"><input type="number" className="input" value={qty} onChange={e => setQty(e.target.value)} /></Field>
        </div>
        <button onClick={addLine} className="bg-slate-900 text-white h-[38px] px-4 rounded-lg text-sm hover:bg-slate-800">Add</button>
      </div>

      <div className="border border-stone-200 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-xs text-stone-500 uppercase font-ledger">
            <tr><th className="text-left px-3 py-2">Item</th><th className="text-right px-3 py-2">Qty</th><th className="text-right px-3 py-2">Price</th><th className="text-right px-3 py-2">Total</th><th></th></tr>
          </thead>
          <tbody>
            {lines.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-stone-400">No items added yet.</td></tr>}
            {lines.map((l, i) => (
              <tr key={i} className="border-t border-stone-100">
                <td className="px-3 py-2">{l.name}</td>
                <td className="px-3 py-2 text-right font-ledger">{l.qty}</td>
                <td className="px-3 py-2 text-right font-ledger">{inr(l.price)}</td>
                <td className="px-3 py-2 text-right font-ledger">{inr(l.lineTotal)}</td>
                <td className="px-3 py-2 text-right"><button onClick={() => removeLine(i)} className="text-rose-500"><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-stone-50 rounded-lg p-4 font-ledger text-sm space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
        {discountPct > 0 && <div className="flex justify-between text-teal-700"><span>Customer discount ({discountPct}%)</span><span>-{inr(discountAmount)}</span></div>}
        {taxType === "taxable" && <div className="flex justify-between"><span>GST ({gstRate}%)</span><span>{inr(gstAmount)}</span></div>}
        <div className="flex justify-between font-display text-base pt-2 border-t border-stone-200"><span>Total</span><span>{inr(total)}</span></div>
      </div>

      <button onClick={save} disabled={lines.length === 0} className="mt-4 w-full bg-slate-900 disabled:opacity-40 text-white py-2.5 rounded-lg text-sm hover:bg-slate-800 flex items-center justify-center gap-2">
        <Check size={16} /> Save invoice
      </button>
      <style>{`.input { border:1px solid #d6d3d1; border-radius:8px; padding:8px 10px; font-size:14px; width:100%; }`}</style>
    </Modal>
  );
}

function InvoicePrintCard({ invoice }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-6 max-w-lg" id="invoice-print">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-display text-lg text-slate-800">Invoice saved</p>
          <p className="text-xs text-stone-500 font-ledger">{invoice.date} · {invoice.customerName}</p>
        </div>
        <span className={`stamp text-xs px-3 py-1 font-display tracking-wide ${invoice.type === "taxable" ? "text-rose-700" : "text-teal-700"}`}>
          {invoice.type.toUpperCase()}
        </span>
      </div>
      <div className="font-ledger text-sm space-y-1 mb-3">
        {invoice.items.map((l, i) => (
          <div key={i} className="flex justify-between text-stone-600"><span>{l.name} × {l.qty}</span><span>{inr(l.lineTotal)}</span></div>
        ))}
      </div>
      <div className="font-ledger text-sm border-t border-stone-200 pt-2 flex justify-between font-display text-base">
        <span>Total</span><span>{inr(invoice.total)}</span>
      </div>
      <button onClick={() => window.print()} className="mt-4 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <Printer size={15} /> Print / save as PDF
      </button>
    </div>
  );
}

// ---------- ledger (shared) ----------
function LedgerView({ invoices, customers, title, exportable }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? invoices : invoices.filter(i => i.customerId === filter);
  const total = filtered.reduce((s, i) => s + i.total, 0);

  const exportCSV = () => {
    const rows = [["Date", "Customer", "Type", "Subtotal", "Discount", "GST", "Total", "Status"]];
    filtered.forEach(i => rows.push([i.date, i.customerName, i.type, i.subtotal, i.discountAmount, i.gstAmount, i.total, i.status]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "customer-ledger.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-slate-800">{title}</h1>
          <p className="text-stone-500 text-sm">{filtered.length} invoices · {inr(total)} total</p>
        </div>
        <div className="flex gap-2">
          <select className="border border-stone-300 rounded-lg text-sm px-3" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All customers</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {exportable && (
            <button onClick={exportCSV} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800">
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase text-xs font-ledger tracking-wide">
            <tr><th className="text-left px-5 py-3">Date</th><th className="text-left px-5 py-3">Customer</th><th className="text-left px-5 py-3">Format</th><th className="text-right px-5 py-3">Total</th><th className="text-left px-5 py-3">Status</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-stone-400">No invoices yet.</td></tr>}
            {[...filtered].reverse().map(i => (
              <tr key={i.id} className="border-t border-stone-100">
                <td className="px-5 py-3 font-ledger text-stone-600">{i.date}</td>
                <td className="px-5 py-3 text-slate-800">{i.customerName}</td>
                <td className="px-5 py-3 capitalize text-stone-600">{i.type}</td>
                <td className="px-5 py-3 text-right font-ledger">{inr(i.total)}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-ledger ${i.status === "paid" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"}`}>{i.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createRoot } from "react-dom/client";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
