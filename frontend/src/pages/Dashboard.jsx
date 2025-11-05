import React, { useState, useEffect } from "react";
import { 
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  PiggyBank,
  ShoppingCart,
  Coffee,
  Car,
  Film,
  Heart,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Dashboard() {
  const API_BASE = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    try {
      const [transRes, budgetRes, catRes] = await Promise.all([
        fetch(`${API_BASE}/transactions/gettransactions/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/budgets/get_budgets/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/categories/allcategories/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const transData = await transRes.json();
      const budgetData = await budgetRes.json();
      const catData = await catRes.json();

      setTransactions(Array.isArray(transData) ? transData : []);
      setBudgets(Array.isArray(budgetData) ? budgetData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // Filter transactions by selected month
  const filteredTransactions = transactions.filter(t => {
    const transDate = new Date(t.date);
    const matchesMonth = selectedMonth === "all" || transDate.getMonth() === parseInt(selectedMonth);
    const matchesCategory = selectedCategory === "all" || t.category_id === parseInt(selectedCategory);
    return matchesMonth && matchesCategory;
  });

  // Calculate stats
  const currentMonthTransactions = transactions.filter(t => {
    const transDate = new Date(t.date);
    return transDate.getMonth() === new Date().getMonth();
  });

  const lastMonthTransactions = transactions.filter(t => {
    const transDate = new Date(t.date);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return transDate.getMonth() === lastMonth.getMonth();
  });

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const lastMonthIncome = lastMonthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const balance = totalIncome - totalExpenses;
  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  const remainingBudget = totalBudget - totalExpenses;

  const incomeChange = lastMonthIncome > 0 ? ((totalIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1) : 0;
  const expenseChange = lastMonthExpenses > 0 ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1) : 0;

  // Spending by category
  const categorySpending = categories.map(cat => {
    const spent = currentMonthTransactions
      .filter(t => t.category_id === cat.category_id && t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    return { name: cat.name, value: spent, color: getRandomColor() };
  }).filter(c => c.value > 0);

  // Expenses over time (weekly)
  const expensesOverTime = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (3 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekExpenses = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === "expense" && date >= weekStart && date < weekEnd;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return {
      name: `Week ${i + 1}`,
      expenses: weekExpenses
    };
  });

  // Budget alerts
  const budgetAlerts = budgets.map(budget => {
    const spent = currentMonthTransactions
      .filter(t => t.category_id === budget.category_id && t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const percentage = (spent / parseFloat(budget.amount)) * 100;
    const categoryName = categories.find(c => c.category_id === budget.category_id)?.name || "Unknown";
    
    if (percentage >= 100) {
      return {
        type: "danger",
        message: `${categoryName} budget exceeded by BWP ${(spent - parseFloat(budget.amount)).toFixed(2)}`
      };
    } else if (percentage >= 85) {
      return {
        type: "warning",
        message: `You have used ${percentage.toFixed(0)}% of your ${categoryName} budget.`
      };
    }
    return null;
  }).filter(Boolean);

  // Recent transactions (last 10)
  const recentTransactions = [...filteredTransactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  function getRandomColor() {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("food") || name.includes("grocery")) return ShoppingCart;
    if (name.includes("transport") || name.includes("car")) return Car;
    if (name.includes("entertainment") || name.includes("fun")) return Film;
    if (name.includes("health")) return Heart;
    if (name.includes("coffee")) return Coffee;
    return DollarSign;
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">Welcome back, {user.fname || user.username}! Here's your financial overview.</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 bg-gray-50">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Balance</span>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="text-blue-600" size={20} />
              </div>
            </div>
            <p className={`text-3xl font-bold mb-1 ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              BWP {balance.toFixed(2)}
            </p>
            <div className="flex items-center gap-1 text-sm">
              {balance >= 0 ? (
                <><ArrowUpRight size={16} className="text-green-600" /><span className="text-green-600">Available</span></>
              ) : (
                <><ArrowDownRight size={16} className="text-red-600" /><span className="text-red-600">Deficit</span></>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Income</span>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="text-green-600" size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">BWP {totalIncome.toFixed(2)}</p>
            <div className="flex items-center gap-1 text-sm">
              {incomeChange >= 0 ? (
                <><ArrowUpRight size={16} className="text-green-600" /><span className="text-green-600">+{incomeChange}%</span></>
              ) : (
                <><ArrowDownRight size={16} className="text-red-600" /><span className="text-red-600">{incomeChange}%</span></>
              )}
              <span className="text-gray-500">vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Spending</span>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="text-red-600" size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">BWP {totalExpenses.toFixed(2)}</p>
            <div className="flex items-center gap-1 text-sm">
              {expenseChange <= 0 ? (
                <><ArrowDownRight size={16} className="text-green-600" /><span className="text-green-600">{Math.abs(expenseChange)}%</span></>
              ) : (
                <><ArrowUpRight size={16} className="text-red-600" /><span className="text-red-600">+{expenseChange}%</span></>
              )}
              <span className="text-gray-500">vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Remaining Budget</span>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <PiggyBank className="text-purple-600" size={20} />
              </div>
            </div>
            <p className={`text-3xl font-bold mb-1 ${remainingBudget >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              BWP {remainingBudget.toFixed(2)}
            </p>
            <div className="text-sm text-gray-500">
              of BWP {totalBudget.toFixed(2)} total
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Spending by Category */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Spending by Category</h3>
            {categorySpending.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `BWP ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {categorySpending.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-xs text-gray-600">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No spending data available
              </div>
            )}
          </div>

          {/* Expenses Over Time */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Expenses Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={expensesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip formatter={(value) => `BWP ${value.toFixed(2)}`} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Progress & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Progress */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Budget Progress</h3>
            <div className="space-y-4">
              {budgets.length > 0 ? budgets.map((budget) => {
                const spent = currentMonthTransactions
                  .filter(t => t.category_id === budget.category_id && t.type === "expense")
                  .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
                const percentage = Math.min((spent / parseFloat(budget.amount)) * 100, 100);
                const categoryName = categories.find(c => c.category_id === budget.category_id)?.name || "Unknown";
                
                return (
                  <div key={budget.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700">{categoryName}</span>
                      <span className="text-gray-600">
                        BWP {spent.toFixed(2)} / {parseFloat(budget.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          percentage >= 100 ? 'bg-red-600' :
                          percentage >= 85 ? 'bg-yellow-500' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(0)}% used</p>
                  </div>
                );
              }) : (
                <p className="text-gray-400 text-center py-8">No budgets set</p>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? recentTransactions.map((trans) => {
                const category = categories.find(c => c.category_id === trans.category_id);
                const IconComponent = getCategoryIcon(category?.name);
                
                return (
                  <div key={trans.transaction_id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      trans.type === "income" ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <IconComponent size={18} className={trans.type === "income" ? 'text-green-600' : 'text-red-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{trans.description}</p>
                      <p className="text-xs text-gray-500">{category?.name || 'Uncategorized'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${trans.type === "income" ? 'text-green-600' : 'text-red-600'}`}>
                        {trans.type === "expense" ? "-" : "+"}BWP {parseFloat(trans.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(trans.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-gray-400 text-center py-8">No transactions yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-orange-500" size={20} />
              <h3 className="text-lg font-bold text-gray-900">Budget Alerts</h3>
            </div>
            <div className="space-y-3">
              {budgetAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-4 rounded-lg ${
                    alert.type === "danger" ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <AlertTriangle size={18} className={alert.type === "danger" ? 'text-red-600' : 'text-yellow-600'} />
                  <p className={`text-sm font-medium ${alert.type === "danger" ? 'text-red-800' : 'text-yellow-800'}`}>
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}