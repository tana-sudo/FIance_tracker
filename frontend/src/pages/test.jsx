import React, { useState, useEffect } from "react";
import { Plus, X, Trash2, Tag, Edit2, TrendingUp, TrendingDown, Package, Search, Grid, List } from "lucide-react";

export default function Categories() {
  const API_BASE = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");

  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [selectedIcon, setSelectedIcon] = useState("tag");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filterType, setFilterType] = useState("all");

  const colorOptions = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
    "#8B5CF6", "#EC4899", "#06B6D4", "#6366F1"
  ];

  const iconOptions = [
    { name: "tag", icon: Tag },
    { name: "package", icon: Package },
    { name: "trending-up", icon: TrendingUp },
    { name: "trending-down", icon: TrendingDown }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setFetchLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${API_BASE}/categories/allcategories`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned invalid response. Please check your API endpoint.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to load categories");
      }

      setCategories(Array.isArray(data) ? data : [
      ]);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setError("Category name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/categories/new_categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategory.trim(),
          type: "Personal",
          color: selectedColor,
          icon: selectedIcon
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned invalid response. Please check your API endpoint.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to add category");
      }

      setCategories((prev) => [...prev, { ...data, color: selectedColor, icon: selectedIcon }]);
      setNewCategory("");
      setSelectedColor("#3B82F6");
      setSelectedIcon("tag");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Add category error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
  if (!window.confirm("Are you sure you want to delete this category?")) return;

  try {
    const res = await fetch(`${API_BASE}/categories/del-categories/${id}`, {
      method: "DELETE",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || "Failed to delete category");
    }

    setCategories((prev) => prev.filter((c) => c.category_id !== id));
  } catch (err) {
    console.error("Delete error:", err);
    alert(err.message);
  }
};


  const getIconComponent = (iconName) => {
    const icon = iconOptions.find(i => i.name === iconName);
    return icon ? icon.icon : Tag;
  };

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || 
      (filterType === "global" && cat.type === "Global") ||
      (filterType === "personal" && cat.type !== "Global");
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: categories.length,
    global: categories.filter(c => c.type === "Global").length,
    personal: categories.filter(c => c.type !== "Global").length
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8">
        <div className="flex justify-between items-start">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2">Categories</h2>
            <p className="text-blue-100">Organize and manage your transaction categories</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-lg"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-blue-100 text-sm mb-1">Total Categories</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-blue-100 text-sm mb-1">Global</p>
            <p className="text-3xl font-bold text-white">{stats.global}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-blue-100 text-sm mb-1">Personal</p>
            <p className="text-3xl font-bold text-white">{stats.personal}</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-600 text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="text-red-800 font-medium text-sm">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  filterType === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("global")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  filterType === "global"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Global
              </button>
              <button
                onClick={() => setFilterType("personal")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  filterType === "personal"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Personal
              </button>
            </div>

            <div className="flex gap-2 border-l border-gray-200 pl-4">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                title="Grid view"
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                title="List view"
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {fetchLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Tag size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm ? "No matching categories" : "No Categories Yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? "Try adjusting your search" : "Get started by adding your first category"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add Category
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((cat) => {
              const IconComponent = getIconComponent(cat.icon);
              return (
                <div
                  key={cat.category_id || cat.name}
                  className="group bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color || '#3B82F6'}20` }}
                    >
                      <IconComponent 
                        size={24} 
                        style={{ color: cat.color || '#3B82F6' }}
                      />
                    </div>
                    {cat.type !== "Global" && (
                      <button
                        onClick={() => handleDeleteCategory(cat.category_id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{cat.name}</h3>
                  
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      cat.type === "Global"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {cat.type === "Global" ? "Global" : "Personal"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {filteredCategories.map((cat, index) => {
              const IconComponent = getIconComponent(cat.icon);
              return (
                <div
                  key={cat.category_id || cat.name}
                  className={`flex items-center justify-between p-5 hover:bg-gray-50 transition-colors ${
                    index !== filteredCategories.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color || '#3B82F6'}20` }}
                    >
                      <IconComponent 
                        size={24} 
                        style={{ color: cat.color || '#3B82F6' }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                      <span
                        className={`inline-flex mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          cat.type === "Global"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {cat.type === "Global" ? "Global" : "Personal"}
                      </span>
                    </div>
                  </div>
                  
                  {cat.type !== "Global" && (
                    <button
                      onClick={() => handleDeleteCategory(cat.category_id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setNewCategory("");
                setSelectedColor("#3B82F6");
                setSelectedIcon("tag");
                setError("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Add New Category
                </h2>
                <p className="text-sm text-gray-600">
                  Customize your category with a name, color, and icon
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCategory();
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g. Groceries, Entertainment"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          selectedColor === color
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Icon
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {iconOptions.map((option) => {
                      const IconComp = option.icon;
                      return (
                        <button
                          key={option.name}
                          onClick={() => setSelectedIcon(option.name)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedIcon === option.name
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <IconComp size={24} className="mx-auto" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setNewCategory("");
                      setSelectedColor("#3B82F6");
                      setSelectedIcon("tag");
                      setError("");
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCategory}
                    disabled={loading || !newCategory.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
                  >
                    {loading ? "Adding..." : "Add Category"}
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