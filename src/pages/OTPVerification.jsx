// import { useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import logo from "../assets/logo.svg";
// import { setAuth } from "../utils/auth";
// import { BASE_URL } from "../utils/config";

// const OTPVerification = () => {
//   const [otp, setOtp] = useState("");
//   const [error, setError] = useState("");
//   const [info, setInfo] = useState("");
//   const [verifying, setVerifying] = useState(false);
//   const [resending, setResending] = useState(false);

//   const navigate = useNavigate();
//   const location = useLocation();

//   // Get data from state
//   const state = location.state || {};
//   const input = state.input || "";
//   const ttl = state.ttl || "";
//   const receivedOtp = state.otp || ""; // Use otp instead of debugOtp

//   const handleVerifyOTP = async () => {
//     if (!/^\d{6}$/.test(otp)) {
//       setError("Enter a valid 6-digit OTP.");
//       return;
//     }

//     try {
//       setVerifying(true);
//       setError("");
//       setInfo("");

//       const res = await fetch(`${BASE_URL}/admin/auth/verify-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ mobileNumber: input, otp }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.message || "Verification failed");

//       setAuth({
//         mobileNumber: data?.data?.mobileNumber || input,
//         name: data?.data?.name || null,
//         loggedInAt: Date.now(),
//       });

//       navigate("/dashboard");
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setVerifying(false);
//     }
//   };

//   const handleResend = async () => {
//     try {
//       setResending(true);
//       setError("");
//       setInfo("");

//       const res = await fetch(`${BASE_URL}/admin/auth/resend-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ mobileNumber: input }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.message || "Failed to resend OTP");

//       // Update state with new OTP
//       navigate(location.pathname, {
//         state: {
//           input,
//           ttl: data?.expiresInSeconds ?? "",
//           otp: data?.otp || "",
//         },
//         replace: true, // Replace history to avoid stale state
//       });

//       setInfo(`OTP re-sent successfully. (OTP: ${data.otp})`);
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setResending(false);
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.card}>
//         <img src={logo} alt="HomeJee Logo" style={styles.logo} />
//         <br />
//         <h2 style={styles.heading}>OTP Verification</h2>
//         <p style={styles.subText}>
//           Enter the OTP sent to <span style={{ fontWeight: "bold" }}>{input}</span>
//           {ttl ? ` (expires in ~${ttl}s)` : ""}
//         </p>

//         {/* Display OTP */}
//         {receivedOtp ? (
//           <p style={{ color: "#999", fontSize: "0.8rem", marginTop: "-6px" }}>
//             OTP: <strong>{receivedOtp}</strong>
//           </p>
//         ) : null}

//         <input
//           type="text"
//           maxLength="6"
//           placeholder="Enter OTP"
//           style={styles.input}
//           value={otp}
//           onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
//           disabled={verifying}
//         />
//         {error && <p style={styles.error}>{error}</p>}
//         {info && <p style={styles.info}>{info}</p>}

//         <button onClick={handleVerifyOTP} style={styles.buttonGreen} disabled={verifying}>
//           {verifying ? "Verifying..." : "Verify OTP"}
//         </button>

//         <p style={styles.resend} onClick={resending ? undefined : handleResend}>
//           {resending ? "Resending..." : "Resend OTP"}
//         </p>
//       </div>
//     </div>
//   );
// };

// const styles = {
//   container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f3f4f6" },
//   card: { backgroundColor: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", width: "350px", textAlign: "center" },
//   heading: { fontSize: "1.5rem", fontWeight: "bold", color: "#333" },
//   subText: { color: "#666", fontSize: "0.9rem", marginBottom: "1rem" },
//   logo: { width: "120px", marginBottom: "15px" },
//   input: { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "5px", fontSize: "1rem", outline: "none", marginBottom: "1rem", textAlign: "center", letterSpacing: "3px" },
//   error: { color: "red", fontSize: "0.8rem", marginBottom: "0.5rem" },
//   info: { color: "green", fontSize: "0.85rem", marginBottom: "0.5rem" },
//   buttonGreen: { width: "100%", backgroundColor: "gray", color: "white", padding: "10px", borderRadius: "5px", fontSize: "1rem", border: "none", cursor: "pointer", transition: "0.3s" },
//   resend: { color: "#C7191D", fontSize: "0.9rem", marginTop: "1rem", cursor: "pointer", textDecoration: "underline" },
// };

// export default OTPVerification;

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import { initSession } from "../utils/auth"; // Use initSession
import { BASE_URL } from "../utils/config";

const OTPVerification = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  // Get data from state
  const state = location.state || {};
  const input = state.input || "";
  const ttl = state.ttl || 120; // Default 120 seconds
  const receivedOtp = state.otp || "";

  // Timer countdown effect
  useEffect(() => {
    if (ttl > 0 && timer === 0) {
      setTimer(ttl);
    }
  }, [ttl]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerifyOTP = async () => {
 

    try {
      setVerifying(true);
      setError("");
      setInfo("");

      const res = await fetch(`${BASE_URL}/admin/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: input, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400) {
          throw new Error(data.message || "Invalid OTP");
        } else if (res.status === 404) {
          throw new Error("Admin account not found");
        }
        throw new Error(data?.message || "Verification failed");
      }

      // Store admin data and REAL JWT token from backend
      if (data.data && data.token) {
        // Use initSession which handles everything
        initSession(data.data, data.token);
      } else {
        throw new Error("No authentication data received");
      }

      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
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

      const res = await fetch(`${BASE_URL}/admin/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: input }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data.message || "Please wait before resending OTP");
        }
        throw new Error(data?.message || "Failed to resend OTP");
      }

      // Update state with new OTP
      navigate(location.pathname, {
        state: {
          input,
          ttl: data?.expiresInSeconds || 120,
          otp: data?.otp || "",
        },
        replace: true,
      });

      setTimer(data?.expiresInSeconds || 120);
      setInfo(`OTP re-sent successfully!`);
    } catch (e) {
      setError(e.message);
    } finally {
      setResending(false);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={logo} alt="HomeJee Logo" style={styles.logo} />

        <h2 style={styles.heading}>OTP Verification</h2>

        <div style={styles.infoBox}>
          <p style={styles.subText}>Enter the OTP sent to</p>
          <p style={styles.phoneNumber}>{input}</p>

          {timer > 0 && (
            <p style={styles.timer}>
              Expires in:{" "}
              <span style={{ color: timer < 30 ? "#dc3545" : "#28a745" }}>
                {formatTime(timer)}
              </span>
            </p>
          )}
        </div>

        {/* Debug OTP display (only in development) */}
        {receivedOtp  && (
          <div style={styles.debugBox}>
            <p style={styles.debugText}>
              Debug OTP: <strong>{receivedOtp}</strong>
            </p>
          </div>
        )}

        <div style={styles.otpContainer}>
          <input
            type="text"
            maxLength="6"
            placeholder="Enter 6-digit OTP"
            style={styles.input}
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setOtp(value);
             
            }}
            onKeyPress={(e) => e.key === "Enter" && handleVerifyOTP()}
            disabled={verifying}
            autoFocus
          />
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.error}>{error}</p>
          </div>
        )}

        {info && (
          <div style={styles.successBox}>
            <p style={styles.info}>{info}</p>
          </div>
        )}

        <button
          onClick={handleVerifyOTP}
          style={{
            ...styles.button,
            opacity: verifying || otp.length !== 6 ? 0.6 : 1,
            cursor: verifying || otp.length !== 6 ? "not-allowed" : "pointer",
          }}
          disabled={verifying || otp.length !== 6}
        >
          {verifying ? (
            <>
              <span style={styles.spinner}></span>
              Verifying...
            </>
          ) : (
            "Verify OTP"
          )}
        </button>

        <div style={styles.resendContainer}>
          <p style={styles.resendText}>
            Didn't receive the code?{" "}
            <span
              onClick={resending || timer > 100 ? undefined : handleResend}
              style={{
                ...styles.resendLink,
                opacity: resending || timer > 100 ? 0.5 : 1,
                cursor: resending || timer > 100 ? "not-allowed" : "pointer",
              }}
            >
              {resending ? "Resending..." : "Resend OTP"}
            </span>
          </p>

          {timer > 100 && (
            <p style={styles.waitText}>
              Wait {formatTime(timer - 100)} before resending
            </p>
          )}
        </div>

        <button onClick={() => navigate("/login")} style={styles.backButton}>
          ← Back to Login
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
    backgroundColor: "#f8f9fa",
  },
  card: {
    backgroundColor: "white",
    padding: "2.5rem",
    borderRadius: "12px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
    width: "400px",
    textAlign: "center",
    border: "1px solid #eaeaea",
  },
  logo: {
    width: "140px",
    marginBottom: "1.5rem",
  },
  heading: {
    fontSize: "1.75rem",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "0.5rem",
  },
  infoBox: {
    backgroundColor: "#f8f9fa",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
  },
  subText: {
    color: "#6c757d",
    fontSize: "0.95rem",
    marginBottom: "0.25rem",
  },
  phoneNumber: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#2c3e50",
    margin: "0.25rem 0",
  },
  timer: {
    fontSize: "0.9rem",
    color: "#6c757d",
    marginTop: "0.5rem",
  },
  debugBox: {
    backgroundColor: "#fff3cd",
    border: "1px solid #ffeaa7",
    borderRadius: "6px",
    padding: "0.75rem",
    marginBottom: "1.5rem",
  },
  debugText: {
    fontSize: "0.85rem",
    color: "#856404",
    margin: 0,
  },
  otpContainer: {
    marginBottom: "1.5rem",
  },
  input: {
    width: "100%",
    padding: "14px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "1.25rem",
    outline: "none",
    textAlign: "center",
    letterSpacing: "8px",
    fontFamily: "monospace",
    transition: "border 0.3s ease",
    boxSizing: "border-box",
  },
  errorBox: {
    backgroundColor: "#f8d7da",
    border: "1px solid #f5c6cb",
    borderRadius: "6px",
    padding: "0.75rem",
    marginBottom: "1rem",
  },
  error: {
    color: "#721c24",
    fontSize: "0.9rem",
    margin: 0,
  },
  successBox: {
    backgroundColor: "#d4edda",
    border: "1px solid #c3e6cb",
    borderRadius: "6px",
    padding: "0.75rem",
    marginBottom: "1rem",
  },
  info: {
    color: "#155724",
    fontSize: "0.9rem",
    margin: 0,
  },
  button: {
    width: "100%",
    backgroundColor: "#C7191D",
    color: "white",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "1rem",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "600",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid #ffffff",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  resendContainer: {
    marginBottom: "1.5rem",
  },
  resendText: {
    color: "#6c757d",
    fontSize: "0.95rem",
    marginBottom: "0.5rem",
  },
  resendLink: {
    color: "#C7191D",
    fontWeight: "600",
    textDecoration: "none",
    transition: "color 0.3s ease",
  },
  waitText: {
    fontSize: "0.85rem",
    color: "#6c757d",
    fontStyle: "italic",
    margin: 0,
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#6c757d",
    fontSize: "0.9rem",
    cursor: "pointer",
    padding: "0.5rem",
    transition: "color 0.3s ease",
  },
};

// Add CSS animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default OTPVerification;
