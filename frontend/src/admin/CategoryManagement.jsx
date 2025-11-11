import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, Tag, X } from "lucide-react";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  
  const [categoryModal, setCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ 
    name: "", 
    type: "expense", 
    icon: "💰", 
    color: "#0088FE" 
  });

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
      const [catRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/transactions`)
      ]);

      const catData = await catRes.json();
      const txData = await txRes.json();

      setCategories(catData);
      setTransactions(txData);
    } catch (err) {
      showToast("Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCategoryModal = (category = null) => {
    setEditCategory(category);
    setCategoryForm(category || { name: "", type: "expense", icon: "💰", color: "#0088FE" });
    setCategoryModal(true);
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.name) return showToast("Category name required", "error");

    try {
      const endpoint = editCategory ? `${API_BASE}/categories/${editCategory.id}` : `${API_BASE}/categories`;
      const method = editCategory ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm)
      });

      if (!res.ok) throw new Error("Operation failed");
      showToast(editCategory ? "Category updated" : "Category created");
      setCategoryModal(false);
      fetchData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Category deleted");
      fetchData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const categoryUsage = categories.map(cat => ({
    ...cat,
    count: transactions.filter(t => t.category === cat.name).length,
    total: transactions.filter(t => t.category === cat.name).reduce((sum, t) => sum + parseFloat(t.amount), 0)
  }));

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"} text-white`}>
          {toast.message}
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Tag size={32} />
          <h1 className="text-3xl font-bold">Category Management</h1>
        </div>
        <button
          onClick={() => openCategoryModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold">Total Categories</h2>
          <p className="text-2xl font-bold">{categories.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold">Income Categories</h2>
          <p className="text-2xl font-bold text-green-600">{categories.filter(c => c.type === "income").length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold">Expense Categories</h2>
          <p className="text-2xl font-bold text-red-600">{categories.filter(c => c.type === "expense").length}</p>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Icon</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Color</th>
              <th className="p-3 text-left">Usage Count</th>
              <th className="p-3 text-left">Total Amount</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categoryUsage.map(cat => (
              <tr key={cat.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-2xl">{cat.icon}</td>
                <td className="p-3 font-medium">{cat.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${cat.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {cat.type}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: cat.color }}></div>
                    {cat.color}
                  </div>
                </td>
                <td className="p-3">{cat.count} transactions</td>
                <td className="p-3 font-semibold">${cat.total.toFixed(2)}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => openCategoryModal(cat)} className="text-blue-600 hover:text-blue-800">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-4 text-center text-gray-500">Loading...</p>}
        {!loading && categories.length === 0 && (
          <p className="p-4 text-center text-gray-500">No categories found. Add your first category!</p>
        )}
      </div>

      {/* Category Modal */}
      {categoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50" onClick={() => setCategoryModal(false)}>
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 mt-20 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editCategory ? "Edit Category" : "Add Category"}</h2>
              <button onClick={() => setCategoryModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full border p-2 rounded"
                  placeholder="e.g., Food, Transport"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Type</label>
                <select
                  value={categoryForm.type}
                  onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
                  className="w-full border p-2 rounded"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Icon (Emoji)</label>
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-full border p-2 rounded"
                  placeholder="💰"
                />
                <p className="text-xs text-gray-500 mt-1">Use any emoji or symbol</p>
              </div>
              <div>
                <label className="block font-medium mb-1">Color</label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-full border p-2 rounded h-10"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setCategoryModal(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                  Cancel
                </button>
                <button onClick={handleCategorySubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  {editCategory ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}