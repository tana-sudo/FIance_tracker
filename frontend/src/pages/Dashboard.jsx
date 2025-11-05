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
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/**
 * Dashboard.jsx
 * - Keeps your layout unchanged
 * - Parses transaction dates as MM/DD/YYYY (with safe fallback)
 * - Filters everything (KPIs, charts, budgets, alerts, recent transactions)
 * - Adds quick month toggle (This Month | Last Month | All Time)
 */

export default function Dashboard() {
  const API_BASE = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);

  // selectedMonth: "all" or numeric month string "0"-"11"
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // quickMonth: "this", "last", "all"
  const [quickMonth, setQuickMonth] = useState("this");

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  useEffect(() => {
    // keep quickMonth and selectedMonth in sync:
    if (quickMonth === "this") {
      setSelectedMonth(String(new Date().getMonth()));
    } else if (quickMonth === "last") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      setSelectedMonth(String(d.getMonth()));
    } else {
      setSelectedMonth("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickMonth]);

  const fetchData = async () => {
    try {
      const [transRes, budgetRes, catRes] = await Promise.all([
        fetch(`${API_BASE}/transactions/gettransactions/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/budgets/get_budgets/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/categories/allcategories/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const transData = await transRes.json();
      const budgetData = await budgetRes.json();
      const catData = await catRes.json();

      // store arrays safely
      setTransactions(Array.isArray(transData) ? transData : []);
      setBudgets(Array.isArray(budgetData) ? budgetData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // --- Helpers: robust date parsing for MM/DD/YYYY stored dates ---
  function parseDateSafe(d) {
    if (!d) return null;
    // If it's already a Date object
    if (d instanceof Date) return d;
    // If it's ISO-ish (yyyy-mm-dd or yyyy-mm-ddTHH:MM:SS)
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
      const nd = new Date(d);
      if (!isNaN(nd)) return nd;
    }
    // If it's MM/DD/YYYY or M/D/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) {
      const parts = d.split("/");
      // parts: [MM, DD, YYYY]
      const mm = parseInt(parts[0], 10) - 1;
      const dd = parseInt(parts[1], 10);
      const yy = parseInt(parts[2], 10);
      const nd = new Date(yy, mm, dd);
      if (!isNaN(nd)) return nd;
    }
    // Try Date constructor as a last resort
    const attempt = new Date(d);
    return isNaN(attempt) ? null : attempt;
  }

  // --- Filtered transactions used everywhere ---
  const filteredTransactions = transactions.filter(t => {
    const date = parseDateSafe(t.date);
    if (!date) return false; // ignore malformed date
    const matchesMonth = selectedMonth === "all" || date.getMonth() === parseInt(selectedMonth);
    const matchesCategory = selectedCategory === "all" || t.category_id === parseInt(selectedCategory);
    return matchesMonth && matchesCategory;
  });

  // --- KPI Calculations (use filteredTransactions) ---
  const totalIncome = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const balance = totalIncome - totalExpenses;

  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  const remainingBudget = totalBudget - totalExpenses;

  // --- For change comparisons we compute "selectedLastMonth" (same filter but last month) ---
  const computeLastMonthChange = () => {
    // Determine the month we compare against:
    // If selectedMonth === 'all' -> lastMonth = previous calendar month
    // Else -> compare the month before selectedMonth
    let compareMonth;
    if (selectedMonth === "all") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      compareMonth = d.getMonth();
    } else {
      compareMonth = (parseInt(selectedMonth, 10) - 1 + 12) % 12;
    }

    const lastFiltered = transactions.filter(t => {
      const date = parseDateSafe(t.date);
      if (!date) return false;
      const matchesMonth = date.getMonth() === compareMonth;
      const matchesCategory = selectedCategory === "all" || t.category_id === parseInt(selectedCategory);
      return matchesMonth && matchesCategory;
    });

    const income = lastFiltered.filter(t => t.type === "income").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const expenses = lastFiltered.filter(t => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    return { income, expenses };
  };

  const { income: lastMonthIncome, expenses: lastMonthExpenses } = computeLastMonthChange();

  const incomeChange = lastMonthIncome > 0 ? ((totalIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1) : 0;
  const expenseChange = lastMonthExpenses > 0 ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1) : 0;

  // --- Category Spending for Pie (based on filteredTransactions) ---
  const categorySpending = categories
    .map(cat => {
      const spent = filteredTransactions
        .filter(t => t.category_id === cat.category_id && t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      return spent > 0 ? { name: cat.name, value: spent } : null;
    })
    .filter(Boolean);

  // --- Expenses Over Time (4 weeks) using filteredTransactions ---
  const expensesOverTime = Array.from({ length: 4 }, (_, i) => {
    const now = new Date();
    // build relative week windows ending today: Week1 oldest -> Week4 newest
    const end = new Date(now);
    end.setDate(now.getDate() - (3 - i) * 7 + 1); // exclusive end
    const start = new Date(end);
    start.setDate(end.getDate() - 7); // inclusive start

    const weekExpenses = filteredTransactions
      .filter(t => {
        const d = parseDateSafe(t.date);
        return t.type === "expense" && d && d >= start && d < end;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return { name: `Week ${i + 1}`, expenses: weekExpenses };
  });

  // --- Budgets progress & alerts (use filteredTransactions) ---
  const budgetsWithProgress = budgets.map(b => {
    const spent = filteredTransactions
      .filter(t => t.category_id === b.category_id && t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const percentage = parseFloat(b.amount) > 0 ? (spent / parseFloat(b.amount)) * 100 : 0;
    return { ...b, spent, percentage };
  });

  const budgetAlerts = budgetsWithProgress
    .map(b => {
      const categoryName = categories.find(c => c.category_id === b.category_id)?.name || "Unknown";
      if (b.percentage >= 100) return { type: "danger", message: `${categoryName} budget exceeded by BWP ${(b.spent - parseFloat(b.amount)).toFixed(2)}` };
      if (b.percentage >= 85) return { type: "warning", message: `You have used ${b.percentage.toFixed(0)}% of your ${categoryName} budget.` };
      return null;
    })
    .filter(Boolean);

  // --- Recent transactions (filtered + sorted) ---
  const recentTransactions = [...filteredTransactions]
    .sort((a, b) => {
      const da = parseDateSafe(a.date);
      const db = parseDateSafe(b.date);
      return db - da;
    })
    .slice(0, 10);

  // --- Category icon helper ---
  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("food") || name.includes("grocery")) return ShoppingCart;
    if (name.includes("transport") || name.includes("car")) return Car;
    if (name.includes("entertainment") || name.includes("fun")) return Film;
    if (name.includes("health")) return Heart;
    if (name.includes("coffee")) return Coffee;
    return DollarSign;
  };

  // --- Color palette used for pie cells ---
  const pieColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

  // --- JSX (keeps your original layout intact) ---
  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">Welcome back, {user.fname || user.username}! Here's your financial overview.</p>
          </div>

          <div className="flex gap-3 items-center">
            {/* Quick Month Toggle */}
            <div className="inline-flex rounded-md overflow-hidden border">
              <button
                onClick={() => setQuickMonth("this")}
                className={`px-3 py-2 text-sm ${quickMonth === "this" ? "bg-gray-100 font-semibold" : "bg-white"}`}
              >
                This Month
              </button>
              <button
                onClick={() => setQuickMonth("last")}
                className={`px-3 py-2 text-sm ${quickMonth === "last" ? "bg-gray-100 font-semibold" : "bg-white"}`}
              >
                Last Month
              </button>
              <button
                onClick={() => setQuickMonth("all")}
                className={`px-3 py-2 text-sm ${quickMonth === "all" ? "bg-gray-100 font-semibold" : "bg-white"}`}
              >
                All Time
              </button>
            </div>

            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setQuickMonth("custom"); // indicate manual month selection
              }}
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
              {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 bg-gray-50">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Balance */}
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

          {/* Total Income */}
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

          {/* Total Spending */}
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

          {/* Remaining Budget */}
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
            <div className="text-sm text-gray-500">of BWP {totalBudget.toFixed(2)} total</div>
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
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `BWP ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {categorySpending.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></div>
                      <span className="text-xs text-gray-600">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">No spending data available</div>
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
              {budgetsWithProgress.length > 0 ? budgetsWithProgress.map((budget) => {
                const categoryName = categories.find(c => c.category_id === budget.category_id)?.name || "Unknown";
                const percentage = Math.min(budget.percentage || 0, 100);
                return (
                  <div key={budget.budget_id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700">{categoryName}</span>
                      <span className="text-gray-600">BWP {budget.spent.toFixed(2)} / {parseFloat(budget.amount).toFixed(2)}</span>
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
              {recentTransactions.length > 0 ? recentTransactions.map((trans, idx) => {
                const category = categories.find(c => c.category_id === trans.category_id);
                const IconComponent = getCategoryIcon(category?.name);

                return (
                  <div key={trans.id || trans.transaction_id || idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trans.type === "income" ? 'bg-green-100' : 'bg-red-100'}`}>
                      <IconComponent size={18} className={trans.type === "income" ? 'text-green-600' : 'text-red-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{trans.description}</p>
                      <p className="text-xs text-gray-500">{category?.name || 'Uncategorized'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${trans.type === "income" ? 'text-green-600' : 'text-red-600'}`}>
                        {trans.type === "expense" ? "-" : "+"}BWP {parseFloat(trans.amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{(() => {
                        const d = parseDateSafe(trans.date);
                        return d ? d.toLocaleDateString() : "";
                      })()}</p>
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
                <div key={idx} className={`flex items-start gap-3 p-4 rounded-lg ${alert.type === "danger" ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <AlertTriangle size={18} className={alert.type === "danger" ? 'text-red-600' : 'text-yellow-600'} />
                  <p className={`text-sm font-medium ${alert.type === "danger" ? 'text-red-800' : 'text-yellow-800'}`}>{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
