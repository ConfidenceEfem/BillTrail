import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/clients", label: "Clients" },
  { to: "/invoices", label: "Invoices" },
  { to: "/recurring-invoices", label: "Recurring" },
  { to: "/settings", label: "Settings" },
];

export function AppShell() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col p-4">
        <p className="text-lg font-medium text-brand-800 mb-8">BillTrail</p>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? "bg-brand-50 text-brand-800" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 text-left"
        >
          Log out
        </button>
      </aside>
      <main className="flex-1 p-8">
   
        <Outlet />
      </main>
    </div>
  );
}