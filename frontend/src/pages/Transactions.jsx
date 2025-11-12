import React, { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Search, X, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export default function Transactions() {
  const API_ROOT = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    amount: "",
    description: "",
    category_id: "",
    type: "expense",
    date: new Date().toISOString().split("T")[0],
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchCategories();
    fetchTransactions();
  }, [user.id]);

  const openImportDialog = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    try {
      const headers = ["Date", "Description", "Category", "Type", "Amount"];
      const csvContent = headers.join(",") + "\n";
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transactions_template.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Template download error:", err);
      toast.error("Failed to download template");
    }
  };

  const normalizeDateMMDDYYYY = (input) => {
    try {
      if (!input) return null;
      const s = String(input).trim();
      const mmdd = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      if (mmdd.test(s)) return s;
      const iso = /^\d{4}-\d{2}-\d{2}$/;
      if (iso.test(s)) {
        const [y, m, d] = s.split("-");
        return `${m}/${d}/${y}`;
      }
      const ddmm = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      if (ddmm.test(s)) {
        const [d, m, y] = s.split("/");
        if (parseInt(d, 10) > 12) return `${m}/${d}/${y}`;
      }
      const dt = new Date(s);
      if (!isNaN(dt)) {
        const mm = String(dt.getMonth() + 1).padStart(2, "0");
        const dd = String(dt.getDate()).padStart(2, "0");
        const yy = dt.getFullYear();
        return `${mm}/${dd}/${yy}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleImportFile = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const name = file.name.toLowerCase();
      const isCSV = name.endsWith(".csv");

      const mapRowsToRecords = (rows) =>
        rows.map((r) => ({
          Date:
            normalizeDateMMDDYYYY(
              r.Date ?? r.date ?? r.DATE ?? r["Date"] ?? r["date"]
            ) || "",
          Description: (r.Description ?? r.description ?? r.DESCRIPTION ?? r["Description"] ?? r["description"] ?? "").toString(),
          Category: (r.Category ?? r.category ?? r.CATEGORY ?? r["Category"] ?? r["category"] ?? "").toString(),
          Type: (r.Type ?? r.type ?? r.TYPE ?? r["Type"] ?? r["type"] ?? "").toString(),
          Amount: r.Amount ?? r.amount ?? r.AMOUNT ?? r["Amount"] ?? r["amount"] ?? "",
        }));

      const sendImport = async (records) => {
        const valid = records.filter(
          (r) => r.Date && r.Type && r.Amount !== "" && !isNaN(parseFloat(r.Amount)) && r.Category
        );
        if (valid.length === 0) {
          toast.error("No valid records found. Ensure columns: Date, Description, Category, Type, Amount");
          return;
        }
        const res = await fetch(`${API_ROOT}/transactions/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ records: valid }),
        });
        const raw = await res.text();
        let respData = null;
        try {
          respData = JSON.parse(raw);
        } catch {
          respData = null;
        }
        if (!res.ok) {
          const msg = respData?.error || (raw?.startsWith("<") ? `Endpoint not found (${res.status})` : raw || "Import failed");
          throw new Error(msg);
        }
        const insertedCount = respData?.insertedCount ?? 0;
        const errorCount = respData?.errorCount ?? 0;
        toast.success(`Imported ${insertedCount} records${errorCount ? `, ${errorCount} errors` : ""}`);
        e.target.value = "";
        // Refresh categories as imports may create new ones
        await fetchCategories();
        await fetchTransactions();
      };

      if (isCSV) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            try {
              const rows = Array.isArray(results.data) ? results.data : [];
              if (rows.length === 0) {
                toast.error("No rows found in CSV");
                e.target.value = "";
                return;
              }
              const records = mapRowsToRecords(rows);
              await sendImport(records);
            } catch (err) {
              console.error("❌ CSV import error:", err);
              toast.error(err?.message || "Failed to import CSV");
            }
          },
          error: (err) => {
            console.error("❌ CSV parse error:", err);
            toast.error("Failed to parse CSV file");
          },
        });
      } else {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const fileData = new Uint8Array(evt.target.result);
            const wb = XLSX.read(fileData, { type: "array" });
            const sheetName = wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            if (!Array.isArray(rows) || rows.length === 0) {
              toast.error("No rows found in the file");
              return;
            }
            const records = mapRowsToRecords(rows);
            await sendImport(records);
          } catch (err) {
            console.error("❌ Import parse error:", err?.message || err);
            toast.error(err?.message || "Failed to parse file");
          }
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (err) {
      console.error("❌ Import error:", err?.message || err);
      toast.error(err?.message || "Import failed");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_ROOT}/categories/allcategories/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      toast.error("Failed to load categories");
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ROOT}/transactions/gettransactions/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
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

      await fetchTransactions();
      setIsModalOpen(false);
      setEditing(null);
      resetForm();
      toast.success(editing ? "Transaction updated!" : "Transaction added!");
    } catch (err) {
      console.error("❌ Save error:", err);
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
      await fetchTransactions();
      toast.success("Transaction deleted!");
    } catch (err) {
      console.error("❌ Delete error:", err);
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
    const matchesSearch = t.description
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = filter === "all" || t.type === filter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
          <p className="text-gray-500 text-sm">Track and manage your finances</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row gap-3 items-center mb-6">
        <div className="relative flex-1 w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          {["all", "income", "expense"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg ${
                filter === t
                  ? t === "income"
                    ? "bg-green-600 text-white"
                    : t === "expense"
                    ? "bg-red-600 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button onClick={downloadTemplate} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800">
            Template
          </button>
          <button onClick={openImportDialog} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center p-10 text-gray-500">
            Loading transactions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-10 text-gray-500">
            No transactions found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Description</th>
                <th className="text-left px-4 py-2">Category</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-right px-4 py-2">Amount</th>
                <th className="text-center px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const category = categories.find(
                  (c) => c.category_id === t.category_id
                );
                return (
                  <tr
                    key={t.transaction_id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-2">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{t.description}</td>
                    <td className="px-4 py-2">{category?.name || "N/A"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          t.type === "income"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        t.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      BWP {parseFloat(t.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1 text-gray-600 hover:text-blue-600"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.transaction_id)}
                        className="p-1 text-red-600 hover:text-red-800"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">
                {editing ? "Edit Transaction" : "Add Transaction"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditing(null);
                }}
              >
                <X />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Amount (BWP)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
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
                <label className="text-sm font-medium">Date</label>
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "income" })}
                    className={`px-4 py-2 rounded ${
                      form.type === "income"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "expense" })}
                    className={`px-4 py-2 rounded ${
                      form.type === "expense"
                        ? "bg-red-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded"
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
