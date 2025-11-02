import { useState, useEffect } from "react";
import api from "../api/axios";
import Modal from "../components/Modal";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "",
    type: "expense",
  });

  const fetchTransactions = async () => {
    const res = await api.get("/transactions");
    setTransactions(res.data);
  };

  const handleSave = async () => {
    if (editing) {
      await api.put(`/transactions/${editing.id}`, form);
    } else {
      await api.post("/transactions", form);
    }
    fetchTransactions();
    setShowModal(false);
    setEditing(null);
    setForm({ description: "", amount: "", category: "", type: "expense" });
  };

  const handleEdit = (t) => {
    setEditing(t);
    setForm(t);
    setShowModal(true);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Add Transaction
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.description}</td>
                <td>{t.category}</td>
                <td>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      t.type === "expense"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {t.type}
                  </span>
                </td>
                <td className={t.type === "expense" ? "text-red-600" : "text-green-600"}>
                  ${t.amount}
                </td>
                <td>
                  <button
                    onClick={() => handleEdit(t)}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      await api.delete(`/transactions/${t.id}`);
                      fetchTransactions();
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
        title={editing ? "Edit Transaction" : "Add Transaction"}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border rounded w-full p-2"
          />
          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="border rounded w-full p-2"
          />
          <input
            type="text"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
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
