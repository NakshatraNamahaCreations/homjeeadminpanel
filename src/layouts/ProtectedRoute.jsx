// layouts/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { isFullyAuthed } from "../utils/auth";

const ProtectedRoute = () => {
  // Use isFullyAuthed which checks both token and session validity
  const isAuthenticated = isFullyAuthed();

  console.log("ProtectedRoute check - isAuthenticated:", isAuthenticated);
  
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    // Optional: Clear only auth data, not everything
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminAuth');
    
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;