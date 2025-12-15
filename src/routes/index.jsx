import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";

import NewLeads from "../pages/NewLeads";
import LeadDetails from "../pages/LeadDetails";
import NotificationSettings from "../pages/NotificationSettings";
import MoneyDashboard from "../pages/MoneyDashboard";
import PerformanceDashboard from "../pages/PerformanceDashboard";
import VendorsDashboard from "../pages/VendorsDashboard";
import ProductsDashboard from "../pages/ProductDashboard";
import OngoingLeads from "../pages/OngoingLeads";
import OngoingLeadDetails from "../pages/OngoingLeadDetails";
import Login from "../pages/Login";
import OTPVerification from "../pages/OTPVerification";
import Layout from "../layouts/Layout";
import DeepCleaningDashboard from "../pages/DeepCleaningDashboard";
import Settings from "../pages/Setting";
import Logout from "../pages/Logout";
import AllReminders from "../pages/AllReminders";
import EnquiriesList from "../pages/EnquiriesList";
import EnquiryDetails from "../pages/EnquiryDetails";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/otp-verification" element={<OTPVerification />} />

      <Route path="/" element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* <Route path="/enquiries" element={<Enquiries />} /> */}
        <Route path="/enquiries" element={<EnquiriesList />} />
        <Route path="/enquiry-details/:id" element={<EnquiryDetails />} />

        <Route path="/newleads" element={<NewLeads />} />
        <Route path="/lead-details/:id" element={<LeadDetails />} />
        <Route path="/notification" element={<NotificationSettings />} />
         <Route path="/ongoing-leads" element={<OngoingLeads />} />
        <Route path="/ongoing-leads/:bookingId" element={<OngoingLeadDetails />} />
        <Route path="/moneydashboard" element={<MoneyDashboard />} />
        <Route
          path="/performancedashboard"
          element={<PerformanceDashboard />}
        />
        <Route path="/vendor" element={<VendorsDashboard />} />
        <Route path="/product" element={<ProductsDashboard />} />
        <Route
          path="/deep-cleaning-dashboard"
          element={<DeepCleaningDashboard />}
        />

        <Route path="/all-reminders" element={<AllReminders />} />
        <Route path="/logout" element={<Logout />} />

        <Route path="/setting" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
