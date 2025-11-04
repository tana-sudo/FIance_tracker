import React, { useState, useEffect } from "react";
import { Plus, X, Trash2, Edit2, Target, AlertCircle, CheckCircle } from "lucide-react";

export default function Budgets() {
  const API_BASE = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const user_id = user.id;

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: ""
  });

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
    fetchTransactions();
  }, []);

  // ===== FETCH BUDGETS =====
  const fetchBudgets = async () => {
    setFetchLoading(true);
    try {
      const res = await fetch(`${API_BASE}/budgets/get_budgets/${user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load budgets");

      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  // ===== FETCH CATEGORIES =====
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories/allcategories/${user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // ===== FETCH TRANSACTIONS =====
  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/transactions/gettransactions/${user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // ===== CALCULATIONS =====
  const calculateSpent = (budget) => {
    return transactions
      .filter(t =>
        t.category_id === budget.category_id &&
        t.type === "expense" &&
        new Date(t.date) >= new Date(budget.start_date) &&
        new Date(t.date) <= new Date(budget.end_date)
      )
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  };

  const getBudgetStatus = (budget, spent) => {
    const percentage = (spent / parseFloat(budget.amount)) * 100;
    if (percentage >= 100) return { color: "red", icon: AlertCircle };
    if (percentage >= 80) return { color: "yellow", icon: AlertCircle };
    return { color: "green", icon: CheckCircle };
  };

  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + calculateSpent(b), 0);
  const totalRemaining = totalBudget - totalSpent;

  // ===== SUBMIT / UPDATE =====
  const handleSubmit = async () => {
    if (!formData.category_id || !formData.amount || !formData.start_date || !formData.end_date) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    const url = editingBudget
      ? `${API_BASE}/budgets/updateBudget/${editingBudget.budget_id}`
      : `${API_BASE}/budgets/add_budget`;

    const payload = {
      user_id,
      category_id: parseInt(formData.category_id),
      amount: formData.amount,
      start_date: formData.start_date,
      end_date: formData.end_date
    };

    try {
      const res = await fetch(url, {
        method: editingBudget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save budget");

      await fetchBudgets();
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== DELETE =====
  const handleDelete = async (budget_id) => {
    if (!window.confirm("Delete this budget?")) return;

    try {
      const res = await fetch(`${API_BASE}/budgets/removeBudget/${budget_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      setBudgets(prev => prev.filter(b => b.budget_id !== budget_id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount,
      start_date: budget.start_date.split("T")[0],
      end_date: budget.end_date.split("T")[0]
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category_id: "",
      amount: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: ""
    });
    setEditingBudget(null);
    setError("");
  };

  // ===== UI RENDER =====
  return (
    <>
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-8">
        <div className="flex justify-between items-start text-white">
          <div>
            <h2 className="text-3xl font-bold">Budgets</h2>
            <p className="text-purple-100">Set and track your spending limits</p>
          </div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-600 rounded-lg shadow-lg"
          >
            <Plus size={20} /> Create Budget
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="p-8">
        {fetchLoading ? (
          <div className="text-center py-20 text-gray-500">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Target size={50} className="mx-auto text-gray-400 mb-4" />
            No budgets yet. Create one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const spent = calculateSpent(budget);
              const remaining = parseFloat(budget.amount) - spent;
              const percentage = Math.min((spent / parseFloat(budget.amount)) * 100, 100);
              const status = getBudgetStatus(budget, spent);
              const StatusIcon = status.icon;
              const categoryName = categories.find(c => c.category_id === budget.category_id)?.name || "Uncategorized";

              return (
                <div key={budget.budget_id} className="bg-white rounded-xl p-6 shadow border">
                  <div className="flex justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{categoryName}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(budget)} className="text-blue-600 hover:text-blue-800">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(budget.budget_id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm space-y-2 mb-4">
                    <div className="flex justify-between"><span>Budget</span><span>BWP {budget.amount}</span></div>
                    <div className="flex justify-between"><span>Spent</span><span className="text-red-600">BWP {spent.toFixed(2)}</span></div>
                    <div className="flex justify-between">
                      <span>Remaining</span>
                      <span className={remaining >= 0 ? "text-green-600" : "text-red-600"}>
                        BWP {remaining.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div
                      className={`h-2 rounded-full ${
                        status.color === "red" ? "bg-red-600" :
                        status.color === "yellow" ? "bg-yellow-500" :
                        "bg-green-600"
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg relative">
            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="absolute right-4 top-4 text-gray-400">
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">{editingBudget ? "Edit Budget" : "Create Budget"}</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select</option>
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Amount (BWP)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 border rounded py-2">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-purple-600 text-white rounded py-2">
                  {loading ? "Saving..." : editingBudget ? "Update" : "Create"}
                </button>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}