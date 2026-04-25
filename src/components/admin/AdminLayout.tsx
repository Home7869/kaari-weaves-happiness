import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Package, ShoppingBag, Users, Settings as SettingsIcon } from "lucide-react";
import { clearAdminToken } from "@/lib/api";

export function AdminLayout({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const logout = () => { clearAdminToken(); nav("/admin/login"); };
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
      isActive ? "bg-maroon text-gold" : "text-maroon-dk hover:bg-maroon/10"
    }`;
  return (
    <div className="min-h-screen flex bg-cream">
      <aside className="w-60 bg-ivory border-r border-gold/25 p-5 flex flex-col">
        <Link to="/admin" className="font-display text-2xl text-maroon mb-8">कारी <span className="text-sm text-muted-foreground">admin</span></Link>
        <nav className="space-y-1 flex-1">
          <NavLink to="/admin" end className={linkCls}><LayoutDashboard size={16} />Dashboard</NavLink>
          <NavLink to="/admin/products" className={linkCls}><Package size={16} />Products</NavLink>
          <NavLink to="/admin/orders" className={linkCls}><ShoppingBag size={16} />Orders</NavLink>
          <NavLink to="/admin/customers" className={linkCls}><Users size={16} />Customers</NavLink>
          <NavLink to="/admin/settings" className={linkCls}><SettingsIcon size={16} />Settings</NavLink>
        </nav>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-maroon px-4 py-2"><LogOut size={14} />Sign out</button>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
