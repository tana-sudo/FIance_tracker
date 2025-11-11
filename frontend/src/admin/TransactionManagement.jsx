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

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, catRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/transactions`),
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/users/getUsers`)
      ]);

      const txData = await txRes.json();
      const catData = await catRes.json();
      const userData = await userRes.json();

      setTransactions(txData);
      setCategories(catData);
      setUsers(userData);
    } catch (err) {
      showToast("Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    const startMatch = !dateRange.start || date >= new Date(dateRange.start);
    const endMatch = !dateRange.end || date <= new Date(dateRange.end);
    const typeMatch = !filterType || t.type === filterType;
    const categoryMatch = !filterCategory || t.category === filterCategory;
    const userMatch = !filterUser || t.userId === parseInt(filterUser);
    return startMatch && endMatch && typeMatch && categoryMatch && userMatch;
  });

  const transactionTrends = filteredTransactions.reduce((acc, t) => {
    const date = new Date(t.date).toISOString().slice(0, 10);
    const existing = acc.find(d => d.date === date);
    if (existing) {
      if (t.type === "income") existing.income += parseFloat(t.amount);
      else existing.expense += parseFloat(t.amount);
    } else {
      acc.push({
        date,
        income: t.type === "income" ? parseFloat(t.amount) : 0,
        expense: t.type === "expense" ? parseFloat(t.amount) : 0
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

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

  const avgTransaction = transactions.length > 0 ? transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / transactions.length : 0;
  const suspiciousTransactions = transactions.filter(t => parseFloat(t.amount) > avgTransaction * 5);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"} text-white`}>
          {toast.message}
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={32} />
        <h1 className="text-3xl font-bold">Transaction Overview</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Total Income</h3>
          <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600">${totalExpense.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Net Balance</h3>
          <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
            ${netBalance.toFixed(2)}
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
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="border p-2 rounded">
            <option value="">All Users</option>
            {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
          </select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Transaction Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={transactionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#00C49F" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#FF8042" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Top 5 Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={topCategories} dataKey="value" nameKey="name" outerRadius={80} label>
                {topCategories.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Top 10 User Spending</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userSpending}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="username" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
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
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {suspiciousTransactions.map(t => (
                    <tr key={t.id} className="border-b">
                      <td className="p-2">{users.find(u => u.id === t.userId)?.username || t.userId}</td>
                      <td className="p-2 font-bold text-red-600">${parseFloat(t.amount).toFixed(2)}</td>
                      <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}