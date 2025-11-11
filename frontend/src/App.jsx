import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Budgets from "./pages/Budgets";
import Reports from "./pages/test";  
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import UserManagement from "./admin/UserManagement";
import CategoryManagement from "./admin/CategoryManagement";
import TransactionManagement from "./admin/TransactionManagement";
import AdminReports from "./admin/AdminReports";
import { Toaster } from "react-hot-toast";


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

        <AdminLayout>
          {/* Additional admin routes can be added here */}
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/categories" element={<CategoryManagement />} />
          <Route path="/admin/transactions" element={<TransactionManagement />} />
          <Route path="/admin/reports" element={<AdminReports />}/>
        </AdminLayout>
      </Routes>
    </Router>
    
  );
}

export default App;
