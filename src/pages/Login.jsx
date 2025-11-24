import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { isAuthed } from "../utils/auth";
import { BASE_URL } from "../utils/config";


const Login = () => {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthed()) navigate("/dashboard"); // already logged in
  }, [navigate]);

  // keep only digits and clamp to 10
  const sanitizeTo10Digits = (val) =>
    String(val || "")
      .replace(/\D/g, "")
      .slice(0, 10);

  const handleLogin = async () => {
    const mobileNumber = sanitizeTo10Digits(input);

    if (!/^\d{10}$/.test(mobileNumber)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BASE_URL}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to send OTP");
      }

      // success → go to OTP screen; pass mobile + ttl + (optionally) debug otp
      navigate("/otp-verification", {
        state: {
          input: mobileNumber,
          ttl: data?.expiresInSeconds ?? "",
          otp: data?.otp || "",
        },
      });
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
          type="tel"
          inputMode="numeric"
          pattern="\d{10}"
          maxLength={10}
          autoComplete="tel"
          placeholder="Phone Number (10 digits)"
          style={styles.input}
          value={input}
          onChange={(e) => {
            const val = sanitizeTo10Digits(e.target.value);
            setInput(val);
            // live validation message while typing (optional)
            if (val.length > 0 && val.length < 10) {
              setError("Phone number must be exactly 10 digits.");
            } else {
              setError("");
            }
          }}
          disabled={loading}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={handleLogin}
          style={styles.button}
          disabled={loading || input.length !== 10}
        >
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
