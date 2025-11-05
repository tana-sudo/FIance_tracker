import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb
} from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Reports() {
  const API_BASE = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [quickFilter, setQuickFilter] = useState("thisMonth");

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    try {
      const [transRes, catRes] = await Promise.all([
        fetch(`${API_BASE}/transactions/gettransactions/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/categories/allcategories/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const transData = await transRes.json();
      const catData = await catRes.json();

      setTransactions(Array.isArray(transData) ? transData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleQuickFilter = (filter) => {
    setQuickFilter(filter);
    const now = new Date();
    if (filter === "thisMonth") {
      setSelectedMonth(now.getMonth());
      setSelectedYear(now.getFullYear());
    } else if (filter === "lastMonth") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      setSelectedMonth(lastMonth.getMonth());
      setSelectedYear(lastMonth.getFullYear());
    }
  };

  const getMonthTransactions = (month, year) => {
    return transactions.filter(t => {
      const transDate = new Date(t.date);
      if (quickFilter === "allTime") return true;
      return transDate.getMonth() === month && transDate.getFullYear() === year;
    });
  };

  const currentMonthTransactions = getMonthTransactions(selectedMonth, selectedYear);
  const previousMonthDate = new Date(selectedYear, selectedMonth - 1);
  const previousMonthTransactions = getMonthTransactions(previousMonthDate.getMonth(), previousMonthDate.getFullYear());

  const calculateStats = (transArray) => {
    const income = transArray.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const expenses = transArray.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const savings = income - expenses;

    const categorySpending = {};
    transArray.filter(t => t.type === "expense").forEach(t => {
      const catName = categories.find(c => c.category_id === t.category_id)?.name || "Other";
      categorySpending[catName] = (categorySpending[catName] || 0) + parseFloat(t.amount || 0);
    });
    const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];

    return { income, expenses, savings, topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null };
  };

  const currentStats = calculateStats(currentMonthTransactions);
  const previousStats = calculateStats(previousMonthTransactions);

  const categorySpending = categories.map(cat => {
    const spent = currentMonthTransactions
      .filter(t => t.category_id === cat.category_id && t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    return { name: cat.name, value: spent };
  }).filter(c => c.value > 0);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  const dailySpending = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(selectedYear, selectedMonth, i + 1);
    const dayExpenses = currentMonthTransactions
      .filter(t => {
        const transDate = new Date(t.date);
        return t.type === "expense" && transDate.getDate() === date.getDate();
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return { day: i + 1, expenses: dayExpenses };
  });

  const insights = [];
  if (previousStats.expenses > 0) {
    const expenseChange = ((currentStats.expenses - previousStats.expenses) / previousStats.expenses * 100);
    if (Math.abs(expenseChange) > 5) {
      insights.push({
        type: expenseChange > 0 ? "warning" : "success",
        text: `Your spending ${expenseChange > 0 ? 'increased' : 'decreased'} ${Math.abs(expenseChange).toFixed(1)}% compared to last month.`
      });
    }
  }

  if (currentStats.topCategory) {
    insights.push({
      type: "info",
      text: `${currentStats.topCategory.name} is your highest spending category this month at BWP ${currentStats.topCategory.amount.toFixed(2)}.`
    });
  }

  if (currentStats.savings > 0) {
    insights.push({
      type: "success",
      text: `Great job! You saved BWP ${currentStats.savings.toFixed(2)} this month.`
    });
  } else if (currentStats.savings < 0) {
    insights.push({
      type: "warning",
      text: `You spent BWP ${Math.abs(currentStats.savings).toFixed(2)} more than you earned this month.`
    });
  }

  const handleDownloadPDF = () => {
    alert("PDF download feature coming soon!");
  };

  const handleExportCSV = () => {
    const csv = currentMonthTransactions.map(t => 
      `${t.date},${t.description},${t.type},${t.amount},${categories.find(c => c.category_id === t.category_id)?.name || 'Other'}`
    ).join('\n');
    const blob = new Blob([`Date,Description,Type,Amount,Category\n${csv}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${selectedMonth + 1}-${selectedYear}.csv`;
    a.click();
  };

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2">Reports</h2>
            <p className="text-indigo-100">View trends, insights, and financial analysis</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleQuickFilter("thisMonth")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                quickFilter === "thisMonth" 
                  ? "bg-white text-indigo-600"
                  : "bg-indigo-700 text-white hover:bg-indigo-800"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleQuickFilter("lastMonth")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                quickFilter === "lastMonth" 
                  ? "bg-white text-indigo-600"
                  : "bg-indigo-700 text-white hover:bg-indigo-800"
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => handleQuickFilter("allTime")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                quickFilter === "allTime" 
                  ? "bg-white text-indigo-600"
                  : "bg-indigo-700 text-white hover:bg-indigo-800"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {quickFilter !== "allTime" && (
          <div className="flex flex-wrap gap-3 mt-6">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-indigo-400 bg-white/90 rounded-lg focus:ring-2 focus:ring-white outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-indigo-400 bg-white/90 rounded-lg focus:ring-2 focus:ring-white outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p-8 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-medium">Total Income</span>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="text-green-600" size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">BWP {currentStats.income.toFixed(2)}</p>
            {previousStats.income > 0 && (
              <div className="flex items-center gap-1 text-sm">
                {currentStats.income >= previousStats.income ? (
                  <><ArrowUpRight size={16} className="text-green-600" /><span className="text-green-600">
                    +{((currentStats.income - previousStats.income) / previousStats.income * 100).toFixed(1)}%
                  </span></>
                ) : (
                  <><ArrowDownRight size={16} className="text-red-600" /><span className="text-red-600">
                    {((currentStats.income - previousStats.income) / previousStats.income * 100).toFixed(1)}%
                  </span></>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-medium">Total Expenses</span>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="text-red-600" size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">BWP {currentStats.expenses.toFixed(2)}</p>
            {previousStats.expenses > 0 && (
              <div className="flex items-center gap-1 text-sm">
                {currentStats.expenses <= previousStats.expenses ? (
                  <><ArrowDownRight size={16} className="text-green-600" /><span className="text-green-600">
                    {((currentStats.expenses - previousStats.expenses) / previousStats.expenses * 100).toFixed(1)}%
                  </span></>
                ) : (
                  <><ArrowUpRight size={16} className="text-red-600" /><span className="text-red-600">
                    +{((currentStats.expenses - previousStats.expenses) / previousStats.expenses * 100).toFixed(1)}%
                  </span></>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-medium">Net Savings</span>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="text-blue-600" size={20} />
              </div>
            </div>
            <p className={`text-3xl font-bold mb-2 ${currentStats.savings >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              BWP {currentStats.savings.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">Income - Expenses</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-medium">Top Category</span>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Target className="text-purple-600" size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {currentStats.topCategory?.name || "N/A"}
            </p>
            {currentStats.topCategory && (
              <p className="text-sm text-gray-500">BWP {currentStats.topCategory.amount.toFixed(2)}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Spending Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySpending}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip formatter={(value) => `BWP ${value.toFixed(2)}`} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

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
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `BWP ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {categorySpending.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                      <span className="text-xs text-gray-600 truncate">{cat.name}</span>
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
        </div>

        {insights.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-yellow-500" size={24} />
              <h3 className="text-lg font-bold text-gray-900">Financial Insights</h3>
            </div>
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-4 rounded-lg ${
                    insight.type === "success" ? "bg-green-50 border border-green-200" :
                    insight.type === "warning" ? "bg-yellow-50 border border-yellow-200" :
                    "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div className={`mt-0.5 ${
                    insight.type === "success" ? "text-green-600" :
                    insight.type === "warning" ? "text-yellow-600" :
                    "text-blue-600"
                  }`}>
                    •
                  </div>
                  <p className={`text-sm font-medium ${
                    insight.type === "success" ? "text-green-800" :
                    insight.type === "warning" ? "text-yellow-800" :
                    "text-blue-800"
                  }`}>
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Month Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Period</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Income</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Expenses</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Savings</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Top Category</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="text-right py-3 px-4 text-sm font-semibold text-green-600">
                    BWP {currentStats.income.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4 text-sm font-semibold text-red-600">
                    BWP {currentStats.expenses.toFixed(2)}
                  </td>
                  <td className={`text-right py-3 px-4 text-sm font-semibold ${currentStats.savings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    BWP {currentStats.savings.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {currentStats.topCategory?.name || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {previousMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-gray-600">
                    BWP {previousStats.income.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-gray-600">
                    BWP {previousStats.expenses.toFixed(2)}
                  </td>
                  <td className={`text-right py-3 px-4 text-sm ${previousStats.savings >= 0 ? 'text-gray-600' : 'text-gray-600'}`}>
                    BWP {previousStats.savings.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {previousStats.topCategory?.name || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Export Report</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Download size={20} />
              Download PDF Report
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              <FileText size={20} />
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </>
  );
}