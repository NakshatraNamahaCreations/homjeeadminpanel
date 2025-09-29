// export default Enquiries;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateLeadModal from "./CreateLeadModal";
import { FaMapMarkerAlt, FaPhone, FaArrowLeft } from "react-icons/fa";
import { Button, Modal , Form } from "react-bootstrap";
import EditEnquiryModal from "./EditEnquiryModal";

const genUID = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;


const ConfirmModal = ({
  show,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
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


const ReminderModal = ({ show, onClose, enquiry, onUpdated, moveToOld }) => {
  const [newDate, setNewDate] = useState("");

  const handleSave = async () => {
    if (!newDate || !enquiry?.bookingId) return;

    try {
      const res = await fetch(
        `https://homjee-backend.onrender.com/api/bookings/update-user-booking/${enquiry.bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedSlot: {
              ...enquiry.raw.selectedSlot,
              slotDate: newDate, // update only slotDate
            },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");

      // update UI
      onUpdated?.(data.booking);

      // move enquiry to old with note
      moveToOld(
        {
          ...enquiry,
          raw: { ...enquiry.raw, selectedSlot: data.booking.selectedSlot },
        },
        "Reminder set"
      );

      onClose();
    } catch (err) {
      alert(err.message || "Failed to set reminder");
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 16 }}>Set Reminder</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>Choose new reminder date</Form.Label>
          <Form.Control
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleSave}>
          Save Reminder
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const Enquiries = () => {
  const [showOld, setShowOld] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visibleLeads, setVisibleLeads] = useState(6); // State for pagination
  const navigate = useNavigate();

  const [newEnquiries, setNewEnquiries] = useState([]);
  const [oldEnquiries, setOldEnquiries] = useState([]);
const [showEdit, setShowEdit] = useState(false);

  const [expandedEnquiryUID, setExpandedEnquiryUID] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedIsOld, setSelectedIsOld] = useState(false);
const [showReminder, setShowReminder] = useState(false);

  const [confirmState, setConfirmState] = useState({
    show: false,
    title: "",
    message: "",
    note: "",
  });

  useEffect(() => {
    const fetchPendingBookings = async () => {
      try {
        const res = await fetch(
          "https://homjee-backend.onrender.com/api/bookings/get-all-enquiries"
        );
        const data = await res.json();

        if (data.allEnquies) {
          // Get current date for comparison
          const currentDate = new Date();
          const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

          // Filter and sort enquiries by bookingDate in descending order
          const filtered = data.allEnquies
            .filter((booking) => booking.bookingDetails?.status === "Pending")
            .sort(
              (a, b) =>
                new Date(b.bookingDetails.bookingDate) -
                new Date(a.bookingDetails.bookingDate)
            );

          // Transform and split into new and old enquiries
          const newLeads = [];
          const oldLeads = [];

          filtered.forEach((booking) => {
            const bookingDate = new Date(booking.bookingDetails.bookingDate);
            const timeDiff = currentDate - bookingDate;

              const derivedFormName =
            booking?.formName ?? booking?.form?.name ?? booking?.form?.title ?? booking?.meta?.formName ?? booking?.source?.formName ?? "NA";

            const serviceNames = (booking?.service || [])
              .map((s) => s?.serviceName)
              .filter(Boolean)
              .join(", ");

            const categories = [
              ...new Set(
                (booking?.service || []).map((s) => s?.category).filter(Boolean)
              ),
            ].join(", ");

            const rawDate = booking?.selectedSlot?.slotDate;
            const dateStr = rawDate
              ? new Date(rawDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "—";

            const timeStr = booking?.selectedSlot?.slotTime || "—";

            const coords = booking?.address?.location?.coordinates;
            const [lng, lat] =
              Array.isArray(coords) && coords.length === 2 ? coords : [0, 0];
            const googleLocation = `https://maps.google.com/?q=${lat},${lng}`;

            
   const createdDate = new Date(booking?.createdDate);
          const createdTime = new Date(booking?.createdDate).toLocaleTimeString();

            // const enquiry = {
            //   _uid: genUID(),
            //   date: dateStr,
            //   time: timeStr,
            //   name: booking?.customer?.name || "",
            //   contact: booking?.customer?.phone
            //     ? `+91 ${booking.customer.phone}`
            //     : "",
            //   category: categories || "Service",
            //   formName: derivedFormName,
            //   filledData: {
            //     serviceType: serviceNames || "",
            //     location: booking?.address?.streetArea || "",
            //     houseNumber: booking?.address?.houseFlatNumber || "",
            //     landmark: booking?.address?.landMark || "",
            //     timeSlot: booking?.selectedSlot?.slotTime || "",
            //     payment:
            //       booking?.bookingDetails?.paymentStatus === "Paid"
            //         ? `₹${booking?.bookingDetails?.paidAmount || 0} (Paid)`
            //         : "(Unpaid)",
            //   },
            //   googleLocation,
            //    createdDate: createdDate.toLocaleDateString("en-GB", {
            //   day: "2-digit",
            //   month: "2-digit",
            //   year: "numeric",
            // }), // Format created date
            // createdTime,
            // };
            const enquiry = {
  _uid: genUID(),
  // --- for display ---
  date: dateStr,
  time: timeStr,
  name: booking?.customer?.name || "",
  contact: booking?.customer?.phone ? `+91 ${booking.customer.phone}` : "",
  category: categories || "Service",
  formName: derivedFormName,
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
  createdDate: createdDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }),
  createdTime,

  // --- keep raw fields for editing ---
  bookingId: booking?._id,
  raw: {
    customer: booking?.customer || {},
    service: booking?.service || [],
    bookingDetails: booking?.bookingDetails || {},
    address: booking?.address || {},
    selectedSlot: booking?.selectedSlot || {},
    isEnquiry: booking?.isEnquiry ?? true,
    formName: booking?.formName || "",
  },
};


            // Move to oldEnquiries if older than 2 days
            if (timeDiff > twoDaysInMs) {
              oldLeads.push({ ...enquiry, note: "Moved to Old (Older than 2 days)" });
            } else {
              newLeads.push(enquiry);
            }
          });

          setNewEnquiries(newLeads);
          setOldEnquiries(oldLeads);
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

  const moveToOld = (lead, note = "") => {
    if (!lead) return;
    setOldEnquiries((prev) => [
      { ...lead, _uid: genUID(), movedAt: new Date().toISOString(), note },
      ...prev,
    ]);
    setNewEnquiries((prev) => prev.filter((e) => e._uid !== lead._uid));

    setShowOld(true);
    handleBackToList();
  };

  const upsertEditedIntoLists = (updatedBooking) => {
  // rebuild a display object (enquiry) from updatedBooking using the SAME logic you used in fetch
  // but we can minimally patch the current selected lead to keep it simple.

  const patch = (list) =>
    list.map((item) => {
      if (item._uid !== selectedLead?._uid) return item;

      const b = updatedBooking;
      const categories = [...new Set((b?.service || []).map(s => s?.category).filter(Boolean))].join(", ");
      const serviceNames = (b?.service || [])
        .map(s => s?.serviceName)
        .filter(Boolean)
        .join(", ");

      const rawDate = b?.selectedSlot?.slotDate;
      const dateStr = rawDate
        ? new Date(rawDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "—";
      const timeStr = b?.selectedSlot?.slotTime || "—";

      return {
        ...item,
        date: dateStr,
        time: timeStr,
        name: b?.customer?.name || "",
        contact: b?.customer?.phone ? `+91 ${b.customer.phone}` : "",
        category: categories || "Service",
        formName: b?.formName || item.formName,
        filledData: {
          ...item.filledData,
          serviceType: serviceNames || "",
          location: b?.address?.streetArea || "",
          houseNumber: b?.address?.houseFlatNumber || "",
          landmark: b?.address?.landMark || "",
          timeSlot: b?.selectedSlot?.slotTime || "",
          payment:
            b?.bookingDetails?.paymentStatus === "Paid"
              ? `₹${b?.bookingDetails?.paidAmount || 0} (Paid)`
              : "(Unpaid)",
        },
        // keep raw up-to-date
        raw: {
          customer: b?.customer || {},
          service: b?.service || [],
          bookingDetails: b?.bookingDetails || {},
          address: b?.address || {},
          selectedSlot: b?.selectedSlot || {},
          isEnquiry: b?.isEnquiry ?? item?.raw?.isEnquiry,
          formName: b?.formName || item?.raw?.formName,
        },
      };
    });

  if (selectedIsOld) {
    setOldEnquiries((prev) => patch(prev));
  } else {
    setNewEnquiries((prev) => patch(prev));
  }
};


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

  // Handle Load More button click


  const upsertEditedIntoListsReturnSelected = (currentSelected, updatedBooking) => {
  // Rebuild the same object for the selected lead (same as the patch logic above)
  const b = updatedBooking;
  const categories = [...new Set((b?.service || []).map(s => s?.category).filter(Boolean))].join(", ");
  const serviceNames = (b?.service || [])
    .map(s => s?.serviceName)
    .filter(Boolean)
    .join(", ");

  const rawDate = b?.selectedSlot?.slotDate;
  const dateStr = rawDate
    ? new Date(rawDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";
  const timeStr = b?.selectedSlot?.slotTime || "—";

  return {
    ...currentSelected,
    date: dateStr,
    time: timeStr,
    name: b?.customer?.name || "",
    contact: b?.customer?.phone ? `+91 ${b.customer.phone}` : "",
    category: categories || "Service",
    formName: b?.formName || currentSelected.formName,
    filledData: {
      ...currentSelected.filledData,
      serviceType: serviceNames || "",
      location: b?.address?.streetArea || "",
      houseNumber: b?.address?.houseFlatNumber || "",
      landmark: b?.address?.landMark || "",
      timeSlot: b?.selectedSlot?.slotTime || "",
      payment:
        b?.bookingDetails?.paymentStatus === "Paid"
          ? `₹${b?.bookingDetails?.paidAmount || 0} (Paid)`
          : "(Unpaid)",
    },
    raw: {
      customer: b?.customer || {},
      service: b?.service || [],
      bookingDetails: b?.bookingDetails || {},
      address: b?.address || {},
      selectedSlot: b?.selectedSlot || {},
      isEnquiry: b?.isEnquiry ?? currentSelected?.raw?.isEnquiry,
      formName: b?.formName || currentSelected?.raw?.formName,
    },
  };
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
            // setVisibleLeads(6); // Reset visible leads when switching tabs
          }}
        >
          New Enquiries ({newEnquiries.length})
        </button>
        <button
          style={showOld ? styles.activeTab : styles.inactiveTab}
          onClick={() => {
            setShowOld(true);
            handleBackToList();
            // setVisibleLeads(6); // Reset visible leads when switching tabs
          }}
        >
          Old Enquiries ({oldEnquiries.length})
        </button>
      </div>

      {expandedEnquiryUID === null ? (
        // ---- LIST VIEW ----
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {(showOld ? oldEnquiries : newEnquiries)
            .slice(0, visibleLeads)
            .map((enquiry) => (
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
                      color:
                        enquiry.category === "Deep Cleaning" ? "red" : "#008E00",
                    }}
                  >
                    {enquiry.category}
                  </p>
                  <p style={{ fontSize: "12px", fontWeight: 600 }}>
                    {enquiry.date}
                  </p>
                </div>

                <div style={styles.cardHeader}>
                  <p style={{ fontWeight: "bold", fontSize: "14px" }}>
                    {enquiry.name}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      marginTop: "-1%",
                    }}
                  >
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
          {/* Load More Button */}
          {(showOld ? oldEnquiries : newEnquiries).length > visibleLeads && (
            <button
              style={{
                ...styles.buttonPrimary,
                marginTop: "15px",
                backgroundColor: "#e0e0e0",
                alignSelf: "center",
              }}
              onClick={handleLoadMore}
            >
              Load More
            </button>
          )}
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
                    <FaMapMarkerAlt className="me-1" />{" "}
                    {selectedLead?.filledData?.location}
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
                    style={{
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "4px 8px",
                    }}
                  >
                    Directions
                  </button>
                  <button
                    className="btn btn-outline-danger w-100"
                    style={{
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "4px 8px",
                    }}
                  >
                    Call
                  </button>
                </div>
              </div>

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
                      <span className="text-muted">
                        Form Filling Time&Date:
                      </span>{" "}
              {selectedLead?.createdDate} at {selectedLead?.createdTime}
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
                    style={{
                      borderRadius: "8px",
                      fontSize: "10px",
                      padding: "4px",
                    }}
                     onClick={() => setShowEdit(true)}
                  >
                    Edit Enquiry
                  </button>

                  <button
                    className="btn btn-secondary me-2"
                    style={{
                      borderRadius: "8px",
                      fontSize: "10px",
                      padding: "4px",
                    }}
                    onClick={confirmDismiss}
                  >
                    Dismiss
                  </button>

                 <button
  className="btn btn-secondary me-2"
  style={{
    borderRadius: "8px",
    fontSize: "10px",
    padding: "4px",
  }}
  onClick={() => setShowReminder(true)}
>
  Set Reminder
</button>


                  <button
                    className="btn btn-secondary me-2"
                    style={{
                      borderRadius: "8px",
                      fontSize: "10px",
                      padding: "4px",
                    }}
                    onClick={confirmMarkAsUnread}
                  >
                    Mark as Unread
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
      {showEdit && selectedLead && (
  <EditEnquiryModal
    show={showEdit}
    onClose={() => setShowEdit(false)}
    enquiry={selectedLead}
    onUpdated={(updatedBooking) => {
      upsertEditedIntoLists(updatedBooking);
      // keep the details pane in sync
      setSelectedLead((prev) => prev ? upsertEditedIntoListsReturnSelected(prev, updatedBooking) : prev);
    }}
  />
)}

{showReminder && selectedLead && (
  <ReminderModal
    show={showReminder}
    onClose={() => setShowReminder(false)}
    enquiry={selectedLead}
    onUpdated={(updatedBooking) => {
      upsertEditedIntoLists(updatedBooking);
      setSelectedLead((prev) =>
        prev ? upsertEditedIntoListsReturnSelected(prev, updatedBooking) : prev
      );
    }}
    moveToOld={moveToOld}
  />
)}


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