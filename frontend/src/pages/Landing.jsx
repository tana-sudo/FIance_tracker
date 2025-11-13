import { useNavigate } from "react-router-dom";
import {
  Upload,
  Tag,
  PieChart,
  Bell,
  Shield,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-gray-800 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 opacity-20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 opacity-20 blur-3xl animate-pulse" />

      {/* Header */}
      <header className="px-6 py-4 border-b/50 border-transparent bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={22} />
            <span className="font-semibold text-xl tracking-tight">Euna</span>
          </div>
          <div className="space-x-3">
            <button
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              onClick={() => navigate("/auth")}
            >
              Log In / Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Master your money
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Import transactions, auto-tag categories, set budgets, and see real-time insights.
              Beautifully simple. Ridiculously powerful.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="px-5 py-3 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </button>
              <button
                className="px-5 py-3 rounded-md border border-gray-300 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => navigate("/auth")}
              >
                Try Demo Login
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="px-3 py-1 rounded-full bg-gray-100">Secure by design</span>
              <span className="px-3 py-1 rounded-full bg-gray-100">Fast CSV/XLSX imports</span>
              <span className="px-3 py-1 rounded-full bg-gray-100">Smart categorization</span>
            </div>
          </div>

          {/* Preview Card */}
          <div className="relative">
            <div className="rounded-2xl shadow-xl bg-white/80 backdrop-blur-md border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-sm text-gray-500">Dashboard preview</span>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-6">
                <div className="rounded-lg p-4 bg-gradient-to-br from-indigo-50 to-white border">
                  <div className="flex items-center gap-2 text-indigo-700 font-medium mb-2">
                    <Upload size={18} /> Import
                  </div>
                  <p className="text-sm text-gray-600">Drop CSV/XLSX. We trim names and de-duplicate categories.</p>
                </div>
                <div className="rounded-lg p-4 bg-gradient-to-br from-pink-50 to-white border">
                  <div className="flex items-center gap-2 text-pink-700 font-medium mb-2">
                    <Tag size={18} /> Categorize
                  </div>
                  <p className="text-sm text-gray-600">Auto-tag by rules, adjust manually anytime.</p>
                </div>
                <div className="rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white border">
                  <div className="flex items-center gap-2 text-purple-700 font-medium mb-2">
                    <PieChart size={18} /> Insights
                  </div>
                  <p className="text-sm text-gray-600">Clear charts for spend, income, and trends.</p>
                </div>
                <div className="rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white border">
                  <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                    <Bell size={18} /> Alerts
                  </div>
                  <p className="text-sm text-gray-600">Budget notifications keep you informed.</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-30 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Upload,
              title: "Lightning-fast imports",
              desc: "Upload CSV or XLSX files and start analyzing in seconds.",
            },
            { icon: Tag, title: "Smart tagging", desc: "Automatic categorization with manual tweaks anytime." },
            { icon: PieChart, title: "Clear analytics", desc: "Spend breakdowns and helpful visualizations." },
            { icon: Bell, title: "Budget alerts", desc: "Stay ahead with timely notifications." },
            { icon: Shield, title: "Secure & private", desc: "Your data is protected and never shared." },
            { icon: Sparkles, title: "Polished UX", desc: "A clean, modern interface that feels great to use." },
          ].map((f, i) => (
            <div
              key={i}
              className="group rounded-xl border bg-white/70 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <f.icon className="text-indigo-600 group-hover:text-indigo-700" />
                <h3 className="font-semibold">{f.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 pb-4">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { label: "Imports processed", value: "10k+" },
            { label: "Avg. setup time", value: "2 min" },
            { label: "User satisfaction", value: "98%" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl bg-white/70 backdrop-blur-md border p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600">{s.value}</div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="px-6 py-12 border-t bg-white/80 backdrop-blur-md mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} Euna. Built with care.
          </div>
          <div className="flex gap-3">
            <button
              className="px-5 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow"
              onClick={() => navigate("/auth")}
            >
              Create your account
            </button>
            <button
              className="px-5 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              onClick={() => navigate("/auth")}
            >
              Sign in
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}