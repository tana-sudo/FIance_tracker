import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ArrowUpDown, 
  Target, 
  Tag, 
  FileText, 
  LogOut,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Last 30 Days");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!userData || !token) {
      window.location.href = "/";
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error("Error parsing user data:", error);
      window.location.href = "/";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Sample data for charts
  const incomeExpenseData = [
    { name: 'Jan', income: 400, expenses: 240 },
    { name: 'Feb', income: 300, expenses: 139 },
    { name: 'Mar', income: 200, expenses: 980 },
    { name: 'Apr', income: 278, expenses: 390 },
    { name: 'May', income: 189, expenses: 480 },
    { name: 'Jun', income: 0, expenses: 600 },
  ];

  const categoryData = [
    { name: 'Healthcare', value: 600, color: '#3B82F6' },
    { name: 'Food', value: 300, color: '#10B981' },
    { name: 'Transport', value: 200, color: '#F59E0B' },
    { name: 'Entertainment', value: 150, color: '#EF4444' },
  ];

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, active: true },
    { name: 'Transactions', icon: ArrowUpDown, active: false },
    { name: 'Budgets', icon: Target, active: false },
    { name: 'Categories', icon: Tag, active: false },
    { name: 'Reports', icon: FileText, active: false },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Brand */}
       

        {/* Navigation */}
        <nav className="flex-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                item.active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600 mt-1">Welcome back {user.fname || user.username}! 👋 Here's your financial overview.</p>
         
          
            </div>
            <div className="flex gap-2">
              {['Last 30 Days', 'Last 60 Days', 'All Time'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Income */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Total Income</span>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-green-500">BWP 0.00</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>

            {/* Total Expenses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Total Expenses</span>
                <TrendingDown className="text-red-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-red-500">BWP 600.00</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>

            {/* Balance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Balance</span>
                <Wallet className="text-blue-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-red-500">-BWP 600.00</p>
              <p className="text-xs text-gray-500 mt-1">Current balance</p>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Transactions</span>
                <Receipt className="text-purple-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">1</p>
              <p className="text-xs text-gray-500 mt-1">Total count</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expenses Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="#EF4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expenses by Category Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Expenses by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Profile Card */}
       
        </div>
      </main>
    </div>
  );
}