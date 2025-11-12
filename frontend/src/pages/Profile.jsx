import React, { useEffect, useState } from "react";
import { User, Save, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Profile() {
  const API_BASE = "http://localhost:3000/api";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    fname: "",
    email: "",
    gender: "",
    dob: "",
    role: "user",
    status: "active",
  });

  const token = localStorage.getItem("accessToken");
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const showToast = (message, type = "success") => {
    if (type === "error") toast.error(message);
    else toast.success(message);
  };

  const fetchMe = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
      const data = await res.json();
      setForm({
        username: data.username || currentUser.username || "",
        fname: data.name || data.fname || currentUser.fname || currentUser.name || "",
        email: data.email || currentUser.email || "",
        gender: data.gender || "",
        dob: data.dob || "",
        role: data.role || currentUser.role || "user",
        status: data.status || "active",
      });
    } catch (err) {
      showToast(err.message || "Could not fetch profile", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      showToast("Not authenticated", "error");
      setLoading(false);
      return;
    }
    fetchMe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);

      // Update local user cache for sidebar/header
      const updatedUser = {
        id: data.id,
        username: data.username,
        name: data.name || form.fname,
        email: data.email,
        role: data.role,
        gender: data.gender,
        dob: data.dob,
        status: data.status,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      showToast("Profile updated successfully");
    } catch (err) {
      showToast(err.message || "Could not save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <User size={28} className="text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <p className="text-gray-600 mt-1">View and update your account details</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
            saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Content */}
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar & Meta */}
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
              {(form.fname || form.username || "U")[0].toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {form.fname || form.username}
              </p>
              <p className="text-gray-600">{form.email}</p>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 mt-2">
                <ShieldCheck size={14} /> {form.role}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                name="fname"
                value={form.fname}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={form.dob || ""}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <input
                name="status"
                readOnly 
                value={form.status}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}