import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateLeadModal from "./CreateLeadModal";
import { FaMapMarkerAlt, FaPhone, FaArrowLeft } from "react-icons/fa";
import { Button, Modal } from "react-bootstrap";

const genUID = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/* ---------- Reusable confirm modal ---------- */
const ConfirmModal = ({ show, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel }) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 16 }}>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontSize: 14 }}>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const Enquiries = () => {
  const [showOld, setShowOld] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const [newEnquiries, setNewEnquiries] = useState([]);
  const [oldEnquiries, setOldEnquiries] = useState([]);

  const [expandedEnquiryUID, setExpandedEnquiryUID] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedIsOld, setSelectedIsOld] = useState(false);

  // confirm modal state
  const [confirmState, setConfirmState] = useState({
    show: false,
    title: "",
    message: "",
    note: "", // "Dismissed" | "Marked as Unread"
  });

  useEffect(() => {
    const fetchPendingBookings = async () => {
      try {
        const res = await fetch("https://homjee-backend.onrender.com/api/bookings/get-all-enquiries");
        const data = await res.json();

        if (data.allEnquies) {
          const filtered = data.allEnquies.filter(
            (booking) => booking.bookingDetails?.status === "Pending"
          );

          // const transformed = filtered.map((booking) => {
          //   const serviceNames = (booking?.service || [])
          //     .map((s) => s?.serviceName)
          //     .filter(Boolean)
          //     .join(", ");

          //   const categories = [
          //     ...new Set((booking?.service || []).map((s) => s?.category).filter(Boolean)),
          //   ].join(", ");

          //   return {
          //     _uid: genUID(),
          //     date: new Date(booking.bookingDetails.bookingDate).toLocaleDateString(
          //       "en-GB",
          //       { day: "2-digit", month: "2-digit", year: "numeric" }
          //     ),
          //     time: booking.bookingDetails.bookingTime || "",
          //     name: booking.customer?.name || "",
          //     contact: booking.customer?.phone ? `+91 ${booking.customer.phone}` : "",
          //     category: categories || "Service",
          //     formName : formName || "",
          //     filledData: {
          //       serviceType: serviceNames || "",
          //       location: booking.address?.streetArea || "",
          //       houseNumber: booking.address?.houseFlatNumber || "",
          //       landmark: booking.address?.landMark || "",
          //       timeSlot: booking.selectedSlot?.slotTime || "",
          //       payment:
          //         booking.bookingDetails?.paymentStatus === "Paid"
          //           ? `₹${booking.bookingDetails?.paidAmount || 0} (Paid)`
          //           : "(Unpaid)",
          //     },
          //     googleLocation: `https://maps.google.com/?q=0,0`,
          //   };
          // });
const transformed = filtered.map((booking) => {
  // 1) Safely derive formName from whatever your API sends
  const derivedFormName =
    booking?.formName ??
    booking?.form?.name ??
    booking?.form?.title ??
    booking?.meta?.formName ??
    booking?.source?.formName ??
    "Website Service Page"; // final fallback

  // 2) Service names and categories (as you had)
  const serviceNames = (booking?.service || [])
    .map((s) => s?.serviceName)
    .filter(Boolean)
    .join(", ");

  const categories = [
    ...new Set((booking?.service || []).map((s) => s?.category).filter(Boolean)),
  ].join(", ");

  // 3) Date/time safe formatting
  const rawDate = booking?.bookingDetails?.bookingDate;
  const dateStr = rawDate
    ? new Date(rawDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  const timeStr = booking?.bookingDetails?.bookingTime || "—";

  // 4) Google map link from coordinates if available
  const coords = booking?.address?.location?.coordinates; // [lng, lat]
  const [lng, lat] = Array.isArray(coords) && coords.length === 2 ? coords : [0, 0];
  const googleLocation = `https://maps.google.com/?q=${lat},${lng}`;

  return {
    _uid: genUID(),
    date: dateStr,
    time: timeStr,
    name: booking?.customer?.name || "",
    contact: booking?.customer?.phone ? `+91 ${booking.customer.phone}` : "",
    category: categories || "Service",
    formName: derivedFormName, // <-- use the variable you defined
    filledData: {
      serviceType: serviceNames || "",
      location: booking?.address?.streetArea || "",
      houseNumber: booking?.address?.houseFlatNumber || "",
      landmark: booking?.address?.landMark || "",
      timeSlot: booking?.selectedSlot?.slotTime || "",
      payment:
        booking?.bookingDetails?.paymentStatus === "Paid"
          ? `₹${booking?.bookingDetails?.paidAmount || 0} (Paid)`
          : "(Unpaid)",
    },
    googleLocation,
  };
});

          setNewEnquiries(transformed);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    };

    fetchPendingBookings();
  }, []);

  const handleBackToList = () => {
    setExpandedEnquiryUID(null);
    setSelectedLead(null);
    setSelectedIsOld(false);
  };

  const toggleEnquiry = (uid, isOldTab) => {
    const list = isOldTab ? oldEnquiries : newEnquiries;
    const selected = list.find((e) => e._uid === uid) || null;

    setSelectedLead(selected);
    setSelectedIsOld(!!isOldTab);
    setExpandedEnquiryUID((prev) => (prev === uid ? null : uid));
  };

  // ---- Moving logic ----
  const moveToOld = (lead, note = "") => {
    if (!lead) return;
    setOldEnquiries((prev) => [
      { ...lead, _uid: genUID(), movedAt: new Date().toISOString(), note },
      ...prev,
    ]);
    setNewEnquiries((prev) => prev.filter((e) => e._uid !== lead._uid));
    // Switch to Old tab and return to list view
    setShowOld(true);
    handleBackToList();
  };

  // ---- Open confirmation modal for actions ----
  const confirmDismiss = () => {
    if (!selectedLead || selectedIsOld) return;
    setConfirmState({
      show: true,
      title: "Dismiss Enquiry",
      message: "Are you sure you want to dismiss this enquiry?",
      note: "Dismissed",
    });
  };

  const confirmMarkAsUnread = () => {
    if (!selectedLead || selectedIsOld) return;
    setConfirmState({
      show: true,
      title: "Mark as Unread",
      message: "Are you sure you want to mark this enquiry as unread?",
      note: "Marked as Unread",
    });
  };

  // ---- ConfirmModal handlers ----
  const handleConfirmOk = () => {
    if (selectedLead && !selectedIsOld) {
      moveToOld(selectedLead, confirmState.note);
    }
    setConfirmState((s) => ({ ...s, show: false }));
  };

  const handleConfirmCancel = () => {
    setConfirmState((s) => ({ ...s, show: false }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <h6 style={styles.heading}>Enquiries</h6>
        <button style={styles.buttonPrimary} onClick={() => setShowModal(true)}>
          + Create New Lead/Enquiry
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button
          style={!showOld ? styles.activeTab : styles.inactiveTab}
          onClick={() => {
            setShowOld(false);
            handleBackToList();
          }}
        >
          New Enquiries ({newEnquiries.length})
        </button>
        <button
          style={showOld ? styles.activeTab : styles.inactiveTab}
          onClick={() => {
            setShowOld(true);
            handleBackToList();
          }}
        >
          Old Enquiries ({oldEnquiries.length})
        </button>
      </div>

      {expandedEnquiryUID === null ? (
        // ---- LIST VIEW ----
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {(showOld ? oldEnquiries : newEnquiries).map((enquiry) => (
            <div
              key={enquiry._uid}
              style={styles.card}
              onClick={() => toggleEnquiry(enquiry._uid, showOld)}
            >
              <div style={styles.cardHeader}>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: enquiry.category === "Deep Cleaning" ? "red" : "#008E00",
                  }}
                >
                  {enquiry.category}
                </p>
                <p style={{ fontSize: "12px", fontWeight: 600 }}>{enquiry.date}</p>
              </div>

              <div style={styles.cardHeader}>
                <p style={{ fontWeight: "bold", fontSize: "14px" }}>{enquiry.name}</p>
                <p style={{ fontSize: "12px", fontWeight: 600, marginTop: "-1%" }}>
                  {enquiry.time}
                </p>
              </div>

              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "12px",
                  marginTop: "-1%",
                }}
              >
                <FaMapMarkerAlt style={{ marginRight: 5 }} />
                {enquiry.filledData?.location}
              </p>

              {showOld && enquiry.note ? (
                <p style={{ fontSize: 11, color: "#777", marginTop: 6 }}>
                  Moved to Old: <strong>{enquiry.note}</strong>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        // ---- DETAILS VIEW ----
        <div className="container mt-4">
          <div
            className="d-flex align-items-center mb-3"
            onClick={handleBackToList}
            style={{ cursor: "pointer" }}
          >
            <Button
              variant="white"
              className="mb-3"
              style={{ fontSize: "14px", borderColor: "black" }}
            >
              <FaArrowLeft /> Back to List
            </Button>
          </div>

          <div className="card shadow-sm border-0" style={{ marginTop: "-2%" }}>
            <div className="card-body">
              <div
                className="d-flex justify-content-between align-items-center p-3"
                style={{ backgroundColor: "#F9F9F9", borderRadius: "8px" }}
              >
                <div>
                  <p className="fw-bold mb-1">
                    {selectedLead?.category || "Service Category"}
                  </p>

                  <p className="fw-bold mb-1">{selectedLead?.name}</p>

                  <p className="text-muted mb-1" style={{ fontSize: "12px" }}>
                    <FaMapMarkerAlt className="me-1" /> {selectedLead?.filledData?.location}
                  </p>
                  <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                    <FaPhone className="me-1" /> {selectedLead?.contact}
                  </p>
                </div>

                <div className="text-end">
                  <p className="text-black mb-0" style={{ fontSize: "12px" }}>
                    {selectedLead?.date}
                  </p>
                  <p className="fw-bold mb-2" style={{ fontSize: "12px" }}>
                    {selectedLead?.time}
                  </p>
                  <button
                    className="btn btn-danger mb-2 w-100"
                    style={{ borderRadius: "8px", fontSize: "12px", padding: "4px 8px" }}
                  >
                    Directions
                  </button>
                  <button
                    className="btn btn-outline-danger w-100"
                    style={{ borderRadius: "8px", fontSize: "12px", padding: "4px 8px" }}
                  >
                    Call
                  </button>
                </div>
              </div>

              {/* <p
                className="text-dark fw-semibold mb-1"
                style={{ fontSize: "14px", marginTop: "2%" }}
              >
                Package Name: Deluxe Cleaning Package
              </p> */}
              <hr />

              <div className="d-flex justify-content-between mt-4">
                <div className="d-flex flex-column" style={{ width: "50%" }}>
                  <div
                    className="card p-3"
                    style={{
                      borderRadius: "8px",
                      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <h6 className="fw-bold" style={{ fontSize: "14px" }}>
                      Form Details
                    </h6>
                    <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                      <span className="text-muted">Form Name:</span>{" "}
                      <strong>{selectedLead?.formName || "—"}</strong>
                    </p>
                    <p style={{ fontSize: "12px" }}>
                      <span className="text-muted">Form Filling Time&Date:</span>{" "}
                      <strong>
                        ({selectedLead?.date} {selectedLead?.time})
                      </strong>
                    </p>
                    {selectedIsOld && selectedLead?.note ? (
                      <p style={{ fontSize: "12px", marginTop: 8 }}>
                        <span className="text-muted">Status:</span>{" "}
                        <strong>{selectedLead.note}</strong>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Action buttons ONLY for NEW enquiries */}
              {!selectedIsOld ? (
                <div className="mt-4 d-flex">
                  <button
                    className="btn btn-secondary me-2"
                    style={{ borderRadius: "8px", fontSize: "10px", padding: "4px" }}
                  >
                    Edit Enquiry
                  </button>

                  <button
                    className="btn btn-secondary me-2"
                    style={{ borderRadius: "8px", fontSize: "10px", padding: "4px" }}
                    onClick={confirmDismiss}
                  >
                    Dismiss
                  </button>

                  <button
                    className="btn btn-secondary me-2"
                    style={{ borderRadius: "8px", fontSize: "10px", padding: "4px" }}
                  >
                    Set Reminder
                  </button>

                  <button
                    className="btn btn-secondary me-2"
                    style={{ borderRadius: "8px", fontSize: "10px", padding: "4px" }}
                    onClick={confirmMarkAsUnread}
                  >
                    Mark as Unread
                  </button>

                  <button
                    className="btn btn-danger"
                    style={{ borderRadius: "8px", fontSize: "10px" }}
                  >
                    Cancel Lead
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {showModal && <CreateLeadModal onClose={() => setShowModal(false)} />}

      {/* Confirm modal (shared) */}
      <ConfirmModal
        show={confirmState.show}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleConfirmOk}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: "20px",
    fontFamily: "'Poppins', sans-serif",
    minHeight: "100vh",
  },
  heading: { fontSize: "1.2rem", fontWeight: "bold", marginBottom: "15px" },
  buttonPrimary: {
    color: "black",
    padding: "10px 15px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  tabContainer: {
    display: "flex",
    marginBottom: "10px",
    marginTop: "4%",
  },
  activeTab: {
    flex: 1,
    padding: "10px",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    backgroundColor: "#e0e0e0",
    border: "none",
    borderRadius: "5px",
  },
  inactiveTab: {
    flex: 1,
    padding: "10px",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "5px",
    color: "#555",
  },
  card: {
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "8px",
    width: "100%",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
};

export default Enquiries;

