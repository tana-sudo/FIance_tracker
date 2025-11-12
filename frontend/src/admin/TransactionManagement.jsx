import React, { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function TransactionManagement() {
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
      // Fetch all transactions at once using the getalltransactions endpoint (admin only)
      const [txRes, userRes, catRes] = await Promise.all([
        fetch(`${API_BASE}/transactions/getalltransactions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/users/getUsers`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        // Corrected categories endpoint to match backend: /api/categories/getcategories
        fetch(`${API_BASE}/categories/getcategories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!txRes.ok || !userRes.ok || !catRes.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const txData = await txRes.json();
      const userData = await userRes.json();
      const catData = await catRes.json();

      console.log(`Fetched ${txData?.length || 0} transactions from all users`);
      console.log(`Fetched ${userData?.length || 0} users`);
      console.log(`Fetched ${catData?.length || 0} categories`);

      // Map and normalize transactions to ensure consistent fields for filtering/display
      const transactionsWithUser = Array.isArray(txData)
        ? txData.map(tx => {
            const user = userData.find(u => u.id === tx.user_id);
            // Normalize type and amount
            const normalizedType = (tx.type || tx.transaction_type || "").toLowerCase();
            const amountRaw = tx.amount;
            const amountNum = typeof amountRaw === "string"
              ? parseFloat(String(amountRaw).replace(/[^\d.-]/g, ""))
              : parseFloat(amountRaw || 0);
            return {
              ...tx,
              type: normalizedType || tx.type,
              amount: isNaN(amountNum) ? 0 : amountNum,
              userId: tx.user_id,
              username: user ? (user.username || user.name || `User ${tx.user_id}`) : `User ${tx.user_id}`
            };
          })
        : [];

      setTransactions(transactionsWithUser);
      setCategories(Array.isArray(catData) ? catData : []);
      setUsers(Array.isArray(userData) ? userData : []);
      
      showToast(`Loaded ${transactionsWithUser.length} transactions from ${userData.length} users`);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showToast("Failed to fetch data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Fallback for non-admin: fetch only current user's data
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
        // Users list is public in current backend
        fetch(`${API_BASE}/users/getUsers`)
      ]);

      if (!txRes.ok || !catRes.ok || !userRes.ok) {
        throw new Error("Failed to fetch user-scoped data from server");
      }

      const txData = await txRes.json();
      const catData = await catRes.json();
      const userData = await userRes.json();

      const transactionsWithUser = Array.isArray(txData)
        ? txData.map(tx => ({
            ...tx,
            type: (tx.type || tx.transaction_type || "").toLowerCase(),
            amount: typeof tx.amount === "string"
              ? parseFloat(String(tx.amount).replace(/[^\d.-]/g, ""))
              : parseFloat(tx.amount || 0),
            userId: tx.user_id,
            username: currentUser?.username || currentUser?.name || `User ${tx.user_id}`
          }))
        : [];

      setTransactions(transactionsWithUser);
      setCategories(Array.isArray(catData) ? catData : []);
      setUsers(Array.isArray(userData) ? userData : [currentUser]);

      showToast(`Loaded ${transactionsWithUser.length} of your transactions`);
    } catch (err) {
      console.error("Failed to fetch user-scoped data:", err);
      showToast("Failed to fetch your data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Parse date safely (handles both MM/DD/YYYY and ISO formats)
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      // Try ISO format first
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return new Date(dateStr);
      }
      // Try MM/DD/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const [m, d, y] = dateStr.split("/");
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      }
      return new Date(dateStr);
    } catch {
      return null;
    }
  };

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => {
    const date = parseDate(t.date);
    if (!date) return false;
    
    const startMatch = !dateRange.start || date >= new Date(dateRange.start);
    const endMatch = !dateRange.end || date <= new Date(dateRange.end);
    const typeMatch = !filterType || t.type === filterType;
    
    // Match by category_id
    const categoryMatch = !filterCategory || t.category_id === parseInt(filterCategory);
    const userMatch = !filterUser || t.userId === parseInt(filterUser);
    
    return startMatch && endMatch && typeMatch && categoryMatch && userMatch;
  });

  const transactionTrends = filteredTransactions.reduce((acc, t) => {
    const date = parseDate(t.date);
    if (!date) return acc;
    
    const dateStr = date.toISOString().slice(0, 10);
    const existing = acc.find(d => d.date === dateStr);
    if (existing) {
      if (t.type === "income") existing.income += parseFloat(t.amount || 0);
      else existing.expense += parseFloat(t.amount || 0);
    } else {
      acc.push({
        date: dateStr,
        income: t.type === "income" ? parseFloat(t.amount || 0) : 0,
        expense: t.type === "expense" ? parseFloat(t.amount || 0) : 0
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  const categoryBreakdown = filteredTransactions.reduce((acc, t) => {
    const category = categories.find(c => c.category_id === t.category_id);
    const categoryName = category?.name || "Uncategorized";
    const existing = acc.find(c => c.name === categoryName);
    if (existing) existing.value += parseFloat(t.amount || 0);
    else acc.push({ name: categoryName, value: parseFloat(t.amount || 0) });
    return acc;
  }, []);

  const topCategories = [...categoryBreakdown].sort((a, b) => b.value - a.value).slice(0, 5);

  const userSpending = filteredTransactions.reduce((acc, t) => {
    const user = users.find(u => u.id === t.userId);
    const username = user ? (user.username || user.name) : `User ${t.userId}`;
    const existing = acc.find(u => u.username === username);
    if (existing) existing.amount += parseFloat(t.amount || 0);
    else acc.push({ username, amount: parseFloat(t.amount || 0) });
    return acc;
  }, []).sort((a, b) => b.amount - a.amount).slice(0, 10);

  // Compute suspicious transactions relative to the filtered dataset for consistency
  const avgTransaction = filteredTransactions.length > 0
    ? filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) / filteredTransactions.length
    : 0;
  const suspiciousTransactions = filteredTransactions.filter(t => parseFloat(t.amount || 0) > avgTransaction * 5);

  // CSV export utility
  const downloadCSV = (rows, filename = "data.csv") => {
    try {
      const headers = ["date", "type", "category", "amount", "description", "user"];
      const csv = [
        headers.join(","),
        ...rows.map(r => headers.map(h => {
          const cell = r[h] ?? "";
          return `"${String(cell).replace(/"/g, '""')}"`;
        }).join(","))
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast("CSV downloaded");
    } catch (err) {
      console.error("CSV download failed", err);
      showToast("Failed to download CSV", "error");
    }
  };

  const exportFilteredTransactions = () => {
    const rows = filteredTransactions.map(t => {
      const user = users.find(u => u.id === t.userId);
      const category = categories.find(c => c.category_id === t.category_id);
      return {
        date: t.date,
        type: t.type,
        category: category?.name || "",
        amount: parseFloat(t.amount || 0).toFixed(2),
        description: t.description || "",
        user: user?.username || user?.name || `User ${t.userId}`
      };
    });
    downloadCSV(rows, `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"} text-white`}>
          {toast.message}
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp size={32} />
          <div>
            <h1 className="text-3xl font-bold">Transaction Overview</h1>
            <p className="text-sm text-gray-600">
              Viewing data from <span className="font-semibold text-blue-600">{users.length} users</span> with{" "}
              <span className="font-semibold text-blue-600">{transactions.length} transactions</span>
            </p>
          </div>
        </div>
        {!isAdmin && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded">
            Limited view: showing your transactions only
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          Loading transaction data...
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Total Income</h3>
          <p className="text-2xl font-bold text-green-600">BWP {totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600">BWP {totalExpense.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Net Balance</h3>
          <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
            BWP {netBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Total Transactions</h3>
          <p className="text-2xl font-bold">{transactions.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
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
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="border p-2 rounded">
            <option value="">All Users</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username || user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Export Filtered Transactions */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Export Filtered Transactions</h3>
          <button
            onClick={exportFilteredTransactions}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Download CSV
          </button>
        </div>
        <p className="text-gray-600 text-sm mt-2">Exports the currently filtered list of transactions.</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Transaction Trends</h3>
          {transactionTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={transactionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `BWP ${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#00C49F" strokeWidth={2} name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#FF8042" strokeWidth={2} name="Expense" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No transaction data available
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Top 5 Categories</h3>
          {topCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={topCategories} dataKey="value" nameKey="name" outerRadius={80} label>
                  {topCategories.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `BWP ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No category data available
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Top 10 User Spending</h3>
          {userSpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userSpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="username" />
                <YAxis />
                <Tooltip formatter={(value) => `BWP ${value.toFixed(2)}`} />
                <Bar dataKey="amount" fill="#8884d8" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No user spending data available
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Suspicious Transactions ({suspiciousTransactions.length})</h3>
          <div className="overflow-y-auto max-h-60">
            {suspiciousTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No suspicious activity detected</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {suspiciousTransactions.map(t => {
                    const user = users.find(u => u.id === t.userId);
                    const category = categories.find(c => c.category_id === t.category_id);
                    const date = parseDate(t.date);
                    
                    return (
                      <tr key={t.transaction_id || t.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{user?.username || user?.name || `User ${t.userId}`}</td>
                        <td className="p-2">{category?.name || "Unknown"}</td>
                        <td className="p-2 font-bold text-red-600">BWP {parseFloat(t.amount || 0).toFixed(2)}</td>
                        <td className="p-2">{date ? date.toLocaleDateString() : "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          {filteredTransactions.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 50).map(t => {
                  const user = users.find(u => u.id === t.userId);
                  const category = categories.find(c => c.category_id === t.category_id);
                  const date = parseDate(t.date);
                  
                  return (
                    <tr key={t.transaction_id || t.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{date ? date.toLocaleDateString() : "N/A"}</td>
                      <td className="p-2">{user?.username || user?.name || `User ${t.userId}`}</td>
                      <td className="p-2">{category?.name || "Unknown"}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          t.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`p-2 font-semibold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        BWP {parseFloat(t.amount || 0).toFixed(2)}
                      </td>
                      <td className="p-2">{t.description || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-8">No transactions found</p>
          )}
        </div>
      </div>
    </div>
  );
}