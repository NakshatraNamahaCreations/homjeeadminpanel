import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaPhone,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { Button, Badge } from "react-bootstrap";
import EditEnquiryModal from "./EditEnquiryModal";
import ReminderModal from "./ReminderModal";
import ConfirmModal from "./ConfirmModal";
import { BASE_URL } from "../utils/config";

const EnquiryDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  const [confirmState, setConfirmState] = useState({
    show: false,
    title: "",
    message: "",
    action: null,
  });

  /* ---------------------------
     Formatting function (common)
     --------------------------- */
  const safeDateFormat = (iso) => {
    try {
      if (!iso) return { d: "N/A", t: "N/A" };
      const dt = new Date(iso);
      if (isNaN(dt.getTime())) return { d: "N/A", t: "N/A" };
      return {
        d: dt.toLocaleDateString("en-IN"),
        t: dt.toLocaleTimeString("en-IN"),
      };
    } catch {
      return { d: "N/A", t: "N/A" };
    }
  };

  const formatBooking = (b) => {
    if (!b) return null;

    // handle both createdDate and createdAt naming
    const createdIso = b.createdDate || b.createdAt || b.bookingDate || null;
    const { d: createdDate, t: createdTime } = safeDateFormat(createdIso);

    const slotDateIso =
      b.selectedSlot?.slotDate || b.bookingDetails?.bookingDate || null;
    const slotDate =
      slotDateIso && slotDateIso !== "Invalid Date"
        ? new Date(slotDateIso).toLocaleDateString("en-IN")
        : b.selectedSlot?.slotDate || "N/A";

    return {
      bookingId: b._id || b.bookingId || b.id || "",
      name: b.customer?.name || b.customerName || "N/A",
      contact: b.customer?.phone
        ? `+91 ${b.customer.phone}`
        : b.customerPhone || "N/A",
      category: (
        [...(b.service || [])].map((s) => s.category).filter(Boolean) || []
      ).length
        ? [...new Set((b.service || []).map((s) => s.category))].join(", ")
        : b.serviceCategory || "N/A",
      date: slotDate,
      time: b.selectedSlot?.slotTime || b.bookingDetails?.bookingTime || "N/A",
      formName: b.formName || b.form || "N/A",
      createdDate,
      createdTime,
      filledData: {
        location: b.address?.streetArea || b.address?.locationName || "N/A",
        houseNumber: b.address?.houseFlatNumber || "",
        landmark: b.address?.landMark || "",
        timeSlot: b.selectedSlot?.slotTime || "",
        serviceType:
          (b.service || [])
            .map((s) => s.serviceName)
            .filter(Boolean)
            .join(", ") ||
          b.serviceType ||
          "",
      },
      googleLocation:
        b.address?.location && Array.isArray(b.address.location.coordinates)
          ? `https://maps.google.com/?q=${b.address.location.coordinates[1]},${b.address.location.coordinates[0]}`
          : "",
      raw: {
        ...b,
        isRead: !!b.isRead,
        isDismmised: !!b.isDismmised,
        isEnquiry:
          typeof b.isEnquiry === "boolean" ? b.isEnquiry : !!b.isEnquiry,
      },
    };
  };

  /* ---------------------------------------------------
     If location.state exists, use it (but normalize it)
     --------------------------------------------------- */
  useEffect(() => {
    if (!location?.state) return;

    // location.state might be already formatted, or may contain booking/raw object
    const state = location.state;
    let bookingCandidate = null;

    // Common possibilities
    if (state.booking) bookingCandidate = state.booking;
    else if (state.data) bookingCandidate = state.data;
    else if (state.raw) bookingCandidate = state.raw;
    else if (state.bookingId && state.raw) bookingCandidate = state.raw;
    else bookingCandidate = state; // fallback: maybe the whole booking was passed

    try {
      const formatted = formatBooking(bookingCandidate);
      if (formatted) {
        setEnquiry(formatted);
        setLoading(false);
      }
    } catch (err) {
      console.error("format from location.state failed:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state]);

  /* ---------------------------------------------------
     Fetch booking by id when no state provided
     (handle API shape: { booking: {...} } or { data: {...} })
     --------------------------------------------------- */
  const fetchDetails = async () => {
    if (location?.state) return; // don't fetch when we already have state

    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/bookings/get-bookings-by-bookingid/${id}`,
      );
      const data = await res.json();

      // API might return shape like { booking: {...} } or { data: {...} } or { success: true, data: {...} }
      const booking =
        data?.booking || data?.data || (data?.success && data?.data) || data;

      if (booking) {
        const formatted = formatBooking(booking);
        setEnquiry(formatted);
      } else {
        console.warn("No booking found in API response:", data);
      }
    } catch (err) {
      console.error("fetchDetails error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!location?.state) fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location?.state]);

  /* ---------------------------
     Update status helper
     --------------------------- */
  const updateStatusAPI = async (field, value) => {
    try {
      const bookingId = enquiry?.bookingId || id; // ✅ always correct
      const res = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Status update failed");
      return data;
    } catch (err) {
      console.error("updateStatusAPI error:", err);
      throw err;
    }
  };

  /* ---------------------------
     Auto-mark-as-read
     --------------------------- */
  useEffect(() => {
    if (!enquiry) return;

    // ✅ don't auto-mark read if dismissed already
    if (!enquiry.raw?.isRead && !enquiry.raw?.isDismmised) {
      (async () => {
        try {
          await updateStatusAPI("isRead", true);
          setEnquiry((prev) => ({
            ...prev,
            raw: { ...prev.raw, isRead: true },
          }));
        } catch (err) {
          console.error("auto mark read failed:", err);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiry]);

  /* ---------------------------
   Mark as Lead API
   --------------------------- */
  const markAsLeadAPI = async () => {
    try {
      console.log("Marking as lead for booking:", id);

      const res = await fetch(`${BASE_URL}/bookings/${id}/mark-as-lead`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to mark as lead");
      }

      const result = await res.json();
      console.log("Mark as Lead Success:", result);
      return result;
    } catch (err) {
      console.error("markAsLeadAPI error:", err);
      throw err;
    }
  };

  // Selected deep cleaning packages (if any)
  const deepPackages = enquiry
    ? (enquiry.raw?.service || []).filter(
        (s) =>
          s?.category &&
          s.category.toString().toLowerCase() === "deep cleaning",
      )
    : [];

  // bookingDetails convenience
  const bookingDetails = enquiry?.raw?.bookingDetails || {};
  const isHousePainting = enquiry?.raw?.service?.some(
    (s) =>
      s?.category && s.category.toString().toLowerCase() === "house painting",
  );

  const paymentLinkUrl = enquiry?.raw?.bookingDetails?.paymentLink?.url || "";

  const hasSlot = !!(
    enquiry?.raw?.selectedSlot?.slotDate && enquiry?.raw?.selectedSlot?.slotTime
  );

  const hasAddress = !!(
    enquiry?.raw?.address?.houseFlatNumber &&
    enquiry?.raw?.address?.streetArea &&
    enquiry?.raw?.address?.city &&
    Array.isArray(enquiry?.raw?.address?.location?.coordinates) &&
    enquiry?.raw?.address?.location?.coordinates?.length === 2
  );

  const hasCustomer = !!(
    enquiry?.raw?.customer?.name && enquiry?.raw?.customer?.phone
  );

  const hasService =
    Array.isArray(enquiry?.raw?.service) && enquiry.raw.service.length > 0;

  const siteVisitCharges = Number(bookingDetails?.siteVisitCharges || 0);

  const canShowMarkAsLead =
    hasSlot &&
    hasAddress &&
    hasCustomer &&
    hasService &&
    isHousePainting &&
    siteVisitCharges === 0;

  /* ---------------------------
     UI
     --------------------------- */
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

  if (!enquiry) return <p style={{ padding: 20 }}>Enquiry not found</p>;

  return (
    <div className="container " style={{ fontFamily: "Poppins" }}>
      <div
        className="d-flex align-items-center mb-2"
        style={{ cursor: "pointer" }}
      >
        <Button
          variant="white"
          className="btn-sm"
          style={{ fontSize: 14, borderColor: "black" }}
          onClick={() => navigate("/enquiries")}
        >
          <FaArrowLeft /> Back to List
        </Button>
      </div>

      <div
        className="card shadow-sm border-0"
        style={{
          borderLeft: enquiry.raw?.isRead
            ? "4px solid #6c757d"
            : "4px solid #007bff",
        }}
      >
        <div className="card-body">
          <div
            className="d-flex justify-content-between align-items-center p-3"
            style={{
              backgroundColor: enquiry.raw?.isRead ? "#f8f9fa" : "#F9F9F9",
              borderRadius: 8,
            }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <p className="fw-bold mb-0">{enquiry.category}</p>
                {enquiry.raw?.isRead && <Badge bg="secondary">Read</Badge>}
              </div>

              <p className="fw-bold mb-1">{enquiry.name}</p>
              <p
                className="text-muted mb-1"
                style={{ fontSize: "12px", maxWidth: "800px" }}
              >
                <FaMapMarkerAlt className="me-1" />

                {[
                  enquiry?.filledData?.houseNumber,
                  enquiry?.filledData?.location,
                ]
                  .filter(Boolean)
                  .join(", ") || "No Location"}
                <br />
                {enquiry?.filledData?.landmark && (
                  <>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#363636ff",
                        paddingLeft: "15px",
                      }}
                    >
                      Landmark:{" "}
                    </span>
                    {enquiry?.filledData?.landmark}
                  </>
                )}
              </p>

              <p className="text-muted mb-1" style={{ fontSize: 14 }}>
                <FaPhone className="me-1" /> {enquiry.contact}
              </p>
            </div>

            <div className="text-end">
              <p className="text-black mb-0" style={{ fontSize: 14 }}>
                {enquiry.date}
              </p>

              <p className="fw-bold mb-2" style={{ fontSize: 14 }}>
                {enquiry.time}
              </p>

              <button
                className="btn btn-danger mb-2 w-100"
                style={{ borderRadius: 8, fontSize: 12, padding: "4px 8px" }}
                onClick={() => {
                  if (enquiry.googleLocation)
                    window.open(enquiry.googleLocation, "_blank");
                }}
              >
                Directions
              </button>

              <button
                className="btn btn-outline-danger w-100"
                style={{ borderRadius: 8, fontSize: 12, padding: "4px 8px" }}
                onClick={() => {
                  const phone = (enquiry.contact || "").replace(/[^0-9]/g, "");
                  if (phone) window.open(`tel:${phone}`, "_self");
                }}
              >
                Call
              </button>
            </div>
          </div>

          <a href={paymentLinkUrl} target="__balnk">
            Open Payment link
          </a>

          <hr />

          <div className="d-flex justify-content-between mt-4">
            <div className="d-flex flex-column" style={{ width: "50%" }}>
              <div
                className="card p-3"
                style={{
                  borderRadius: 8,
                  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <h6 className="fw-bold" style={{ fontSize: 14 }}>
                  Form Details
                </h6>

                <p style={{ fontSize: 12, marginBottom: "1%" }}>
                  <span className="text-muted">Form Name:</span>{" "}
                  <strong>{enquiry.formName || "—"}</strong>
                </p>

                <p style={{ fontSize: 12 }}>
                  <span className="text-muted">Booking Time & Date:</span>{" "}
                  {enquiry.createdDate} at {enquiry.createdTime}
                </p>
                {/* <p style={{ fontSize: 12 }}>
                  {console.log("enq", enquiry)}
                  <span className="text-muted">Slot Time & Date:</span>{" "}
                  {enquiry.raw.selectedSlot.slotDate} at {enquiry.raw.selectedSlot.slotTime}
                </p> */}

                <p style={{ fontSize: 12 }}>
                  <span className="text-muted">Read Status:</span>{" "}
                  <strong
                    className={
                      enquiry.raw?.isRead ? "text-secondary" : "text-primary"
                    }
                  >
                    {enquiry.raw?.isRead ? "Read" : "Unread"}
                  </strong>
                </p>

                {deepPackages && deepPackages.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <h6 className="fw-bold" style={{ fontSize: 13 }}>
                      Deep Cleaning Packages
                    </h6>
                    <ul style={{ paddingLeft: 16, marginBottom: 0 }}>
                      {deepPackages.map((p, i) => (
                        <li key={i} style={{ fontSize: 12, marginBottom: 6 }}>
                          <strong>
                            {p.serviceName || p.name || "Package"}
                          </strong>
                          {p.subCategory ? ` — ${p.subCategory}` : ""}
                          {" \u00A0"}
                          <span className="text-muted">
                            ₹{p.price ?? p.totalAmount ?? "-"}
                          </span>
                          {p.bookingAmount !== undefined &&
                          p.bookingAmount !== null ? (
                            <span className="text-muted">
                              {" "}
                              • Booking ₹{p.bookingAmount}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Payment summary was intentionally moved into EditEnquiryModal — keep Form Details card focused on package info here */}
              </div>
            </div>
          </div>

          <div className="mt-4 d-flex flex-wrap gap-2">
            <button
              className="btn btn-secondary"
              style={{ borderRadius: 8, fontSize: 10, padding: "4px 8px" }}
              onClick={() => setShowEdit(true)}
            >
              Edit Enquiry
            </button>

            {!enquiry.raw?.isDismmised && (
              <button
                className={`btn ${
                  enquiry.raw?.isRead ? "btn-warning" : "btn-info"
                }`}
                style={{
                  borderRadius: 8,
                  fontSize: 10,
                  padding: "4px 8px",
                  color: "white",
                }}
                onClick={() =>
                  setConfirmState({
                    show: true,
                    title: enquiry.raw?.isRead
                      ? "Mark as Unread"
                      : "Mark as Read",
                    message: `Are you sure you want to mark this enquiry as ${
                      enquiry.raw?.isRead ? "unread" : "read"
                    }?`,
                    action: "toggleRead",
                  })
                }
              >
                {enquiry.raw?.isRead ? (
                  <>
                    <FaEyeSlash className="me-1" /> Mark as Unread
                  </>
                ) : (
                  <>
                    <FaEye className="me-1" /> Mark as Read
                  </>
                )}
              </button>
            )}

            <button
              className="btn btn-secondary"
              style={{ borderRadius: 8, fontSize: 10, padding: "4px 8px" }}
              onClick={() =>
                setConfirmState({
                  show: true,
                  title: "Dismiss Enquiry",
                  message: "Are you sure you want to dismiss this enquiry?",
                  action: "dismiss",
                })
              }
            >
              Dismiss
            </button>

            <button
              className="btn btn-secondary"
              style={{ borderRadius: 8, fontSize: 10, padding: "4px 8px" }}
              onClick={() => setShowReminder(true)}
            >
              Set Reminder
            </button>

            {canShowMarkAsLead && (
              <button
                className="btn btn-success"
                style={{ borderRadius: 8, fontSize: 10, padding: "4px 8px" }}
                onClick={() =>
                  setConfirmState({
                    show: true,
                    title: "Convert as Lead",
                    message:
                      "Are you sure you want to mark this enquiry as a lead?",
                    action: "markAsLead",
                  })
                }
              >
                Convert as Lead
              </button>
            )}

            {/* <button
              className="btn btn-success"
              style={{ borderRadius: 8, fontSize: 10, padding: "4px 8px" }}
              onClick={() =>
                setConfirmState({
                  show: true,
                  title: "Convert as Lead",
                  message:
                    "Are you sure you want to convert this enquiry to a lead? This will mark the first payment as paid.",
                  action: "markAsLead",
                })
              }
            >
              Convert as Lead
            </button> */}
          </div>
        </div>
      </div>

      <ConfirmModal
        show={confirmState.show}
        title={confirmState.title}
        message={confirmState.message}
        onCancel={() => setConfirmState((s) => ({ ...s, show: false }))}
        onConfirm={async () => {
          try {
            if (confirmState.action === "toggleRead") {
              const newValue = !enquiry.raw.isRead;
              await updateStatusAPI("isRead", newValue);
              setEnquiry((prev) => ({
                ...prev,
                raw: { ...prev.raw, isRead: newValue },
              }));
              navigate("/enquiries");
            }

            if (confirmState.action === "dismiss") {
              await updateStatusAPI("isDismmised", true);
              navigate("/enquiries");
            }

            // ✅ FIX: ADD THIS BACK
            if (confirmState.action === "markAsLead") {
              await updateStatusAPI("isEnquiry", false);
              await fetchDetails(); 
              navigate("/enquiries");
            }
          } catch (err) {
            console.error(err);
            alert(err?.message || "Action failed");
          } finally {
            setConfirmState((s) => ({ ...s, show: false }));
          }
        }}
      />

      {showEdit && enquiry && (
        <EditEnquiryModal
          show={showEdit}
          onClose={() => setShowEdit(false)}
          enquiry={enquiry}
          title="Edit Enquiry" // 👈 Added
          onUpdated={() => fetchDetails()}
        />
      )}

      {showReminder && enquiry && (
        <ReminderModal
          show={showReminder}
          onClose={() => setShowReminder(false)}
          enquiry={enquiry}
        />
      )}
    </div>
  );
};

export default EnquiryDetails;



// working code - 20-01
// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import {
//   FaArrowLeft,
//   FaMapMarkerAlt,
//   FaPhone,
//   FaEye,
//   FaEyeSlash,
// } from "react-icons/fa";
// import { Button, Badge } from "react-bootstrap";
// import EditEnquiryModal from "./EditEnquiryModal";
// import ReminderModal from "./ReminderModal";
// import ConfirmModal from "./ConfirmModal";
// import { BASE_URL } from "../utils/config";

// const EnquiryDetails = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const location = useLocation();

//   const [enquiry, setEnquiry] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [showEdit, setShowEdit] = useState(false);
//   const [showReminder, setShowReminder] = useState(false);

//   const [confirmState, setConfirmState] = useState({
//     show: false,
//     title: "",
//     message: "",
//     action: null,
//   });

//   /* ---------------------------
//      Formatting function (common)
//      --------------------------- */
//   const safeDateFormat = (iso) => {
//     try {
//       if (!iso) return { d: "N/A", t: "N/A" };
//       const dt = new Date(iso);
//       if (isNaN(dt.getTime())) return { d: "N/A", t: "N/A" };
//       return {
//         d: dt.toLocaleDateString("en-IN"),
//         t: dt.toLocaleTimeString("en-IN"),
//       };
//     } catch {
//       return { d: "N/A", t: "N/A" };
//     }
//   };

//   const formatBooking = (b) => {
//     if (!b) return null;

//     // handle both createdDate and createdAt naming
//     const createdIso = b.createdDate || b.createdAt || b.bookingDate || null;
//     const { d: createdDate, t: createdTime } = safeDateFormat(createdIso);

//     const slotDateIso =
//       b.selectedSlot?.slotDate || b.bookingDetails?.bookingDate || null;
//     const slotDate =
//       slotDateIso && slotDateIso !== "Invalid Date"
//         ? new Date(slotDateIso).toLocaleDateString("en-IN")
//         : b.selectedSlot?.slotDate || "N/A";

//     return {
//       bookingId: b._id || b.bookingId || b.id || "",
//       name: b.customer?.name || b.customerName || "N/A",
//       contact: b.customer?.phone
//         ? `+91 ${b.customer.phone}`
//         : b.customerPhone || "N/A",
//       category: (
//         [...(b.service || [])].map((s) => s.category).filter(Boolean) || []
//       ).length
//         ? [...new Set((b.service || []).map((s) => s.category))].join(", ")
//         : b.serviceCategory || "N/A",
//       date: slotDate,
//       time: b.selectedSlot?.slotTime || b.bookingDetails?.bookingTime || "N/A",
//       formName: b.formName || b.form || "N/A",
//       createdDate,
//       createdTime,
//       filledData: {
//         location: b.address?.streetArea || b.address?.locationName || "N/A",
//         houseNumber: b.address?.houseFlatNumber || "",
//         landmark: b.address?.landMark || "",
//         timeSlot: b.selectedSlot?.slotTime || "",
//         serviceType:
//           (b.service || [])
//             .map((s) => s.serviceName)
//             .filter(Boolean)
//             .join(", ") ||
//           b.serviceType ||
//           "",
//       },
//       googleLocation:
//         b.address?.location && Array.isArray(b.address.location.coordinates)
//           ? `https://maps.google.com/?q=${b.address.location.coordinates[1]},${b.address.location.coordinates[0]}`
//           : "",
//       raw: {
//         ...b,
//         isRead: !!b.isRead,
//         isDismmised: !!b.isDismmised,
//       },
//     };
//   };

//   /* ---------------------------------------------------
//      If location.state exists, use it (but normalize it)
//      --------------------------------------------------- */
//   useEffect(() => {
//     if (!location?.state) return;

//     // location.state might be already formatted, or may contain booking/raw object
//     const state = location.state;
//     let bookingCandidate = null;

//     // Common possibilities
//     if (state.booking) bookingCandidate = state.booking;
//     else if (state.data) bookingCandidate = state.data;
//     else if (state.raw) bookingCandidate = state.raw;
//     else if (state.bookingId && state.raw) bookingCandidate = state.raw;
//     else bookingCandidate = state; // fallback: maybe the whole booking was passed

//     try {
//       const formatted = formatBooking(bookingCandidate);
//       if (formatted) {
//         setEnquiry(formatted);
//         setLoading(false);
//       }
//     } catch (err) {
//       console.error("format from location.state failed:", err);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [location?.state]);

//   /* ---------------------------------------------------
//      Fetch booking by id when no state provided
//      (handle API shape: { booking: {...} } or { data: {...} })
//      --------------------------------------------------- */
//   const fetchDetails = async () => {
//     if (location?.state) return; // don't fetch when we already have state

//     setLoading(true);
//     try {
//       const res = await fetch(
//         `${BASE_URL}/bookings/get-bookings-by-bookingid/${id}`,
//       );
//       const data = await res.json();

//       // API might return shape like { booking: {...} } or { data: {...} } or { success: true, data: {...} }
//       const booking =
//         data?.booking || data?.data || (data?.success && data?.data) || data;

//       if (booking) {
//         const formatted = formatBooking(booking);
//         setEnquiry(formatted);
//       } else {
//         console.warn("No booking found in API response:", data);
//       }
//     } catch (err) {
//       console.error("fetchDetails error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!location?.state) fetchDetails();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id, location?.state]);

//   /* ---------------------------
//      Update status helper
//      --------------------------- */
//   const updateStatusAPI = async (field, value) => {
//     try {
//       const res = await fetch(`${BASE_URL}/bookings/${id}/status`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ field, value }),
//       });
//       return await res.json();
//     } catch (err) {
//       console.error("updateStatusAPI error:", err);
//       throw err;
//     }
//   };

//   /* ---------------------------
//      Auto-mark-as-read
//      --------------------------- */
//   useEffect(() => {
//     if (!enquiry) return;
//     if (!enquiry.raw?.isRead) {
//       (async () => {
//         try {
//           await updateStatusAPI("isRead", true);
//           setEnquiry((prev) => ({
//             ...prev,
//             raw: { ...prev.raw, isRead: true },
//           }));
//         } catch (err) {
//           console.error("auto mark read failed:", err);
//         }
//       })();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [enquiry]);

//   /* ---------------------------
//    Mark as Lead API
//    --------------------------- */
//   const markAsLeadAPI = async () => {
//     try {
//       console.log("Marking as lead for booking:", id);

//       const res = await fetch(`${BASE_URL}/bookings/${id}/mark-as-lead`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.message || "Failed to mark as lead");
//       }

//       const result = await res.json();
//       console.log("Mark as Lead Success:", result);
//       return result;
//     } catch (err) {
//       console.error("markAsLeadAPI error:", err);
//       throw err;
//     }
//   };

//   // Selected deep cleaning packages (if any)
//   const deepPackages = enquiry
//     ? (enquiry.raw?.service || []).filter(
//         (s) =>
//           s?.category &&
//           s.category.toString().toLowerCase() === "deep cleaning",
//       )
//     : [];

//   // bookingDetails convenience
//   const bookingDetails = enquiry?.raw?.bookingDetails || {};
//   const isHousePainting = enquiry?.raw?.service?.some(
//     (s) =>
//       s?.category && s.category.toString().toLowerCase() === "house painting",
//   );

//   const paymentLinkUrl = enquiry?.raw?.bookingDetails?.paymentLink?.url || "";

//   /* ---------------------------
//      UI
//      --------------------------- */
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

//         .loader-dots span:nth-child(2) {
//           animation-delay: 0.2s;
//         }

//         .loader-dots span:nth-child(3) {
//           animation-delay: 0.4s;
//         }

//         @keyframes pulse {
//           0% { transform: scale(1); opacity: 0.5; }
//           100% { transform: scale(1.6); opacity: 1; }
//         }
//       `}</style>
//       </div>
//     );
//   }

//   if (!enquiry) return <p style={{ padding: 20 }}>Enquiry not found</p>;

//   return (
//     <div className="container " style={{ fontFamily: "Poppins" }}>
//       <div
//         className="d-flex align-items-center mb-2"
//         style={{ cursor: "pointer" }}
//       >
//         <Button
//           variant="white"
//           className="btn-sm"
//           style={{ fontSize: 14, borderColor: "black" }}
//           onClick={() => navigate("/enquiries")}
//         >
//           <FaArrowLeft /> Back to List
//         </Button>
//       </div>

//       <div
//         className="card shadow-sm border-0"
//         style={{
//           borderLeft: enquiry.raw?.isRead
//             ? "4px solid #6c757d"
//             : "4px solid #007bff",
//         }}
//       >
//         <div className="card-body">
//           <div
//             className="d-flex justify-content-between align-items-center p-3"
//             style={{
//               backgroundColor: enquiry.raw?.isRead ? "#f8f9fa" : "#F9F9F9",
//               borderRadius: 8,
//             }}
//           >
//             <div>
//               <div className="d-flex align-items-center gap-2 mb-1">
//                 <p className="fw-bold mb-0">{enquiry.category}</p>
//                 {enquiry.raw?.isRead && <Badge bg="secondary">Read</Badge>}
//               </div>

//               <p className="fw-bold mb-1">{enquiry.name}</p>
//               <p
//                 className="text-muted mb-1"
//                 style={{ fontSize: "12px", maxWidth: "800px" }}
//               >
//                 <FaMapMarkerAlt className="me-1" />

//                 {[
//                   enquiry?.filledData?.houseNumber,
//                   enquiry?.filledData?.location,
//                 ]
//                   .filter(Boolean)
//                   .join(", ") || "No Location"}
//                 <br />
//                 {enquiry?.filledData?.landmark && (
//                   <>
//                     <span
//                       style={{
//                         fontWeight: 600,
//                         color: "#363636ff",
//                         paddingLeft: "15px",
//                       }}
//                     >
//                       Landmark:{" "}
//                     </span>
//                     {enquiry?.filledData?.landmark}
//                   </>
//                 )}
//               </p>

//               <p className="text-muted mb-1" style={{ fontSize: 14 }}>
//                 <FaPhone className="me-1" /> {enquiry.contact}
//               </p>
//             </div>

//             <div className="text-end">
//               <p className="text-black mb-0" style={{ fontSize: 14 }}>
//                 {enquiry.date}
//               </p>

//               <p className="fw-bold mb-2" style={{ fontSize: 14 }}>
//                 {enquiry.time}
//               </p>

//               <button
//                 className="btn btn-danger mb-2 w-100"
//                 style={{ borderRadius: 8, fontSize: 12, padding: "4px 8px" }}
//                 onClick={() => {
//                   if (enquiry.googleLocation)
//                     window.open(enquiry.googleLocation, "_blank");
//                 }}
//               >
//                 Directions
//               </button>

//               <button
//                 className="btn btn-outline-danger w-100"
//                 style={{ borderRadius: 8, fontSize: 12, padding: "4px 8px" }}
//                 onClick={() => {
//                   const phone = (enquiry.contact || "").replace(/[^0-9]/g, "");
//                   if (phone) window.open(`tel:${phone}`, "_self");
//                 }}
//               >
//                 Call
//               </button>
//             </div>
//           </div>

//           <a href={paymentLinkUrl} target="__balnk">
//             Open Payment link
//           </a>

//           <hr />

//           <div className="d-flex justify-content-between mt-4">
//             <div className="d-flex flex-column" style={{ width: "50%" }}>
//               <div
//                 className="card p-3"
//                 style={{
//                   borderRadius: 8,
//                   boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
//                 }}
//               >
//                 <h6 className="fw-bold" style={{ fontSize: 14 }}>
//                   Form Details
//                 </h6>

//                 <p style={{ fontSize: 12, marginBottom: "1%" }}>
//                   <span className="text-muted">Form Name:</span>{" "}
//                   <strong>{enquiry.formName || "—"}</strong>
//                 </p>

//                 <p style={{ fontSize: 12 }}>
//                   <span className="text-muted">Booking Time & Date:</span>{" "}
//                   {enquiry.createdDate} at {enquiry.createdTime}
//                 </p>
//                 {/* <p style={{ fontSize: 12 }}>
//                   {console.log("enq", enquiry)}
//                   <span className="text-muted">Slot Time & Date:</span>{" "}
//                   {enquiry.raw.selectedSlot.slotDate} at {enquiry.raw.selectedSlot.slotTime}
//                 </p> */}

//                 <p style={{ fontSize: 12 }}>
//                   <span className="text-muted">Read Status:</span>{" "}
//                   <strong
//                     className={
//                       enquiry.raw?.isRead ? "text-secondary" : "text-primary"
//                     }
//                   >
//                     {enquiry.raw?.isRead ? "Read" : "Unread"}
//                   </strong>
//                 </p>

//                 {deepPackages && deepPackages.length > 0 && (
//                   <div style={{ marginTop: 8 }}>
//                     <h6 className="fw-bold" style={{ fontSize: 13 }}>
//                       Deep Cleaning Packages
//                     </h6>
//                     <ul style={{ paddingLeft: 16, marginBottom: 0 }}>
//                       {deepPackages.map((p, i) => (
//                         <li key={i} style={{ fontSize: 12, marginBottom: 6 }}>
//                           <strong>
//                             {p.serviceName || p.name || "Package"}
//                           </strong>
//                           {p.subCategory ? ` — ${p.subCategory}` : ""}
//                           {" \u00A0"}
//                           <span className="text-muted">
//                             ₹{p.price ?? p.totalAmount ?? "-"}
//                           </span>
//                           {p.bookingAmount !== undefined &&
//                           p.bookingAmount !== null ? (
//                             <span className="text-muted">
//                               {" "}
//                               • Booking ₹{p.bookingAmount}
//                             </span>
//                           ) : null}
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}

//                 {/* Payment summary was intentionally moved into EditEnquiryModal — keep Form Details card focused on package info here */}
//               </div>
//             </div>
//           </div>

//           <div className="mt-4 d-flex flex-wrap gap-2">
//             <button
//               className="btn btn-secondary"
//               style={{ borderRadius: 8, fontSize: 10, padding: "4px 8px" }}
//               onClick={() => setShowEdit(true)}
//             >
//               Edit Enquiry
//             </button>

//             <button
//               className={`btn ${
//                 enquiry.raw?.isRead ? "btn-warning" : "btn-info"
//               }`}
//               style={{
//                 borderRadius: 8,
//                 fontSize: 10,
//                 padding: "4px 8px",
//                 color: "white",
//               }}
//               onClick={() =>
//                 setConfirmState({
//                   show: true,
//                   title: enquiry.raw?.isRead
//                     ? "Mark as Unread"
//                     : "Mark as Read",
//                   message: `Are you sure you want to mark this enquiry as ${
//                     enquiry.raw?.isRead ? "unread" : "read"
//                   }?`,
//                   action: "toggleRead",
//                 })
//               }
//             >
//               {enquiry.raw?.isRead ? (
//                 <>
//                   <FaEyeSlash className="me-1" /> Mark as Unread
//                 </>
//               ) : (
//                 <>
//                   <FaEye className="me-1" /> Mark as Read
//                 </>
//               )}
//             </button>

//             <button
//               className="btn btn-secondary"
//               style={{ borderRadius: 8, fontSize: 10, padding: "4px 8px" }}
//               onClick={() =>
//                 setConfirmState({
//                   show: true,
//                   title: "Dismiss Enquiry",
//                   message: "Are you sure you want to dismiss this enquiry?",
//                   action: "dismiss",
//                 })
//               }
//             >
//               Dismiss
//             </button>

//             <button
//               className="btn btn-secondary"
//               style={{ borderRadius: 8, fontSize: 10, padding: "4px 8px" }}
//               onClick={() => setShowReminder(true)}
//             >
//               Set Reminder
//             </button>

//             {/* <button
//               className="btn btn-success"
//               style={{ borderRadius: 8, fontSize: 10, padding: "4px 8px" }}
//               onClick={() =>
//                 setConfirmState({
//                   show: true,
//                   title: "Convert as Lead",
//                   message:
//                     "Are you sure you want to convert this enquiry to a lead? This will mark the first payment as paid.",
//                   action: "markAsLead",
//                 })
//               }
//             >
//               Convert as Lead
//             </button> */}
//           </div>
//         </div>
//       </div>

//       <ConfirmModal
//         show={confirmState.show}
//         title={confirmState.title}
//         message={confirmState.message}
//         onCancel={() => setConfirmState((s) => ({ ...s, show: false }))}
//         onConfirm={async () => {
//           try {
//             if (confirmState.action === "toggleRead") {
//               const newValue = !enquiry.raw.isRead;
//               await updateStatusAPI("isRead", newValue);
//               setEnquiry((prev) => ({
//                 ...prev,
//                 raw: { ...prev.raw, isRead: newValue },
//               }));
//               navigate("/enquiries");
//             }

//             if (confirmState.action === "dismiss") {
//               await updateStatusAPI("isDismmised", true);
//               navigate("/enquiries");
//             }

//             // if (confirmState.action === "markAsLead") {
//             //   await markAsLeadAPI();

//             //   navigate("/enquiries");
//             // }
//           } catch (err) {
//             console.error(err);
//           } finally {
//             setConfirmState((s) => ({ ...s, show: false }));
//           }
//         }}
//       />

//       {showEdit && enquiry && (
//         <EditEnquiryModal
//           show={showEdit}
//           onClose={() => setShowEdit(false)}
//           enquiry={enquiry}
//           title="Edit Enquiry" // 👈 Added
//           onUpdated={() => fetchDetails()}
//         />
//       )}

//       {showReminder && enquiry && (
//         <ReminderModal
//           show={showReminder}
//           onClose={() => setShowReminder(false)}
//           enquiry={enquiry}
//         />
//       )}
//     </div>
//   );
// };

// export default EnquiryDetails;
