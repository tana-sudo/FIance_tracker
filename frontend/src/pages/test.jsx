import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, X, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export default function Transactions() {
  const API_ROOT = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [form, setForm] = useState({
    amount: "",
    description: "",
    category_id: "",
    type: "expense",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!user?.id) return;
    fetchCategories();
    fetchTransactions();
  }, [user.id]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_ROOT}/categories/allcategories/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ROOT}/transactions/gettransactions/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.amount || !form.description || !form.category_id) {
      toast.error("All fields are required");
      return;
    }

    const payload = {
      user_id: user.id,
      amount: parseFloat(form.amount),
      type: form.type,
      category_id: parseInt(form.category_id),
      description: form.description,
      date: form.date,
    };

    try {
      const url = editing
        ? `${API_ROOT}/transactions/updateTransaction/${editing.transaction_id}`
        : `${API_ROOT}/transactions/addTransaction`;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save transaction");

      fetchTransactions();
      setIsModalOpen(false);
      setEditing(null);
      resetForm();
      toast.success(editing ? "Transaction updated!" : "Transaction added!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (transaction_id) => {
    if (!window.confirm("Delete this transaction?")) return;

    try {
      const res = await fetch(
        `${API_ROOT}/transactions/deleteTransaction/${transaction_id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to delete transaction");
      fetchTransactions();
      toast.success("Transaction deleted!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const resetForm = () => {
    setForm({
      amount: "",
      description: "",
      category_id: "",
      type: "expense",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      amount: t.amount,
      description: t.description,
      category_id: t.category_id,
      type: t.type,
      date: t.date.split("T")[0],
    });
    setIsModalOpen(true);
  };

  const filtered = transactions.filter((t) => {
    const matchesSearch = t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filter === "all" || t.type === filter;

    const selected = new Date(selectedDate);
    const txDate = new Date(t.date);
    const matchesMonth =
      txDate.getMonth() === selected.getMonth() &&
      txDate.getFullYear() === selected.getFullYear();

    return matchesSearch && matchesType && matchesMonth;
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track and manage your finances
          </p>
        </div>

        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition"
        >
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1 w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div className="flex gap-2 bg-gray-100 rounded-full p-1">
          {["all", "income", "expense"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm ${
                filter === t
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* DATE FILTER */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm text-gray-600">Filter by month:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-black/10"
        />
      </div>

      {/* TABLE */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        {loading ? (
          <div className="text-center p-10 text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-10 text-gray-500">No transactions found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-gray-600">
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const category = categories.find(
                  (c) => c.category_id === t.category_id
                );

                return (
                  <tr key={t.transaction_id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      {new Date(t.date).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-4 py-3">{t.description}</td>
                    <td className="px-4 py-3">{category?.name || "—"}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{t.type}</td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        t.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      BWP {parseFloat(t.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="text-gray-500 hover:text-gray-800"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.transaction_id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-medium text-gray-800">
                {editing ? "Edit Transaction" : "Add Transaction"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditing(null);
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                <X />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm text-gray-700">Amount (BWP)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-700">Date</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar size={18} className="text-gray-500" />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-700">Type</label>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "income" })}
                    className={`px-4 py-2 rounded-md border ${
                      form.type === "income"
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-300"
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "expense" })}
                    className={`px-4 py-2 rounded-md border ${
                      form.type === "expense"
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-300"
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black"
              >
                {editing ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
