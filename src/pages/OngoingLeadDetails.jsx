import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import vendorImg from "../assets/vendor3.png";
import {
  FaChevronRight,
  FaChevronDown,
  FaPhone,
  FaMapMarkerAlt,
  FaEdit,
  FaCopy,
  FaArrowLeft,
} from "react-icons/fa";
import { Button } from "react-bootstrap";
import FinalizeQuoteModal from "./FinalizeQuoteModal";
import { BASE_URL } from "../utils/config";
import EditLeadModal from "./EditLeadModal";

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

  if (s === "customer unreachable") return "#fd7e14";
  if (s === "pending hiring") return "#fd7e14";
  if (s === "waiting for final payment") return "#fd7e14";

  if (s === "hired") return "#0056b3";
  if (s === "project ongoing") return "#0d6efd";
  if (s === "project completed") return "#28a745";

  if (s === "negotiation") return "#6610f2";
  if (s === "set remainder") return "#20c997";

  return "#6c757d"; // default fallback
};

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
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");

  const [paymentDetails, setPaymentDetails] = useState({
    totalAmount: 0,
    amountPaid: 0,
    paymentId: "",
  });

  // Expand states (if any)
  const [expandedMeasurements, setExpandedMeasurements] = useState({});
  const [expandedQuotations, setExpandedQuotations] = useState({});

  // STATUS OPTIONS (as requested)
  const STATUS_OPTIONS = [
    "Confirmed", //accepted or responded
    "Job Ongoing", // started - deep cleaning
    "Survey Ongoing", //started - house painting
    "Survey Completed", //ended - house painting
    "Job Completed", //ended - deep cleaning
    "Customer Cancelled", // from the vendor app
    "Cancelled", // from the website by customer themself
    "Customer Unreachable",
    "Admin Cancelled",
    "Pending Hiring", // mark hiring
    "Hired", // first payment done
    "Project Ongoing", // project started house painting
    "Waiting for final payment",
    "Project Completed", // project completed
    "Negotiation",
    "Set Remainder",
  ];

  // format date/time to IST and desired display
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

  // fetch booking by bookingId
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError("Missing booking id");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // Use provided API
        const res = await fetch(
          `${BASE_URL}/bookings/get-bookings-by-bookingid/${bookingId}`
        );
        if (!res.ok)
          throw new Error(`Booking API error: ${res.status} ${res.statusText}`);
        const payload = await res.json();

        // If API returns booking object in payload.booking or booking
        const bookingData =
          payload.booking || payload.bookingData || payload || null;

        // If your API returns top-level booking object as payload.booking (per your sample), use that
        const normalized = payload.booking ? payload.booking : payload;

        setBooking(normalized);
        // set payment details so UI shows values
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

    fetchBooking();
  }, [bookingId]);

  // fetch vendors list
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setVendorsLoading(true);
        setVendorsError(null);
        const res = await fetch(`${BASE_URL}/vendor/get-all-vendor`);
        if (!res.ok) throw new Error(`Vendor API error: ${res.status}`);
        const data = await res.json();
        setVendors(data?.vendor || []);
      } catch (err) {
        console.error("Vendor fetch error:", err);
        setVendorsError(err.message || "Failed to load vendors");
        setVendors([]);
      } finally {
        setVendorsLoading(false);
      }
    };

    fetchVendors();
  }, []);

  // Handlers
  const handleBack = () => navigate("/ongoing-leads"); // go back to list (adjust route as needed)

  const handleOpenMaps = () => {
    try {
      const lat =
        booking?.address?.location?.coordinates?.[1] ??
        booking?.address?.location?.coordinates?.[0]; // sometimes lat/lng order differs
      const lng =
        booking?.address?.location?.coordinates?.[0] ??
        booking?.address?.location?.coordinates?.[1];
      if (lat && lng) {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(mapsUrl, "_blank");
        return;
      } else if (booking?.address?.streetArea || booking?.address?.city) {
        const q = `${booking.address.streetArea || ""} ${
          booking.address.city || ""
        }`.trim();
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          q
        )}`;
        window.open(mapsUrl, "_blank");
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

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleVendorChange = async (e) => {
    const value = e.target.value;
    setSelectedVendor(value);
    if (!booking?._id) {
      alert("Booking not loaded");
      return;
    }
    // find vendor object
    const found = vendors.find((v) => v.vendor.vendorName === value);
    if (!found) {
      alert("Vendor not found");
      return;
    }

    try {
      // update assigned professional (PUT) using your backend
      const res = await fetch(
        `${BASE_URL}/bookings/update-assigned-professional/${booking._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            professionalId: found._id,
            name: found.vendor.vendorName,
            phone: found.vendor.mobileNumber || found.vendor.mobile,
          }),
        }
      );
      if (!res.ok) throw new Error(`Assign vendor failed: ${res.status}`);
      const data = await res.json();
      // update UI
      setBooking((prev) => ({
        ...prev,
        assignedProfessional: {
          ...found,
          name: found.vendor.vendorName,
          phone: found.vendor.mobileNumber || found.vendor.mobile,
          acceptedDate: prev?.assignedProfessional?.acceptedDate ?? null,
          acceptedTime: prev?.assignedProfessional?.acceptedTime ?? null,
        },
      }));
      alert("Vendor assigned successfully");
    } catch (err) {
      console.error("Assign vendor error:", err);
      alert("Failed to assign vendor");
    }
  };

  const formatINR = (n) =>
    typeof n === "number"
      ? n.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        })
      : n;

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

        .loader-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .loader-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

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

  // normalize some fields for easier UI
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
      <div className="card shadow-sm border-0 ">
        <div className="card-body">
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
                    backgroundColor: `${getStatusColor(status)}20`, // soft tint
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
                  ></span>
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
                  {booking.address?.landMark && (
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
                    style={{ borderRadius: 8, padding: "6px 12px" }}
                  >
                    Directions
                  </button>
                  <button
                    onClick={handleCall}
                    className="btn btn-sm btn-outline-danger"
                    style={{ borderRadius: 8, padding: "6px 12px" }}
                  >
                    Call
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main column cards */}
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

                    const totalAmount =
                      d.finalTotal ??
                      d.finalTotalAmount ??
                      d.originalTotalAmount ??
                      d.bookingAmount ??
                      0;

                    const amountPaid = d.paidAmount ?? 0;
                    const amountYetToPay =
                      d.amountYetToPay ?? totalAmount - amountPaid;
                    const siteVisitCharges = d.siteVisitCharges ?? 0;
                    const paymentMethod =
                      d.paymentMethod || d.firstPayment?.method || "N/A";
                    const paymentId =
                      d.paymentLink?.providerRef || d.otp || "N/A";

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
                            ₹{totalAmount.toLocaleString("en-IN")}
                          </strong>
                        </p>

                        <p style={{ fontSize: 12, marginBottom: 1 }}>
                          <span className="text-muted">Amount Paid:</span>{" "}
                          <strong>₹{amountPaid.toLocaleString("en-IN")}</strong>
                        </p>

                        <p style={{ fontSize: 12, marginBottom: 1 }}>
                          <span className="text-muted">Amount Yet to Pay:</span>{" "}
                          <strong>
                            ₹{amountYetToPay.toLocaleString("en-IN")}
                          </strong>
                        </p>

                        {isHousePainting && (
                          <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                            <span className="text-muted">
                              Site Visit Charges:
                            </span>{" "}
                            <strong>
                              ₹{siteVisitCharges.toLocaleString("en-IN")}
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
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Package Details */}
              {/* SERVICE DETAILS (LeadDetails 2-column style) */}
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

                      <div className="fw-bold text-end">
                        ₹{(s.price ?? 0).toLocaleString("en-IN")}
                      </div>
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

              {/* Buttons group (Change Vendor select + actions) - positioned BELOW Form Details as requested */}
              <div
                className="d-flex align-items-center gap-2  "
                style={{ marginTop: 8 }}
              >
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
                  {vendors.filter(Boolean).map((v) => (
                    <option key={v._id} value={v.vendor.vendorName}>
                      {v.vendor.vendorName}
                    </option>
                  ))}
                </select>

                <button
                  className="btn btn-sm btn-secondary"
                  style={{ borderRadius: 8, fontSize: "12px" }}
                  onClick={() => alert("Reschedule clicked (implement)")}
                >
                  Reschedule
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  style={{ borderRadius: 8, fontSize: "12px" }}
                  onClick={() => setShowEditModal(true)}
                >
                  Edit
                </button>

                <button
                  className="btn btn-sm btn-danger"
                  style={{ borderRadius: 8, fontSize: "12px" }}
                  onClick={() => setShowCancelPopup(true)}
                >
                  Cancel Lead
                </button>
              </div>
            </div>

            <div className="col-md-5">
              {/* Vendor Assign Card */}
              <div className="card" style={{ borderRadius: 8, minHeight: 280 }}>
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
                </div>
              </div>
            </div>
          </div>

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

                <label className="form-label">Refund Amount</label>
                <input
                  type="number"
                  className="form-control mb-3"
                  placeholder="Enter Refund Amount"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
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
                    onClick={() => {
                      setShowCancelPopup(false);
                      alert("Submit refund + cancel API here");
                    }}
                  >
                    Save & Cancel Booking
                  </button>
                </div>
              </div>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
};

export default OngoingLeadDetails;
