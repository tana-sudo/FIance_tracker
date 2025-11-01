import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = "http://localhost:3000/api/auth";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint = isLogin ? `${API_BASE}/login` : `${API_BASE}/register`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setMessage(data.message || "Success!");

      if (isLogin && data.accessToken) {
        setMessage("Login successful! (Demo mode - tokens stored in memory)");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({
    label,
    type = "text",
    name,
    placeholder,
    ...props
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-1.5">
        {label}
      </label>
      <input
        name={name}
        type={type}
        onChange={handleChange}
        placeholder={placeholder}
        {...props}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-gray-50"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Finance Tracker
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Manage your finances with ease
        </p>

        {/* Toggle Buttons */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`w-1/2 py-2.5 text-sm font-medium rounded-md transition-all ${
              isLogin
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`w-1/2 py-2.5 text-sm font-medium rounded-md transition-all ${
              !isLogin
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`text-center text-sm mb-4 ${
              message.includes("Success") || message.includes("successful")
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {message}
          </div>
        )}

        {/* Animated Form Section */}
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.form
              key="login"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                />

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Password
                  </label>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 mt-6"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <InputField
                  label="Full Name"
                  name="name"
                  placeholder="John Doe"
                />
                <InputField
                  label="Username"
                  name="username"
                  placeholder="johndoe"
                />
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                />
                <InputField
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  placeholder="mm/dd/yyyy"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Gender
                  </label>
                  <select
                    name="gender"
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-gray-50"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Password
                  </label>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 mt-4"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
      </motion.div>
    </div>
  );
}