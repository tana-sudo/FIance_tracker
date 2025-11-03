import React, { useState, useEffect } from "react";
import { Plus, X, Trash2, Edit2, Target, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

export default function Budgets() {
  const API_BASE = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
    budget_amount: "",
    period: "monthly",
    start_date: new Date().toISOString().split('T')[0],
    end_date: ""
  });

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (formData.period && formData.start_date) {
      const start = new Date(formData.start_date);
      let end = new Date(start);
      
      if (formData.period === "monthly") {
        end.setMonth(end.getMonth() + 1);
      } else if (formData.period === "quarterly") {
        end.setMonth(end.getMonth() + 3);
      } else if (formData.period === "yearly") {
        end.setFullYear(end.getFullYear() + 1);
      }
      
      setFormData(prev => ({
        ...prev,
        end_date: end.toISOString().split('T')[0]
      }));
    }
  }, [formData.period, formData.start_date]);

  const fetchBudgets = async () => {
    setFetchLoading(true);
    try {
      const res = await fetch(`${API_BASE}/budgets/user/${user.id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load budgets");
      }

      const data = await res.json();
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch budgets error:", err);
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
          "Content-Type": "application/json"
        },
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load categories");
      }
      
      const data = await res.json();
      console.log("Fetched categories:", data);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/transactions/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch transactions error:", err);
    }
  };

  const calculateSpent = (budget) => {
    const budgetTransactions = transactions.filter(t => 
      t.category_id === budget.category_id &&
      t.transaction_type === "expense" &&
      new Date(t.transaction_date) >= new Date(budget.start_date) &&
      new Date(t.transaction_date) <= new Date(budget.end_date)
    );
    
    return budgetTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  };

  const handleSubmit = async () => {
    if (!formData.category_id || !formData.budget_amount) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = editingBudget
        ? `${API_BASE}/budgets/${editingBudget.budget_id}`
        : `${API_BASE}/budgets`;

      const res = await fetch(url, {
        method: editingBudget ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          user_id: user.id,
          budget_amount: parseFloat(formData.budget_amount)
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save budget");
      }

      await fetchBudgets();
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (budgetId) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    try {
      const res = await fetch(`${API_BASE}/budgets/${budgetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete budget");
      }

      setBudgets(prev => prev.filter(b => b.budget_id !== budgetId));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      budget_amount: budget.budget_amount.toString(),
      period: budget.period,
      start_date: budget.start_date.split('T')[0],
      end_date: budget.end_date.split('T')[0]
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category_id: "",
      budget_amount: "",
      period: "monthly",
      start_date: new Date().toISOString().split('T')[0],
      end_date: ""
    });
    setEditingBudget(null);
    setError("");
  };

  const getBudgetStatus = (budget, spent) => {
    const percentage = (spent / budget.budget_amount) * 100;
    if (percentage >= 100) return { status: "exceeded", color: "red", icon: AlertCircle };
    if (percentage >= 80) return { status: "warning", color: "yellow", icon: AlertCircle };
    return { status: "good", color: "green", icon: CheckCircle };
  };

  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.budget_amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + calculateSpent(b), 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-8">
        <div className="flex justify-between items-start">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2">Budgets</h2>
            <p className="text-purple-100">Set and track your spending limits</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors shadow-lg"
          >
            <Plus size={20} />
            Create Budget
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-purple-100 text-sm mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-white">BWP {totalBudget.toFixed(2)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-purple-100 text-sm mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-white">BWP {totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-purple-100 text-sm mb-1">Remaining</p>
            <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-white' : 'text-red-300'}`}>
              BWP {totalRemaining.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {fetchLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Loading budgets...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Target size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Budgets Yet</h3>
            <p className="text-gray-600 mb-6">Create your first budget to start tracking your spending</p>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} />
              Create Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const spent = calculateSpent(budget);
              const remaining = budget.budget_amount - spent;
              const percentage = Math.min((spent / budget.budget_amount) * 100, 100);
              const status = getBudgetStatus(budget, spent);
              const StatusIcon = status.icon;

              return (
                <div
                  key={budget.budget_id}
                  className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {budget.category_name || 'Uncategorized'}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">{budget.period}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.budget_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Budget</span>
                      <span className="font-semibold text-gray-900">
                        BWP {parseFloat(budget.budget_amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Spent</span>
                      <span className="font-semibold text-red-600">
                        BWP {spent.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining</span>
                      <span className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        BWP {remaining.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{percentage.toFixed(0)}% used</span>
                      <StatusIcon size={14} className={`text-${status.color}-600`} />
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          status.color === 'red' ? 'bg-red-600' :
                          status.color === 'yellow' ? 'bg-yellow-500' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 pt-3 border-t border-gray-200">
                    {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
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
                {editingBudget ? "Edit Budget" : "Create New Budget"}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {editingBudget ? "Update budget details" : "Set a spending limit for a category"}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat.category_id} value={cat.id || cat.category_id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Amount (BWP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget_amount}
                    onChange={(e) => setFormData({...formData, budget_amount: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['monthly', 'quarterly', 'yearly'].map(period => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setFormData({...formData, period})}
                        className={`py-2.5 rounded-lg font-medium transition-colors capitalize ${
                          formData.period === period
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Automatically calculated based on period</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Saving..." : editingBudget ? "Update Budget" : "Create Budget"}
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