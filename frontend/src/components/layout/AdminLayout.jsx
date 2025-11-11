import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  ArrowUpDown,
  Tag,
  FileText,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const adminData = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!adminData || !token) {
      navigate("/"); // Redirect if not logged in
      return;
    }

    try {
      setAdmin(JSON.parse(adminData));
    } catch (error) {
      console.error("Error parsing admin data:", error);
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  const navItems = [
    { name: "User Management", icon: Users, path: "/admin/users" },
    { name: "Transactions", icon: ArrowUpDown, path: "/admin/transactions" },
    { name: "Categories", icon: Tag, path: "/admin/categories" },
    { name: "Reports", icon: FileText, path: "/admin/reports" },
    { name: "Settings", icon: Settings, path: "/admin/settings" },
  ];

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
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600 mb-1">Admin Panel</h1>
          <div className="flex items-center gap-2 mt-3 p-2 bg-gray-50 rounded-lg">
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
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
            Management
          </p>
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                location.pathname === item.path
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
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
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <Shield size={20} className="text-blue-600" />
            <span>Admin Dashboard</span>
          </div>
          <p className="text-sm text-gray-500">
            Welcome back, {admin.name || admin.username} 👋
          </p>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
