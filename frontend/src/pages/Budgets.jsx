import { useEffect, useState } from "react";
import api from "../api/axios";
import Modal from "../components/Modal";

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: "", limit: "" });

  const fetchBudgets = async () => {
    const res = await api.get("/budgets");
    setBudgets(res.data);
  };

  const handleSave = async () => {
    if (editing) {
      await api.put(`/budgets/${editing.id}`, form);
    } else {
      await api.post("/budgets", form);
    }
    fetchBudgets();
    setShowModal(false);
    setEditing(null);
    setForm({ category: "", limit: "" });
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Budgets</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Add Budget
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th>Category</th>
              <th>Limit</th>
              <th>Spent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td>{b.category}</td>
                <td>${b.limit}</td>
                <td>${b.spent}</td>
                <td>
                  <button
                    onClick={() => {
                      setEditing(b);
                      setForm(b);
                      setShowModal(true);
                    }}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      await api.delete(`/budgets/${b.id}`);
                      fetchBudgets();
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
        title={editing ? "Edit Budget" : "Add Budget"}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border rounded w-full p-2"
          />
          <input
            type="number"
            placeholder="Limit"
            value={form.limit}
            onChange={(e) => setForm({ ...form, limit: e.target.value })}
            className="border rounded w-full p-2"
          />
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
