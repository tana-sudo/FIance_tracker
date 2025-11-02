import { useEffect, useState } from "react";
import api from "../api/axios";

export default function TransactionTable() {
  const [transactions, setTransactions] = useState([]);

  const fetchData = async () => {
    const res = await api.get("/transactions");
    setTransactions(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b hover:bg-gray-50">
              <td>{new Date(t.date).toLocaleDateString()}</td>
              <td>{t.description}</td>
              <td>{t.category}</td>
              <td>{t.type}</td>
              <td className={t.type === "expense" ? "text-red-600" : "text-green-600"}>
                {t.type === "expense" ? "-" : "+"}${t.amount}
              </td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
