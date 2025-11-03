import React, { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, Search, X, DollarSign, TrendingUp, TrendingDown
} from "lucide-react";

export default function Transactions() {
  const API_BASE = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category_id: "",
    type: "expense",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    setFetchLoading(true);
    try {
      const res = await fetch(`${API_BASE}/transactions/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to load transactions");

      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories/allcategories/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description || !formData.category_id) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const url = editingTransaction
        ? `${API_BASE}/transactions/${editingTransaction.transaction_id}`
        : `${API_BASE}/transactions`;
      const res = await fetch(url, {
        method: editingTransaction ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          user_id: user.id,
          amount: parseFloat(formData.amount),
        }),
      });
      if (!res.ok) throw new Error("Failed to save transaction");
      await fetchTransactions();
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      const res = await fetch(`${API_BASE}/transactions/${transactionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete transaction");
      await fetchTransactions();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (t) => {
    setEditingTransaction(t);
    setFormData({
      amount: t.amount,
      description: t.description,
      category_id: t.category_id,
      type: t.type,
      date: t.date,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setFormData({
      amount: "",
      description: "",
      category_id: "",
      type: "expense",
      date: new Date().toISOString().split("T")[0],
    });
    setError("");
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchSearch =
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || t.type === filterType;
    return matchSearch && matchType;
  });

  // 🎨 Insight bar (creative touch)
  const total = transactions.reduce(
    (acc, t) =>
      t.type === "income"
        ? acc + parseFloat(t.amount)
        : acc - parseFloat(t.amount),
    0
  );
  const avg = transactions.length
    ? transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) /
      transactions.length
    : 0;

  return (
    <>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-8 py-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]"></div>

        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-4xl font-bold mb-2">Transactions</h2>
            <p className="text-blue-100 text-sm">
              Smart insights for your financial activity
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-700 rounded-lg font-semibold shadow-lg hover:scale-105 transition-all"
          >
            <Plus size={18} /> Add Transaction
          </button>
        </div>

        {/* Insight Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20">
            <p className="text-sm text-blue-100">Total Transactions</p>
            <h3 className="text-3xl font-bold">{transactions.length}</h3>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20">
            <p className="text-sm text-blue-100">Average Amount</p>
            <h3 className="text-3xl font-bold">BWP {avg.toFixed(2)}</h3>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20">
            <p className="text-sm text-blue-100">Net Movement</p>
            <div className="flex items-center gap-2">
              {total >= 0 ? (
                <TrendingUp className="text-green-300" size={20} />
              ) : (
                <TrendingDown className="text-red-300" size={20} />
              )}
              <h3
                className={`text-3xl font-bold ${
                  total >= 0 ? "text-green-200" : "text-red-200"
                }`}
              >
                {total >= 0 ? "+" : "-"}BWP {Math.abs(total).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-2">
              {["all", "income", "expense"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    filterType === type
                      ? type === "income"
                        ? "bg-green-600 text-white"
                        : type === "expense"
                        ? "bg-red-600 text-white"
                        : "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {fetchLoading ? (
          <div className="text-center py-20 text-gray-500">
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <DollarSign size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or add a new one
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Add Transaction
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["Date", "Description", "Category", "Type", "Amount", "Actions"].map(
                      (head) => (
                        <th
                          key={head}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase"
                        >
                          {head}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTransactions.map((t) => (
                    <tr
                      key={t.transaction_id}
                      className="hover:bg-gray-50 transition-all"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {t.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {t.category_name || "Uncategorized"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            t.type === "income"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span
                          className={
                            t.type === "income" ? "text-green-600" : "text-red-600"
                          }
                        >
                          {t.type === "income" ? "+" : "-"}BWP{" "}
                          {parseFloat(t.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.transaction_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {editingTransaction ? "Edit Transaction" : "Add Transaction"}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {editingTransaction
                  ? "Update your record"
                  : "Add a new transaction"}
              </p>

              <div className="space-y-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount (BWP)"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  {["income", "expense"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, type })}
                      className={`py-2.5 rounded-lg font-medium transition-colors ${
                        formData.type === type
                          ? type === "income"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 transition"
                  >
                    {loading
                      ? "Saving..."
                      : editingTransaction
                      ? "Update"
                      : "Add Transaction"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
