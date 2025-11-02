import React, { useState } from "react";
import { 
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Last 30 Days");

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

  const stats = [
    {
      title: 'Total Income',
      value: 'BWP 0.00',
      icon: TrendingUp,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
      valueColor: 'text-green-500',
      subtitle: 'Last 30 days'
    },
    {
      title: 'Total Expenses',
      value: 'BWP 600.00',
      icon: TrendingDown,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      valueColor: 'text-red-500',
      subtitle: 'Last 30 days'
    },
    {
      title: 'Balance',
      value: '-BWP 600.00',
      icon: Wallet,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      valueColor: 'text-red-500',
      subtitle: 'Current balance'
    },
    {
      title: 'Transactions',
      value: '1',
      icon: Receipt,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-50',
      valueColor: 'text-gray-900',
      subtitle: 'Total count'
    },
  ];

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">
              Welcome back, <span className="font-semibold text-gray-900">{user.fname || user.username}</span>! 👋 
              <span className="ml-1">Here's your financial overview.</span>
            </p>
          </div>
          <div className="flex gap-2">
            {['Last 30 Days', 'Last 60 Days', 'All Time'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-sm'
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
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600 text-sm font-medium">{stat.title}</span>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <stat.icon className={stat.iconColor} size={20} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${stat.valueColor} mb-1`}>{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Income vs Expenses Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Income vs Expenses</h3>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Income</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600">Expenses</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {categoryData.map((category, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-xs text-gray-600">{category.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Ready to track more?</h3>
              <p className="text-blue-100">
                Add your transactions and set budgets to better manage your finances.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.href = '/transactions'}
                className="px-5 py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Add Transaction
              </button>
              <button 
                onClick={() => window.location.href = '/budgets'}
                className="px-5 py-2.5 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
              >
                Set Budget
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}