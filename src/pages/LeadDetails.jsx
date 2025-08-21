import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaBell,
  FaEdit,
  FaRupeeSign,
  FaTrash,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaPhone,
  FaCopy,
} from "react-icons/fa";
import vendor from "../assets/vendor.svg";
import { Button, Card, Alert, Container } from "react-bootstrap";

const LeadDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [lead, setLead] = useState(location.state?.lead);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [notificationStatus, setNotificationStatus] = useState("");

  // Fetch vendors based on lead's location and service category
  useEffect(() => {
    console.log("useEffect triggered, lead:", lead); // Log when useEffect runs
    if (!lead) {
      console.log("No lead data available, exiting useEffect");
      setNotificationStatus("No lead data available.");
      return;
    }

    const fetchVendors = async () => {
      try {
        // Safely access coordinates
        const latitude = lead.filledData?.location?.lat ?? 0;
        const longitude = lead.filledData?.location?.lng ?? 0;
        console.log("Coordinates:", { latitude, longitude }); // Log coordinates

        if (latitude === 0 || longitude === 0) {
          console.log("Invalid coordinates, skipping API call");
          setNotificationStatus("No valid coordinates available for this lead.");
          setVendors([]);
          return;
        }

        const serviceCategory = lead.formName.includes("Deep Cleaning")
          ? "deep-cleaning"
          : "house-painting";
        console.log("Service Category:", serviceCategory); // Log service category

        // Fetch nearby bookings
        console.log(
          `Fetching bookings from: https://homjee-backend.onrender.com/api/bookings/get-nearest-booking-by-location-${serviceCategory}/${latitude}/${longitude}`
        );
        const bookingRes = await fetch(
          `https://homjee-backend.onrender.com/api/bookings/get-nearest-booking-by-location-${serviceCategory}/${latitude}/${longitude}`
        );
        console.log("Booking API response status:", bookingRes.status); // Log response status
        const bookingData = await bookingRes.json();
        console.log("Booking API response data:", bookingData); // Log response data

        if (bookingData.bookings && bookingData.bookings.length > 0) {
          // Fetch all vendors
          console.log("Fetching vendors from: https://homjee-backend.onrender.com/api/vendors/get-all-vendor");
          const vendorRes = await fetch("https://homjee-backend.onrender.com/api/vendors/get-all-vendor");
          console.log("Vendor API response status:", vendorRes.status); // Log response status
          const vendorData = await vendorRes.json();
          console.log("Vendor API response data:", vendorData); // Log response data

          if (vendorData.status && vendorData.vendor) {
            // Filter vendors by service type
            const filteredVendors = vendorData.vendor.filter((v) =>
              v.vendor.serviceType.toLowerCase().includes(serviceCategory.replace("-", " "))
            );
            console.log("Filtered vendors:", filteredVendors); // Log filtered vendors
            setVendors(filteredVendors);
          } else {
            console.log("No vendors found in response");
            setVendors([]);
            setNotificationStatus("No vendors found.");
          }
        } else {
          console.log("No bookings found for this location/service");
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


  

  // Handle vendor selection
  const handleVendorSelect = (event) => {
    const selected = event.target.value;
    setSelectedVendor(selected);
    console.log("Vendor Selected:", selected); // Log selected vendor
  };

  // Handle notifying a vendor
  const handleNotifyVendor = async () => {
    if (!selectedVendor) {
      console.log("No vendor selected for notification");
      setNotificationStatus("Please select a vendor to notify.");
      return;
    }

    try {
      console.log("Notifying vendor for booking:", lead.id, "with vendor:", selectedVendor);
      const response = await fetch("https://homjee-backend.onrender.com/api/bookings/update-confirm-job-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: lead.id,
          status: "Confirmed",
          assignedProfessional: {
            professionalId: selectedVendor,
            name: vendors.find((v) => v._id === selectedVendor)?.vendor.vendorName || "",
            phone: vendors.find((v) => v._id === selectedVendor)?.vendor.mobileNumber || "",
          },
        }),
      });
      console.log("Notify vendor API response status:", response.status); // Log response status
      const result = await response.json();
      console.log("Notify vendor API response data:", result); // Log response data

      if (response.ok) {
        setNotificationStatus(`Vendor notified successfully for booking ${lead.id}.`);
        setLead({
          ...lead,
          status: "Confirmed",
          filledData: {
            ...lead.filledData,
            assignedVendor: vendors.find((v) => v._id === selectedVendor)?.vendor.vendorName,
          },
        });
      } else {
        setNotificationStatus(result.message || "Failed to notify vendor.");
      }
    } catch (error) {
      console.error("Error notifying vendor:", error);
      setNotificationStatus("Error notifying vendor.");
    }
  };

  if (!lead) {
    console.log("Rendering no lead found UI"); // Log when lead is missing
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

  console.log("Rendering lead details UI, lead:", lead); // Log when rendering lead details
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
                <p className="text-danger fw-bold mb-1">{lead.formName}</p>
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
                <p className="text-black mb-0" style={{ fontSize: "12px" }}>
                  {lead.date}
                </p>
                <p className="fw-bold mb-2" style={{ fontSize: "12px" }}>
                  {lead.time}
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
            <hr />
            <div className="d-flex justify-content-between mt-4">
              <div className="d-flex flex-column" style={{ width: "50%" }}>
                <div
                  className="card p-3 mb-3"
                  style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}
                >
                  <h6 className="fw-bold" style={{ fontSize: "14px" }}>
                    Payment Details
                  </h6>
                  <p className="text-dark fw-semibold mb-1" style={{ fontSize: "14px", marginTop: "2%" }}>
                    {lead.filledData?.payment ? `Payment: ${lead.filledData.payment}` : "Payment: N/A"}
                  </p>
                  <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                    <span className="text-muted">Amount Paid:</span> <strong>{lead.filledData.payment}</strong>
                  </p>
                  <p style={{ fontSize: "12px" }}>
                    <span className="text-muted">Payment ID:</span> <strong>HJC66383</strong>{" "}
                    <FaCopy className="ms-1 text-danger" style={{ cursor: "pointer" }} />
                  </p>
                </div>
                <div
                  className="card p-3"
                  style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}
                >
                  <h6 className="fw-bold" style={{ fontSize: "14px" }}>
                    Form Details
                  </h6>
                  <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                    <span className="text-muted">Form Name:</span> <strong>Admin Panel</strong>
                  </p>
                  <p style={{ fontSize: "12px" }}>
                    <span className="text-muted">Form Filling T&D:</span>{" "}
                    <strong>
                      {lead.date} {lead.time}
                    </strong>
                  </p>
                </div>
              </div>
              <div
                className="card p-3"
                style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", width: "48%" }}
              >
                <h6 className="fw-bold" style={{ fontSize: "14px" }}>
                  Vendors Notified
                </h6>
                {vendors.length > 0 ? (
                  <>
                    <select
                      className="form-select mb-3"
                      value={selectedVendor}
                      onChange={handleVendorSelect}
                      style={{ fontSize: "12px" }}
                    >
                      <option value="">Select a Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.vendor.vendorName} ({vendor.vendor.serviceType})
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-secondary mb-2"
                      style={{ borderRadius: "8px", fontSize: "10px", padding: "4px" }}
                      onClick={handleNotifyVendor}
                    >
                      Notify Vendor
                    </button>
                    {notificationStatus && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: notificationStatus.includes("success") ? "green" : "red",
                        }}
                      >
                        {notificationStatus}
                      </p>
                    )}
                    {lead.filledData?.assignedVendor && (
                      <div className="d-flex mt-2">
                        <div>
                          <img src={vendor} alt="Vendor" className="rounded-circle" width="50" />
                          <p className="mb-0" style={{ fontSize: "12px" }}>
                            {lead.filledData.assignedVendor}
                          </p>
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
              <button
                className="btn btn-secondary me-2"
                style={{ borderRadius: "8px", fontSize: "10px", padding: "4px" }}
                onClick={() => console.log("Edit Lead clicked")} // Add edit functionality here
              >
                Edit Lead
              </button>
              <button
                className="btn btn-danger"
                style={{ borderRadius: "8px", fontSize: "10px" }}
                onClick={async () => {
                  console.log("Cancel Lead clicked for booking:", lead.id); // Log cancel action
                  try {
                    const response = await fetch("https://homjee-backend.onrender.com/api/bookings/cancel-job", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ bookingId: lead.id, status: "Cancelled" }),
                    });
                    console.log("Cancel API response status:", response.status); // Log response status
                    const result = await response.json();
                    console.log("Cancel API response data:", result); // Log response data
                    if (response.ok) {
                      setLead({ ...lead, status: "Cancelled" });
                      setNotificationStatus("Lead cancelled successfully.");
                    } else {
                      setNotificationStatus(result.message || "Failed to cancel lead.");
                    }
                  } catch (error) {
                    console.error("Error cancelling lead:", error);
                    setNotificationStatus("Error cancelling lead.");
                  }
                }}
              >
                Cancel Lead
              </button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default LeadDetails;