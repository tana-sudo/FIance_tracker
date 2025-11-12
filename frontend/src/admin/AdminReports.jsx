import React, { useState, useEffect } from "react";
import { Download, FileText } from "lucide-react";

export default function AdminReports() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterUser, setFilterUser] = useState("");

  const API_BASE = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    } else {
      fetchUserScopedData();
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, catRes, userRes] = await Promise.all([
        // Admin-only endpoints
        fetch(`${API_BASE}/transactions/getalltransactions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/categories/getcategories`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/users/getUsers`)
      ]);

      if (!txRes.ok || !catRes.ok || !userRes.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const txData = await txRes.json();
      const catData = await catRes.json();
      const userData = await userRes.json();

      const catMap = Array.isArray(catData)
        ? catData.reduce((acc, c) => {
            const id = c.category_id ?? c.id;
            acc[id] = c.name;
            return acc;
          }, {})
        : {};

      const normalized = Array.isArray(txData)
        ? txData.map(tx => ({
            ...tx,
            type: (tx.type || tx.transaction_type || "").toLowerCase(),
            amount: typeof tx.amount === "string"
              ? parseFloat(String(tx.amount).replace(/[^\d.-]/g, ""))
              : parseFloat(tx.amount || 0),
            userId: tx.user_id,
            category: catMap[tx.category_id] || "Uncategorized",
            date: tx.date
          }))
        : [];

      setTransactions(normalized);
      setCategories(Array.isArray(catData) ? catData : []);
      setUsers(Array.isArray(userData) ? userData : []);
      showToast(`Loaded ${normalized.length} transactions`);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      showToast("Failed to fetch data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserScopedData = async () => {
    setLoading(true);
    try {
      const userId = currentUser?.id;
      if (!userId || !token) {
        throw new Error("Missing user or token");
      }
      const [txRes, catRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/transactions/gettransactions/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/categories/allcategories/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/users/getUsers`)
      ]);

      if (!txRes.ok || !catRes.ok || !userRes.ok) {
        throw new Error("Failed to fetch user-scoped data from server");
      }

      const txData = await txRes.json();
      const catData = await catRes.json();
      const userData = await userRes.json();

      const catMap = Array.isArray(catData)
        ? catData.reduce((acc, c) => {
            const id = c.category_id ?? c.id;
            acc[id] = c.name;
            return acc;
          }, {})
        : {};

      const normalized = Array.isArray(txData)
        ? txData.map(tx => ({
            ...tx,
            type: (tx.type || tx.transaction_type || "").toLowerCase(),
            amount: typeof tx.amount === "string"
              ? parseFloat(String(tx.amount).replace(/[^\d.-]/g, ""))
              : parseFloat(tx.amount || 0),
            userId: tx.user_id,
            category: catMap[tx.category_id] || "Uncategorized",
            date: tx.date
          }))
        : [];

      setTransactions(normalized);
      setCategories(Array.isArray(catData) ? catData : []);
      setUsers(Array.isArray(userData) ? userData : [currentUser]);
      showToast(`Loaded ${normalized.length} transactions for you`);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      showToast("Failed to fetch your data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    const startMatch = !dateRange.start || date >= new Date(dateRange.start);
    const endMatch = !dateRange.end || date <= new Date(dateRange.end);
    const typeMatch = !filterType || t.type === filterType;
    const categoryMatch = !filterCategory || t.category === filterCategory;
    const userMatch = !filterUser || t.userId === parseInt(filterUser);
    return startMatch && endMatch && typeMatch && categoryMatch && userMatch;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  const categoryBreakdown = filteredTransactions.reduce((acc, t) => {
    const existing = acc.find(c => c.name === t.category);
    if (existing) existing.value += parseFloat(t.amount);
    else acc.push({ name: t.category, value: parseFloat(t.amount) });
    return acc;
  }, []);

  const topCategories = [...categoryBreakdown].sort((a, b) => b.value - a.value).slice(0, 5);

  const userSpending = filteredTransactions.reduce((acc, t) => {
    const user = users.find(u => u.id === t.userId);
    const username = user ? user.username : `User ${t.userId}`;
    const existing = acc.find(u => u.username === username);
    if (existing) existing.amount += parseFloat(t.amount);
    else acc.push({ username, amount: parseFloat(t.amount) });
    return acc;
  }, []).sort((a, b) => b.amount - a.amount).slice(0, 10);

  const categoryUsage = categories.map(cat => ({
    ...cat,
    count: transactions.filter(t => t.category === cat.name).length,
    total: transactions.filter(t => t.category === cat.name).reduce((sum, t) => sum + parseFloat(t.amount), 0)
  }));

  const downloadCSV = (data, filename) => {
    if (data.length === 0) {
      showToast("No data to export", "error");
      return;
    }
    
    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    showToast("Export completed");
  };

  const generateReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: dateRange,
      filters: {
        type: filterType || "all",
        category: filterCategory || "all",
        user: filterUser || "all"
      },
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        transactionCount: filteredTransactions.length,
        averageTransaction: filteredTransactions.length > 0 ? (totalIncome + totalExpense) / filteredTransactions.length : 0
      },
      topCategories,
      topUsers: userSpending,
      categoryBreakdown: categoryBreakdown,
      metadata: {
        totalUsers: users.length,
        totalCategories: categories.length,
        activeUsers: users.filter(u => u.status === "active").length
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast("Report generated");
  };

  const exportTransactions = () => {
    const data = filteredTransactions.map(t => ({
      date: t.date,
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description || "",
      user: users.find(u => u.id === t.userId)?.username || t.userId
    }));
    downloadCSV(data, `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportCategoryStats = () => {
    downloadCSV(categoryUsage, `category-stats-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportUserStats = () => {
    downloadCSV(userSpending, `user-spending-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportUsers = () => {
    downloadCSV(users, `users-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"} text-white`}>
          {toast.message}
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-6">
        <FileText size={32} />
        <h1 className="text-3xl font-bold">Reports & Exports</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-semibold mb-3">Filter Data for Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="border p-2 rounded"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="border p-2 rounded"
            placeholder="End Date"
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border p-2 rounded">
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border p-2 rounded">
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.category_id ?? cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Export Transactions</h3>
          <p className="text-gray-600 mb-4">Download all filtered transactions as CSV</p>
          <button
            onClick={exportTransactions}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
            disabled={filteredTransactions.length === 0}
          >
            <Download size={18} /> Export Transactions ({filteredTransactions.length})
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Generate Comprehensive Report</h3>
          <p className="text-gray-600 mb-4">Generate detailed financial report (JSON)</p>
          <button
            onClick={generateReport}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
          >
            <FileText size={18} /> Generate Report
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Category Statistics</h3>
          <p className="text-gray-600 mb-4">Export category usage and statistics</p>
          <button
            onClick={exportCategoryStats}
            className="bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-purple-700"
            disabled={categoryUsage.length === 0}
          >
            <Download size={18} /> Export Category Stats ({categoryUsage.length})
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">User Activity Report</h3>
          <p className="text-gray-600 mb-4">Export user spending analysis</p>
          <button
            onClick={exportUserStats}
            className="bg-orange-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-orange-700"
            disabled={userSpending.length === 0}
          >
            <Download size={18} /> Export User Spending ({userSpending.length})
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">All Users Data</h3>
          <p className="text-gray-600 mb-4">Export complete user database</p>
          <button
            onClick={exportUsers}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-indigo-700"
            disabled={users.length === 0}
          >
            <Download size={18} /> Export All Users ({users.length})
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Custom Date Range</h3>
          <p className="text-gray-600 mb-4">Export data for specific period</p>
          <div className="text-sm text-gray-500">
            {dateRange.start && dateRange.end ? (
              <p>Selected: {dateRange.start} to {dateRange.end}</p>
            ) : (
              <p>No date range selected (all time)</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Current Period Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Total Transactions</p>
            <p className="text-2xl font-bold">{filteredTransactions.length}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Active Users</p>
            <p className="text-2xl font-bold">{new Set(filteredTransactions.map(t => t.userId)).size}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Categories Used</p>
            <p className="text-2xl font-bold">{new Set(filteredTransactions.map(t => t.category)).size}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Avg Transaction</p>
            <p className="text-2xl font-bold">
              BWP {(filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / filteredTransactions.length || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600">Total Income</p>
            <p className="text-xl font-bold text-green-600">BWP {totalIncome.toFixed(2)}</p>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-xl font-bold text-red-600">BWP {totalExpense.toFixed(2)}</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600">Net Balance</p>
            <p className={`text-xl font-bold ${netBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
              BWP {netBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}