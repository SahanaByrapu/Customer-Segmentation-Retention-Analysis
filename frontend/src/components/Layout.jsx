import { NavLink, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Sparkles, 
  FileText,
  Shield,
  Settings
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/customers", icon: Users, label: "Customers" },
  { path: "/predictions", icon: TrendingUp, label: "Predictions" },
  { path: "/ai-insights", icon: Sparkles, label: "AI Insights" },
  { path: "/reports", icon: FileText, label: "Reports" },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside 
        className="w-64 bg-gray-900 text-white flex flex-col fixed h-full"
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
                ChurnGuard
              </h1>
              <p className="text-xs text-gray-400">AI Analytics</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `sidebar-item ${isActive ? "active" : ""}`
                  }
                  data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button 
            className="sidebar-item w-full justify-start"
            data-testid="settings-btn"
          >
            <Settings className="w-5 h-5" strokeWidth={1.5} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 bg-gray-50 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
