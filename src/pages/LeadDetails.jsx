import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaRupeeSign,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaPhone,
  FaCopy,
} from "react-icons/fa";
import vendor from "../assets/vendor.svg";
import { Button, Card, Alert, Container } from "react-bootstrap";
import { toast } from "react-toastify";
import EditLeadModal from "./EditLeadModal";

const LeadDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [lead, setLead] = useState(location.state?.lead);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [notificationStatus, setNotificationStatus] = useState("");
const [showEditModal, setShowEditModal] = useState(false);
  const formatIST = (isoLike) => {
    if (!isoLike) return { d: "N/A", t: "N/A" };
    const d = new Date(isoLike);
    if (isNaN(d.getTime())) return { d: "N/A", t: "N/A" };
    return {
      d: d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" }),
      t: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }),
    };
  };

  useEffect(() => {
    if (!lead) {
      setNotificationStatus("No lead data available.");
      return;
    }

    const fetchVendors = async () => {
      try {
        const latitude = lead?.filledData?.location?.lat ?? 0;
        const longitude = lead?.filledData?.location?.lng ?? 0;

        if (!latitude || !longitude) {
          setNotificationStatus("No valid coordinates available for this lead.");
          setVendors([]);
          return;
        }

        // decide service category via the derived serviceCategory
        const sc = (lead?.filledData?.serviceCategory || "").toLowerCase();
        const isDeepCleaning = sc.includes("deep cleaning");
        const serviceCategorySlug = isDeepCleaning ? "deep-cleaning" : "house-painting";

        // Get bookings near this location & service
        const bookingRes = await fetch(
          `https://homjee-backend.onrender.com/api/bookings/get-nearest-booking-by-location-${serviceCategorySlug}/${latitude}/${longitude}`
        );
        const bookingData = await bookingRes.json();

        if (bookingData?.bookings?.length > 0) {
          // load all vendors
          const vendorRes = await fetch("https://homjee-backend.onrender.com/api/vendors/get-all-vendor");
          const vendorData = await vendorRes.json();

          if (vendorData?.status && Array.isArray(vendorData?.vendor)) {
            // Filter vendors: try to match "deep cleaning" / "house painting" in vendor.serviceType
            const filteredVendors = vendorData.vendor.filter((v) => {
              const st = (v?.vendor?.serviceType || "").toLowerCase();
              return isDeepCleaning ? st.includes("deep") : st.includes("paint");
            });
            setVendors(filteredVendors);
            setNotificationStatus(filteredVendors.length ? "" : "No vendors found.");
          } else {
            setVendors([]);
            setNotificationStatus("No vendors found.");
          }
        } else {
          setVendors([]);
          setNotificationStatus("No bookings found for this location/service.");
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
        setNotificationStatus("Error fetching vendors.");
      }
    };

    fetchVendors();
  }, [lead]);

  const handleVendorSelect = (event) => {
    setSelectedVendor(event.target.value);
  };

const handleNotifyVendor = async () => {
  if (!selectedVendor) {
    setNotificationStatus("Please select a vendor to notify.");
    return;
  }

  try {
    const chosen = vendors.find((v) => v._id === selectedVendor);

    // ✅ Use the correct POST API
    const response = await fetch("https://homjee-backend.onrender.com/api/bookings/response-confirm-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: lead.id,
        status: "Confirmed",
        vendorId: selectedVendor, // backend expects vendorId (professionalId)
        assignedProfessional: {
          professionalId: selectedVendor,
          name: chosen?.vendor?.vendorName || "",
          phone: chosen?.vendor?.mobileNumber || "",
        },
      }),
    });

    const result = await response.json();

    if (response.ok) {
      setNotificationStatus(`Vendor notified successfully for booking ${lead.id}.`);
      setLead((prev) => ({
        ...prev,
        status: "Confirmed",
        filledData: {
          ...prev.filledData,
          assignedVendor: chosen?.vendor?.vendorName,
        },
      }));
    } else {
      setNotificationStatus(result?.message || "Failed to notify vendor.");
    }
  } catch (error) {
    console.error("Error notifying vendor:", error);
    setNotificationStatus("Error notifying vendor.");
  }
};


  if (!lead) {
    return (
      <Container className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
        <Alert variant="danger" className="text-center">
          <h2 className="fs-4">Lead Not Found</h2>
          <p className="fs-6">The requested lead does not exist or has been removed.</p>
        </Alert>
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Go Back
        </Button>
      </Container>
    );
  }

  const { d: createdOnDate, t: createdOnTime } = formatIST(lead.createdAt);

  return (
    <Container className="py-4 bg-white min-vh-100" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Button variant="light" className="mb-3" size="sm" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </Button>

      <div className="container mt-4">
        <div className="card shadow-sm border-0" style={{ marginTop: "-4%" }}>
          <div className="card-body">
            <div
              className="d-flex justify-content-between align-items-center p-3"
              style={{ backgroundColor: "#F9F9F9", borderRadius: "8px" }}
            >
              <div>
                <p className="text-danger fw-bold mb-1">{lead.filledData?.serviceCategory || "N/A"}</p>
                <p className="fw-bold mb-1">{lead.name}</p>
                <p className="text-muted mb-1" style={{ fontSize: "12px" }}>
                  <FaMapMarkerAlt className="me-1" />{" "}
                  {lead.filledData?.location?.name || lead.filledData?.location || "No Location"}
                </p>
                <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                  <FaPhone className="me-1" /> {lead.contact}
                </p>
              </div>
              <div className="text-end">
                {/* These two lines are the selected slot date/time you already had */}
                <p className="text-black mb-0" style={{ fontSize: "12px" }}>{lead.date}</p>
                <p className="fw-bold mb-2" style={{ fontSize: "12px" }}>{lead.time}</p>
                {/* <button className="btn btn-danger mb-2 w-100" style={{ borderRadius: "8px", fontSize: "12px", padding: "4px 8px" }}>
                  Directions
                </button> */}

                <button
  className="btn btn-danger mb-2 w-100"
  style={{ borderRadius: "8px", fontSize: "12px", padding: "4px 8px" }}
  onClick={() => {
    try {
      const lat = lead?.filledData?.location?.lat;
      const lng = lead?.filledData?.location?.lng;

      if (lat && lng) {
        // Google Maps directions link
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(mapsUrl, "_blank");
      } else {
        alert("No valid location available for directions.");
      }
    } catch (err) {
      console.error("Directions failed:", err);
    }
  }}
>
  Directions
</button>

                <button className="btn btn-outline-danger w-100" style={{ borderRadius: "8px", fontSize: "12px", padding: "4px 8px" }}>
                  Call
                </button>
              </div>
            </div>

            <hr />

            <div className="d-flex justify-content-between mt-4">
              <div className="d-flex flex-column" style={{ width: "50%" }}>
                <div className="card p-3 mb-3" style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}>
                  <h6 className="fw-bold" style={{ fontSize: "14px" }}>Payment Details</h6>
                  <p className="text-dark fw-semibold mb-1" style={{ fontSize: "14px", marginTop: "2%" }}>
                    {lead.filledData?.payment ? `Payment: ${lead.filledData.payment}` : "Payment: N/A"}
                  </p>
                  <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                    <span className="text-muted">Amount Paid:</span> <strong>{lead.filledData?.payment || "N/A"}</strong>
                  </p>
                  <p style={{ fontSize: "12px" }}>
                    <span className="text-muted">Payment ID:</span> <strong>HJC66383</strong>{" "}
                    <FaCopy className="ms-1 text-danger" style={{ cursor: "pointer" }} />
                  </p>
                </div>

                <div className="card p-3" style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}>
                  <h6 className="fw-bold" style={{ fontSize: "14px" }}>Form Details</h6>

                  <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                    <span className="text-muted">Form Name:</span>{" "}
                    <strong>{lead.formName || "N/A"}</strong>
                  </p>
                  <p style={{ fontSize: "12px" }}>
                    <span className="text-muted">Form Filling T&amp;D:</span>{" "}
                    <strong>{createdOnDate} {createdOnTime}</strong>
                  </p>
                </div>
              </div>

              <div className="card p-3" style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", width: "48%" }}>
                <h6 className="fw-bold" style={{ fontSize: "14px" }}>Vendors Notified</h6>

                {vendors.length > 0 ? (
                  <>
                    <select className="form-select mb-3" value={selectedVendor} onChange={handleVendorSelect} style={{ fontSize: "12px" }}>
                      <option value="">Select a Vendor</option>
                      {vendors.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v?.vendor?.vendorName} ({v?.vendor?.serviceType})
                        </option>
                      ))}
                    </select>

                    <button className="btn btn-secondary mb-2" style={{ borderRadius: "8px", fontSize: "10px", padding: "4px" }} onClick={handleNotifyVendor}>
                      Notify Vendor
                    </button>

                    {notificationStatus && (
                      <p style={{ fontSize: "12px", color: notificationStatus.toLowerCase().includes("success") ? "green" : "red" }}>
                        {notificationStatus}
                      </p>
                    )}

                    {lead.filledData?.assignedVendor && (
                      <div className="d-flex mt-2">
                        <div>
                          <img src={vendor} alt="Vendor" className="rounded-circle" width="50" />
                          <p className="mb-0" style={{ fontSize: "12px" }}>{lead.filledData.assignedVendor}</p>
                          <p style={{ fontSize: "12px" }}>
                            Vendor Notified: <span style={{ fontWeight: "bold" }}>14 Dec 2025 03:08 PM</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: "12px" }}>
                    {notificationStatus || "No vendors available for this service/location."}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 d-flex">
              <button className="btn btn-secondary me-2" style={{ borderRadius: "8px", fontSize: "10px", padding: "4px" }}  onClick={() => setShowEditModal(true)}>
                Edit Lead
              </button>
             {lead.status === "Admin Cancelled" ? (
    <span
      className="btn btn-outline-secondary"
      style={{ borderRadius: "8px", fontSize: "10px", cursor: "not-allowed" }}
    >
      Admin Already Cancelled
    </span>
  ) : (
    <button
      className="btn btn-danger"
      style={{ borderRadius: "8px", fontSize: "10px" }}
      onClick={async () => {
        try {
          const response = await fetch(
            "https://homjee-backend.onrender.com/api/bookings/update-status",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: lead.id,
                status: "Admin Cancelled",
              }),
            }
          );
          const result = await response.json();
          if (response.ok) {
            setLead({ ...lead, status: "Admin Cancelled" });
            setNotificationStatus("Lead cancelled successfully.");
           navigate("/newleads", { state: { cancelled: true } }); // pass state
          } else {
            setNotificationStatus(result?.message || "Failed to cancel lead.");
          }
        } catch (error) {
          console.error("Error cancelling lead:", error);
          setNotificationStatus("Error cancelling lead.");
        }
      }}
    >
      Cancel Lead
    </button>
      )}

            </div>
          </div>
        </div>
      </div>
      <EditLeadModal
        show={showEditModal}
  onClose={() => setShowEditModal(false)}
  lead={lead}
  onUpdate={(updated) => setLead({ ...lead, ...updated })}
/>
    </Container>
  );
};

export default LeadDetails;
