import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Enquiries from "../pages/Enquiries";
import NewLeads from "../pages/NewLeads";
import LeadDetails from "../pages/LeadDetails";
import NotificationSettings from "../pages/NotificationSettings";
import MoneyDashboard from "../pages/MoneyDashboard";
import PerformanceDashboard from "../pages/PerformanceDashboard"; 
import VendorsDashboard from "../pages/VendorsDashboard";
import ProductsDashboard from "../pages/ProductDashboard";
import OngoingLeads from "../pages/OngoingLeads";
import Login from "../pages/Login";
import OTPVerification from "../pages/OTPVerification";
import Layout from "../layouts/Layout";
import DeepCleaningDashboard from "../pages/DeepCleaningDashboard";
import Settings from "../pages/Setting";
import Logout from "../pages/Logout";




const AppRoutes = () => {
  return (
    <Routes>

      <Route path="/" element={<Login />} />
      <Route path="/otp-verification" element={<OTPVerification />} />


      <Route path="/" element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/enquiries" element={<Enquiries />} />
        <Route path="/newleads" element={<NewLeads />} />
        <Route path="/lead-details/:id" element={<LeadDetails />} />
        <Route path="/notification" element={<NotificationSettings />} />
        <Route path="/ongoingleads" element={<OngoingLeads />} />
        <Route path="/moneydashboard" element={<MoneyDashboard />} />
        <Route path="/performancedashboard" element={<PerformanceDashboard />} />
        <Route path="/vendor" element={<VendorsDashboard />} />
        <Route path="/product" element={<ProductsDashboard />} />
        <Route path="/deep-cleaning-dashboard" element={<DeepCleaningDashboard />} />
  
<Route path="/logout" element={<Logout />} />

        <Route path="/setting" element={<Settings />} />

      </Route>
    </Routes>
  );
};

export default AppRoutes;
