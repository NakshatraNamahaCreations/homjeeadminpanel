import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import vendor from "../assets/vendor.svg";
import vendor2 from "../assets/vendor2.svg";
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




const OngoingLeads = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState("All Leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [serviceFilter, setServiceFilter] = useState("All Services");
  const [expandedMeasurements, setExpandedMeasurements] = useState({});
  const [expandedQuotations, setExpandedQuotations] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [measurementData, setMeasurementData] = useState({});
  const [vendors, setVendors] = useState([]);
const [vendorsLoading, setVendorsLoading] = useState(false);
const [vendorsError, setVendorsError] = useState(null);

  const [paymentDetails, setPaymentDetails] = useState({
    totalAmount: 0,
    amountPaid: 0,
    paymentId: "",
  });

  const [quotesList, setQuotesList] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState(null);

  const handleFinalizeClick = (quoteId) => {
    setSelectedQuoteId(quoteId);
    setShowModal(true);
  };
  const handleCloseModal = () => setShowModal(false);
  const handleFinalize = () => {
    console.log("Quote finalized!");
  };

  

  // 🆕 IST formatter for date/time
  const formatIST = (isoLike) => {
    if (!isoLike) return { d: "N/A", t: "N/A" };
    const d = new Date(isoLike);
    if (isNaN(d.getTime())) return { d: "N/A", t: "N/A" };
    return {
      d: d.toLocaleDateString("en-IN", {
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

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!selectedLead?.id) {
        setQuotesList([]);
        return;
      }

      try {
        setQuotesLoading(true);
        setQuotesError(null);

        const res = await fetch(
          `${BASE_URL}/quotations/quotes-list-by-id?leadId=${encodeURIComponent(
            selectedLead.id
          )}`
        );
        if (!res.ok) throw new Error(`Quotes API error: ${res.status} ${res.statusText}`);

        const payload = await res.json();
        const list = payload?.data?.list || [];
        const mappedQuotes = list.map((q) => ({ ...q, finalized: q.status === "finalized" }));
        setQuotesList(mappedQuotes);
      } catch (e) {
        console.error("Error fetching quotes:", e);
        setQuotesError(e.message || "Failed to fetch quotes");
        setQuotesList([]);
      } finally {
        setQuotesLoading(false);
      }
    };

    fetchQuotes();
  }, [selectedLead?.id]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Fetch leads from API
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch(`${BASE_URL}/bookings/get-all-leads`);
        if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);

        const data = await response.json();
        const mappedLeads = (data.allLeads || [])
          .filter((lead) => ["Ongoing", "Pending","Job Ongoing","Job Ended"].includes(lead?.bookingDetails?.status))
          .map((lead) => {
            const createdAtISO = lead.createdDate || lead.bookingDetails?.bookingDate || null; // 🆕
            const { d: createdOnDate, t: createdOnTime } = formatIST(createdAtISO); // 🆕

            return {
              id: lead._id,
              name: lead.customer?.name || "Unknown Customer",
              services: lead.service || [],
              formName: lead.formName || "—",
              bookingDate: lead.selectedSlot?.slotDate
                ? new Date(lead.selectedSlot.slotDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "N/A",
              time: lead.selectedSlot?.slotTime || "N/A",
              city: lead.address
                ? `${lead.address.houseFlatNumber || ""}, ${lead.address.streetArea || ""}${
                    lead.address.landMark ? `, ${lead.address.landMark}` : ""
                  }`
                : "N/A",
              status: lead.bookingDetails?.status || "N/A",
              vendor: lead.assignedProfessional ? lead.assignedProfessional.name : "Unassigned",
              type: lead.selectedSlot?.slotDate
                ? (() => {
                    const slotDate = new Date(lead.selectedSlot.slotDate);
                    slotDate.setHours(0, 0, 0, 0);
                    if (slotDate.getTime() === today.getTime()) return "Today";
                    if (slotDate.getTime() === tomorrow.getTime()) return "Tomorrow";
                    return "Other";
                  })()
                : "N/A",
              phone: lead.customer?.phone || "N/A",
              totalAmount: (lead.service || []).reduce(
                (sum, s) => sum + (s.price || 0) * (s.quantity || 1),
                0
              ),
              amountPaid: lead.bookingDetails?.paidAmount || 0,
              paymentId: lead.bookingDetails?.otp?.toString() || "N/A",
              vendorReceived: lead.createdDate
                ? new Date(lead.createdDate).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }).replace(",", "")
                : "N/A",
              vendorResponded: lead.assignedProfessional?.acceptedDate
                ? new Date(lead.assignedProfessional.acceptedDate).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }).replace(",", "")
                : "N/A",
              createdAt: createdAtISO,          // 🆕 raw
              createdOnDate,                    // 🆕 "DD/MM/YYYY" (IST)
              createdOnTime,                    // 🆕 "HH:MM AM/PM" (IST)
            };
          });

        const sortedLeads = mappedLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLeads(sortedLeads);
      } catch (error) {
        console.error("Error fetching leads:", error.message);
      }
    };
    fetchLeads();
  }, []);

  // Fetch measurement data when a lead is selected
  useEffect(() => {
    const fetchMeasurements = async () => {
      if (!selectedLead?.id || !selectedLead.services?.some((s) => (s.category || "").includes("Painting"))) {
        setMeasurementData({});
        return;
      }

      try {
        const response = await fetch(
          `https://homjee-backend.onrender.com/api/measurements/get-measurements-by-leadId/${selectedLead.id}`
        );
        if (!response.ok) throw new Error(`Measurement API error: ${response.status} ${response.statusText}`);

        const data = await response.json();

        if (data?.rooms && Object.keys(data.rooms).length > 0) {
          const mappedMeasurements = {
            Interior: { size: "0 sq ft", items: [] },
            Exterior: { size: "0 sq ft", items: [] },
            Others: { size: "0 sq ft", items: [] },
          };

          const interiorKeys = ["Entrance Passage", "Living Room", "Bedroom 1", "Bedroom 2", "Kitchen", "Passage"];
          const exteriorKeys = ["Balcony", "Dry Balcony", "Bedroom Balcony"];

          for (const [roomName, roomData] of Object.entries(data.rooms)) {
            const ceilingsTotal = (roomData.ceilings || []).reduce((sum, c) => sum + (c.area || 0), 0);
            const wallsTotal = (roomData.walls || []).reduce((sum, w) => sum + (w.area || 0), 0);
            const itemsTotal = (roomData.measurements || []).reduce((sum, m) => sum + (m.area || 0), 0);
            const totalArea = (ceilingsTotal + wallsTotal + itemsTotal).toFixed(2);

            const roomItem = {
              name: roomName,
              ceiling: `${ceilingsTotal.toFixed(2)} sq ft`,
              ceilingCount: roomData.ceilings?.length || 0,
              walls: `${wallsTotal.toFixed(2)} sq ft`,
              wallsCount: roomData.walls?.length || 0,
              total: `${totalArea} sq ft`,
            };

            if (interiorKeys.includes(roomName) || roomName.toLowerCase().includes("bedroom") || roomName.toLowerCase().includes("washroom")) {
              mappedMeasurements.Interior.items.push(roomItem);
              mappedMeasurements.Interior.size = `${(
                parseFloat(mappedMeasurements.Interior.size) + parseFloat(totalArea)
              ).toFixed(2)} sq ft`;
            } else if (exteriorKeys.includes(roomName)) {
              mappedMeasurements.Exterior.items.push(roomItem);
              mappedMeasurements.Exterior.size = `${(
                parseFloat(mappedMeasurements.Exterior.size) + parseFloat(totalArea)
              ).toFixed(2)} sq ft`;
            } else {
              mappedMeasurements.Others.items.push(roomItem);
              mappedMeasurements.Others.size = `${(
                parseFloat(mappedMeasurements.Others.size) + parseFloat(totalArea)
              ).toFixed(2)} sq ft`;
            }
          }

          Object.keys(mappedMeasurements).forEach((section) => {
            if (mappedMeasurements[section].items.length === 0) delete mappedMeasurements[section];
          });

          setMeasurementData(mappedMeasurements);
        } else {
          setMeasurementData({});
        }
      } catch (error) {
        console.error("Error fetching measurements for lead ID:", selectedLead?.id, error.message);
        setMeasurementData({});
      }
    };
    fetchMeasurements();
  }, [selectedLead]);

  // Unique service list for filter
  const uniqueServices = [
    "All Services",
    ...new Set(leads.map((lead) => lead.services?.[0]?.category || "Unknown Service")),
  ];

const handleVendorSelect = async (event) => {
  const vendorName = event.target.value;
  setSelectedVendor(vendorName);

  if (!selectedLead?.id) {
    alert("Please select a lead first.");
    return;
  }

  const selectedVendorObj = vendors.find(
    (v) => v.vendor.vendorName === vendorName
  );

  if (!selectedVendorObj) {
    console.error("Vendor not found in list");
    return;
  }

  try {
    const res = await fetch(
      `https://homjee-backend.onrender.com/api/bookings/update-assigned-professional/${selectedLead.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId: selectedVendorObj._id,
          name: selectedVendorObj.vendor.vendorName,
          phone: selectedVendorObj.vendor.phone || "",
        }),
      }
    );

    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

    const data = await res.json();
    console.log("Vendor updated:", data);

    // update UI
    setSelectedLead((prev) => ({
      ...prev,
      vendor: selectedVendorObj.vendor.vendorName,
    }));

    alert("Vendor assigned successfully!");
  } catch (err) {
    console.error("Error updating vendor:", err);
    alert("Failed to update vendor");
  }
};

  const filteredLeads = leads.filter((lead) => {
    const matchesFilterType = filterType === "All Leads" || lead.type === filterType;
    const matchesCity = cityFilter === "All Cities" || (lead.city || "").includes(cityFilter);
    const matchesService =
      serviceFilter === "All Services" || (lead.services || []).some((s) => s.category === serviceFilter);
    const matchesStatus = statusFilter === "All" || lead.status === statusFilter;
    const matchesVendor = vendorFilter === "All" || lead.vendor === vendorFilter;

    const haystack = [
      lead.name,
      lead.city,
      lead.vendor,
      lead.status,
      lead.formName,
      lead.bookingDate,
      lead.time,
      ...(lead.services || []).map((s) => `${s.category} ${s.subCategory} ${s.serviceName}`),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = haystack.includes(searchQuery.toLowerCase());

    return matchesFilterType && matchesCity && matchesService && matchesStatus && matchesVendor && matchesSearch;
  });

  const formatINR = (n) =>
    typeof n === "number"
      ? n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
      : n;

  const handleCardClick = async (lead) => {
    try {
      const response = await fetch(
        `https://homjee-backend.onrender.com/api/bookings/get-bookings-by-bookingid/${lead.id}`
      );
      if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);

      const bookingData = await response.json();

      if (!bookingData?.customer || !bookingData?.service || !bookingData?.bookingDetails) {
        throw new Error("Invalid API response: Missing required fields");
      }

      // 🆕 derive created fields here as well
      const createdAtISO = bookingData.createdDate || bookingData.bookingDetails?.bookingDate || null;
      const { d: createdOnDate, t: createdOnTime } = formatIST(createdAtISO);

      const detailedLead = {
        id: bookingData._id || lead.id,
        name: bookingData.customer.name || "Unknown Customer",
        services: bookingData.service || lead.services,
        bookingDate: bookingData.selectedSlot?.slotDate
          ? new Date(bookingData.selectedSlot.slotDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "N/A",
        time: bookingData.selectedSlot?.slotTime || bookingData.bookingDetails.bookingTime || lead.time,
        formName: bookingData.formName || "—",
        city: bookingData.address
          ? `${bookingData.address.houseFlatNumber || ""}, ${bookingData.address.streetArea || ""}${
              bookingData.address.landMark ? `, ${bookingData.address.landMark}` : ""
            }`
          : lead.city,
        status: bookingData.bookingDetails.status || lead.status,
        vendor: bookingData.assignedProfessional ? bookingData.assignedProfessional.name : "Unassigned",
        type: bookingData.selectedSlot?.slotDate
          ? new Date(bookingData.selectedSlot.slotDate).toDateString() === new Date().toDateString()
            ? "Today"
            : "Tomorrow"
          : lead.type,
        phone: bookingData.customer.phone || lead.phone,
        totalAmount: (bookingData.service || []).reduce(
          (sum, s) => sum + (s.price || 0) * (s.quantity || 1),
          0
        ),
        amountPaid: bookingData.bookingDetails.paidAmount || lead.amountPaid,
        paymentId: bookingData.bookingDetails.otp ? bookingData.bookingDetails.otp.toString() : lead.paymentId,
        vendorReceived: bookingData.createdDate
          ? new Date(bookingData.createdDate).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }).replace(",", "")
          : "N/A",
        vendorResponded: bookingData.assignedProfessional?.acceptedDate
          ? new Date(bookingData.assignedProfessional.acceptedDate).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }).replace(",", "")
          : "N/A",
        // 🆕 pass created fields for Form Details
        createdAt: createdAtISO,
        createdOnDate,
        createdOnTime,
      };

      setSelectedLead(detailedLead);
      setPaymentDetails({
        totalAmount: detailedLead.totalAmount,
        amountPaid: detailedLead.amountPaid,
        paymentId: detailedLead.paymentId,
      });
    } catch (error) {
      console.error("Error fetching booking details for lead ID:", lead.id, error.message);
      setSelectedLead(lead); // fallback
      setPaymentDetails({
        totalAmount: lead.totalAmount,
        amountPaid: lead.amountPaid,
        paymentId: lead.paymentId,
      });
    }
  };
  

  useEffect(() => {
  const fetchVendors = async () => {
    try {
      setVendorsLoading(true);
      setVendorsError(null);

      const res = await fetch("https://homjee-backend.onrender.com/api/vendor/get-all-vendor");
      if (!res.ok) throw new Error(`Vendor API error: ${res.status} ${res.statusText}`);

      const data = await res.json();

  const list = data?.vendor || [];
      setVendors(list);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setVendorsError(err.message || "Failed to fetch vendors");
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  };

  fetchVendors();
}, []);

console.log(vendors, "vendors")

const filteredVendors = selectedLead?.services?.[0]?.category
  ? vendors.filter(
      (v) =>
        v.vendor.serviceType.toLowerCase() ===
        selectedLead.services[0].category.toLowerCase()
    )
  : vendors;

  const handleBackToList = () => {
    setSelectedLead(null);
    setMeasurementData({});
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleMeasurements = (section) => {
    setExpandedMeasurements((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleToggleQuotations = (section) => {
    setExpandedQuotations((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const totalSqft = Object.values(measurementData).reduce(
    (acc, curr) => acc + (curr.size ? parseFloat(curr.size) : 0),
    0
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h5 style={styles.heading}>Ongoing & Pending Leads</h5>
        <div style={styles.filtersContainer}>
          {["All Leads", "Today", "Tomorrow"].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              style={{
                ...styles.filterButton,
                backgroundColor: filterType === filter ? "red" : "transparent",
                color: filterType === filter ? "white" : "black",
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.filterRow}>
        <select style={styles.dropdown} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          <option>All Cities</option>
          <option>Bengaluru</option>
          <option>Mumbai</option>
        </select>

        <select style={styles.dropdown} value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
          {uniqueServices.map((service, index) => (
            <option key={index} value={service}>
              {service}
            </option>
          ))}
        </select>

        <select style={styles.dropdown} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          <option>Ongoing</option>
          <option>Pending</option>
        </select>

        <select
  style={styles.dropdown}
  value={vendorFilter}
  onChange={(e) => setVendorFilter(e.target.value)}
>
  <option value="All">All Vendors</option>
  {vendors.map((v) => (
    <option key={v._id} value={v.vendor.vendorName}>
      {v.vendor.vendorName}
    </option>
  ))}
</select>

      </div>

      <div style={styles.contentContainer}>
        {selectedLead ? (
          <div className="container mt-4">
            <div className="d-flex align-items-center mb-3" onClick={handleBackToList} style={{ cursor: "pointer" }}>
              <Button variant="white" className="mb-3" style={{ fontSize: "14px", borderColor: "black" }}>
                <FaArrowLeft /> Back to List
              </Button>
            </div>

            <div className="card shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#F9F9F9", borderRadius: "8px" }}>
                  <div>
                    <p className="text-danger fw-bold mb-1">
                      {selectedLead.services?.[0]?.category || "Unknown Service"}
                    </p>
                    <p className="fw-bold mb-1">{selectedLead.name}</p>
                    <p className="text-muted mb-1" style={{ fontSize: "12px" }}>
                      <FaMapMarkerAlt className="me-1" /> {selectedLead.city}
                    </p>
                    <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                      <FaPhone className="me-1" /> {selectedLead.phone}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-black mb-0" style={{ fontSize: "12px" }}>
                      {selectedLead.bookingDate}
                    </p>
                    <p className="fw-bold mb-2" style={{ fontSize: "12px" }}>
                      {selectedLead.time}
                    </p>
                    {/* <button className="btn btn-danger mb-2 w-100" style={{ borderRadius: "8px", fontSize: "12px", padding: "4px 8px" }}>
                      Directions
                    </button> */}
                    <button
  className="btn btn-danger mb-2 w-100"
  style={{ borderRadius: "8px", fontSize: "12px", padding: "4px 8px" }}
  onClick={() => {
    try {
      // If your booking API returns location object:
      const lat = selectedLead?.address?.lat || selectedLead?.location?.lat;
      const lng = selectedLead?.address?.lng || selectedLead?.location?.lng;

      if (lat && lng) {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(mapsUrl, "_blank");
      } else if (selectedLead?.city) {
        // Fallback: use city/address string
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          selectedLead.city
        )}`;
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

                    {/* <button className="btn btn-outline-danger w-100" style={{ borderRadius: "8px", fontSize: "12px", padding: "4px 8px" }}>
                      Call
                    </button> */}
                    <button
  className="btn btn-outline-danger w-100"
  style={{ borderRadius: "8px", fontSize: "12px", padding: "4px 8px" }}
  onClick={() => {
    if (selectedLead?.phone && selectedLead.phone !== "N/A") {
      window.location.href = `tel:${selectedLead.phone}`;
    } else {
      alert("No phone number available.");
    }
  }}
>
  Call
</button>

                  </div>
                </div>

                <hr />

                <div className="d-flex justify-content-between mt-4">
                  <div className="d-flex flex-column" style={{ width: "50%" }}>
                    {/* Measurements + Quotation (if Painting) */}
                    {selectedLead.services?.some((s) => (s.category || "").includes("Painting")) &&
                      Object.keys(measurementData).length > 0 && (
                        <>
                          <div
                            className="card p-3 mb-3"
                            style={{
                              borderRadius: "8px",
                              boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
                            }}
                          >
                            <h6
                              className="fw-bold"
                              style={{ fontSize: "14px" }}
                            >
                              Measurements Summary
                            </h6>
                            {Object.entries(measurementData).map(
                              ([section, data]) => (
                                <div key={section}>
                                  <div
                                    className="d-flex justify-content-between align-items-center"
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                      handleToggleMeasurements(section)
                                    }
                                  >
                                    <p
                                      style={{
                                        fontSize: "12px",
                                        marginBottom: "1%",
                                      }}
                                    >
                                      <span className="text-muted">
                                        {section}:
                                      </span>{" "}
                                      <strong>{data.size}</strong>
                                    </p>
                                    <span
                                      style={{ fontSize: "12px", color: "red" }}
                                    >
                                      {expandedMeasurements[section] ? (
                                        <FaChevronDown />
                                      ) : (
                                        <FaChevronRight />
                                      )}
                                    </span>
                                  </div>
                                  {expandedMeasurements[section] && (
                                    <div
                                      className="ps-3"
                                      style={{ fontSize: "12px" }}
                                    >
                                      {data.items.map((room, idx) => (
                                        <div key={idx} className="mb-2">
                                          <strong>{room.name}</strong>
                                          <p className="mb-0">
                                            Ceiling({room.ceilingCount}):{" "}
                                            {room.ceiling} | Walls(
                                            {room.wallsCount}): {room.walls} |
                                            Total: {room.total}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                            <p style={{ fontSize: "12px", marginTop: "8px" }}>
                              <span className="text-muted">
                                Total measurement:
                              </span>{" "}
                              <strong>{totalSqft.toFixed(2)} sq ft</strong>
                            </p>
                          </div>

                          <div
                            className="card p-3 mb-3"
                            style={{
                              borderRadius: "8px",
                              boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
                            }}
                          >
                            <h6
                              className="fw-bold"
                              style={{ fontSize: "14px" }}
                            >
                              Quotation Summary
                            </h6>

                            {/* Loader / Error / Empty states */}
                            {quotesLoading && (
                              <p
                                className="text-muted"
                                style={{ fontSize: "12px" }}
                              >
                                Loading quotes…
                              </p>
                            )}
                            {!quotesLoading && quotesError && (
                              <p
                                className="text-danger"
                                style={{ fontSize: "12px" }}
                              >
                                {quotesError}
                              </p>
                            )}
                            {!quotesLoading &&
                              !quotesError &&
                              quotesList.length === 0 && (
                                <p
                                  className="text-muted"
                                  style={{ fontSize: "12px" }}
                                >
                                  No quotes yet for this lead.
                                </p>
                              )}

                            {/* Quotes list */}
                            {!quotesLoading &&
                              !quotesError &&
                              quotesList.map((q) => (
                                <div key={q.id} className="mb-2">
                                  <div
                                    className="d-flex justify-content-between align-items-center"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleToggleQuotations(q.id)}
                                  >
                                    <p
                                      style={{
                                        fontSize: "12px",
                                        marginBottom: 0,
                                      }}
                                    >
                                      <strong>{q.title || "Quote"}</strong> •{" "}
                                      <span className="text-muted">Total:</span>{" "}
                                      <strong>
                                        {formatINR(q.amount ?? 0)}
                                      </strong>
                                      {q.finalized ? (
                                        <span
                                          className="badge bg-success ms-2"
                                          style={{ fontSize: "10px" }}
                                        >
                                          Final
                                        </span>
                                      ) : null}
                                    </p>
                                    <span
                                      style={{ fontSize: "12px", color: "red" }}
                                    >
                                      {expandedQuotations[q.id] ? (
                                        <FaChevronDown />
                                      ) : (
                                        <FaChevronRight />
                                      )}
                                    </span>
                                  </div>

                                  {expandedQuotations[q.id] && (
                                    <div
                                      className="card p-2 mt-2"
                                      style={{
                                        background: "#f9f9f9",
                                        fontSize: "12px",
                                        borderRadius: "6px",
                                      }}
                                    >
                                      {/* q.breakdown is returned by the API in the controller you shared */}
                                      {(q.breakdown || []).map((b, i) => (
                                        <p className="mb-1" key={i}>
                                          <strong>{b.label}:</strong>{" "}
                                          {formatINR(b.amount ?? 0)}
                                        </p>
                                      ))}
                                      <div className="d-flex gap-2 mt-1">
                                        <button
                                          className="btn btn-outline-dark btn-sm"
                                          style={{
                                            fontSize: "12px",
                                            padding: "2px 8px",
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation(); /* TODO: navigate to a quote detail screen */
                                          }}
                                        >
                                          View Quote
                                        </button>
                                        
                                        <button
                                          className="btn btn-outline-dark btn-sm"
                                          style={{
                                            fontSize: "12px",
                                            padding: "2px 8px",
                                          }}
                                         onClick={() => handleFinalizeClick(q.id)}
                                             disabled={q.finalized}
                                          title={
                                            q.finalized
                                              ? "Already final"
                                              : "Mark as Final"
                                          }
                                        >
                                          Mark as Final
                                        </button>
                                      </div>
                                       <FinalizeQuoteModal
        quoteId={selectedQuoteId}
        onFinalize={handleFinalize}
        show={showModal}
        handleClose={handleCloseModal}
      />
                                    </div>
                                    
                                  )}
                                </div>
                              ))}
                          </div>
                        </>
                      )}

                    {/* Payment Details (unchanged) */}
                    <div className="card p-3 mb-3" style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold" style={{ fontSize: "14px" }}>
                          Payment Details
                        </h6>
                        <FaEdit
                          className="text-black"
                          style={{ cursor: "pointer", fontSize: "14px" }}
                          onClick={() => setIsEditingPayment(!isEditingPayment)}
                        />
                      </div>
                      {isEditingPayment ? (
                         <>
                          <div className="mb-2">
                            <label
                              style={{ fontSize: "12px" }}
                              className="text-muted"
                            >
                              Total Amount:
                            </label>
                            <input
                              type="number"
                              name="totalAmount"
                              value={paymentDetails.totalAmount}
                              onChange={handlePaymentChange}
                              className="form-control"
                              style={{ fontSize: "12px" }}
                            />
                          </div>
                          <div className="mb-2">
                            <label
                              style={{ fontSize: "12px" }}
                              className="text-muted"
                            >
                              Amount Paid:
                            </label>
                            <div className="d-flex align-items-center">
                              <input
                                type="number"
                                name="amountPaid"
                                value={paymentDetails.amountPaid}
                                onChange={handlePaymentChange}
                                className="form-control me-2"
                                style={{ fontSize: "12px" }}
                              />
                              <button
                                className="btn btn-transparent"
                                style={{
                                  fontSize: "10px",
                                  padding: "4px 10px",
                                  color: "black",
                                  borderColor: "black",
                                  borderRadius: "6px",
                                  whiteSpace: "nowrap",
                                  border: "1px solid black",
                                }}
                                onClick={() =>
                                  console.log(
                                    "Sending payment:",
                                    paymentDetails.amountPaid
                                  )
                                }
                              >
                                Send
                              </button>
                            </div>
                          </div>
                          <div className="mb-2">
                            <label
                              style={{ fontSize: "12px" }}
                              className="text-muted"
                            >
                              Payment ID:
                            </label>
                            <input
                              type="text"
                              name="paymentId"
                              value={paymentDetails.paymentId}
                              onChange={handlePaymentChange}
                              className="form-control"
                              style={{ fontSize: "12px" }}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                            <span className="text-muted">Total Amount:</span>{" "}
                            <strong>Rs. {paymentDetails.totalAmount}</strong>
                          </p>
                          <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                            <span className="text-muted">Amount Paid:</span>{" "}
                            <strong>Rs. {paymentDetails.amountPaid}</strong>
                          </p>
                          <p style={{ fontSize: "12px" }}>
                            <span className="text-muted">Payment ID:</span>{" "}
                            <strong>{paymentDetails.paymentId}</strong>
                            <FaCopy
                              className="ms-1 text-danger"
                              style={{ cursor: "pointer" }}
                              onClick={() => navigator.clipboard.writeText(paymentDetails.paymentId)}
                            />
                          </p>
                        </>
                      )}
                    </div>

                    {/* Package Details (unchanged) if NOT Painting */}
                    {!selectedLead.services?.some((s) => (s.category || "").includes("Painting")) && (
                      <div className="card p-3 mb-3" style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}>
                        <h6 className="fw-bold" style={{ fontSize: "14px" }}>Package Details</h6>
                        {selectedLead.services.map((service, index) => (
                          <div key={index} style={{ marginBottom: "8px" }}>
                            <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                              <span className="text-muted"><strong>{service.subCategory}</strong></span>
                            </p>
                            <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                              <span className="text-muted">Service: {service.serviceName}</span>
                            </p>
                            <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                              <span className="text-muted">Price: ₹{service.price} x {service.quantity}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 🆕 Form Details with Created On/At */}
                    <div className="card p-3" style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}>
                      <h6 className="fw-bold" style={{ fontSize: "14px" }}>Form Details</h6>

                      <p style={{ fontSize: "12px" }}>
                        <span className="text-muted">Form Name:</span>{" "}
                        <strong>{selectedLead.formName}</strong>
                      </p>

                    

                      <p style={{ fontSize: "12px" }}>
                        <span className="text-muted">Form Filling Date &amp; Time:</span>{" "}
                        <strong> {selectedLead.createdOnDate || formatIST(selectedLead.createdAt).d}  :
                        {selectedLead.createdOnTime || formatIST(selectedLead.createdAt).t}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Vendor Assign (unchanged) */}
                  <div className="card p-3" style={{ width: "48%", borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}>
                    <h6 className="fw-bold" style={{ fontSize: "14px" }}>Vendor Assign</h6>
                    <div className="text-center me-3">
                      <img src={vendor} alt="Vendor" className="rounded-circle" width="50" />
                      <p className="mb-0" style={{ fontSize: "12px", fontWeight: "bold" }}>
                        {selectedLead.vendor}
                      </p>
                    </div>
                    <p className="mb-1" style={{ fontSize: "12px", marginTop: "4%" }}>
                      <span className="text-muted">Vendor Received:</span>{" "}
                      <strong>{selectedLead.createdOnDate || formatIST(selectedLead.createdAt).d}  :
                        {selectedLead.createdOnTime || formatIST(selectedLead.createdAt).t}</strong>
                    </p>
                    <p className="mb-1" style={{ fontSize: "12px" }}>
                      <span className="text-muted">Vendor Responded:</span>{" "}
                      <strong>{selectedLead.vendorResponded}</strong>
                    </p>
                  </div>
                </div>

                 </div>
              </div>  
              <div className="mt-4 d-flex">
             <select
  className="form-select me-2"
  style={{
    borderRadius: "8px",
    fontSize: "10px",
    padding: "4px 8px",
    fontWeight: "bold",
    width: "15%",
    borderColor: "black",
    outline: "none",
    boxShadow: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    appearance: "none",
  }}
  value={selectedVendor}
  onChange={handleVendorSelect}
>
 <option value="">Change Vendor</option>
    {vendorsLoading && <option disabled>Loading vendors...</option>}
    {vendorsError && <option disabled>{vendorsError}</option>}
    {filteredVendors.length > 0 ? (
      filteredVendors.map((v) => (
        <option key={v._id} value={v.vendor.vendorName}>
          {v.vendor.vendorName}
        </option>
      ))
    ) : (
      <option disabled>No matching vendors available</option>
    )}
</select>


                  <button className="btn btn-secondary me-2" style={{ borderRadius: "8px", fontSize: "10px" ,   padding: "4px 8px",}}>
                    Reschedule
                  </button>
                  <button className="btn btn-secondary me-2" style={{ borderRadius: "8px", fontSize: "10px",   padding: "4px 8px", }}>
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ borderRadius: "8px", fontSize: "10px" }}
                  >
                    Cancel Lead
                  </button>
             
            </div>
          </div>
        ) : (
        
          <div style={styles.leadsContainer}>
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <div key={lead.id} style={styles.card} onClick={() => handleCardClick(lead)}>
                  <div style={styles.cardHeader}>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: (lead.services || []).some((s) => (s.category || "").includes("Painting"))
                          ? "#008E00"
                          : "red",
                      }}
                    >
                      {lead.services?.[0]?.category || "Unknown Service"}
                    </span>
                    <div style={styles.dateContainer}>
                      <span style={styles.bookingDate}>{lead.bookingDate}</span>
                      <span style={styles.bookingTime}>{lead.time}</span>
                      <Button
                        style={{
                          backgroundColor: lead.status === "Ongoing" ? "#E24F00" : "#FFC107",
                          borderColor: "transparent",
                          borderRadius: "20px",
                          fontSize: "12px",
                        }}
                      >
                        {lead.status}
                      </Button>
                    </div>
                  </div>
                  <div style={styles.cardBody}>
                    <h5 style={styles.cardTitle}>{lead.name}</h5>
                    <p style={styles.cardCity}>
                      <FaMapMarkerAlt /> {lead.city}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p style={styles.noResults}>No ongoing or pending leads found.</p>
            )}
          </div>
        )}
      </div>

  
    </div>
  );
};

const styles = {
  container: { padding: "20px", fontFamily: "'Poppins', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  heading: { fontSize: "18px", fontWeight: "bold" },
  filtersContainer: { display: "flex", gap: "10px" },
  filterButton: { padding: "6px 12px", borderRadius: "26px", border: "1px solid #ccc", cursor: "pointer", fontSize: "12px" },
  filterRow: { display: "flex", gap: "10px", marginBottom: "15px" },
  dropdown: { padding: "8px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "12px" },
  contentContainer: { padding: "20px", minHeight: "100vh" },
  leadsContainer: { flex: 1, display: "flex", flexDirection: "column", gap: "15px" },
  card: { background: "#fff", padding: "15px", borderRadius: "8px", boxShadow: "0px 4px 6px rgba(0,0,0,0.1)", cursor: "pointer" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "5px" },
  dateContainer: { textAlign: "right", display: "flex", flexDirection: "column" },
  bookingDate: { fontSize: "12px", color: "black", fontWeight: "600" },
  bookingTime: { fontSize: "12px", color: "black", fontWeight: "600" },
  cardBody: { marginTop: "-42px" },
  cardTitle: { fontWeight: "700", fontSize: "14px" },
  cardCity: { fontSize: "12px", color: "black", marginTop: "3%" },
  noResults: { textAlign: "center", padding: "10px" },
};

export default OngoingLeads;

