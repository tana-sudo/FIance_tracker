import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const API_BASE = "http://localhost:3000/api";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Email
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Email is invalid";

    // Password
    if (!formData.password) newErrors.password = "Password is required";
    else if (!isLogin) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password))
        newErrors.password =
          "Password must be 8+ chars with uppercase, lowercase, number, and special character";
    }

    // Extra validation for sign-up only
    if (!isLogin) {
      if (!formData.fname || formData.fname.trim().length < 2)
        newErrors.fname = "Full name is required (min 2 characters)";

      if (!formData.username || formData.username.trim().length < 3)
        newErrors.username = "Username must be at least 3 characters";

      if (!formData.dob) newErrors.dob = "Date of birth is required";
      else {
        const age = new Date().getFullYear() - new Date(formData.dob).getFullYear();
        if (age < 13) newErrors.dob = "You must be at least 13 years old";
      }

      if (!formData.gender) newErrors.gender = "Please select a gender";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage("Please fix the errors in the form.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const endpoint = isLogin
        ? `${API_BASE}/auth/login`
        : `${API_BASE}/users/register`;

      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            username: formData.username,
            fname: formData.fname,
            email: formData.email,
            password: formData.password,
            gender: formData.gender,
            dob: formData.dob,
            role: "user",
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.error || "Email or password is wrong.");

      setMessage(data.message || "Success!");

      // ✅ LOGIN logic
      if (isLogin && data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
        if (data.user.role === "admin")
        {
            navigate("/users");
        }
        else
        {
        navigate("/dashboard");
        }
        }, 1000);
      } else if (!isLogin) {
        // ✅ SIGN-UP logic
        setMessage("Account created successfully! Please login.");
        setTimeout(() => {
          setIsLogin(true);
          setFormData({});
          setErrors({});
          setTouched({});
          setMessage("");
        }, 2000);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
    setFormData({});
    setErrors({});
    setTouched({});
    setMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Euna</h2>
        <p className="text-center text-gray-500 mb-6">
          Manage your finances with ease
        </p>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.includes("success") || message.includes("Success")
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Toggle buttons */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => switchMode(true)}
            className={`w-1/2 py-2.5 text-sm font-medium rounded-md transition-all ${
              isLogin
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => switchMode(false)}
            className={`w-1/2 py-2.5 text-sm font-medium rounded-md transition-all ${
              !isLogin
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        {isLogin ? (
          /* LOGIN FORM */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                onChange={handleChange}
                onBlur={handleBlur}
                value={formData.email || ""}
                placeholder="you@example.com"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 ${
                  errors.email && touched.email
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.email && touched.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Password
              </label>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                onChange={handleChange}
                onBlur={handleBlur}
                value={formData.password || ""}
                placeholder="Enter your password"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 pr-10 ${
                  errors.password && touched.password
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && touched.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        ) : (
          /* SIGN UP FORM */
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Full Name
              </label>
              <input
                name="fname"
                type="text"
                onChange={handleChange}
                onBlur={handleBlur}
                value={formData.fname || ""}
                placeholder="John Doe"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 ${
                  errors.fname && touched.fname
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.fname && touched.fname && (
                <p className="text-red-600 text-xs mt-1">{errors.fname}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Username
              </label>
              <input
                name="username"
                type="text"
                onChange={handleChange}
                onBlur={handleBlur}
                value={formData.username || ""}
                placeholder="johndoe"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 ${
                  errors.username && touched.username
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.username && touched.username && (
                <p className="text-red-600 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                onChange={handleChange}
                onBlur={handleBlur}
                value={formData.email || ""}
                placeholder="you@example.com"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 ${
                  errors.email && touched.email
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.email && touched.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Date of Birth
              </label>
              <input
                name="dob"
                type="date"
                onChange={handleChange}
                onBlur={handleBlur}
                value={formData.dob || ""}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 ${
                  errors.dob && touched.dob
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.dob && touched.dob && (
                <p className="text-red-600 text-xs mt-1">{errors.dob}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Gender
              </label>
              <select
                name="gender"
                onChange={handleChange}
                onBlur={handleBlur}
                value={formData.gender || ""}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 ${
                  errors.gender && touched.gender
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && touched.gender && (
                <p className="text-red-600 text-xs mt-1">{errors.gender}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Password
              </label>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                onChange={handleChange}
                onBlur={handleBlur}
                value={formData.password || ""}
                placeholder="Create a password"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 pr-10 ${
                  errors.password && touched.password
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && touched.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
