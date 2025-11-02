import React, { useEffect, useState } from "react";
//import { motion } from "framer-motion";
import { motion } from "motion/react"
import { LogOut } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    // redirect to login if no token
    if (!storedUser || !token) {
      window.location.href = "/";
      return;
    }

    setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-200 p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Welcome 👋</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm font-medium"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <div className="space-y-4 text-gray-700">
          <div className="p-3 bg-gray-50 rounded-md">
            <span className="font-medium text-gray-500">Id: </span>
            {user.id}
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <span className="font-medium text-gray-500">Full Name: </span>
            {user.name}
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <span className="font-medium text-gray-500">Username: </span>
            {user.username}
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <span className="font-medium text-gray-500">Email: </span>
            {user.email}
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <span className="font-medium text-gray-500">Role: </span>
            {user.role}
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 text-gray-500 text-sm"
      >
        Finance Tracker © {new Date().getFullYear()}
      </motion.p>
    </div>
  );
}
