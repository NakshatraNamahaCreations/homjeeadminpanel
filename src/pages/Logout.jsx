// pages/Logout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      logout();
    } catch (e) {
      // ignore
    } finally {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Logging out...</h2>
        <p>Please wait while we log you out.</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
  },
  card: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "10px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    width: "350px",
    textAlign: "center",
  },
};

export default Logout;
