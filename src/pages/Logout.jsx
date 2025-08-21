import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth } from "../utils/auth";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    clearAuth();          // ✅ clear localStorage
    navigate("/");   // ✅ go to login
  }, [navigate]);

  return null; // no UI needed
};

export default Logout;
