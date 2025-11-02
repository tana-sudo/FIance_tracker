import { useEffect, useState } from "react";
import api from "../api/axios";
import Modal from "../components/Modal";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "expense" });

  const fetchCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data);
  };

  const handleSave = async () => {
    if (editing) {
      await api.put(`/categories/${editing.id}`, form);
    } else {
      await api.post("/categories", form);
    }
    fetchCategories();
    setShowModal(false);
    setEditing(null);
    setForm({ name: "", type: "expense" });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Add Category
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th>Name</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td>{c.name}</td>
                <td>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      c.type === "expense"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {c.type}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => {
                      setEditing(c);
                      setForm(c);
                      setShowModal(true);
                    }}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      await api.delete(`/categories/${c.id}`);
                      fetchCategories();
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title={editing ? "Edit Category" : "Add Category"}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Category Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded w-full p-2"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="border rounded w-full p-2"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}
