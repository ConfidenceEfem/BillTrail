import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Repeat, Settings, LogOut, Wallet } from "lucide-react";
import { useAuthStore } from "../store/authStore";
// import { decodeAccessToken } from "../lib/jwt";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/recurring-invoices", label: "Recurring", icon: Repeat },
  { to: "/balance", label: "Balance", icon: Wallet },
  // { to: "/team", label: "Team", icon: UsersRound },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col p-4">
        <div className="flex items-center gap-2 mb-10 px-2">
         <img className="w-[150px] h-[60px] object-cover" src="/logo.png"/>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-800"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 pt-3 mt-3">
          {/* <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold flex items-center justify-center">
              {decoded?.role?.[0] ?? "?"}
            </div>
            <p className="text-xs text-gray-500">{decoded?.role ?? "Member"}</p>
          </div> */}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 w-full"
          >
            <LogOut size={18} strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}