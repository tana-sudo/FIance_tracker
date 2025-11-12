// src/pages/Reports.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileSpreadsheet,
  FileText,
  Info, // For insights
  AlertTriangle, // For insights/alerts
  // --- Category Icons (Copied from Dashboard) ---
  ShoppingCart,
  Coffee,
  Car,
  Film,
  Heart,
  DollarSign,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  YAxis,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Reports.jsx
 * - Full Reports page for src/pages/Reports.jsx
 * - Assumes transaction.date is MM/DD/YYYY
 * - CSV, PDF, Budget PDF (Monthly / Quarterly / Yearly)
 *
 * --- LATEST UPDATES ---
 * 1. Memoized all derived data with useMemo for a massive performance boost.
 * 2. Restructured header to separate Filters from Export Actions.
 * 3. Added getCategoryIcon helper for better "Recent Transactions" icons.
 * 4. Improved "Insights" card with icons for scannability.
 * 5. Renamed "Expenses Over Time" to "Recent 4-Week Expense Trend".
 * 6. Replaced GaugeChart with a simple progress bar.
 * 7. FIXED: downloadFullPDF now correctly slices tall content into multiple pages.
 */

export default function Reports() {
  const API_BASE = "http://localhost:3000/api";
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // data
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);

  // filters
  const [quickMonth, setQuickMonth] = useState("this"); // this | last | all | custom
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth())); // "0" .. "11" or "all"
  const [selectedCategory, setSelectedCategory] = useState("all");

  // period mode for Budget PDF generation
  const [periodMode, setPeriodMode] = useState("Monthly"); // "Monthly" | "Quarterly" | "Yearly"
  const [selectedQuarter, setSelectedQuarter] = useState(1); // 1..4
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // ref for html2canvas capture (download full-page PDF)
  const reportRef = useRef();

  useEffect(() => {
    if (user?.id) fetchAll();
  }, [user?.id]);

  // keep quickMonth and selectedMonth synced (but user can pick custom)
  useEffect(() => {
    if (quickMonth === "this") {
      setSelectedMonth(String(new Date().getMonth()));
    } else if (quickMonth === "last") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      setSelectedMonth(String(d.getMonth()));
    } else if (quickMonth === "all") {
      setSelectedMonth("all");
    }
  }, [quickMonth]);

  const fetchAll = async () => {
    try {
      const [tRes, bRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/transactions/gettransactions/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/budgets/get_budgets/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/categories/allcategories/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const tData = await tRes.json();
      const bData = await bRes.json();
      const cData = await cRes.json();

      setTransactions(Array.isArray(tData) ? tData : []);
      setBudgets(Array.isArray(bData) ? bData : []);
      setCategories(Array.isArray(cData) ? cData : []);
    } catch (err) {
      console.error("Error loading report data:", err);
    }
  };

  // ---- helpers ----

  // parse MM/DD/YYYY safely (with fallback to ISO)
  const parseDateMMDDYYYY = (d) => {
    if (!d) return null;
    if (d instanceof Date) return d;
    // ISO first
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
      const iso = new Date(d);
      if (!isNaN(iso)) return iso;
    }
    // MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) {
      const [m, dd, y] = d.split("/");
      const nd = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(dd, 10));
      if (!isNaN(nd)) return nd;
    }
    const attempt = new Date(d);
    return isNaN(attempt) ? null : attempt;
  };

  const monthName = (m) => {
    if (m === "all") return "All_Time";
    return new Date(2024, parseInt(m, 10)).toLocaleString("default", { month: "long" });
  };

  const getQuarterRange = (q, year) => {
    // q: 1..4
    const startMonth = (q - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 1); // exclusive
    end.setDate(end.getDate() - 1); // last day of quarter
    return { start, end };
  };

  const getYearRange = (year) => {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    return { start, end };
  };

  // --- ADDED: Category icon helper from Dashboard ---
  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("food") || name.includes("grocery")) return ShoppingCart;
    if (name.includes("transport") || name.includes("car")) return Car;
    if (name.includes("entertainment") || name.includes("fun")) return Film;
    if (name.includes("health")) return Heart;
    if (name.includes("coffee")) return Coffee;
    return DollarSign;
  };

  // ---- MEMOIZED CALCULATIONS (Performance Boost) ----

  // filtered transactions by selectedMonth and selectedCategory (used everywhere)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const dt = parseDateMMDDYYYY(t.date);
      if (!dt) return false;
      const matchesMonth = selectedMonth === "all" || dt.getMonth() === parseInt(selectedMonth, 10);
      const matchesCategory = selectedCategory === "all" || t.category_id === parseInt(selectedCategory, 10);
      return matchesMonth && matchesCategory;
    });
  }, [transactions, selectedMonth, selectedCategory]);

  // KPI calculations based on filteredTransactions
  const totalIncome = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  }, [filteredTransactions]);

  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const totalBudget = useMemo(() => {
    return budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  }, [budgets]);

  const remainingBudget = useMemo(() => totalBudget - totalExpenses, [totalBudget, totalExpenses]);

  // previous month comparison (for changes)
  const { prevIncome, prevExpenses } = useMemo(() => {
    let compareMonth;
    if (selectedMonth === "all") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      compareMonth = d.getMonth();
    } else {
      compareMonth = (parseInt(selectedMonth, 10) - 1 + 12) % 12;
    }
    const prevFiltered = transactions.filter((t) => {
      const dt = parseDateMMDDYYYY(t.date);
      if (!dt) return false;
      return dt.getMonth() === compareMonth && (selectedCategory === "all" || t.category_id === parseInt(selectedCategory, 10));
    });
    const prevIncome = prevFiltered.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const prevExpenses = prevFiltered.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    return { prevIncome, prevExpenses };
  }, [transactions, selectedMonth, selectedCategory]);

  const incomeChange = useMemo(() => (prevIncome > 0 ? (((totalIncome - prevIncome) / prevIncome) * 100).toFixed(1) : 0), [totalIncome, prevIncome]);
  const expenseChange = useMemo(() => (prevExpenses > 0 ? (((totalExpenses - prevExpenses) / prevExpenses) * 100).toFixed(1) : 0), [totalExpenses, prevExpenses]);

  // category spending for pie
  const categorySpending = useMemo(() => {
    return categories
      .map((cat) => {
        const spent = filteredTransactions.filter((t) => t.category_id === cat.category_id && t.type === "expense").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
        return spent > 0 ? { name: cat.name, value: spent } : null;
      })
      .filter(Boolean);
  }, [categories, filteredTransactions]);

  // expenses over time (4-week buckets)
  const expensesOverTime = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const now = new Date();
      const end = new Date(now);
      end.setDate(now.getDate() - (3 - i) * 7 + 1); // exclusive end
      const start = new Date(end);
      start.setDate(end.getDate() - 7);

      const total = filteredTransactions // NOTE: This uses filteredTransactions
        .filter((t) => {
          const dt = parseDateMMDDYYYY(t.date);
          return t.type === "expense" && dt && dt >= start && dt < end;
        })
        .reduce((s, t) => s + parseFloat(t.amount || 0), 0);

      return { name: `Week ${i + 1}`, expenses: total };
    });
  }, [filteredTransactions]);

  // budgets progress
  const budgetsWithProgress = useMemo(() => {
    return budgets.map((b) => {
      const spent = filteredTransactions.filter((t) => t.category_id === b.category_id && t.type === "expense").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      const percentage = parseFloat(b.amount) > 0 ? (spent / parseFloat(b.amount)) * 100 : 0;
      return { ...b, spent, percentage };
    });
  }, [budgets, filteredTransactions]);

  const budgetAlerts = useMemo(() => {
    return budgetsWithProgress
      .map((b) => {
        const cname = categories.find((c) => c.category_id === b.category_id)?.name || "Unknown";
        if (b.percentage >= 100) return { type: "danger", message: `${cname} budget exceeded by BWP ${(b.spent - parseFloat(b.amount)).toFixed(2)}` };
        if (b.percentage >= 85) return { type: "warning", message: `You have used ${b.percentage.toFixed(0)}% of your ${cname} budget.` };
        return null;
      })
      .filter(Boolean);
  }, [budgetsWithProgress, categories]);

  // recent transactions (top 10)
  const recentTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const da = parseDateMMDDYYYY(a.date);
      const db = parseDateMMDDYYYY(b.date);
      return db - da;
    }).slice(0, 10);
  }, [filteredTransactions]);

  // top category (for KPI card)
  const topCat = useMemo(() => {
    return [...categorySpending].sort((a, b) => b.value - a.value)[0];
  }, [categorySpending]);

  // insights (rule-based)
  const insights = useMemo(() => {
    const insightsList = [];
    if (totalExpenses > totalIncome) insightsList.push({ type: "warning", message: "You spent more than you earned in the selected period." });
    if (topCat) insightsList.push({ type: "info", message: `Top spending category: ${topCat.name} — BWP ${topCat.value.toFixed(2)}.` });
    if (parseFloat(expenseChange) > 10) insightsList.push({ type: "warning", message: `Expenses increased by ${expenseChange}% compared to the previous period.` });
    if (parseFloat(incomeChange) > 10) insightsList.push({ type: "info", message: `Income increased by ${incomeChange}% compared to the previous period.` });
    if (remainingBudget < 0) insightsList.push({ type: "warning", message: "You're over your total budgets for the selected period." });
    if (insightsList.length === 0) insightsList.push({ type: "info", message: "No major alerts — nice work maintaining balance!" });
    return insightsList;
  }, [totalExpenses, totalIncome, topCat, expenseChange, incomeChange, remainingBudget]);

  // health score
  const healthScore = useMemo(() => {
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const budgetDiscipline = totalBudget > 0 ? Math.max(0, Math.min(100, (remainingBudget / totalBudget) * 100 + 50)) : 50; // heuristic
    return Math.round((savingsRate * 0.6) + (budgetDiscipline * 0.4));
  }, [totalIncome, totalExpenses, totalBudget, remainingBudget]);

  // ---- END OF MEMOIZED CALCULATIONS ----

  // CSV export with friendly filename
  const exportCSV = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      alert("No transactions to export for selected filters.");
      return;
    }
    const rows = filteredTransactions.map((t) => ({
      Date: t.date,
      Category: categories.find((c) => c.category_id === t.category_id)?.name || "Uncategorized",
      Type: t.type,
      Amount: t.amount,
      Description: t.description || "",
    }));
    const csv = Papa.unparse(rows);
    const mName = monthName(selectedMonth);
    const catName = selectedCategory === "all" ? "All_Categories" : (categories.find((c) => c.category_id === Number(selectedCategory))?.name || "Category").replace(/\s+/g, "_");
    const fileYear = selectedYear;
    const fileName = `Transactions_${mName}_${catName}_${fileYear}.csv`.replace(/\s+/g, "_");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, fileName);
  };

  // --- UPDATED: PDF export (whole-page screenshot) ---
  const downloadFullPDF = async () => {
    if (!reportRef.current) return;
    try {
      // 1. Capture the entire content of the ref, no matter how tall
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // better quality
        useCORS: true,
        scrollY: -window.scrollY, // avoid partial capture based on scroll position
      });
      
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // 2. Setup PDF dimensions
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfPageWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();

      // 3. Calculate scaled image height for PDF width
      const imgRatio = imgHeight / imgWidth;
      const pdfImgHeight = pdfPageWidth * imgRatio;

      // 4. Determine how many pages are needed
      const totalPages = Math.ceil(pdfImgHeight / pdfPageHeight);

      // 5. Add first page image
      pdf.addImage(imgData, "PNG", 0, 0, pdfPageWidth, pdfImgHeight);

      // 6. Add subsequent pages by shifting the image up by one page height per page
      for (let i = 1; i < totalPages; i++) {
        pdf.addPage();
        const yOffset = -(i * pdfPageHeight);
        pdf.addImage(imgData, "PNG", 0, yOffset, pdfPageWidth, pdfImgHeight);
      }
      
      const filename = `Report_${new Date().toLocaleDateString().replace(/\//g, "_")}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF export failed:", err);
    }
  };

  // ---- Budget PDF generator with Monthly / Quarterly / Yearly modes ----
  const downloadBudgetReport = (mode = periodMode) => {
    // determine period range based on mode
    let periodLabel = "";
    let rangeStart = null;
    let rangeEnd = null;

    if (mode === "Monthly") {
      if (selectedMonth === "all") {
        // entire year
        const r = getYearRange(selectedYear);
        rangeStart = r.start;
        rangeEnd = r.end;
        periodLabel = `${selectedYear}`;
      } else {
        const m = parseInt(selectedMonth, 10);
        rangeStart = new Date(selectedYear, m, 1);
        rangeEnd = new Date(selectedYear, m + 1, 1);
        rangeEnd.setDate(rangeEnd.getDate() - 1);
        periodLabel = `${monthName(selectedMonth)}_${selectedYear}`;
      }
    } else if (mode === "Quarterly") {
      const { start, end } = getQuarterRange(selectedQuarter, selectedYear);
      rangeStart = start;
      rangeEnd = end;
      periodLabel = `Q${selectedQuarter}_${selectedYear}`;
    } else {
      // Yearly
      const { start, end } = getYearRange(selectedYear);
      rangeStart = start;
      rangeEnd = end;
      periodLabel = `Year_${selectedYear}`;
    }

    // filter transactions in the chosen range (inclusive)
    const inRangeTx = transactions.filter((t) => {
      const dt = parseDateMMDDYYYY(t.date);
      if (!dt) return false;
      return dt >= rangeStart && dt <= rangeEnd && (selectedCategory === "all" || t.category_id === parseInt(selectedCategory, 10));
    });

    const doc = new jsPDF("p", "mm", "a4");
    const leftMargin = 14;
    let y = 20;

    // Page 1 - Title + KPIs + Health Score
    doc.setFontSize(18);
    doc.text("Personal Budget Report", leftMargin, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`User: ${user.fname || user.username || "User"}`, leftMargin, y);
    doc.text(`Period: ${periodLabel}`, leftMargin + 110, y);
    y += 8;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, leftMargin, y);
    y += 12;

    doc.setFontSize(12);
    doc.text("Key Metrics", leftMargin, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Income: BWP ${inRangeTx.filter(t => t.type === 'income').reduce((s,t)=>s+parseFloat(t.amount||0),0).toFixed(2)}`, leftMargin, y);
    y += 6;
    doc.text(`Total Expenses: BWP ${inRangeTx.filter(t => t.type === 'expense').reduce((s,t)=>s+parseFloat(t.amount||0),0).toFixed(2)}`, leftMargin, y);
    y += 6;
    doc.text(`Net Savings: BWP ${(inRangeTx.filter(t => t.type === 'income').reduce((s,t)=>s+parseFloat(t.amount||0),0) - inRangeTx.filter(t => t.type === 'expense').reduce((s,t)=>s+parseFloat(t.amount||0),0)).toFixed(2)}`, leftMargin, y);
    y += 12;

    // Health score (text + numeric)
    doc.setFontSize(12);
    doc.text("Financial Health Score", leftMargin, y);
    doc.setFontSize(20);
    doc.text(String(healthScore), leftMargin, y + 10);
    y += 22;

    // Add page 2 - Budget summary table using autoTable
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Budget Summary", leftMargin, 20);

    const budgetTableBody = budgets.map((b) => {
      const catName = categories.find((c) => c.category_id === b.category_id)?.name || "Unknown";
      const allocated = parseFloat(b.amount || 0);
      const spent = transactions
        .filter((t) => {
          const dt = parseDateMMDDYYYY(t.date);
          return dt && dt >= rangeStart && dt <= rangeEnd && t.category_id === b.category_id && t.type === "expense";
        })
        .reduce((s, t) => s + parseFloat(t.amount || 0), 0);

      const remaining = allocated - spent;
      const usage = allocated > 0 ? ((spent / allocated) * 100).toFixed(1) + "%" : "0%";
      return [catName, `BWP ${allocated.toFixed(2)}`, `BWP ${spent.toFixed(2)}`, `BWP ${remaining.toFixed(2)}`, usage];
    });

    doc.autoTable({
      startY: 30,
      head: [["Category", "Budget", "Spent", "Remaining", "Usage"]],
      body: budgetTableBody,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [60, 60, 60] },
      showHead: 'everyPage',
    });

    // Page 3 - Alerts (if any)
    const alerts = budgetTableBody
      .map((row) => {
        // usage in last column
        const usageStr = row[4];
        const usageVal = parseFloat(usageStr);
        if (!isNaN(usageVal) && usageVal >= 100) return `Budget exceeded: ${row[0]} (${usageStr})`;
        if (!isNaN(usageVal) && usageVal >= 85) return `Nearly full: ${row[0]} (${usageStr})`;
        return null;
      })
      .filter(Boolean);

    if (alerts.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Budget Alerts", leftMargin, 20);
      doc.setFontSize(10);
      const alertsTable = alerts.map((a) => [a]);
      doc.autoTable({
        startY: 28,
        head: [["Alert"]],
        body: alertsTable,
        styles: { fontSize: 10 },
        showHead: 'everyPage',
      });
    }

    // Page 4 - Transaction details (include up to 500 rows; large exports will still work but may span pages)
    if (inRangeTx.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Transactions (detailed)", leftMargin, 20);

      const txTableBody = inRangeTx.map((t) => {
        const dt = parseDateMMDDYYYY(t.date);
        const dateStr = dt ? dt.toLocaleDateString() : t.date;
        const catName = categories.find((c) => c.category_id === t.category_id)?.name || "Uncategorized";
        return [dateStr, catName, t.type, parseFloat(t.amount || 0).toFixed(2), t.description || ""];
      });

      doc.autoTable({
        startY: 28,
        head: [["Date", "Category", "Type", "Amount", "Description"]],
        body: txTableBody,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [60, 60, 60] },
        columnStyles: {
          4: { cellWidth: 60 }, // description column
        },
        showHead: 'everyPage',
      });
    }

    // save file naming with period label
    const fileName = `Budget_Report_${periodLabel}_${new Date().toLocaleDateString().replace(/\//g, "_")}.pdf`.replace(/\s+/g, "_");
    doc.save(fileName);
  };


  // small color palette for pie
  const pieColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

  /**
   * Helper to determine the Tailwind color class for the health score progress bar.
   * @param {number} score - The health score (0-100).
   * @returns {string} Tailwind color class.
   */
  const getHealthBarColor = (score) => {
    if (score > 75) return "bg-green-600";
    if (score > 50) return "bg-yellow-500";
    if (score > 30) return "bg-orange-500";
    return "bg-red-600";
  };

  // JSX: keep layout largely identical to your previous Reports layout
  return (
    <div ref={reportRef} className="p-8 space-y-8 bg-gray-50">
      {/* --- MODIFIED: Restructured Header --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Analyze your spending patterns and generate professional reports.</p>
        </div>
      </div>

      {/* --- ADDED: New Filter & Export Bar --- */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-wrap justify-between items-center gap-4">
        {/* Filter Group */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-500">Filters:</span>
          {/* quick month toggles */}
          <div className="inline-flex rounded-md overflow-hidden border">
            <button onClick={() => setQuickMonth("this")} className={`px-3 py-2 text-sm ${quickMonth === "this" ? "bg-gray-100 font-semibold" : "bg-white"}`}>This Month</button>
            <button onClick={() => setQuickMonth("last")} className={`px-3 py-2 text-sm ${quickMonth === "last" ? "bg-gray-100 font-semibold" : "bg-white"}`}>Last Month</button>
            <button onClick={() => setQuickMonth("all")} className={`px-3 py-2 text-sm ${quickMonth === "all" ? "bg-gray-100 font-semibold" : "bg-white"}`}>All Time</button>
          </div>
          {/* month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); setQuickMonth("custom"); }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          {/* category selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
            ))}
          </select>
          {/* year selector */}
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg">
            {Array.from({ length: 5 }, (_, i) => {
              const y = new Date().getFullYear() - i; // last 5 years
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>

        {/* Export Group */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-500">Exports:</span>
          {/* Budget PDF controls */}
          <div className="flex items-center gap-2 border-l pl-3">
            <select value={periodMode} onChange={(e) => setPeriodMode(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
            {periodMode === "Quarterly" && (
              <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number(e.target.value))} className="px-3 py-2 border rounded-lg">
                <option value={1}>Q1</option>
                <option value={2}>Q2</option>
                <option value={3}>Q3</option>
                <option value={4}>Q4</option>
              </select>
            )}
            <button onClick={() => downloadBudgetReport(periodMode)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              <FileText size={16} /> Budget PDF
            </button>
          </div>
          {/* Other exports */}
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50">
            <FileSpreadsheet size={16} /> CSV
          </button>
          <button onClick={downloadFullPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50">
            <Download size={16} /> Page PDF
          </button>
        </div>
      </div>
      {/* --- END OF NEW BAR --- */}

      <section aria-labelledby="financial-summary-heading">
        <h2 id="financial-summary-heading" className="text-xl font-bold text-gray-900 mb-4">Financial Summary</h2>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="text-sm text-gray-600">Total Income</div>
            <div className="text-3xl font-bold">BWP {totalIncome.toFixed(2)}</div>
            <div className="text-xs text-gray-500">{prevIncome > 0 ? `${incomeChange}% vs prev` : "—"}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="text-sm text-gray-600">Total Expenses</div>
            <div className="text-3xl font-bold">BWP {totalExpenses.toFixed(2)}</div>
            <div className="text-xs text-gray-500">{prevExpenses > 0 ? `${expenseChange}% vs prev` : "—"}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="text-sm text-gray-600">Net Savings</div>
            <div className={`text-3xl font-bold ${balance >= 0 ? "text-gray-900" : "text-red-600"}`}>BWP {balance.toFixed(2)}</div>
            <div className="text-xs text-gray-500">of BWP {totalBudget.toFixed(2)} budgets</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="text-sm text-gray-600">Top Category</div>
            <div className="text-2xl font-bold">{topCat ? topCat.name : "None"}</div>
            <div className="text-xs text-gray-500">{topCat ? `BWP ${topCat.value.toFixed(2)}` : ""}</div>
          </div>
        </div>
      </section>

      <section aria-labelledby="charts-heading">
        <h2 id="charts-heading" className="text-xl font-bold text-gray-900 mb-4">Charts</h2>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <h3 className="text-lg font-bold mb-4">Spending by Category</h3>
            {categorySpending.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categorySpending} dataKey="value" innerRadius={60} outerRadius={100}>
                      {categorySpending.map((entry, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `BWP ${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {categorySpending.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                      <span className="text-xs text-gray-600">{c.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="h-64 flex items-center justify-center text-gray-400">No spending data</div>}
          </div>

          {/* Line */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            {/* --- MODIFIED: Title for clarity --- */}
            <h3 className="text-lg font-bold mb-4">Recent 4-Week Expense Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={expensesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => `BWP ${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>


      <section aria-labelledby="health-insights-heading">
        <h2 id="health-insights-heading" className="text-xl font-bold text-gray-900 mb-4">Health & Insights</h2>
        {/* Health + Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <h3 className="text-lg font-bold mb-4">Financial Health Score</h3>
            {/* Progress Bar for Health Score */}
            <div className="w-full bg-gray-200 rounded-full h-4 mt-6 mb-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${getHealthBarColor(healthScore)}`}
                style={{ width: `${Math.max(0, Math.min(100, healthScore))}%` }}
              />
            </div>
            {/* End Progress Bar */}
            <p className="text-center text-3xl font-bold text-gray-900 mt-4">{healthScore}/100</p>
            <p className="text-center text-gray-500 mt-2">
              {healthScore > 75 ? "Excellent — you are in great shape!" : healthScore > 50 ? "Good — keep improving." : healthScore > 30 ? "At risk — review spending." : "Critical — take action now."}
            </p>
          </div>

          {/* --- MODIFIED: Insights with Icons --- */}
          <div className="col-span-2 bg-white rounded-2xl p-6 border shadow-sm">
            <h3 className="text-lg font-bold mb-4">Insights</h3>
            <ul className="space-y-3 text-gray-700">
              {insights.map((ins, i) => (
                <li key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {ins.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                  <span className="text-sm">{ins.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="details-heading">
        <h2 id="details-heading" className="text-xl font-bold text-gray-900 mb-4">Details</h2>
        {/* Budgets & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <h3 className="text-lg font-bold mb-4">Budget Progress</h3>
            <div className="space-y-4">
              {budgetsWithProgress.length > 0 ? budgetsWithProgress.map((b) => {
                const cname = categories.find((c) => c.category_id === b.category_id)?.name || "Unknown";
                const percent = Math.min(100, Math.round(b.percentage || 0));
                return (
                  <div key={b.budget_id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700">{cname}</span>
                      <span className="text-gray-600">BWP {b.spent.toFixed(2)} / {parseFloat(b.amount).toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full ${percent >= 100 ? "bg-red-600" : percent >= 85 ? "bg-yellow-500" : "bg-green-600"}`} style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{percent}% used</p>
                  </div>
                );
              }) : <p className="text-gray-400 text-center py-8">No budgets set</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? recentTransactions.map((t, idx) => {
                const cat = categories.find((c) => c.category_id === t.category_id);
                const dt = parseDateMMDDYYYY(t.date);
                const IconComponent = getCategoryIcon(cat?.name); // --- MODIFIED ---
                return (
                  <div key={t.id || t.transaction_id || idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    {/* --- MODIFIED: Use real icon --- */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                      <IconComponent size={18} className={`${t.type === "income" ? "text-green-600" : "text-red-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{t.description || (cat?.name || "Transaction")}</p>
                      <p className="text-xs text-gray-500">{cat?.name || "Uncategorized"}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>{t.type === "expense" ? "-" : "+"}BWP {parseFloat(t.amount || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{dt ? dt.toLocaleDateString() : ""}</p>
                    </div>
                  </div>
                );
              }) : <p className="text-gray-400 text-center py-8">No transactions yet</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <section aria-labelledby="alerts-heading">
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h2 id="alerts-heading" className="text-xl font-bold text-gray-900">Budget Alerts</h2>
            </div>
            <div className="space-y-3">
              {budgetAlerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-lg ${a.type === "danger" ? "bg-red-50 border border-red-200" : "bg-yellow-50 border border-yellow-200"}`}>
                  <p className={`text-sm font-medium ${a.type === "danger" ? "text-red-800" : "text-yellow-800"}`}>{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}