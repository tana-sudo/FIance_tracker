import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCcw,
  Download,
  Clock,
  User,
  Shield,
  Tag,
  Edit,
  Trash2,
  Target,
  ArrowUpDown,
  LogIn,
  FileText
} from "lucide-react";

const API_BASE = "http://localhost:3000/api";

export default function ActivityLogs() {
  const token = localStorage.getItem("accessToken");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser?.role === "admin";

  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Filters
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [live, setLive] = useState(false);

  // Icon mapping for actions
  const actionIcon = (action) => {
    const map = {
      LOGIN: LogIn,
      REGISTER_USER: User,
      UPDATE_USER: Edit,
      DELETE_USER: Trash2,
      ADD_CATEGORY: Tag,
      UPDATE_CATEGORY: Edit,
      DELETE_CATEGORY: Trash2,
      ADD_TRANSACTION: ArrowUpDown,
      UPDATE_TRANSACTION: Edit,
      DELETE_TRANSACTION: Trash2,
      ADD_BUDGET: Target,
      UPDATE_BUDGET: Edit,
      DELETE_BUDGET: Trash2
    };
    return map[action] || FileText;
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2500);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const adminEndpoint = `${API_BASE}/auditlogs/all`;
      const adminAlias = `${API_BASE}/auditlogs/getall`;
      const userEndpoint = `${API_BASE}/auditlogs/user`;

      // Admin-only view: attempt primary route, then alias; non-admins blocked
      if (!isAdmin) {
        throw new Error("Admins only: Activity Logs shows all users' activity.");
      }

      let res = await fetch(adminEndpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 404) {
        // Try alias if primary route not found
        res = await fetch(adminAlias, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (!res.ok) {
        const msg = `Failed to load logs (status ${res.status})`;
        throw new Error(msg);
      }

      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data.map(l => ({
            id: l.log_id || l.id,
            userId: l.user_id,
            action: String(l.action || "").toUpperCase(),
            detail: l.detail || "",
            timestamp: l.timestamp,
            username: l.username || undefined,
            name: l.name || undefined,
            role: l.role || undefined
          }))
        : [];
      setLogs(normalized);
      showToast(`Loaded ${normalized.length} activities`);
    } catch (err) {
      console.error("Load logs error:", err);
      showToast(err.message || "Failed to load logs", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/getUsers`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(fetchLogs, 10000);
    return () => clearInterval(id);
  }, [live]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || `${l.action} ${l.detail}`.toLowerCase().includes(q);
      const matchesAction = !actionFilter || l.action === actionFilter;
      const matchesUser = !userFilter || String(l.userId) === String(userFilter);
      const date = new Date(l.timestamp);
      const matchesStart = !dateRange.start || date >= new Date(dateRange.start);
      const matchesEnd = !dateRange.end || date <= new Date(dateRange.end);
      return matchesQuery && matchesAction && matchesUser && matchesStart && matchesEnd;
    });
  }, [logs, query, actionFilter, userFilter, dateRange]);

  const actions = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.action))).sort();
  }, [logs]);

  const stats = useMemo(() => {
    const byAction = logs.reduce((acc, l) => {
      acc[l.action] = (acc[l.action] || 0) + 1;
      return acc;
    }, {});
    const topActions = Object.entries(byAction)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const uniqueUsers = new Set(logs.map(l => l.userId)).size;
    return {
      total: logs.length,
      uniqueUsers,
      topActions
    };
  }, [logs]);

  const downloadCSV = (rows, filename) => {
    if (!rows?.length) {
      showToast("No data to export", "error");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    showToast("Exported CSV");
  };

  const exportFilteredCSV = () => {
    downloadCSV(filtered.map(l => ({
      id: l.id,
      userId: l.userId,
      action: l.action,
      detail: l.detail,
      timestamp: l.timestamp,
      username: l.username || "",
      role: l.role || ""
    })), `activity-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showToast("Exported JSON");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${toast.type === "error" ? "bg-red-500" : "bg-green-600"} text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield size={30} className="text-blue-600" />
          <h1 className="text-3xl font-bold">Activity Logs</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-900 flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
          <button
            onClick={() => setLive(v => !v)}
            className={`px-3 py-2 rounded flex items-center gap-2 ${live ? "bg-green-600 text-white" : "bg-white text-gray-800 border"}`}
            title="Live auto-refresh"
          >
            <Clock size={16} /> Live {live ? "On" : "Off"}
          </button>
          <button onClick={exportFilteredCSV} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={exportJSON} className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
            <Download size={16} /> Export JSON
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2 border rounded px-3">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              className="w-full py-2 outline-none"
              placeholder="Search action or detail..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="border p-2 rounded">
            <option value="">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {isAdmin ? (
            <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="border p-2 rounded">
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username || u.name || `User ${u.id}`}</option>
              ))}
            </select>
          ) : (
            <div className="border p-2 rounded text-gray-500">Your Activity</div>
          )}
          <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="border p-2 rounded" />
          <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="border p-2 rounded" />
        </div>
        <div className="mt-2 text-sm text-gray-500">Showing {filtered.length} of {logs.length} events</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Events</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Unique Users</p>
          <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Top Actions</p>
          <div className="mt-2 space-y-2">
            {stats.topActions.map(t => (
              <div key={t.name} className="flex items-center justify-between">
                <span className="text-gray-700 text-sm">{t.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-gray-200 rounded overflow-hidden">
                    <div className="h-2 bg-blue-600" style={{ width: `${Math.min(100, (t.count / (stats.topActions[0]?.count || 1)) * 100)}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-500">{t.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow divide-y">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No activity found for the selected filters.
          </div>
        ) : (
          filtered.map(l => {
            const Icon = actionIcon(l.action);
            const userLabel = l.username || l.name || `User ${l.userId}`;
            const timeLabel = new Date(l.timestamp).toLocaleString();
            return (
              <div key={l.id} className="p-4 flex items-start gap-4 hover:bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Icon size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{l.action.replace(/_/g, " ")}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{userLabel}</span>
                    {l.role && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{l.role}</span>}
                  </div>
                  <p className="text-gray-700 mt-1 text-sm break-words">{l.detail}</p>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">{timeLabel}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}