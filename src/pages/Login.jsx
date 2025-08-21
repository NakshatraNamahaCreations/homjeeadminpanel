import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { isAuthed } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_BASE || "https://homjee-backend.onrender.com";

const Login = () => {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

   useEffect(() => {
    if (isAuthed()) navigate("/dashboard"); // already logged in
  }, [navigate]);

  const normalizeMobile = (val) => String(val || "").replace(/\D/g, "");

  const handleLogin = async () => {
    const mobileNumber = normalizeMobile(input);

    if (!mobileNumber || !/^\d{10,15}$/.test(mobileNumber)) {
      setError("Please enter a valid mobile number (digits only).");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to send OTP");
      }

      // success → go to OTP screen; pass mobile + (optionally) ttl/debug otp
      const params = new URLSearchParams({
        input: mobileNumber,
        ttl: String(data?.expiresInSeconds ?? ""),
        // NOTE: debugOtp only in non-production backend; don't rely on it
        debugOtp: data?.debugOtp || "",
      });

      navigate(`/otp-verification?${params.toString()}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={logo} alt="HomeJee Logo" style={styles.logo} />

        <h2 style={styles.heading}>Login</h2>
        <p style={styles.subText}>Enter your phone number</p>

        <input
          type="text"
          placeholder="Phone Number (10 digits)"
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        {error && <p style={styles.error}>{error}</p>}

        <button onClick={handleLogin} style={styles.button} disabled={loading}>
          {loading ? "Sending OTP..." : "Continue"}
        </button>
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
  logo: { width: "120px", marginBottom: "15px" },
  heading: { fontSize: "1.5rem", fontWeight: "bold", color: "#333" },
  subText: { color: "#666", fontSize: "0.9rem", marginBottom: "1rem" },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "1rem",
    outline: "none",
    marginBottom: "1rem",
  },
  error: { color: "red", fontSize: "0.8rem", marginBottom: "0.5rem" },
  button: {
    width: "100%",
    backgroundColor: "#C7191D",
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "1rem",
    border: "none",
    cursor: "pointer",
    transition: "0.3s",
    opacity: 1,
  },
};

export default Login;
