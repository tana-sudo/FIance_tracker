import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ArrowUpDown, 
  Target, 
  Tag, 
  FileText, 
  Bell,
  LogOut,
  User
} from "lucide-react";
import useRoleGuard from "../hooks/useRoleGuard";
import Notifications from "./Notifications";

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Enforce user-only access for standard app layout
  const { user: currentUser, isAllowed, checked } = useRoleGuard(["user"], { redirectTo: "/dashboard" });
  useEffect(() => {
    if (checked && currentUser) {
      setUser(currentUser);
    }
  }, [checked, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Transactions', icon: ArrowUpDown, path: '/transactions' },
    { name: 'Budgets', icon: Target, path: '/budgets' },
    { name: 'Categories', icon: Tag, path: '/categories' },
    { name: 'Notifications', icon: Bell, path: '/notifications' },
    { name: 'Reports', icon: FileText, path: '/reports' }, 
  
  ];

  if (!user || !isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600 mb-1">Euna</h1>
          <div
            className="flex items-center gap-2 mt-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/profile')}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/profile'); }}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {((user.fname || user.name || user.username || 'U')[0]).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.fname || user.name || user.username}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <div className="mt-3">
            <Notifications />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
            Menu
          </p>
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </button>
          ))}
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
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}