import React, { useState, useEffect } from "react";
import { Edit, Trash2, Download, X, SortAsc, SortDesc } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Navigate } from "react-router-dom";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const USERS_PER_PAGE = 10;


export default function UserManagement() {
const token = localStorage.getItem("accessToken");
const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
const isAdmin = currentUser?.role === "admin";
if (!token || !isAdmin) {
Navigate("/", { replace: true });
};
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [userModal, setUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: "",
    fname: "",
    email: "",
    password: "",
    role: "user",
    gender: "",
    dob: "",
    status: "active",
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

  const toISODateSafe = (value) => {
    if (!value && value !== 0) return null;
    try {
      const isoValue = String(value).replace(" ", "T");
      const d = new Date(isoValue);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    } catch {
      return null;
    }
  };

  const formatPrettyDate = (value) => {
    if (!value && value !== 0) return "N/A";
    try {
      const isoValue = String(value).replace(" ", "T");
      const d = new Date(isoValue);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

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
    if (user) {
      // When editing, properly map the user data
      setUserForm({
        username: user.username || "",
        fname: user.fname || user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "user",
        gender: user.gender || "",
        dob: toISODateSafe(user.dob) || "",
        status: user.status || "active",
      });
    } else {
      // When creating new user
      setUserForm({
        username: "",
        fname: "",
        email: "",
        password: "",
        role: "user",
        gender: "",
        dob: "",
        status: "active",
      });
    }
    setUserModal(true);
  };

  const handleUserSubmit = async () => {
    if (!userForm.username || userForm.username.length < 3)
      return showToast("Username must be at least 3 characters", "error");
    if (userForm.username.length > 50)
      return showToast("Username must be less than 50 characters", "error");
    if (!userForm.email || !/\S+@\S+\.\S+/.test(userForm.email))
      return showToast("Invalid email", "error");
    if (userForm.email.length > 100)
      return showToast("Email must be less than 100 characters", "error");
    if (userForm.fname && userForm.fname.length > 100)
      return showToast("Full name must be less than 100 characters", "error");
    if (
      !editUser &&
      (!userForm.password || !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(userForm.password))
    )
      return showToast("Password must be at least 8 characters with letters and numbers", "error");

    try {
      const endpoint = editUser
        ? `${API_BASE}/users/updateuser/${editUser.id}`
        : `${API_BASE}/users/register`;
      const method = editUser ? "PUT" : "POST";
      
      // Ensure all fields are within database limits and not empty
      const username = (userForm.username || "").trim().substring(0, 50);
      const fname = (userForm.fname || "").trim().substring(0, 100);
      const email = (userForm.email || "").trim().substring(0, 100);
      const role = (userForm.role || "user").substring(0, 20);
      const gender = (userForm.gender || "").trim().substring(0, 10);
      const dob = (userForm.dob || "").substring(0, 20);
      const status = (userForm.status || "active").substring(0, 20);
      
      // Validate required fields after trimming
      if (!username || username.length < 3) {
        return showToast("Username is required (min 3 characters)", "error");
      }
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        return showToast("Valid email is required", "error");
      }
      if (!fname || fname.length === 0) {
        return showToast("Full name is required", "error");
      }
      
      const payload = {
        username,
        fname,  // Always include fname
        email,
        role,
        gender: gender || "",  // Send empty string if not provided
        dob: dob || "",
        status,
      };

      // Only include password for new users
      if (!editUser && userForm.password) {
        payload.password = userForm.password;
      }
      
      console.log('Sending payload:', payload);
      console.log('Field details:', {
        username: `"${payload.username}" (${payload.username.length} chars)`,
        fname: `"${payload.fname}" (${payload.fname.length} chars)`,
        email: `"${payload.email}" (${payload.email.length} chars)`,
        role: `"${payload.role}" (${payload.role.length} chars)`,
        gender: payload.gender ? `"${payload.gender}" (${payload.gender.length} chars)` : 'undefined',
        dob: payload.dob ? `"${payload.dob}" (${payload.dob.length} chars)` : 'undefined',
        status: `"${payload.status}" (${payload.status.length} chars)`,
      });

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        console.error('Backend error response:', data);
        throw new Error(data.error || data.message || data.details || "Operation failed");
      }
      
      showToast(editUser ? "User updated successfully" : "User created successfully");
      setUserModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Update error:', err);
      showToast(err.message, "error");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${API_BASE}/users/deleteuser/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      showToast("User deleted successfully");
      fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      
      // Find the user to get all their details
      const user = users.find(u => u.id === id);
      if (!user) {
        return showToast("User not found", "error");
      }
      
      // Send all required fields with just the status changed
      const res = await fetch(`${API_BASE}/users/updateuser/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: user.username,
          fname: user.fname || user.name,
          email: user.email,
          role: user.role,
          gender: user.gender || "",
          dob: user.dob || "",
          status: newStatus
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Status update failed");
      showToast(`User ${newStatus === "active" ? "activated" : "deactivated"} successfully`);
      fetchUsers();
    } catch (err) {
      console.error('Toggle status error:', err);
      showToast(err.message, "error");
    }
  };

  const handleBulkUserAction = async (action) => {
    if (selectedUsers.length === 0) return showToast("No users selected", "error");
    
    try {
      await Promise.all(
        selectedUsers.map(async (id) => {
          const user = users.find(u => u.id === id);
          if (!user) return;
          
          if (action === "delete") {
            return fetch(`${API_BASE}/users/deleteuser/${id}`, { method: "DELETE" });
          }
          
          // For activate/deactivate, send all required fields
          return fetch(`${API_BASE}/users/updateuser/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              username: user.username,
              fname: user.fname || user.name,
              email: user.email,
              role: user.role,
              gender: user.gender || "",
              dob: user.dob || "",
              status: action === "activate" ? "active" : "inactive"
            }),
          });
        })
      );
      showToast("Bulk action completed successfully");
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      console.error('Bulk action error:', err);
      showToast("Bulk action failed", "error");
    }
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...users]
    .filter(
      (u) =>
        !userSearch ||
        (u.username && u.username.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
        ((u.fname ?? u.name) && (u.fname ?? u.name).toLowerCase().includes(userSearch.toLowerCase()))
    )
    .filter((u) => !filterRole || u.role === filterRole)
    .filter((u) => !filterStatus || u.status === filterStatus)
    .sort((a, b) => {
      const av = a[sortConfig.key] ?? "";
      const bv = b[sortConfig.key] ?? "";
      if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const paginatedUsers = sortedUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / USERS_PER_PAGE));

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const inactiveUsers = users.filter((u) => u.status === "inactive").length;

  const roleDistribution = [
    { name: "Admin", value: users.filter((u) => u.role === "admin").length },
    { name: "User", value: users.filter((u) => u.role === "user").length },
  ];

  const genderDistribution = [
    { name: "Male", value: users.filter((u) => u.gender === "male").length },
    { name: "Female", value: users.filter((u) => u.gender === "female").length },
    { name: "Other", value: users.filter((u) => u.gender === "other").length },
  ];

  const newUsersLine = users
    .reduce((acc, u) => {
      const date = toISODateSafe(u.createdAt);
      if (!date) return acc;
      const existing = acc.find((d) => d.date === date);
      if (existing) existing.count++;
      else acc.push({ date, count: 1 });
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const activeInactiveBar = [{ name: "Users", Active: activeUsers, Inactive: inactiveUsers }];

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(startOfToday.getDate() - 7);
  const fourteenDaysAgo = new Date(startOfToday);
  fourteenDaysAgo.setDate(startOfToday.getDate() - 14);

  const usersJoinedThisWeek = users.filter((u) => {
    const iso = toISODateSafe(u.createdAt);
    if (!iso) return false;
    const d = new Date(iso);
    return d >= sevenDaysAgo && d < startOfToday.setDate(startOfToday.getDate() + 1);
  }).length;

  const usersJoinedLastWeek = users.filter((u) => {
    const iso = toISODateSafe(u.createdAt);
    if (!iso) return false;
    const d = new Date(iso);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;

  const growthPercent =
    usersJoinedLastWeek > 0
      ? (((usersJoinedThisWeek - usersJoinedLastWeek) / usersJoinedLastWeek) * 100).toFixed(1)
      : usersJoinedThisWeek > 0
      ? "100.0"
      : "—";

  const downloadCSV = (data, filename) => {
    if (!data || !data.length) return showToast("No data to export", "error");
    const headers = Object.keys(data[0] || {});
    const csv = [headers.join(","), ...data.map((row) => headers.map((h) => JSON.stringify(row[h] || "")).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Export completed successfully");
  };

  const exportUsers = () => {
    downloadCSV(users, `users-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const generateWeeklyReport = () => {
    const joinedThisWeekList = users
      .filter((u) => {
        const iso = toISODateSafe(u.createdAt);
        if (!iso) return false;
        const d = new Date(iso);
        return d >= sevenDaysAgo;
      })
      .slice(0, 200);

    const roleSummaryRows = roleDistribution
      .map((r) => `<tr><td style="padding:6px 8px;border:1px solid #ddd">${r.name}</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${r.value}</td></tr>`)
      .join("");

    const genderSummaryRows = genderDistribution
      .map((g) => `<tr><td style="padding:6px 8px;border:1px solid #ddd">${g.name}</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${g.value}</td></tr>`)
      .join("");

    const usersRows = joinedThisWeekList
      .map(
        (u) =>
          `<tr>
            <td style="padding:6px 8px;border:1px solid #ddd">${u.id ?? ""}</td>
            <td style="padding:6px 8px;border:1px solid #ddd">${u.username ?? ""}</td>
            <td style="padding:6px 8px;border:1px solid #ddd">${u.fname ?? u.name ?? ""}</td>
            <td style="padding:6px 8px;border:1px solid #ddd">${u.email ?? ""}</td>
            <td style="padding:6px 8px;border:1px solid #ddd">${u.role ?? ""}</td>
            <td style="padding:6px 8px;border:1px solid #ddd">${formatPrettyDate(u.createdAt)}</td>
          </tr>`
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Weekly Users Report</title>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#111; padding:20px; }
            h1 { margin-bottom:6px; }
            .meta { color:#666; margin-bottom:18px; }
            .card { border:1px solid #e6e6e6; padding:12px; border-radius:6px; margin-bottom:12px; }
            table { border-collapse: collapse; width:100%; margin-top:8px; }
          </style>
        </head>
        <body>
          <h1>Weekly Users Report</h1>
          <div class="meta">Generated: ${new Date().toLocaleString()}</div>

          <div class="card">
            <h3>Overview</h3>
            <table>
              <tr><td style="padding:6px 8px;border:1px solid #ddd">Total Users</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${totalUsers}</td></tr>
              <tr><td style="padding:6px 8px;border:1px solid #ddd">Active Users</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${activeUsers}</td></tr>
              <tr><td style="padding:6px 8px;border:1px solid #ddd">Inactive Users</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${inactiveUsers}</td></tr>
              <tr><td style="padding:6px 8px;border:1px solid #ddd">Joined This Week</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${usersJoinedThisWeek}</td></tr>
              <tr><td style="padding:6px 8px;border:1px solid #ddd">Growth vs Last Week</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${growthPercent}%</td></tr>
            </table>
          </div>

          <div class="card">
            <h3>Role Summary</h3>
            <table>${roleSummaryRows}</table>
          </div>

          <div class="card">
            <h3>Gender Summary</h3>
            <table>${genderSummaryRows}</table>
          </div>

          <div class="card">
            <h3>Users Joined This Week (showing up to 200)</h3>
            <table>
              <thead>
                <tr>
                  <th style="padding:6px 8px;border:1px solid #ddd">ID</th>
                  <th style="padding:6px 8px;border:1px solid #ddd">Username</th>
                  <th style="padding:6px 8px;border:1px solid #ddd">Full Name</th>
                  <th style="padding:6px 8px;border:1px solid #ddd">Email</th>
                  <th style="padding:6px 8px;border:1px solid #ddd">Role</th>
                  <th style="padding:6px 8px;border:1px solid #ddd">Joined</th>
                </tr>
              </thead>
              <tbody>
                ${usersRows || `<tr><td colspan="6" style="padding:8px;border:1px solid #ddd">No recent users</td></tr>`}
              </tbody>
            </table>
          </div>

          <div style="margin-top:18px; font-size:12px; color:#666">
            Note: This report is generated from backend timestamps. Charts and deeper analytics available in the dashboard.
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      showToast("Popup blocked. Allow popups to print/save PDF.", "error");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      try {
        win.print();
      } catch (err) {
        // ignore
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {toast.show && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === "error" ? "bg-red-500" : "bg-green-500"
          } text-white`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <button
            onClick={generateWeeklyReport}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2"
            title="Open printable weekly report (save as PDF from browser)"
          >
            <Download size={16} /> Export Weekly Report (PDF)
          </button>
          <button
            onClick={exportUsers}
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
            title="Export all users as CSV"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold">Joined This Week</h2>
          <p className="text-2xl font-bold text-green-700">{usersJoinedThisWeek}</p>
          <p className="text-sm text-gray-500">Growth: {growthPercent === "—" ? "No data" : `${growthPercent}%`}</p>
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
              <Tooltip
                labelFormatter={(date) => {
                  const d = new Date(date);
                  if (isNaN(d.getTime())) return date;
                  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                }}
              />
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
                  onChange={(e) => setSelectedUsers(e.target.checked ? paginatedUsers.map((u) => u.id) : [])}
                  checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                />
              </th>
              {["id", "username", "Full name", "email", "role", "gender", "status"].map((col) => (
                <th key={col} className="p-2 cursor-pointer text-left" onClick={() => requestSort(col)}>
                  <div className="flex items-center gap-1">
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                    {sortConfig.key === col && (sortConfig.direction === "asc" ? <SortAsc size={14} /> : <SortDesc size={14} />)}
                  </div>
                </th>
              ))}
              <th className="p-2">Created</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => {
              const iso = toISODateSafe(user.createdAt);
              const joinedDate = iso ? new Date(iso) : null;
              const highlight = joinedDate && joinedDate >= sevenDaysAgo ? "bg-green-50" : "";

              return (
                <tr key={user.id} className={`border-b hover:bg-gray-50 ${highlight}`}>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                        }
                      }}
                    />
                  </td>
                  <td className="p-2">{user.id}</td>
                  <td className="p-2">{user.username}</td>
                  <td className="p-2">{user.fname || user.name}</td>
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
                  <td className="p-2">{formatPrettyDate(user.createdAt)}</td>
                  <td className="p-2 flex gap-2">
                    <button className="text-blue-500 hover:text-blue-700" onClick={() => openUserModal(user)}>
                      <Edit size={18} />
                    </button>
                    <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4 flex-wrap">
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setCurrentPage(i + 1)}>
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
                  maxLength={100}
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
                  maxLength={50}
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
                  maxLength={100}
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
                    placeholder="Password (min 8 chars, letters + numbers)" 
                  />
                </div>
              )}
              <div>
                <label className="block font-medium mb-1">Role</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full border p-2 rounded">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Gender</label>
                <select value={userForm.gender} onChange={(e) => setUserForm({ ...userForm, gender: e.target.value })} className="w-full border p-2 rounded">
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Date of Birth</label>
                <input type="date" value={userForm.dob} onChange={(e) => setUserForm({ ...userForm, dob: e.target.value })} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block font-medium mb-1">Status</label>
                <select value={userForm.status} onChange={(e) => setUserForm({ ...userForm, status: e.target.value })} className="w-full border p-2 rounded">
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