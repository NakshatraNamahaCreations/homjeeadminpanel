import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import vendorImg from "../assets/vendor3.png";
import { FaPhone, FaMapMarkerAlt, FaCopy, FaArrowLeft } from "react-icons/fa";
import { Button } from "react-bootstrap";
import { BASE_URL } from "../utils/config";
import EditLeadModal from "./EditLeadModal";
import RescheduleTimePickerModal from "./RescheduleTimePickerModal"; // ✅ NEW
import AmountChangeCard from "./AmountChangeCard";

const getStatusColor = (status) => {
  if (!status) return "#6c757d";
  const s = status.toLowerCase();

  if (s === "pending") return "#6c757d";
  if (s === "confirmed") return "#0d6efd";
  if (s === "job ongoing") return "#0d6efd";
  if (s === "survey ongoing") return "#0d6efd";
  if (s === "survey completed") return "#6f42c1";
  if (s === "job completed") return "#28a745";

  if (s === "customer cancelled") return "#dc3545";
  if (s === "cancelled") return "#dc3545";
  if (s === "admin cancelled") return "#b02a37";
  if (s === "cancelled rescheduled") return "#b02a37";

  if (s === "rescheduled") return "#6f42c1";

  if (s === "customer unreachable") return "#fd7e14";
  if (s === "pending hiring") return "#fd7e14";
  if (s === "waiting for final payment") return "#fd7e14";

  if (s === "hired") return "#0056b3";
  if (s === "project ongoing") return "#0d6efd";
  if (s === "project completed") return "#28a745";

  if (s === "negotiation") return "#6610f2";
  if (s === "set remainder") return "#20c997";

  return "#6c757d";
};

const RESCHEDULE_ALLOWED_STATUSES = ["pending", "confirmed", "rescheduled"];

const OngoingLeadDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState(null);

  const [selectedVendor, setSelectedVendor] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);

  const [cashPaymentPopup, setCashPaymentPopup] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [cashPayment, setCashPayment] = useState("");

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const [paymentDetails, setPaymentDetails] = useState({
    totalAmount: 0,
    amountPaid: 0,
    paymentId: "",
  });

  const [assignedVendorDetails, setAssignedVendorDetails] = useState(null);
  const [vendorTeamCount, setVendorTeamCount] = useState(0);

  // -----------------------------
  // Helpers
  // -----------------------------
  const asNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const formatIST = (isoLike) => {
    if (!isoLike) return { d: "N/A", t: "N/A" };
    const d = new Date(isoLike);
    if (isNaN(d.getTime())) return { d: "N/A", t: "N/A" };
    return {
      d: d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }),
      t: d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }),
    };
  };

  const normStatus = (s) =>
    String(s || "")
      .toLowerCase()
      .trim();

  const getRemaining = (p) => asNum(p?.remaining ?? p?.remaning ?? 0);
  const getRequested = (p) => asNum(p?.requestedAmount ?? 0);

  // -----------------------------
  // ✅ FIXED installment calculator
  // -----------------------------
  const computeInstallmentCashDue = (booking) => {
    try {
      const d = booking?.bookingDetails || {};
      const serviceType = booking?.serviceType;

      const first = d.firstPayment || {};
      const second = d.secondPayment || {};
      const finalP = d.finalPayment || {};

      const sequence =
        serviceType === "deep_cleaning"
          ? [
              { key: "firstPayment", label: "First Payment", obj: first },
              { key: "finalPayment", label: "Final Payment", obj: finalP },
            ]
          : [
              { key: "firstPayment", label: "First Payment", obj: first },
              { key: "secondPayment", label: "Second Payment", obj: second },
              { key: "finalPayment", label: "Final Payment", obj: finalP },
            ];

      for (const item of sequence) {
        const status = normStatus(item.obj?.status);
        const requested = getRequested(item.obj);
        const remaining = getRemaining(item.obj);

        // already paid => next
        if (status === "paid") continue;

        // this is the installment we must pay now (earlier must finish first)
        if (status === "pending") {
          // ✅ FINAL PAYMENT PREPAYMENT CASE
          if (
            item.key === "finalPayment" &&
            requested === 0 &&
            asNum(d.amountYetToPay) > 0
          ) {
            return {
              installmentKey: item.key,
              installmentLabel: item.label,
              requestedAmount: asNum(d.amountYetToPay),
              amountYetToPay: asNum(d.amountYetToPay),
              canPay: true,
              message: "",
            };
          }

          if (requested > 0) {
            return {
              installmentKey: item.key,
              installmentLabel: item.label,
              requestedAmount: requested,
              amountYetToPay: requested,
              canPay: true,
              message: "",
            };
          }

          return {
            installmentKey: item.key,
            installmentLabel: item.label,
            requestedAmount: 0,
            amountYetToPay: 0,
            canPay: false,
            message: `Wait for payment request for ${item.label}`,
          };
        }

        if (status === "partial") {
          if (remaining > 0) {
            return {
              installmentKey: item.key,
              installmentLabel: item.label,
              requestedAmount: requested,
              amountYetToPay: remaining,
              canPay: true,
              message: "",
            };
          }
          return {
            installmentKey: item.key,
            installmentLabel: item.label,
            requestedAmount: requested,
            amountYetToPay: 0,
            canPay: false,
            message: `Wait for payment request for ${item.label}`,
          };
        }

        // other / unknown status
        if (requested > 0) {
          return {
            installmentKey: item.key,
            installmentLabel: item.label,
            requestedAmount: requested,
            amountYetToPay: requested,
            canPay: true,
            message: "",
          };
        }

        return {
          installmentKey: item.key,
          installmentLabel: item.label,
          requestedAmount: 0,
          amountYetToPay: 0,
          canPay: false,
          message: `Wait for payment request for ${item.label}`,
        };
      }

      // all paid
      return {
        installmentKey: "",
        installmentLabel: "Payment",
        requestedAmount: 0,
        amountYetToPay: 0,
        canPay: false,
        message: "All installments are already paid.",
      };
    } catch (err) {
      console.error("computeInstallmentCashDue error:", err);
      return {
        installmentKey: "",
        installmentLabel: "Payment",
        requestedAmount: 0,
        amountYetToPay: 0,
        canPay: false,
        message: "Unable to compute installment due.",
      };
    }
  };

  // -----------------------------
  // Derived states
  // -----------------------------
  const maxRequiredTeamMembers = Array.isArray(booking?.service)
    ? Math.max(
        ...booking.service.map((s) => Number(s.teamMembersRequired || 1)),
      )
    : 1;

  const isCancelled = booking?.bookingDetails?.status?.includes("Cancelled");
  const paidAmount = booking?.bookingDetails?.paidAmount ?? 0;
  const isrefundAmount = booking?.bookingDetails?.refundAmount > 0;

  const totalAmount = booking?.bookingDetails?.finalTotal;
  const fullamountYetToPay = booking?.bookingDetails?.amountYetToPay;
  const paymentLinkUrl = booking?.bookingDetails?.paymentLink?.url || "";

  const canChangeVendor =
    !isCancelled &&
    booking?.assignedProfessional &&
    booking?.assignedProfessional?.acceptedDate;

  const bookingStatus =
    booking?.bookingDetails?.status || booking?.status || "";
  const canReschedule =
    !isCancelled &&
    RESCHEDULE_ALLOWED_STATUSES.includes(bookingStatus.toLowerCase());

  const isTeamMismatch =
    vendorTeamCount > 0 && vendorTeamCount < maxRequiredTeamMembers;

  const installmentInfo = computeInstallmentCashDue(booking);
  const installmentDue = asNum(installmentInfo?.amountYetToPay);

  // const shouldShowPayViaCash =
  //   asNum(fullamountYetToPay) > 0 &&
  //   asNum(totalAmount) > 0 &&
  //   installmentInfo?.canPay === true &&
  //   installmentDue > 0;
  const shouldShowPayViaCash =
    asNum(fullamountYetToPay) > 0 && asNum(totalAmount) > 0;
  // installmentInfo?.canPay === true &&
  // installmentDue > 0;

  // -----------------------------
  // Fetch booking
  // -----------------------------
  const fetchBooking = async () => {
    if (!bookingId) {
      setError("Missing booking id");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${BASE_URL}/bookings/get-bookings-by-bookingid/${bookingId}`,
      );
      if (!res.ok) {
        throw new Error(`Booking API error: ${res.status} ${res.statusText}`);
      }
      const payload = await res.json();
      const normalized = payload.booking ? payload.booking : payload;

      setBooking(normalized);

      const paid = normalized?.bookingDetails?.paidAmount ?? 0;
      const total =
        normalized?.bookingDetails?.bookingAmount ??
        normalized?.bookingDetails?.originalTotalAmount ??
        0;

      setPaymentDetails({
        totalAmount: total,
        amountPaid: paid,
        paymentId: normalized?.bookingDetails?.otp
          ? String(normalized.bookingDetails.otp)
          : normalized?.bookingDetails?.paymentLink?.providerRef || "N/A",
      });
    } catch (err) {
      console.error("Booking fetch error:", err);
      setError(err.message || "Failed to fetch booking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchBooking();
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // -----------------------------
  // Fetch vendors
  // -----------------------------
  const fetchAvailableVendors = async () => {
    try {
      setVendorsLoading(true);
      setVendorsError(null);

      const lat = booking?.address?.location?.coordinates?.[1];
      const lng = booking?.address?.location?.coordinates?.[0];

      if (!lat || !lng) throw new Error("Booking location not available");

      const payload = {
        lat,
        lng,
        slotDate: booking?.selectedSlot?.slotDate,
        slotTime: booking?.selectedSlot?.slotTime,
        serviceType: booking?.serviceType,
      };

      if (booking?.serviceType === "deep_cleaning") {
        payload.requiredTeamMembers = booking?.service?.reduce(
          (max, s) => Math.max(max, s.teamMembers || 1),
          1,
        );
      }

      const res = await fetch(`${BASE_URL}/vendor/get-available-vendor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Vendor API error: ${res.status}`);

      const data = await res.json();
      setVendors(data.data || []);
    } catch (err) {
      console.error("Available vendor fetch error:", err);
      setVendorsError(err.message);
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  };

  useEffect(() => {
    if (booking) fetchAvailableVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  // -----------------------------
  // Fetch assigned vendor details
  // -----------------------------
  useEffect(() => {
    const fetchAssignedVendor = async () => {
      try {
        const vendorId = booking?.assignedProfessional?.professionalId;
        if (!vendorId) return;

        const res = await fetch(
          `${BASE_URL}/vendor/get-vendor-by-vendorId/${vendorId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch vendor");

        const data = await res.json();
        setAssignedVendorDetails(data.vendor);

        const teamCount = Array.isArray(data.vendor?.team)
          ? data.vendor.team.length
          : 0;
        setVendorTeamCount(teamCount + 1); // +1 main vendor
      } catch (err) {
        console.error("Vendor fetch error:", err);
        setAssignedVendorDetails(null);
        setVendorTeamCount(0);
      }
    };

    fetchAssignedVendor();
  }, [booking]);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleOpenMaps = () => {
    try {
      const lat =
        booking?.address?.location?.coordinates?.[1] ??
        booking?.address?.location?.coordinates?.[0];
      const lng =
        booking?.address?.location?.coordinates?.[0] ??
        booking?.address?.location?.coordinates?.[1];

      if (lat && lng) {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
          "_blank",
        );
        return;
      }

      if (booking?.address?.streetArea || booking?.address?.city) {
        const q = `${booking.address.streetArea || ""} ${
          booking.address.city || ""
        }`.trim();
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            q,
          )}`,
          "_blank",
        );
        return;
      }

      alert("No valid location available for directions.");
    } catch (err) {
      console.error("Directions failed", err);
      alert("Failed to open directions");
    }
  };

  const handleCall = () => {
    const phone = booking?.customer?.phone;
    if (phone) window.location.href = `tel:${phone}`;
    else alert("No phone number available");
  };

  const handleVendorChange = async () => {
    alert("vendor change");
  };

  // ✅ UPDATED Cash Payment handler (installment wise + installmentStage)
  const handleCashPayment = async () => {
    try {
      const info = computeInstallmentCashDue(booking);
      const due = asNum(info?.amountYetToPay);

      if (!info?.canPay || !(due > 0)) {
        alert(info?.message || "No payable installment amount found.");
        return;
      }

      const payNow = asNum(cashPayment);

      if (!(payNow > 0)) {
        alert("Please enter a valid amount.");
        return;
      }

      if (payNow > due) {
        alert(`Amount cannot be more than ₹${due}`);
        return;
      }

      // ✅ isAdditionalAmount = true ONLY when:
      // secondPayment.amount == secondPayment.requestedAmount AND status == paid
      const secondPayment = booking?.bookingDetails?.secondPayment || {};
      const isAdditionalAmount =
        asNum(secondPayment?.amount) ===
          asNum(secondPayment?.requestedAmount) &&
        normStatus(secondPayment?.status) === "paid";

      // ✅ derive installmentStage from label/key
      const getInstallmentStage = () => {
        // 1) if prePayment/additional => ALWAYS final
        if (isAdditionalAmount) return "final";

        // 2) otherwise based on current installment
        const key = String(info?.installmentKey || "").toLowerCase();
        const label = String(info?.installmentLabel || "").toLowerCase();

        // prefer key match (more reliable)
        if (key.includes("first")) return "first";
        if (key.includes("second")) return "second";
        if (key.includes("final")) return "final";

        // fallback to label match
        if (label.includes("first")) return "first";
        if (label.includes("second")) return "second";
        if (label.includes("final")) return "final";

        // // safe fallback
        // return "first";
      };

      const installmentStage = getInstallmentStage();

      const payload = {
        bookingId,
        paymentMethod: "Cash",
        paidAmount: payNow,
        isAdditionalAmount, // ✅ true => prePayment
        installmentStage, // ✅ REQUIRED now
      };

      const res = await fetch(
        `${BASE_URL}/bookings/update-manual-payment/cash/admin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Cash payment failed");
      }

      alert("Cash payment recorded successfully");

      setCashPayment("");
      setCashPaymentPopup(false);

      await fetchBooking();
    } catch (err) {
      console.error("Cash payment error:", err);
      alert(err.message || "Failed to record cash payment");
    }
  };

  // TODO: you referenced handleCancelBooking in your code; keep your existing function.
  const handleCancelBooking = async () => {
    try {
      alert(
        "Please paste your existing handleCancelBooking logic here (not included in your snippet).",
      );
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------------
  // UI states
  // -----------------------------
  if (loading) {
    return (
      <div
        style={{
          height: "80vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <div className="loader-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="mt-3 text-muted">Loading booking details...</p>

        <style>{`
        .loader-dots span {
          width: 10px;
          height: 10px;
          margin: 0 4px;
          background: #DC3545;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1s infinite alternate;
        }

        .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loader-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 1; }
        }
      `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: "red" }}>Error: {error}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const assigned = booking?.assignedProfessional;

  const addressStr = booking?.address
    ? `${booking.address.houseFlatNumber || ""}${
        booking.address.streetArea ? ", " + booking.address.streetArea : ""
      }`
    : "N/A";

  const formCreated =
    booking?.createdDate || booking?.bookingDetails?.bookingDate || null;
  const createdOn = formatIST(formCreated);

  const bookingSlotDate = booking?.selectedSlot?.slotDate;
  const bookingSlotTime =
    booking?.selectedSlot?.slotTime || booking?.bookingDetails?.bookingTime;

  const normalizedStatus = (
    booking?.bookingDetails?.status || ""
  ).toLowerCase();
  const isProjectCompleted = normalizedStatus === "project completed";

  return (
    <div style={{ paddingInline: 10, fontFamily: "'Poppins', sans-serif" }}>
      <Button
        variant="light"
        className="mb-1"
        size="sm"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft /> Back
      </Button>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          {/* Status Badge */}
          {(() => {
            const status =
              booking?.bookingDetails?.status || booking?.status || "Pending";
            return (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  width: "100%",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    padding: "10px 18px",
                    borderRadius: "12px",
                    backgroundColor: `${getStatusColor(status)}20`,
                    border: `1px solid ${getStatusColor(status)}`,
                    color: getStatusColor(status),
                    fontWeight: 600,
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: getStatusColor(status),
                      borderRadius: "50%",
                      display: "inline-block",
                    }}
                  />
                  {status}
                </div>
              </div>
            );
          })()}

          {/* Header area */}
          <div
            style={{
              background: "#fff",
              padding: "16px",
              borderRadius: 6,
              boxShadow: "0px 1px 2px rgba(0,0,0,0.06)",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <p
                  style={{ color: "#D44B4B", fontWeight: 700, marginBottom: 6 }}
                >
                  {booking?.service?.[0]?.category || "Unknown Service"}
                </p>
                <p style={{ fontWeight: 700, margin: 0 }}>
                  {booking?.customer?.name || "Unknown Customer"}
                </p>

                <p
                  style={{
                    color: "#6c757d",
                    fontSize: 13,
                    margin: "6px 0",
                    width: "900px",
                  }}
                >
                  <FaMapMarkerAlt className="me-1" /> {addressStr}
                  <br />
                  {booking?.address?.landMark && (
                    <>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#363636ff",
                          paddingLeft: "20px",
                        }}
                      >
                        Landmark:{" "}
                      </span>
                      {booking.address.landMark}
                    </>
                  )}
                </p>

                <p style={{ color: "#6c757d", fontSize: 13, margin: 0 }}>
                  <FaPhone className="me-1" />{" "}
                  {booking?.customer?.phone || "N/A"}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14 }}>
                  {bookingSlotDate
                    ? new Date(bookingSlotDate).toLocaleDateString("en-GB")
                    : "N/A"}
                </div>

                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  {bookingSlotTime || "N/A"}
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <button
                    onClick={handleOpenMaps}
                    className="btn btn-sm btn-danger"
                    disabled={isCancelled}
                    style={{ borderRadius: 8, padding: "6px 12px" }}
                  >
                    Directions
                  </button>

                  <button
                    onClick={handleCall}
                    className="btn btn-sm btn-outline-danger"
                    style={{ borderRadius: 8, padding: "6px 12px" }}
                    disabled={isCancelled}
                  >
                    Call
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main columns */}
          <div className="row">
            <div className="col-md-7">
              {/* Payment Details */}
              <div className="card mb-3" style={{ borderRadius: 8 }}>
                <div className="card-body">
                  <h6 className="fw-bold" style={{ fontSize: 14 }}>
                    Payment Details
                  </h6>

                  {(() => {
                    const d = booking?.bookingDetails || {};
                    const total =
                      d.finalTotal ??
                      d.finalTotalAmount ??
                      d.originalTotalAmount ??
                      d.bookingAmount ??
                      0;

                    const paid = d.paidAmount ?? 0;
                    const yet = total > 0 ? d.amountYetToPay : 0;
                    const siteVisitCharges = d.siteVisitCharges ?? 0;
                    const paymentMethod =
                      d.paymentMethod || d.firstPayment?.method || "N/A";
                    const paymentId =
                      d.paymentLink?.providerRef || d.otp || "N/A";
                    const refund = d.refundAmount ?? 0;

                    const isHousePainting =
                      booking?.serviceType === "house_painting";

                    return (
                      <>
                        <p
                          className="fw-semibold text-dark mb-1"
                          style={{ fontSize: 14 }}
                        >
                          Payment Method: {paymentMethod}
                        </p>

                        <p style={{ fontSize: 12, marginBottom: 1 }}>
                          <span className="text-muted">Total Amount:</span>{" "}
                          <strong>
                            ₹{asNum(total).toLocaleString("en-IN")}
                          </strong>
                        </p>

                        <p style={{ fontSize: 12, marginBottom: 1 }}>
                          <span className="text-muted">Amount Paid:</span>{" "}
                          <strong>
                            ₹{asNum(paid).toLocaleString("en-IN")}
                          </strong>
                        </p>

                        <p style={{ fontSize: 12, marginBottom: 1 }}>
                          <span className="text-muted">
                            Amount Yet to Pay :
                          </span>{" "}
                          <strong>₹{asNum(yet).toLocaleString("en-IN")}</strong>
                        </p>

                        {isHousePainting && (
                          <p style={{ fontSize: 12, marginBottom: "1%" }}>
                            <span className="text-muted">
                              Site Visit Charges:
                            </span>{" "}
                            <strong>
                              ₹{asNum(siteVisitCharges).toLocaleString("en-IN")}
                            </strong>
                          </p>
                        )}

                        <p style={{ fontSize: 12 }}>
                          <span className="text-muted">Payment ID:</span>{" "}
                          <strong>{paymentId}</strong>
                          {paymentId !== "N/A" && (
                            <FaCopy
                              className="ms-1 text-danger"
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                navigator.clipboard.writeText(paymentId)
                              }
                            />
                          )}
                        </p>
                        <a href={paymentLinkUrl} target="__balnk">
                          Open Payment link
                        </a>

                        {isCancelled && isrefundAmount && (
                          <div
                            style={{
                              marginTop: 6,
                              padding: "6px 10px",
                              borderLeft: "4px solid #dc3545",
                              backgroundColor: "#fdecea",
                              borderRadius: 4,
                            }}
                          >
                            <p style={{ fontSize: 12, marginBottom: 2 }}>
                              <span className="fw-bold text-danger">
                                Refund Amount
                              </span>
                            </p>
                            <p
                              className="fw-bold text-dark mb-0"
                              style={{ fontSize: 14 }}
                            >
                              ₹{asNum(refund).toLocaleString("en-IN")}
                              <span
                                style={{
                                  fontSize: 11,
                                  marginLeft: 6,
                                  color: "#6c757d",
                                  fontWeight: 500,
                                }}
                              >
                                (initiated)
                              </span>
                            </p>
                          </div>
                        )}

                        {/* ✅ Pay via Cash */}
                        {shouldShowPayViaCash && !isProjectCompleted && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              marginTop: 12,
                            }}
                          >
                            <button
                              onClick={() => {
                                try {
                                  const info =
                                    computeInstallmentCashDue(booking);
                                  if (info?.canPay)
                                    setCashPayment(
                                      String(asNum(info.amountYetToPay)),
                                    );
                                  else setCashPayment("");
                                  setCashPaymentPopup(true);
                                } catch (err) {
                                  console.error(err);
                                  setCashPaymentPopup(true);
                                }
                              }}
                              style={{
                                padding: "6px 16px",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#fff",
                                backgroundColor: "#000",
                                border: "1px solid #000",
                                borderRadius: 6,
                                cursor: "pointer",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                              }}
                            >
                              Pay via Cash
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {booking?.bookingDetails?.priceUpdateRequestedToAdmin && (
                    <AmountChangeCard
                      booking={booking?.bookingDetails}
                      bookingId={booking?._id}
                      fetchBooking={fetchBooking}
                    />
                  )}
                </div>
              </div>

              {/* Service Details */}
              <div className="card p-3 mb-3" style={{ borderRadius: 8 }}>
                <h6 className="fw-bold mb-2" style={{ fontSize: 14 }}>
                  {booking?.service?.[0]?.category === "Deep Cleaning"
                    ? "Deep Cleaning Packages"
                    : "Service Details"}
                </h6>

                {Array.isArray(booking?.service) &&
                booking.service.length > 0 ? (
                  booking.service.map((s, index) => (
                    <div
                      key={index}
                      className="d-flex justify-content-between border-bottom pb-2 mb-2"
                      style={{ fontSize: 13 }}
                    >
                      <div>
                        <p className="mb-1 fw-semibold">• {s.serviceName}</p>
                        {s.subCategory && (
                          <p
                            className="text-muted mb-0"
                            style={{ fontSize: 12 }}
                          >
                            {s.subCategory}
                          </p>
                        )}
                      </div>

                      {booking?.bookingDetails?.serviceType ===
                        "deep_cleaning" && (
                        <div className="fw-bold text-end">
                          ₹{asNum(s.price ?? 0).toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted" style={{ fontSize: 12 }}>
                    No services found
                  </p>
                )}
              </div>

              {/* Form Details */}
              <div className="card mb-3" style={{ borderRadius: 8 }}>
                <div className="card-body">
                  <h6 className="fw-bold" style={{ fontSize: 14 }}>
                    Form Details
                  </h6>
                  <p style={{ fontSize: 13, margin: "4px 0" }}>
                    <span className="text-muted">Form Name:</span>{" "}
                    <strong>{booking?.formName || "—"}</strong>
                  </p>
                  <p style={{ fontSize: 13, margin: 0 }}>
                    <span className="text-muted">
                      Form Filling Date &amp; Time:
                    </span>{" "}
                    <strong>
                      {createdOn.d} : {createdOn.t}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Actions */}
              {!isProjectCompleted && (
                <div
                  className="d-flex align-items-center gap-2"
                  style={{ marginTop: 8 }}
                >
                  {canChangeVendor && (
                    <select
                      className="form-select"
                      style={{ width: 200, borderRadius: 8, fontSize: "12px" }}
                      value={selectedVendor}
                      onChange={handleVendorChange}
                    >
                      <option value="">Change Vendor</option>
                      {vendorsLoading && (
                        <option disabled>Loading vendors...</option>
                      )}
                      {vendorsError && <option disabled>{vendorsError}</option>}
                      {vendors.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.vendor.vendorName}
                        </option>
                      ))}
                    </select>
                  )}

                  {canReschedule && (
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ borderRadius: 8, fontSize: "12px" }}
                      onClick={() => setShowRescheduleModal(true)}
                    >
                      Reschedule
                    </button>
                  )}

                  {!isCancelled && (
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ borderRadius: 8, fontSize: "12px" }}
                      onClick={() => setShowEditModal(true)}
                    >
                      Edit
                    </button>
                  )}

                  {!isrefundAmount && (
                    <button
                      className="btn btn-sm btn-danger"
                      style={{ borderRadius: 8, fontSize: "12px" }}
                      onClick={() => setShowCancelPopup(true)}
                    >
                      Cancel Lead
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Vendor Assign */}
            <div className="col-md-5">
              <div
                className="card"
                style={{
                  borderRadius: 8,
                  minHeight: 280,
                  border: isTeamMismatch
                    ? "2px solid #dc3545"
                    : "1px solid #e0e0e0",
                  boxShadow: isTeamMismatch
                    ? "0 0 0 3px rgba(220,53,69,0.15)"
                    : "none",
                }}
              >
                <div className="card-body text-center">
                  <h6
                    className="fw-bold"
                    style={{ fontSize: 14, textAlign: "left" }}
                  >
                    Vendor Assign
                  </h6>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      paddingTop: 8,
                    }}
                  >
                    <img
                      src={
                        assigned?.profileImage ||
                        assigned?.vendor?.profileImage ||
                        vendorImg
                      }
                      alt="Vendor"
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                    <p style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>
                      {assigned?.name ||
                        assigned?.vendor?.vendorName ||
                        "Unassigned"}
                    </p>
                  </div>

                  <div style={{ textAlign: "left", marginTop: 12 }}>
                    <p className="mb-1" style={{ fontSize: 13 }}>
                      <span className="text-muted">Vendor Received:</span>{" "}
                      <strong>
                        {booking?.createdDate
                          ? new Date(booking.createdDate)
                              .toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                              .replace(",", "")
                          : "N/A"}
                      </strong>
                    </p>
                    <p className="mb-1" style={{ fontSize: 13 }}>
                      <span className="text-muted">Vendor Responded:</span>{" "}
                      <strong>
                        {assigned?.acceptedDate
                          ? new Date(assigned.acceptedDate)
                              .toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                              .replace(",", "")
                          : "N/A"}
                      </strong>
                    </p>
                  </div>

                  {isTeamMismatch && (
                    <div
                      style={{
                        background: "#fdecea",
                        color: "#b02a37",
                        border: "1px solid #f5c2c7",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        marginTop: 10,
                        marginBottom: 8,
                        textAlign: "left",
                      }}
                    >
                      ⚠ Assigned vendor does not have enough team members for
                      this job.
                      <br />
                      Please change the vendor to continue.
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 10,
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: "#f8f9fa",
                      border: "1px dashed #dee2e6",
                    }}
                  >
                    <p style={{ fontSize: 12, marginBottom: 4 }}>
                      <span className="text-muted">Required Team Members:</span>{" "}
                      <strong>{maxRequiredTeamMembers}</strong>
                    </p>

                    <p style={{ fontSize: 12, marginBottom: 0 }}>
                      <span className="text-muted">Vendor Team Available:</span>{" "}
                      <strong
                        style={{
                          color:
                            vendorTeamCount >= maxRequiredTeamMembers
                              ? "#28a745"
                              : "#dc3545",
                        }}
                      >
                        {vendorTeamCount}
                      </strong>
                    </p>
                  </div>

                  <p />
                </div>
              </div>
            </div>
          </div>

          {/* Cash Payment Popup */}
          {cashPaymentPopup && (
            <div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
              style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
            >
              <div
                className="bg-white p-4 rounded shadow"
                style={{ width: "380px" }}
              >
                <h6 className="fw-bold mb-2">Pay via Cash</h6>

                <div
                  style={{
                    background: "#f8f9fa",
                    border: "1px solid #e9ecef",
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}
                  >
                    {installmentInfo?.installmentLabel || "Payment"}
                  </div>

                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <span className="text-muted">Requested Amount:</span>{" "}
                    <strong>
                      ₹
                      {asNum(installmentInfo?.requestedAmount).toLocaleString(
                        "en-IN",
                      )}
                    </strong>
                  </div>

                  <div style={{ fontSize: 13 }}>
                    <span className="text-muted">
                      Amount Yet To Pay (This Installment):
                    </span>{" "}
                    <strong style={{ color: "#dc3545" }}>
                      ₹{installmentDue.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                {/* ✅ NEW: wait message + clamp input */}
                {installmentInfo?.canPay ? (
                  <>
                    <label className="form-label">
                      Amount (Max: ₹{installmentDue.toLocaleString("en-IN")})
                    </label>

                    <input
                      type="number"
                      className="form-control mb-2"
                      value={cashPayment}
                      min={1}
                      max={installmentDue}
                      onChange={(e) => {
                        try {
                          if (e.target.value === "") {
                            setCashPayment("");
                            return;
                          }
                          const v = Number(e.target.value);
                          const safe = !Number.isFinite(v)
                            ? ""
                            : Math.min(Math.max(v, 1), installmentDue);
                          setCashPayment(String(safe));
                        } catch (err) {
                          console.error("cash input change error:", err);
                        }
                      }}
                    />

                    <small className="text-muted">
                      You can pay partially, but not more than the remaining
                      amount for this installment.
                    </small>
                  </>
                ) : (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#fff3cd",
                      border: "1px solid #ffe69c",
                      color: "#856404",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {installmentInfo?.message || "Wait for payment request."}
                  </div>
                )}

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setCashPaymentPopup(false);
                      setCashPayment("");
                    }}
                  >
                    Close
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleCashPayment}
                    disabled={!installmentInfo?.canPay || !(installmentDue > 0)}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Popup */}
          {showCancelPopup && (
            <div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
              style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
            >
              <div
                className="bg-white p-4 rounded shadow"
                style={{ width: "350px" }}
              >
                <h6 className="fw-bold mb-3">Cancel Lead</h6>

                <p>Amount to refund : {paidAmount}</p>
                <label className="form-label">Refund Amount</label>
                <input
                  type="number"
                  className="form-control mb-3"
                  placeholder="Enter Refund Amount"
                  value={refundAmount}
                  max={paidAmount}
                  min={0}
                  onChange={(e) => {
                    try {
                      const value = Number(e.target.value);
                      if (value <= paidAmount) setRefundAmount(value);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                />

                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowCancelPopup(false)}
                  >
                    Close
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleCancelBooking}
                  >
                    Save & Cancel Booking
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && booking && (
            <EditLeadModal
              show={showEditModal}
              onClose={() => setShowEditModal(false)}
              booking={booking}
              onUpdated={(updatedBooking) => {
                setBooking((prev) => ({ ...prev, ...(updatedBooking || {}) }));
              }}
              title="Edit Lead"
            />
          )}

          {/* Reschedule Modal */}
          {showRescheduleModal && booking && (
            <RescheduleTimePickerModal
              booking={booking}
              onClose={() => setShowRescheduleModal(false)}
              onRescheduled={async (sel) => {
                try {
                  setBooking((prev) => ({
                    ...prev,
                    selectedSlot: {
                      ...(prev?.selectedSlot || {}),
                      slotDate: sel.slotDate,
                      slotTime: sel.slotTime,
                    },
                  }));
                  await fetchBooking();
                } catch (err) {
                  console.error("Post-reschedule refresh error:", err);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OngoingLeadDetails;

// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import vendorImg from "../assets/vendor3.png";
// import { FaPhone, FaMapMarkerAlt, FaCopy, FaArrowLeft } from "react-icons/fa";
// import { Button } from "react-bootstrap";
// import { BASE_URL } from "../utils/config";
// import EditLeadModal from "./EditLeadModal";
// import RescheduleTimePickerModal from "./RescheduleTimePickerModal"; // ✅ NEW

// const getStatusColor = (status) => {
//   if (!status) return "#6c757d";
//   const s = status.toLowerCase();

//   if (s === "pending") return "#6c757d";
//   if (s === "confirmed") return "#0d6efd";
//   if (s === "job ongoing") return "#0d6efd";
//   if (s === "survey ongoing") return "#0d6efd";
//   if (s === "survey completed") return "#6f42c1";
//   if (s === "job completed") return "#28a745";

//   if (s === "customer cancelled") return "#dc3545";
//   if (s === "cancelled") return "#dc3545";
//   if (s === "admin cancelled") return "#b02a37";
//   if (s === "cancelled rescheduled") return "#b02a37";

//   if (s === "rescheduled") return "#6f42c1";

//   if (s === "customer unreachable") return "#fd7e14";
//   if (s === "pending hiring") return "#fd7e14";
//   if (s === "waiting for final payment") return "#fd7e14";

//   if (s === "hired") return "#0056b3";
//   if (s === "project ongoing") return "#0d6efd";
//   if (s === "project completed") return "#28a745";

//   if (s === "negotiation") return "#6610f2";
//   if (s === "set remainder") return "#20c997";

//   return "#6c757d";
// };

// const RESCHEDULE_ALLOWED_STATUSES = ["pending", "confirmed", "rescheduled"];

// const OngoingLeadDetails = () => {
//   const { bookingId } = useParams();
//   const navigate = useNavigate();

//   const [booking, setBooking] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [vendors, setVendors] = useState([]);
//   const [vendorsLoading, setVendorsLoading] = useState(false);
//   const [vendorsError, setVendorsError] = useState(null);

//   const [selectedVendor, setSelectedVendor] = useState("");
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showCancelPopup, setShowCancelPopup] = useState(false);

//   const [cashPaymentPopup, setCashPaymentPopup] = useState(false);
//   const [refundAmount, setRefundAmount] = useState("");
//   const [cashPayment, setCashPayment] = useState("");

//   const [showRescheduleModal, setShowRescheduleModal] = useState(false);

//   const [paymentDetails, setPaymentDetails] = useState({
//     totalAmount: 0,
//     amountPaid: 0,
//     paymentId: "",
//   });

//   const [assignedVendorDetails, setAssignedVendorDetails] = useState(null);
//   const [vendorTeamCount, setVendorTeamCount] = useState(0);

//   // -----------------------------
//   // Helpers
//   // -----------------------------
//   const asNum = (v) => {
//     const n = Number(v);
//     return Number.isFinite(n) ? n : 0;
//   };

//   const formatIST = (isoLike) => {
//     if (!isoLike) return { d: "N/A", t: "N/A" };
//     const d = new Date(isoLike);
//     if (isNaN(d.getTime())) return { d: "N/A", t: "N/A" };
//     return {
//       d: d.toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//         timeZone: "Asia/Kolkata",
//       }),
//       t: d.toLocaleTimeString("en-IN", {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//         timeZone: "Asia/Kolkata",
//       }),
//     };
//   };

//   const normStatus = (s) =>
//     String(s || "")
//       .toLowerCase()
//       .trim();

//   const getRemaining = (p) => asNum(p?.remaining ?? p?.remaning ?? 0);
//   const getRequested = (p) => asNum(p?.requestedAmount ?? 0);

//   // -----------------------------
//   // ✅ FIXED installment calculator
//   // -----------------------------
//   const computeInstallmentCashDue = (booking) => {
//     try {
//       const d = booking?.bookingDetails || {};
//       const serviceType = booking?.serviceType;

//       const first = d.firstPayment || {};
//       const second = d.secondPayment || {};
//       const finalP = d.finalPayment || {};

//       const sequence =
//         serviceType === "deep_cleaning"
//           ? [
//               { key: "firstPayment", label: "First Payment", obj: first },
//               { key: "finalPayment", label: "Final Payment", obj: finalP },
//             ]
//           : [
//               { key: "firstPayment", label: "First Payment", obj: first },
//               { key: "secondPayment", label: "Second Payment", obj: second },
//               { key: "finalPayment", label: "Final Payment", obj: finalP },
//             ];

//       for (const item of sequence) {
//         const status = normStatus(item.obj?.status);
//         const requested = getRequested(item.obj);
//         const remaining = getRemaining(item.obj);

//         // already paid => next
//         if (status === "paid") continue;

//         // this is the installment we must pay now (earlier must finish first)
//         if (status === "pending") {
//           if (requested > 0) {
//             return {
//               installmentKey: item.key,
//               installmentLabel: item.label,
//               requestedAmount: requested,
//               amountYetToPay: requested,
//               canPay: true,
//               message: "",
//             };
//           }
//           return {
//             installmentKey: item.key,
//             installmentLabel: item.label,
//             requestedAmount: 0,
//             amountYetToPay: 0,
//             canPay: false,
//             message: `Wait for payment request for ${item.label}`,
//           };
//         }

//         if (status === "partial") {
//           if (remaining > 0) {
//             return {
//               installmentKey: item.key,
//               installmentLabel: item.label,
//               requestedAmount: requested,
//               amountYetToPay: remaining,
//               canPay: true,
//               message: "",
//             };
//           }
//           return {
//             installmentKey: item.key,
//             installmentLabel: item.label,
//             requestedAmount: requested,
//             amountYetToPay: 0,
//             canPay: false,
//             message: `Wait for payment request for ${item.label}`,
//           };
//         }

//         // other / unknown status
//         if (requested > 0) {
//           return {
//             installmentKey: item.key,
//             installmentLabel: item.label,
//             requestedAmount: requested,
//             amountYetToPay: requested,
//             canPay: true,
//             message: "",
//           };
//         }

//         return {
//           installmentKey: item.key,
//           installmentLabel: item.label,
//           requestedAmount: 0,
//           amountYetToPay: 0,
//           canPay: false,
//           message: `Wait for payment request for ${item.label}`,
//         };
//       }

//       // all paid
//       return {
//         installmentKey: "",
//         installmentLabel: "Payment",
//         requestedAmount: 0,
//         amountYetToPay: 0,
//         canPay: false,
//         message: "All installments are already paid.",
//       };
//     } catch (err) {
//       console.error("computeInstallmentCashDue error:", err);
//       return {
//         installmentKey: "",
//         installmentLabel: "Payment",
//         requestedAmount: 0,
//         amountYetToPay: 0,
//         canPay: false,
//         message: "Unable to compute installment due.",
//       };
//     }
//   };

//   // -----------------------------
//   // Derived states
//   // -----------------------------
//   const maxRequiredTeamMembers = Array.isArray(booking?.service)
//     ? Math.max(
//         ...booking.service.map((s) => Number(s.teamMembersRequired || 1))
//       )
//     : 1;

//   const isCancelled = booking?.bookingDetails?.status?.includes("Cancelled");
//   const paidAmount = booking?.bookingDetails?.paidAmount ?? 0;
//   const isrefundAmount = booking?.bookingDetails?.refundAmount > 0;

//   const totalAmount = booking?.bookingDetails?.finalTotal;
//   const fullamountYetToPay = booking?.bookingDetails?.amountYetToPay;

//   const canChangeVendor =
//     !isCancelled &&
//     booking?.assignedProfessional &&
//     booking?.assignedProfessional?.acceptedDate;

//   const bookingStatus =
//     booking?.bookingDetails?.status || booking?.status || "";
//   const canReschedule =
//     !isCancelled &&
//     RESCHEDULE_ALLOWED_STATUSES.includes(bookingStatus.toLowerCase());

//   const isTeamMismatch =
//     vendorTeamCount > 0 && vendorTeamCount < maxRequiredTeamMembers;

//   const installmentInfo = computeInstallmentCashDue(booking);
//   const installmentDue = asNum(installmentInfo?.amountYetToPay);

//   // const shouldShowPayViaCash =
//   //   asNum(fullamountYetToPay) > 0 &&
//   //   asNum(totalAmount) > 0 &&
//   //   installmentInfo?.canPay === true &&
//   //   installmentDue > 0;
//   const shouldShowPayViaCash =
//     asNum(fullamountYetToPay) > 0 &&
//     asNum(totalAmount) > 0
//     // installmentInfo?.canPay === true &&
//     // installmentDue > 0;

//   // -----------------------------
//   // Fetch booking
//   // -----------------------------
//   const fetchBooking = async () => {
//     if (!bookingId) {
//       setError("Missing booking id");
//       setLoading(false);
//       return;
//     }
//     try {
//       setLoading(true);
//       setError(null);

//       const res = await fetch(
//         `${BASE_URL}/bookings/get-bookings-by-bookingid/${bookingId}`
//       );
//       if (!res.ok) {
//         throw new Error(`Booking API error: ${res.status} ${res.statusText}`);
//       }
//       const payload = await res.json();
//       const normalized = payload.booking ? payload.booking : payload;

//       setBooking(normalized);

//       const paid = normalized?.bookingDetails?.paidAmount ?? 0;
//       const total =
//         normalized?.bookingDetails?.bookingAmount ??
//         normalized?.bookingDetails?.originalTotalAmount ??
//         0;

//       setPaymentDetails({
//         totalAmount: total,
//         amountPaid: paid,
//         paymentId: normalized?.bookingDetails?.otp
//           ? String(normalized.bookingDetails.otp)
//           : normalized?.bookingDetails?.paymentLink?.providerRef || "N/A",
//       });
//     } catch (err) {
//       console.error("Booking fetch error:", err);
//       setError(err.message || "Failed to fetch booking");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const load = async () => {
//       await fetchBooking();
//     };
//     load();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [bookingId]);

//   // -----------------------------
//   // Fetch vendors
//   // -----------------------------
//   const fetchAvailableVendors = async () => {
//     try {
//       setVendorsLoading(true);
//       setVendorsError(null);

//       const lat = booking?.address?.location?.coordinates?.[1];
//       const lng = booking?.address?.location?.coordinates?.[0];

//       if (!lat || !lng) throw new Error("Booking location not available");

//       const payload = {
//         lat,
//         lng,
//         slotDate: booking?.selectedSlot?.slotDate,
//         slotTime: booking?.selectedSlot?.slotTime,
//         serviceType: booking?.serviceType,
//       };

//       if (booking?.serviceType === "deep_cleaning") {
//         payload.requiredTeamMembers = booking?.service?.reduce(
//           (max, s) => Math.max(max, s.teamMembers || 1),
//           1
//         );
//       }

//       const res = await fetch(`${BASE_URL}/vendor/get-available-vendor`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) throw new Error(`Vendor API error: ${res.status}`);

//       const data = await res.json();
//       setVendors(data.data || []);
//     } catch (err) {
//       console.error("Available vendor fetch error:", err);
//       setVendorsError(err.message);
//       setVendors([]);
//     } finally {
//       setVendorsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (booking) fetchAvailableVendors();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [booking]);

//   // -----------------------------
//   // Fetch assigned vendor details
//   // -----------------------------
//   useEffect(() => {
//     const fetchAssignedVendor = async () => {
//       try {
//         const vendorId = booking?.assignedProfessional?.professionalId;
//         if (!vendorId) return;

//         const res = await fetch(
//           `${BASE_URL}/vendor/get-vendor-by-vendorId/${vendorId}`
//         );
//         if (!res.ok) throw new Error("Failed to fetch vendor");

//         const data = await res.json();
//         setAssignedVendorDetails(data.vendor);

//         const teamCount = Array.isArray(data.vendor?.team)
//           ? data.vendor.team.length
//           : 0;
//         setVendorTeamCount(teamCount + 1); // +1 main vendor
//       } catch (err) {
//         console.error("Vendor fetch error:", err);
//         setAssignedVendorDetails(null);
//         setVendorTeamCount(0);
//       }
//     };

//     fetchAssignedVendor();
//   }, [booking]);

//   // -----------------------------
//   // Handlers
//   // -----------------------------
//   const handleOpenMaps = () => {
//     try {
//       const lat =
//         booking?.address?.location?.coordinates?.[1] ??
//         booking?.address?.location?.coordinates?.[0];
//       const lng =
//         booking?.address?.location?.coordinates?.[0] ??
//         booking?.address?.location?.coordinates?.[1];

//       if (lat && lng) {
//         window.open(
//           `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
//           "_blank"
//         );
//         return;
//       }

//       if (booking?.address?.streetArea || booking?.address?.city) {
//         const q = `${booking.address.streetArea || ""} ${
//           booking.address.city || ""
//         }`.trim();
//         window.open(
//           `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
//             q
//           )}`,
//           "_blank"
//         );
//         return;
//       }

//       alert("No valid location available for directions.");
//     } catch (err) {
//       console.error("Directions failed", err);
//       alert("Failed to open directions");
//     }
//   };

//   const handleCall = () => {
//     const phone = booking?.customer?.phone;
//     if (phone) window.location.href = `tel:${phone}`;
//     else alert("No phone number available");
//   };

//   const handleVendorChange = async () => {
//     alert("vendor change");
//   };

//   // ✅ UPDATED Cash Payment handler (installment wise + installmentStage)
//   const handleCashPayment = async () => {
//     try {
//       const info = computeInstallmentCashDue(booking);
//       const due = asNum(info?.amountYetToPay);

//       if (!info?.canPay || !(due > 0)) {
//         alert(info?.message || "No payable installment amount found.");
//         return;
//       }

//       const payNow = asNum(cashPayment);

//       if (!(payNow > 0)) {
//         alert("Please enter a valid amount.");
//         return;
//       }

//       if (payNow > due) {
//         alert(`Amount cannot be more than ₹${due}`);
//         return;
//       }

//       // ✅ isAdditionalAmount = true ONLY when:
//       // secondPayment.amount == secondPayment.requestedAmount AND status == paid
//       const secondPayment = booking?.bookingDetails?.secondPayment || {};
//       const isAdditionalAmount =
//         asNum(secondPayment?.amount) ===
//           asNum(secondPayment?.requestedAmount) &&
//         normStatus(secondPayment?.status) === "paid";

//       // ✅ derive installmentStage from label/key
//       const getInstallmentStage = () => {
//         // 1) if prePayment/additional => ALWAYS final
//         if (isAdditionalAmount) return "final";

//         // 2) otherwise based on current installment
//         const key = String(info?.installmentKey || "").toLowerCase();
//         const label = String(info?.installmentLabel || "").toLowerCase();

//         // prefer key match (more reliable)
//         if (key.includes("first")) return "first";
//         if (key.includes("second")) return "second";
//         if (key.includes("final")) return "final";

//         // fallback to label match
//         if (label.includes("first")) return "first";
//         if (label.includes("second")) return "second";
//         if (label.includes("final")) return "final";

//         // // safe fallback
//         // return "first";
//       };

//       const installmentStage = getInstallmentStage();

//       const payload = {
//         bookingId,
//         paymentMethod: "Cash",
//         paidAmount: payNow,
//         isAdditionalAmount, // ✅ true => prePayment
//         installmentStage, // ✅ REQUIRED now
//       };

//       const res = await fetch(
//         `${BASE_URL}/bookings/update-manual-payment/cash/admin`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );

//       const data = await res.json();
//       if (!res.ok) {
//         throw new Error(data?.message || "Cash payment failed");
//       }

//       alert("Cash payment recorded successfully");

//       setCashPayment("");
//       setCashPaymentPopup(false);

//       await fetchBooking();
//     } catch (err) {
//       console.error("Cash payment error:", err);
//       alert(err.message || "Failed to record cash payment");
//     }
//   };

//   // TODO: you referenced handleCancelBooking in your code; keep your existing function.
//   const handleCancelBooking = async () => {
//     try {
//       alert(
//         "Please paste your existing handleCancelBooking logic here (not included in your snippet)."
//       );
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // -----------------------------
//   // UI states
//   // -----------------------------
//   if (loading) {
//     return (
//       <div
//         style={{
//           height: "80vh",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           flexDirection: "column",
//         }}
//       >
//         <div className="loader-dots">
//           <span></span>
//           <span></span>
//           <span></span>
//         </div>
//         <p className="mt-3 text-muted">Loading booking details...</p>

//         <style>{`
//         .loader-dots span {
//           width: 10px;
//           height: 10px;
//           margin: 0 4px;
//           background: #DC3545;
//           border-radius: 50%;
//           display: inline-block;
//           animation: pulse 1s infinite alternate;
//         }

//         .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
//         .loader-dots span:nth-child(3) { animation-delay: 0.4s; }

//         @keyframes pulse {
//           0% { transform: scale(1); opacity: 0.5; }
//           100% { transform: scale(1.6); opacity: 1; }
//         }
//       `}</style>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ padding: 20 }}>
//         <p style={{ color: "red" }}>Error: {error}</p>
//         <Button variant="secondary" onClick={() => window.location.reload()}>
//           Retry
//         </Button>
//       </div>
//     );
//   }

//   const assigned = booking?.assignedProfessional;

//   const addressStr = booking?.address
//     ? `${booking.address.houseFlatNumber || ""}${
//         booking.address.streetArea ? ", " + booking.address.streetArea : ""
//       }`
//     : "N/A";

//   const formCreated =
//     booking?.createdDate || booking?.bookingDetails?.bookingDate || null;
//   const createdOn = formatIST(formCreated);

//   const bookingSlotDate = booking?.selectedSlot?.slotDate;
//   const bookingSlotTime =
//     booking?.selectedSlot?.slotTime || booking?.bookingDetails?.bookingTime;

//   const normalizedStatus = (
//     booking?.bookingDetails?.status || ""
//   ).toLowerCase();
//   const isProjectCompleted = normalizedStatus === "project completed";

//   return (
//     <div style={{ paddingInline: 10, fontFamily: "'Poppins', sans-serif" }}>
//       <Button
//         variant="light"
//         className="mb-1"
//         size="sm"
//         onClick={() => navigate(-1)}
//       >
//         <FaArrowLeft /> Back
//       </Button>

//       <div className="card shadow-sm border-0">
//         <div className="card-body">
//           {/* Status Badge */}
//           {(() => {
//             const status =
//               booking?.bookingDetails?.status || booking?.status || "Pending";
//             return (
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "flex-end",
//                   width: "100%",
//                   marginBottom: 20,
//                 }}
//               >
//                 <div
//                   style={{
//                     padding: "10px 18px",
//                     borderRadius: "12px",
//                     backgroundColor: `${getStatusColor(status)}20`,
//                     border: `1px solid ${getStatusColor(status)}`,
//                     color: getStatusColor(status),
//                     fontWeight: 600,
//                     fontSize: "12px",
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "8px",
//                   }}
//                 >
//                   <span
//                     style={{
//                       width: "10px",
//                       height: "10px",
//                       backgroundColor: getStatusColor(status),
//                       borderRadius: "50%",
//                       display: "inline-block",
//                     }}
//                   />
//                   {status}
//                 </div>
//               </div>
//             );
//           })()}

//           {/* Header area */}
//           <div
//             style={{
//               background: "#fff",
//               padding: "16px",
//               borderRadius: 6,
//               boxShadow: "0px 1px 2px rgba(0,0,0,0.06)",
//               marginBottom: 16,
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "flex-start",
//               }}
//             >
//               <div>
//                 <p
//                   style={{ color: "#D44B4B", fontWeight: 700, marginBottom: 6 }}
//                 >
//                   {booking?.service?.[0]?.category || "Unknown Service"}
//                 </p>
//                 <p style={{ fontWeight: 700, margin: 0 }}>
//                   {booking?.customer?.name || "Unknown Customer"}
//                 </p>

//                 <p
//                   style={{
//                     color: "#6c757d",
//                     fontSize: 13,
//                     margin: "6px 0",
//                     width: "900px",
//                   }}
//                 >
//                   <FaMapMarkerAlt className="me-1" /> {addressStr}
//                   <br />
//                   {booking?.address?.landMark && (
//                     <>
//                       <span
//                         style={{
//                           fontWeight: 600,
//                           color: "#363636ff",
//                           paddingLeft: "20px",
//                         }}
//                       >
//                         Landmark:{" "}
//                       </span>
//                       {booking.address.landMark}
//                     </>
//                   )}
//                 </p>

//                 <p style={{ color: "#6c757d", fontSize: 13, margin: 0 }}>
//                   <FaPhone className="me-1" />{" "}
//                   {booking?.customer?.phone || "N/A"}
//                 </p>
//               </div>

//               <div style={{ textAlign: "right" }}>
//                 <div style={{ fontSize: 14 }}>
//                   {bookingSlotDate
//                     ? new Date(bookingSlotDate).toLocaleDateString("en-GB")
//                     : "N/A"}
//                 </div>

//                 <div style={{ fontWeight: 700, marginBottom: 8 }}>
//                   {bookingSlotTime || "N/A"}
//                 </div>

//                 <div
//                   style={{ display: "flex", flexDirection: "column", gap: 8 }}
//                 >
//                   <button
//                     onClick={handleOpenMaps}
//                     className="btn btn-sm btn-danger"
//                     disabled={isCancelled}
//                     style={{ borderRadius: 8, padding: "6px 12px" }}
//                   >
//                     Directions
//                   </button>

//                   <button
//                     onClick={handleCall}
//                     className="btn btn-sm btn-outline-danger"
//                     style={{ borderRadius: 8, padding: "6px 12px" }}
//                     disabled={isCancelled}
//                   >
//                     Call
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Main columns */}
//           <div className="row">
//             <div className="col-md-7">
//               {/* Payment Details */}
//               <div className="card mb-3" style={{ borderRadius: 8 }}>
//                 <div className="card-body">
//                   <h6 className="fw-bold" style={{ fontSize: 14 }}>
//                     Payment Details
//                   </h6>

//                   {(() => {
//                     const d = booking?.bookingDetails || {};
//                     const total =
//                       d.finalTotal ??
//                       d.finalTotalAmount ??
//                       d.originalTotalAmount ??
//                       d.bookingAmount ??
//                       0;

//                     const paid = d.paidAmount ?? 0;
//                     const yet = total > 0 ? d.amountYetToPay : 0;
//                     const siteVisitCharges = d.siteVisitCharges ?? 0;
//                     const paymentMethod =
//                       d.paymentMethod || d.firstPayment?.method || "N/A";
//                     const paymentId =
//                       d.paymentLink?.providerRef || d.otp || "N/A";
//                     const refund = d.refundAmount ?? 0;

//                     const isHousePainting =
//                       booking?.serviceType === "house_painting";

//                     return (
//                       <>
//                         <p
//                           className="fw-semibold text-dark mb-1"
//                           style={{ fontSize: 14 }}
//                         >
//                           Payment Method: {paymentMethod}
//                         </p>

//                         <p style={{ fontSize: 12, marginBottom: 1 }}>
//                           <span className="text-muted">Total Amount:</span>{" "}
//                           <strong>
//                             ₹{asNum(total).toLocaleString("en-IN")}
//                           </strong>
//                         </p>

//                         <p style={{ fontSize: 12, marginBottom: 1 }}>
//                           <span className="text-muted">Amount Paid:</span>{" "}
//                           <strong>
//                             ₹{asNum(paid).toLocaleString("en-IN")}
//                           </strong>
//                         </p>

//                         <p style={{ fontSize: 12, marginBottom: 1 }}>
//                           <span className="text-muted">
//                             Amount Yet to Pay :
//                           </span>{" "}
//                           <strong>₹{asNum(yet).toLocaleString("en-IN")}</strong>
//                         </p>

//                         {isHousePainting && (
//                           <p style={{ fontSize: 12, marginBottom: "1%" }}>
//                             <span className="text-muted">
//                               Site Visit Charges:
//                             </span>{" "}
//                             <strong>
//                               ₹{asNum(siteVisitCharges).toLocaleString("en-IN")}
//                             </strong>
//                           </p>
//                         )}

//                         <p style={{ fontSize: 12 }}>
//                           <span className="text-muted">Payment ID:</span>{" "}
//                           <strong>{paymentId}</strong>
//                           {paymentId !== "N/A" && (
//                             <FaCopy
//                               className="ms-1 text-danger"
//                               style={{ cursor: "pointer" }}
//                               onClick={() =>
//                                 navigator.clipboard.writeText(paymentId)
//                               }
//                             />
//                           )}
//                         </p>

//                         {isCancelled && isrefundAmount && (
//                           <div
//                             style={{
//                               marginTop: 6,
//                               padding: "6px 10px",
//                               borderLeft: "4px solid #dc3545",
//                               backgroundColor: "#fdecea",
//                               borderRadius: 4,
//                             }}
//                           >
//                             <p style={{ fontSize: 12, marginBottom: 2 }}>
//                               <span className="fw-bold text-danger">
//                                 Refund Amount
//                               </span>
//                             </p>
//                             <p
//                               className="fw-bold text-dark mb-0"
//                               style={{ fontSize: 14 }}
//                             >
//                               ₹{asNum(refund).toLocaleString("en-IN")}
//                               <span
//                                 style={{
//                                   fontSize: 11,
//                                   marginLeft: 6,
//                                   color: "#6c757d",
//                                   fontWeight: 500,
//                                 }}
//                               >
//                                 (initiated)
//                               </span>
//                             </p>
//                           </div>
//                         )}

//                         {/* ✅ Pay via Cash */}
//                         {shouldShowPayViaCash && !isProjectCompleted && (
//                           <div
//                             style={{
//                               display: "flex",
//                               justifyContent: "flex-end",
//                               marginTop: 12,
//                             }}
//                           >
//                             <button
//                               onClick={() => {
//                                 try {
//                                   const info =
//                                     computeInstallmentCashDue(booking);
//                                   if (info?.canPay)
//                                     setCashPayment(
//                                       String(asNum(info.amountYetToPay))
//                                     );
//                                   else setCashPayment("");
//                                   setCashPaymentPopup(true);
//                                 } catch (err) {
//                                   console.error(err);
//                                   setCashPaymentPopup(true);
//                                 }
//                               }}
//                               style={{
//                                 padding: "6px 16px",
//                                 fontSize: 13,
//                                 fontWeight: 600,
//                                 color: "#fff",
//                                 backgroundColor: "#000",
//                                 border: "1px solid #000",
//                                 borderRadius: 6,
//                                 cursor: "pointer",
//                                 boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
//                               }}
//                             >
//                               Pay via Cash
//                             </button>
//                           </div>
//                         )}
//                       </>
//                     );
//                   })()}
//                 </div>
//               </div>

//               {/* Service Details */}
//               <div className="card p-3 mb-3" style={{ borderRadius: 8 }}>
//                 <h6 className="fw-bold mb-2" style={{ fontSize: 14 }}>
//                   {booking?.service?.[0]?.category === "Deep Cleaning"
//                     ? "Deep Cleaning Packages"
//                     : "Service Details"}
//                 </h6>

//                 {Array.isArray(booking?.service) &&
//                 booking.service.length > 0 ? (
//                   booking.service.map((s, index) => (
//                     <div
//                       key={index}
//                       className="d-flex justify-content-between border-bottom pb-2 mb-2"
//                       style={{ fontSize: 13 }}
//                     >
//                       <div>
//                         <p className="mb-1 fw-semibold">• {s.serviceName}</p>
//                         {s.subCategory && (
//                           <p
//                             className="text-muted mb-0"
//                             style={{ fontSize: 12 }}
//                           >
//                             {s.subCategory}
//                           </p>
//                         )}
//                       </div>

//                       {booking?.bookingDetails?.serviceType ===
//                         "deep_cleaning" && (
//                         <div className="fw-bold text-end">
//                           ₹{asNum(s.price ?? 0).toLocaleString("en-IN")}
//                         </div>
//                       )}
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-muted" style={{ fontSize: 12 }}>
//                     No services found
//                   </p>
//                 )}
//               </div>

//               {/* Form Details */}
//               <div className="card mb-3" style={{ borderRadius: 8 }}>
//                 <div className="card-body">
//                   <h6 className="fw-bold" style={{ fontSize: 14 }}>
//                     Form Details
//                   </h6>
//                   <p style={{ fontSize: 13, margin: "4px 0" }}>
//                     <span className="text-muted">Form Name:</span>{" "}
//                     <strong>{booking?.formName || "—"}</strong>
//                   </p>
//                   <p style={{ fontSize: 13, margin: 0 }}>
//                     <span className="text-muted">
//                       Form Filling Date &amp; Time:
//                     </span>{" "}
//                     <strong>
//                       {createdOn.d} : {createdOn.t}
//                     </strong>
//                   </p>
//                 </div>
//               </div>

//               {/* Actions */}
//               {!isProjectCompleted && (
//                 <div
//                   className="d-flex align-items-center gap-2"
//                   style={{ marginTop: 8 }}
//                 >
//                   {canChangeVendor && (
//                     <select
//                       className="form-select"
//                       style={{ width: 200, borderRadius: 8, fontSize: "12px" }}
//                       value={selectedVendor}
//                       onChange={handleVendorChange}
//                     >
//                       <option value="">Change Vendor</option>
//                       {vendorsLoading && (
//                         <option disabled>Loading vendors...</option>
//                       )}
//                       {vendorsError && <option disabled>{vendorsError}</option>}
//                       {vendors.map((v) => (
//                         <option key={v._id} value={v._id}>
//                           {v.vendor.vendorName}
//                         </option>
//                       ))}
//                     </select>
//                   )}

//                   {canReschedule && (
//                     <button
//                       className="btn btn-sm btn-secondary"
//                       style={{ borderRadius: 8, fontSize: "12px" }}
//                       onClick={() => setShowRescheduleModal(true)}
//                     >
//                       Reschedule
//                     </button>
//                   )}

//                   {!isCancelled && (
//                     <button
//                       className="btn btn-sm btn-secondary"
//                       style={{ borderRadius: 8, fontSize: "12px" }}
//                       onClick={() => setShowEditModal(true)}
//                     >
//                       Edit
//                     </button>
//                   )}

//                   {!isrefundAmount && (
//                     <button
//                       className="btn btn-sm btn-danger"
//                       style={{ borderRadius: 8, fontSize: "12px" }}
//                       onClick={() => setShowCancelPopup(true)}
//                     >
//                       Cancel Lead
//                     </button>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Vendor Assign */}
//             <div className="col-md-5">
//               <div
//                 className="card"
//                 style={{
//                   borderRadius: 8,
//                   minHeight: 280,
//                   border: isTeamMismatch
//                     ? "2px solid #dc3545"
//                     : "1px solid #e0e0e0",
//                   boxShadow: isTeamMismatch
//                     ? "0 0 0 3px rgba(220,53,69,0.15)"
//                     : "none",
//                 }}
//               >
//                 <div className="card-body text-center">
//                   <h6
//                     className="fw-bold"
//                     style={{ fontSize: 14, textAlign: "left" }}
//                   >
//                     Vendor Assign
//                   </h6>

//                   <div
//                     style={{
//                       display: "flex",
//                       flexDirection: "column",
//                       alignItems: "center",
//                       paddingTop: 8,
//                     }}
//                   >
//                     <img
//                       src={
//                         assigned?.profileImage ||
//                         assigned?.vendor?.profileImage ||
//                         vendorImg
//                       }
//                       alt="Vendor"
//                       style={{
//                         width: 70,
//                         height: 70,
//                         borderRadius: "50%",
//                         objectFit: "cover",
//                       }}
//                     />
//                     <p style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>
//                       {assigned?.name ||
//                         assigned?.vendor?.vendorName ||
//                         "Unassigned"}
//                     </p>
//                   </div>

//                   <div style={{ textAlign: "left", marginTop: 12 }}>
//                     <p className="mb-1" style={{ fontSize: 13 }}>
//                       <span className="text-muted">Vendor Received:</span>{" "}
//                       <strong>
//                         {booking?.createdDate
//                           ? new Date(booking.createdDate)
//                               .toLocaleString("en-GB", {
//                                 day: "2-digit",
//                                 month: "2-digit",
//                                 year: "numeric",
//                                 hour: "2-digit",
//                                 minute: "2-digit",
//                                 hour12: true,
//                               })
//                               .replace(",", "")
//                           : "N/A"}
//                       </strong>
//                     </p>
//                     <p className="mb-1" style={{ fontSize: 13 }}>
//                       <span className="text-muted">Vendor Responded:</span>{" "}
//                       <strong>
//                         {assigned?.acceptedDate
//                           ? new Date(assigned.acceptedDate)
//                               .toLocaleString("en-GB", {
//                                 day: "2-digit",
//                                 month: "2-digit",
//                                 year: "numeric",
//                                 hour: "2-digit",
//                                 minute: "2-digit",
//                                 hour12: true,
//                               })
//                               .replace(",", "")
//                           : "N/A"}
//                       </strong>
//                     </p>
//                   </div>

//                   {isTeamMismatch && (
//                     <div
//                       style={{
//                         background: "#fdecea",
//                         color: "#b02a37",
//                         border: "1px solid #f5c2c7",
//                         borderRadius: 6,
//                         padding: "8px 10px",
//                         fontSize: 12,
//                         fontWeight: 600,
//                         marginTop: 10,
//                         marginBottom: 8,
//                         textAlign: "left",
//                       }}
//                     >
//                       ⚠ Assigned vendor does not have enough team members for
//                       this job.
//                       <br />
//                       Please change the vendor to continue.
//                     </div>
//                   )}

//                   <div
//                     style={{
//                       marginTop: 10,
//                       padding: "8px 10px",
//                       borderRadius: 6,
//                       background: "#f8f9fa",
//                       border: "1px dashed #dee2e6",
//                     }}
//                   >
//                     <p style={{ fontSize: 12, marginBottom: 4 }}>
//                       <span className="text-muted">Required Team Members:</span>{" "}
//                       <strong>{maxRequiredTeamMembers}</strong>
//                     </p>

//                     <p style={{ fontSize: 12, marginBottom: 0 }}>
//                       <span className="text-muted">Vendor Team Available:</span>{" "}
//                       <strong
//                         style={{
//                           color:
//                             vendorTeamCount >= maxRequiredTeamMembers
//                               ? "#28a745"
//                               : "#dc3545",
//                         }}
//                       >
//                         {vendorTeamCount}
//                       </strong>
//                     </p>
//                   </div>

//                   <p />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Cash Payment Popup */}
//           {cashPaymentPopup && (
//             <div
//               className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
//               style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
//             >
//               <div
//                 className="bg-white p-4 rounded shadow"
//                 style={{ width: "380px" }}
//               >
//                 <h6 className="fw-bold mb-2">Pay via Cash</h6>

//                 <div
//                   style={{
//                     background: "#f8f9fa",
//                     border: "1px solid #e9ecef",
//                     borderRadius: 8,
//                     padding: "10px 12px",
//                     marginBottom: 12,
//                   }}
//                 >
//                   <div
//                     style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}
//                   >
//                     {installmentInfo?.installmentLabel || "Payment"}
//                   </div>

//                   <div style={{ fontSize: 13, marginBottom: 4 }}>
//                     <span className="text-muted">Requested Amount:</span>{" "}
//                     <strong>
//                       ₹
//                       {asNum(installmentInfo?.requestedAmount).toLocaleString(
//                         "en-IN"
//                       )}
//                     </strong>
//                   </div>

//                   <div style={{ fontSize: 13 }}>
//                     <span className="text-muted">
//                       Amount Yet To Pay (This Installment):
//                     </span>{" "}
//                     <strong style={{ color: "#dc3545" }}>
//                       ₹{installmentDue.toLocaleString("en-IN")}
//                     </strong>
//                   </div>
//                 </div>

//                 {/* ✅ NEW: wait message + clamp input */}
//                 {installmentInfo?.canPay ? (
//                   <>
//                     <label className="form-label">
//                       Amount (Max: ₹{installmentDue.toLocaleString("en-IN")})
//                     </label>

//                     <input
//                       type="number"
//                       className="form-control mb-2"
//                       value={cashPayment}
//                       min={1}
//                       max={installmentDue}
//                       onChange={(e) => {
//                         try {
//                           if (e.target.value === "") {
//                             setCashPayment("");
//                             return;
//                           }
//                           const v = Number(e.target.value);
//                           const safe = !Number.isFinite(v)
//                             ? ""
//                             : Math.min(Math.max(v, 1), installmentDue);
//                           setCashPayment(String(safe));
//                         } catch (err) {
//                           console.error("cash input change error:", err);
//                         }
//                       }}
//                     />

//                     <small className="text-muted">
//                       You can pay partially, but not more than the remaining
//                       amount for this installment.
//                     </small>
//                   </>
//                 ) : (
//                   <div
//                     style={{
//                       marginTop: 8,
//                       padding: "10px 12px",
//                       borderRadius: 8,
//                       background: "#fff3cd",
//                       border: "1px solid #ffe69c",
//                       color: "#856404",
//                       fontSize: 13,
//                       fontWeight: 600,
//                     }}
//                   >
//                     {installmentInfo?.message || "Wait for payment request."}
//                   </div>
//                 )}

//                 <div className="d-flex justify-content-end gap-2 mt-3">
//                   <button
//                     className="btn btn-sm btn-secondary"
//                     onClick={() => {
//                       setCashPaymentPopup(false);
//                       setCashPayment("");
//                     }}
//                   >
//                     Close
//                   </button>

//                   <button
//                     className="btn btn-danger btn-sm"
//                     onClick={handleCashPayment}
//                     disabled={!installmentInfo?.canPay || !(installmentDue > 0)}
//                   >
//                     Submit
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Cancel Popup */}
//           {showCancelPopup && (
//             <div
//               className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
//               style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
//             >
//               <div
//                 className="bg-white p-4 rounded shadow"
//                 style={{ width: "350px" }}
//               >
//                 <h6 className="fw-bold mb-3">Cancel Lead</h6>

//                 <p>Amount to refund : {paidAmount}</p>
//                 <label className="form-label">Refund Amount</label>
//                 <input
//                   type="number"
//                   className="form-control mb-3"
//                   placeholder="Enter Refund Amount"
//                   value={refundAmount}
//                   max={paidAmount}
//                   min={0}
//                   onChange={(e) => {
//                     try {
//                       const value = Number(e.target.value);
//                       if (value <= paidAmount) setRefundAmount(value);
//                     } catch (err) {
//                       console.error(err);
//                     }
//                   }}
//                 />

//                 <div className="d-flex justify-content-end gap-2">
//                   <button
//                     className="btn btn-sm btn-secondary"
//                     onClick={() => setShowCancelPopup(false)}
//                   >
//                     Close
//                   </button>

//                   <button
//                     className="btn btn-danger btn-sm"
//                     onClick={handleCancelBooking}
//                   >
//                     Save & Cancel Booking
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Edit Modal */}
//           {showEditModal && booking && (
//             <EditLeadModal
//               show={showEditModal}
//               onClose={() => setShowEditModal(false)}
//               booking={booking}
//               onUpdated={(updatedBooking) => {
//                 setBooking((prev) => ({ ...prev, ...(updatedBooking || {}) }));
//               }}
//               title="Edit Lead"
//             />
//           )}

//           {/* Reschedule Modal */}
//           {showRescheduleModal && booking && (
//             <RescheduleTimePickerModal
//               booking={booking}
//               onClose={() => setShowRescheduleModal(false)}
//               onRescheduled={async (sel) => {
//                 try {
//                   setBooking((prev) => ({
//                     ...prev,
//                     selectedSlot: {
//                       ...(prev?.selectedSlot || {}),
//                       slotDate: sel.slotDate,
//                       slotTime: sel.slotTime,
//                     },
//                   }));
//                   await fetchBooking();
//                 } catch (err) {
//                   console.error("Post-reschedule refresh error:", err);
//                 }
//               }}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OngoingLeadDetails;
