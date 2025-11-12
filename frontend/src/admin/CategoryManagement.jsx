import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, Tag, X } from "lucide-react";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [searchQuery, setSearchQuery] = useState("");
  
  const [categoryModal, setCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ 
    name: "", 
    type: "Global" 
  });

  const API_BASE = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

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
        fetch(`${API_BASE}/categories/getcategories`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/transactions/getalltransactions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // If transactions call is unauthorized, fall back to user-scoped transactions
      let catData = await catRes.json();
      let txData = null;
      if (txRes.status === 401 || txRes.status === 403) {
        const myTxRes = await fetch(`${API_BASE}/transactions/gettransactions/${currentUser?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        txData = await myTxRes.json();
      } else {
        txData = await txRes.json();
      }

      setCategories(Array.isArray(catData) ? catData : []);
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (err) {
      console.error("CategoryManagement fetch error:", err);
      showToast("Failed to fetch data. Please log in.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCategoryModal = (category = null) => {
    setEditCategory(category);
    setCategoryForm(category ? { name: category.name || "", type: "Global" } : { name: "", type: "Global" });
    setCategoryModal(true);
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.name) return showToast("Category name required", "error");

    try {
      const endpoint = editCategory
        ? `${API_BASE}/categories/update_categories/${editCategory.category_id}`
        : `${API_BASE}/categories/new_categories`;
      const method = editCategory ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: categoryForm.name, type: "Global" })
      });

      if (!res.ok) throw new Error("Operation failed");
      showToast(editCategory ? "Category updated" : "Category created");
      setCategoryModal(false);
      fetchData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteCategory = async (category_id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      const res = await fetch(`${API_BASE}/categories/del-categories/${category_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Category deleted");
      fetchData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const categoryUsage = Array.isArray(categories)
    ? categories.map(cat => {
        const catId = cat.category_id ?? cat.id;
        const matchingTx = Array.isArray(transactions)
          ? transactions.filter(t => (t.category_id === catId) || (t.category === cat.name))
          : [];
        const total = matchingTx.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        return {
          ...cat,
          count: matchingTx.length,
          total
        };
      })
    : [];

  const filteredCategoryUsage = categoryUsage.filter(cat =>
    cat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Summary Card */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="p-5 rounded-lg shadow text-center bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900">Total Categories</h2>
          <p className="text-3xl font-extrabold text-blue-800">{categories.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">
          Showing {filteredCategoryUsage.length} of {categoryUsage.length}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search categories..."
        />
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Usage Count</th>
              <th className="p-3 text-left">Total Amount</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategoryUsage.map(cat => (
              <tr key={cat.category_id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{cat.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${cat.type === "Global" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>{cat.type}</span>
                </td>
                <td className="p-3">{cat.count} transactions</td>
                <td className="p-3 font-semibold">${cat.total.toFixed(2)}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => openCategoryModal(cat)} className="text-blue-600 hover:text-blue-800">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.category_id)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-4 text-center text-gray-500">Loading...</p>}
        {!loading && filteredCategoryUsage.length === 0 && (
          <div className="p-6 text-center text-gray-600">
            <p className="text-lg mb-2">No categories found.</p>
            <p className="mb-4">Try adjusting your search or add a new category.</p>
            <button
              onClick={() => openCategoryModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <Plus size={16} className="inline mr-1" /> Add Category
            </button>
          </div>
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
                <input
                  type="text"
                  value="Global"
                  readOnly
                  className="w-full border p-2 rounded bg-gray-100 text-gray-700"
                />
              </div>
              {/* Icon and Color removed: only name is required; type enforced as Global */}
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