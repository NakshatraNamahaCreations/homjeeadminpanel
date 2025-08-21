import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import { setAuth } from "../utils/auth"; 

const API_BASE = import.meta.env.VITE_API_BASE || "https://homjee-backend.onrender.com";

const OTPVerification = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const input = params.get("input") || ""; // mobile number (digits)
  const ttl = params.get("ttl"); // optional from server
  const debugOtp = params.get("debugOtp"); // OPTIONAL (non-prod only)

  const handleVerifyOTP = async () => {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      setInfo("");

      const res = await fetch(`${API_BASE}/api/admin/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: input, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Verification failed");
      }

            setAuth({
        mobileNumber: data?.data?.mobileNumber || input,
        name: data?.data?.name || null,
        loggedInAt: Date.now(),
      });


      // success
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setError("");
      setInfo("");

      const res = await fetch(`${API_BASE}/api/admin/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: input }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to resend OTP");
      }

      setInfo("OTP re-sent successfully.");
      // Optionally show debugOtp for non-prod
      if (data?.debugOtp) setInfo(`OTP re-sent successfully. (Debug: ${data.debugOtp})`);
    } catch (e) {
      setError(e.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={logo} alt="HomeJee Logo" style={styles.logo} />
        <br />
        <h2 style={styles.heading}>OTP Verification</h2>
        <p style={styles.subText}>
          Enter the OTP sent to <span style={{ fontWeight: "bold" }}>{input}</span>
          {ttl ? ` (expires in ~${ttl}s)` : ""}
        </p>

        {/* Dev helper (remove in prod) */}
        {debugOtp ? (
          <p style={{ color: "#999", fontSize: "0.8rem", marginTop: "-6px" }}>
             OTP: <strong>{debugOtp}</strong>
          </p>
        ) : null}

        <input
          type="text"
          maxLength="6"
          placeholder="Enter OTP"
          style={styles.input}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          disabled={verifying}
        />
        {error && <p style={styles.error}>{error}</p>}
        {info && <p style={styles.info}>{info}</p>}

        <button onClick={handleVerifyOTP} style={styles.buttonGreen} disabled={verifying}>
          {verifying ? "Verifying..." : "Verify OTP"}
        </button>

        <p style={styles.resend} onClick={resending ? undefined : handleResend}>
          {resending ? "Resending..." : "Resend OTP"}
        </p>
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
  heading: { fontSize: "1.5rem", fontWeight: "bold", color: "#333" },
  subText: { color: "#666", fontSize: "0.9rem", marginBottom: "1rem" },
  logo: { width: "120px", marginBottom: "15px" },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "1rem",
    outline: "none",
    marginBottom: "1rem",
    textAlign: "center",
    letterSpacing: "3px",
  },
  error: { color: "red", fontSize: "0.8rem", marginBottom: "0.5rem" },
  info: { color: "green", fontSize: "0.85rem", marginBottom: "0.5rem" },
  buttonGreen: {
    width: "100%",
    backgroundColor: "gray",
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "1rem",
    border: "none",
    cursor: "pointer",
    transition: "0.3s",
  },
  resend: {
    color: "#C7191D",
    fontSize: "0.9rem",
    marginTop: "1rem",
    cursor: "pointer",
    textDecoration: "underline",
  },
};

export default OTPVerification;
