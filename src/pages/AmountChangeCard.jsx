import React, { useMemo, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/config";

const AmountChangeCard = ({ booking, bookingId, fetchBooking }) => {
  const [loadingAction, setLoadingAction] = useState(""); // "accept" | "reject" | ""
  const [error, setError] = useState("");

  const resolvedBookingId = bookingId;

  // ✅ supports both booking.priceChanges or booking.bookingDetails.priceChanges
  const priceChanges =
    booking?.priceChanges ||[];

  const lastPendingReducedPriceChange = useMemo(() => {
    try {
      return [...priceChanges]
        .reverse()
        .find(
          (p) =>
            String(p?.status || "").toLowerCase() === "pending" &&
            String(p?.scopeType || "").toLowerCase() === "reduced"
        );
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [priceChanges]);

  // ✅ if no pending reduced change, hide card
  if (!lastPendingReducedPriceChange) return null;

  const b = booking?.bookingDetails ? booking.bookingDetails : booking;

  const data = {
    oldTotal: b?.finalTotal ?? b?.originalTotalAmount ?? 0,
    change: lastPendingReducedPriceChange?.adjustmentAmount ?? 0,
    newTotal: lastPendingReducedPriceChange?.proposedTotal ?? 0,
    paid: b?.paidAmount ?? 0,
  
  };

  const formatINR = (n) => {
    try {
      const x = Number(n);
      return `₹${Number.isFinite(x) ? x.toLocaleString("en-IN") : "0"}`;
    } catch (err) {
      return "₹0";
    }
  };

  // ✅ API: Approve
  const handleAccept = async () => {
    try {
      if (!resolvedBookingId) {
        alert("Missing bookingId");
        return;
      }

      setError("");
      setLoadingAction("accept");

      const url = `${BASE_URL}/bookings/approve-pricing/${resolvedBookingId}`;

      const res = await axios.post(url, { by: "admin" });

      alert(res?.data?.message || "Pricing approved successfully");
      await fetchBooking();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Approve failed. Please try again.";
      setError(msg);
      alert(msg);
    } finally {
      setLoadingAction("");
    }
  };

  // ✅ API: Reject
  const handleReject = async () => {
    try {
      if (!resolvedBookingId) {
        alert("Missing bookingId");
        return;
      }

      setError("");
      setLoadingAction("reject");

      const url = `${BASE_URL}/bookings/disapprove-pricing/${resolvedBookingId}`;

      const res = await axios.post(url, { by: "admin" });

      alert(res?.data?.message || "Pricing rejected successfully");
      await fetchBooking();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Reject failed. Please try again.";
      setError(msg);
      alert(msg);
    } finally {
      setLoadingAction("");
    }
  };

  const disabled = loadingAction === "accept" || loadingAction === "reject";

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.title}>Payment modified by Vendor</div>
            <div style={styles.subTitle}>
              This price change is waiting for admin approval.
            </div>
          </div>

          <div style={styles.badge}>PENDING</div>
        </div>

        {/* rows */}
        <div style={styles.rows}>
          <InfoRow
            label="Original Total Amount:"
            value={formatINR(data.oldTotal)}
          />

          <InfoRow
            label="Total Change:"
            value={` - ${formatINR(Math.abs(data.change))}`}
            valueStyle={{
              color: "#dc2626",
              fontWeight: 800,
            }}
          />

          <InfoRow
            label="New Total Amount:"
            value={formatINR(data.newTotal)}
            valueStyle={{ color: "#16a34a", fontWeight: 800 }}
          />

          <InfoRow label="Amount Paid:" value={formatINR(data.paid)} />

          {/* <InfoRow
            label="Amount Yet To Pay:"
            value={formatINR(data.yetToPay)}
            valueStyle={{ fontWeight: 800 }}
          /> */}

          {error ? <div style={styles.error}>{error}</div> : null}
        </div>

        {/* bottom */}
        <div style={styles.bottom}>
          <button
            style={{
              ...styles.rejectBtn,
              opacity: disabled ? 0.7 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            onClick={handleReject}
            disabled={disabled}
          >
            {loadingAction === "reject" ? "Rejecting..." : "Reject"}
          </button>

          <button
            style={{
              ...styles.acceptBtn,
              opacity: disabled ? 0.7 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            onClick={handleAccept}
            disabled={disabled}
          >
            {loadingAction === "accept" ? "Accepting..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ Small row component
const InfoRow = ({ label, value, valueStyle = {} }) => {
  return (
    <div style={styles.row}>
      <div style={styles.key}>{label}</div>
      <div style={{ ...styles.val, ...valueStyle }}>{value}</div>
    </div>
  );
};

const styles = {
  wrap: {
    width: "100%",
    fontFamily: "'Poppins', sans-serif",
    marginTop: 10,
  },

  card: {
    width: "100%",
    maxWidth: 720,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e9ecef",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },

  header: {
    padding: "16px 20px",
    borderBottom: "1px solid #f1f1f1",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: 800,
    color: "#111827",
  },

  subTitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
  },

  badge: {
    fontSize: 12,
    fontWeight: 800,
    color: "#b45309",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    padding: "6px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },

  rows: {
    padding: "14px 20px 18px 20px",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    padding: "8px 0",
  },

  key: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },

  val: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    minWidth: 120,
    textAlign: "right",
  },

  error: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 10,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: 700,
  },

  bottom: {
    borderTop: "1px solid #f1f1f1",
    padding: "16px 20px",
    display: "flex",
    gap: 12,
    justifyContent: "flex-start", // ✅ like your screenshot (left aligned)
  },

  rejectBtn: {
    padding: "10px 18px",
    borderRadius: 10,
    background: "#fff",
    border: "1px solid #ef4444",
    color: "#ef4444",
    fontWeight: 800,
  },

  acceptBtn: {
    padding: "10px 18px",
    borderRadius: 10,
    background: "#15803d",
    border: "1px solid #15803d",
    color: "#fff",
    fontWeight: 800,
  },
};

export default AmountChangeCard;
