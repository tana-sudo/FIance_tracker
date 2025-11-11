import React, { useState, useEffect } from "react";
import { Edit, Trash2, Download, X, SortAsc, SortDesc } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const USERS_PER_PAGE = 10;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  
  const [userModal, setUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: "", fname: "", email: "", password: "",
    role: "user", gender: "", dob: "", status: "active"
  });
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);

  const API_BASE = "http://localhost:3000/api";

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/getUsers`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch users");
      setUsers(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = (user = null) => {
    setEditUser(user);
    setUserForm(user ? { ...user, password: "" } : {
      username: "", fname: "", email: "", password: "",
      role: "user", gender: "", dob: "", status: "active"
    });
    setUserModal(true);
  };

  const handleUserSubmit = async () => {
    if (!userForm.username || userForm.username.length < 3) return showToast("Username ≥ 3 chars", "error");
    if (!userForm.email || !/\S+@\S+\.\S+/.test(userForm.email)) return showToast("Invalid email", "error");
    if (!editUser && (!userForm.password || !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(userForm.password))) 
      return showToast("Password ≥ 8 chars, letters+numbers", "error");

    try {
      const endpoint = editUser ? `${API_BASE}/users/updateuser/${editUser.id}` : `${API_BASE}/users/register`;
      const method = editUser ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Operation failed");
      showToast(editUser ? "User updated" : "User created");
      setUserModal(false);
      fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE}/users/deleteuser/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      showToast("User deleted");
      fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const toggleUserStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/users/updateuser/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status === "active" ? "inactive" : "active" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Status update failed");
      showToast("Status updated");
      fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleBulkUserAction = async (action) => {
    if (selectedUsers.length === 0) return showToast("No users selected", "error");
    try {
      await Promise.all(selectedUsers.map(id => {
        if (action === "delete") return fetch(`${API_BASE}/users/deleteuser/${id}`, { method: "DELETE" });
        return fetch(`${API_BASE}/users/updateuser/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action === "activate" ? "active" : "inactive" })
        });
      }));
      showToast("Bulk action completed");
      setSelectedUsers([]);
      fetchUsers();
    } catch {
      showToast("Bulk action failed", "error");
    }
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...users]
    .filter(u => (!userSearch || u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
                  u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
                  u.fname.toLowerCase().includes(userSearch.toLowerCase())))
    .filter(u => !filterRole || u.role === filterRole)
    .filter(u => !filterStatus || u.status === filterStatus)
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const paginatedUsers = sortedUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);
  const totalPages = Math.ceil(sortedUsers.length / USERS_PER_PAGE);

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const inactiveUsers = users.filter(u => u.status === "inactive").length;

  const roleDistribution = [
    { name: "Admin", value: users.filter(u => u.role === "admin").length },
    { name: "User", value: users.filter(u => u.role === "user").length }
  ];

  const genderDistribution = [
    { name: "Male", value: users.filter(u => u.gender === "male").length },
    { name: "Female", value: users.filter(u => u.gender === "female").length },
    { name: "Other", value: users.filter(u => u.gender === "other").length }
  ];

  const newUsersLine = users.reduce((acc, u) => {
    const date = new Date(u.createdAt).toISOString().slice(0, 10);
    const existing = acc.find(d => d.date === date);
    if (existing) existing.count++;
    else acc.push({ date, count: 1 });
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  const activeInactiveBar = [
    { name: "Users", Active: activeUsers, Inactive: inactiveUsers }
  ];

  const downloadCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    showToast("Export completed");
  };

  const exportUsers = () => {
    downloadCSV(users, `users-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"} text-white`}>
          {toast.message}
        </div>
      )}
      
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold">Total Users</h2>
          <p className="text-2xl font-bold">{totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold">Active Users</h2>
          <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold">Inactive Users</h2>
          <p className="text-2xl font-bold text-red-600">{inactiveUsers}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">New Users Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={newUsersLine}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Active vs Inactive</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activeInactiveBar}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Active" fill="#00C49F" />
              <Bar dataKey="Inactive" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Role Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={roleDistribution} dataKey="value" nameKey="name" outerRadius={80} label>
                {roleDistribution.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={genderDistribution} dataKey="value" nameKey="name" outerRadius={80} label>
                {genderDistribution.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Search users..."
          className="border p-2 rounded flex-1 min-w-[200px]"
        />
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="border p-2 rounded">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border p-2 rounded">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={exportUsers} className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center gap-2">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => openUserModal()} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Add User
        </button>
        <button onClick={() => handleBulkUserAction("activate")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Activate Selected
        </button>
        <button onClick={() => handleBulkUserAction("deactivate")} className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
          Deactivate Selected
        </button>
        <button onClick={() => handleBulkUserAction("delete")} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Delete Selected
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">
                <input
                  type="checkbox"
                  onChange={(e) => setSelectedUsers(e.target.checked ? paginatedUsers.map(u => u.id) : [])}
                  checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                />
              </th>
              {["id", "username", "fname", "email", "role", "gender", "status"].map(col => (
                <th key={col} className="p-2 cursor-pointer text-left" onClick={() => requestSort(col)}>
                  <div className="flex items-center gap-1">
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                    {sortConfig.key === col && (
                      sortConfig.direction === "asc" ? <SortAsc size={14} /> : <SortDesc size={14} />
                    )}
                  </div>
                </th>
              ))}
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map(user => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                  />
                </td>
                <td className="p-2">{user.id}</td>
                <td className="p-2">{user.username}</td>
                <td className="p-2">{user.fname}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.role}</td>
                <td className="p-2">{user.gender}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded cursor-pointer ${user.status === "active" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}
                    onClick={() => toggleUserStatus(user.id, user.status)}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="p-2 flex gap-2">
                  <button className="text-blue-500 hover:text-blue-700" onClick={() => openUserModal(user)}>
                    <Edit size={18} />
                  </button>
                  <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteUser(user.id)}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4 flex-wrap">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* User Modal */}
      {userModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto" onClick={() => setUserModal(false)}>
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 my-8 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editUser ? "Edit User" : "Add User"}</h2>
              <button onClick={() => setUserModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={userForm.fname}
                  onChange={(e) => setUserForm({ ...userForm, fname: e.target.value })}
                  className="w-full border p-2 rounded"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full border p-2 rounded"
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full border p-2 rounded"
                  placeholder="Email"
                />
              </div>
              {!editUser && (
                <div>
                  <label className="block font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full border p-2 rounded"
                    placeholder="Password"
                  />
                </div>
              )}
              <div>
                <label className="block font-medium mb-1">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full border p-2 rounded"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Gender</label>
                <select
                  value={userForm.gender}
                  onChange={(e) => setUserForm({ ...userForm, gender: e.target.value })}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={userForm.dob}
                  onChange={(e) => setUserForm({ ...userForm, dob: e.target.value })}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Status</label>
                <select
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                  className="w-full border p-2 rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setUserModal(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                  Cancel
                </button>
                <button onClick={handleUserSubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  {editUser ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}