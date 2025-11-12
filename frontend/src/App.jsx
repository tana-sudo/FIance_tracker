import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";  
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import UserManagement from "./admin/UserManagement";
import CategoryManagement from "./admin/CategoryManagement";
import TransactionManagement from "./admin/TransactionManagement";
import AdminReports from "./admin/AdminReports";
import ActivityLogs from "./admin/ActivityLogs";
import { Toaster } from "react-hot-toast";
import { Navigate } from "react-router-dom";


function App() {
  return (
      <Router>
        <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/transactions" element={<Layout><Transactions /></Layout>} /> 
          <Route path="/categories" element={<Layout><Categories /></Layout>} />
          <Route path="/budgets" element={<Layout><Budgets /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} /> 

           {/* Additional admin routes can be added here */}
            < Route path="/users" element={<AdminLayout><UserManagement /></AdminLayout>}/>
            <Route path="/category" element={<AdminLayout><CategoryManagement /></AdminLayout>} />
            <Route path="/transaction"element={<AdminLayout><TransactionManagement /></AdminLayout>} />
            <Route path="/report" element={<AdminLayout><AdminReports /></AdminLayout>}/>
            <Route path="/activity" element={<AdminLayout><ActivityLogs /></AdminLayout>} />
         
        </Routes>
      </Router>
  );
}

export default App;
