import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Users, ArrowUpDown, Tag, FileText, LogOut, Shield } from "lucide-react";
import useRoleGuard from "../hooks/useRoleGuard";

export default function AdminLayout({ children }) {
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Enforce admin-only access using shared hook
  const { user, isAllowed, checked } = useRoleGuard(["admin"], { redirectTo: "/users" });
  useEffect(() => {
    if (checked && user) {
      setAdmin(user);
    }
  }, [checked, user]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const navItems = [
    { name: "User Management", icon: Users, path: "/users" },
    { name: "Transactions", icon: ArrowUpDown, path: "/transaction" },
    { name: "Categories", icon: Tag, path: "/category" },
    { name: "Activity Logs", icon: Shield, path: "/activity" },
    { name: "Reports", icon: FileText, path: "/report" },
  ];

  // Navigate to a tab
  const handleNavigation = (path) => {
    navigate(path, { replace: true }); // absolute path
    window.scrollTo(0, 0); // reset scroll
  };

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo & Admin Info */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600 mb-1">Admin Panel</h1>
          <div
            className="flex items-center gap-2 mt-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
            role="button"
            tabIndex={0}
            onClick={() => handleNavigation('/admin/profile')}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNavigation('/admin/profile'); }}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {(admin.name?.[0] || admin.username?.[0] || "A").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {admin.name || admin.username}
              </p>
              <p className="text-xs text-gray-500 truncate">{admin.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
            Management
          </p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {isAllowed ? children : null}
      </main>
    </div>
  );
}
