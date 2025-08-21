import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import vendor from "../assets/vendor.svg";
import vendor2 from "../assets/vendor2.svg";
import { FaChevronRight, FaChevronDown, FaPhone, FaMapMarkerAlt, FaEdit, FaCopy, FaArrowLeft } from "react-icons/fa";
import { Button } from "react-bootstrap";

const quotationData = {
  "Quote 1": {
    Interior: "₹50,000",
    Exterior: "₹30,000",
    Others: "₹20,000",
    AdditionalServices: "₹5,000"
  },
  "Quote 2": {
    Interior: "₹60,000",
    Exterior: "₹35,000",
    Others: "₹25,000",
    AdditionalServices: "₹10,000"
  }
};

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
  const [measurementData, setMeasurementData] = useState({});
  const [paymentDetails, setPaymentDetails] = useState({
    totalAmount: 0,
    amountPaid: 0,
    paymentId: "",
  });

  const [quotesList, setQuotesList] = useState([]);
const [quotesLoading, setQuotesLoading] = useState(false);
const [quotesError, setQuotesError] = useState(null);


useEffect(() => {
  const fetchQuotes = async () => {
    // Only fetch when we have a lead id
    if (!selectedLead?.id) {
      setQuotesList([]);
      return;
    }

    try {
      setQuotesLoading(true);
      setQuotesError(null);

      // 🔁 Adjust base URL/prefix if your server mounts routes differently
      const res = await fetch(
        `https://homjee-backend.onrender.com/api/quotations/quotes-list-by-id?leadId=${encodeURIComponent(selectedLead.id)}`
      );

      if (!res.ok) {
        throw new Error(`Quotes API error: ${res.status} ${res.statusText}`);
      }

      const payload = await res.json();
      const list = payload?.data?.list || [];
      setQuotesList(list);
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


  // Fetch leads from API
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch("https://homjee-backend.onrender.com/api/bookings/get-all-leads");
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("All Leads API Response:", data); // Debug log
        const mappedLeads = data.allLeads
          .filter(lead => ["Ongoing", "Pending",].includes(lead.bookingDetails.status))
          .map(lead => ({
            id: lead._id,
            name: lead.customer?.name || "Unknown Customer",
            services: lead.service || [], // Store full service array
          bookingDate: lead.bookingDetails?.bookingDate 
  ? new Date(lead.bookingDetails.bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('/') 
  : "N/A",
            time: lead.bookingDetails?.bookingTime || "N/A",
            city: lead.address 
              ? `${lead.address.houseFlatNumber || ""}, ${lead.address.streetArea || ""}${lead.address.landMark ? `, ${lead.address.landMark}` : ""}`
              : "N/A",
            status: lead.bookingDetails?.status || "N/A",
            vendor: lead.assignedProfessional ? lead.assignedProfessional.name : "Unassigned",
            type: lead.selectedSlot?.slotDate 
              ? new Date(lead.selectedSlot.slotDate).toDateString() === new Date().toDateString() ? "Today" : "Tomorrow"
              : "N/A",
            phone: lead.customer?.phone || "N/A",
            totalAmount: lead.service 
              ? lead.service.reduce((sum, s) => sum + (s.price || 0) * (s.quantity || 1), 0)
              : 0,
            amountPaid: lead.bookingDetails?.paidAmount || 0,
            paymentId: lead.bookingDetails?.otp?.toString() || "N/A",
           vendorReceived: lead.assignedProfessional?.acceptedDate 
  ? new Date(lead.assignedProfessional.acceptedDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '') 
  : "N/A",
vendorResponded: lead.assignedProfessional?.startedDate 
  ? new Date(lead.assignedProfessional.startedDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '') 
  : "N/A",
          }));
        setLeads(mappedLeads);
      } catch (error) {
        console.error("Error fetching leads:", error.message);
      }
    };
    fetchLeads();
  }, []);

  // Fetch measurement data when a lead is selected
  useEffect(() => {
    const fetchMeasurements = async () => {
      if (!selectedLead || !selectedLead.id || !selectedLead.services.some(s => s.category.includes("Painting"))) {
        setMeasurementData({});
        return;
      }

      try {
        const response = await fetch(`https://homjee-backend.onrender.com/api/measurements/get-measurements-by-leadId/${selectedLead.id}`);
        if (!response.ok) {
          throw new Error(`Measurement API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Measurement API Response for lead ID:", selectedLead.id, data); // Debug log

        if (data && data.rooms && Object.keys(data.rooms).length > 0) {
          // Map API data to UI-expected structure
          const mappedMeasurements = {
            Interior: { size: "0 sq ft", items: [] },
            Exterior: { size: "0 sq ft", items: [] },
            Others: { size: "0 sq ft", items: [] }
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
              total: `${totalArea} sq ft`
            };

            if (interiorKeys.includes(roomName) || roomName.toLowerCase().includes("bedroom") || roomName.toLowerCase().includes("washroom")) {
              mappedMeasurements.Interior.items.push(roomItem);
              mappedMeasurements.Interior.size = `${(parseFloat(mappedMeasurements.Interior.size) + parseFloat(totalArea)).toFixed(2)} sq ft`;
            } else if (exteriorKeys.includes(roomName)) {
              mappedMeasurements.Exterior.items.push(roomItem);
              mappedMeasurements.Exterior.size = `${(parseFloat(mappedMeasurements.Exterior.size) + parseFloat(totalArea)).toFixed(2)} sq ft`;
            } else {
              mappedMeasurements.Others.items.push(roomItem);
              mappedMeasurements.Others.size = `${(parseFloat(mappedMeasurements.Others.size) + parseFloat(totalArea)).toFixed(2)} sq ft`;
            }
          }

          // Remove empty sections
          Object.keys(mappedMeasurements).forEach(section => {
            if (mappedMeasurements[section].items.length === 0) {
              delete mappedMeasurements[section];
            }
          });
          console.log("Mapped measurement data:", mappedMeasurements);
          setMeasurementData(mappedMeasurements);
        } else {
          console.log("No rooms found in measurement data for lead ID:", selectedLead.id);
          setMeasurementData({});
        }
      } catch (error) {
        console.error("Error fetching measurements for lead ID:", selectedLead.id, error.message);
        setMeasurementData({});
      }
    };
    fetchMeasurements();
  }, [selectedLead]);

  // Get unique service names for filter dropdown
  const uniqueServices = ["All Services", ...new Set(leads.map(lead => lead.services[0]?.category || "Unknown Service"))];

  const handleVendorSelect = (event) => {
    const selected = event.target.value;
    setSelectedVendor(selected);
    console.log("Vendor Selected:", selected);
  };

  const filteredLeads = leads.filter((lead) =>
    (filterType === "All Leads" || lead.type === filterType) &&
    (cityFilter === "All Cities" || lead.city.includes(cityFilter)) &&
    (serviceFilter === "All Services" || lead.services.some(s => s.category === serviceFilter)) &&
    (statusFilter === "All" || lead.status === statusFilter) &&
    (vendorFilter === "All" || lead.vendor === vendorFilter) &&
    Object.values(lead).some((value) =>
      value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );


  const formatINR = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    : n;


  const handleCardClick = async (lead) => {
    try {
      // Fetch detailed booking data using the booking ID
      const response = await fetch(`https://homjee-backend.onrender.com/api/bookings/get-bookings-by-bookingid/${lead.id}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const bookingData = await response.json();
      console.log("API Response for booking ID:", lead.id, bookingData); // Debug log

      // Check if bookingData and required fields exist
      if (!bookingData || !bookingData.customer || !bookingData.service || !bookingData.bookingDetails) {
        throw new Error("Invalid API response: Missing required fields");
      }

      // Map the fetched booking data to the lead structure expected by the UI
      const detailedLead = {
        id: bookingData._id || lead.id,
        name: bookingData.customer.name || "Unknown Customer",
        services: bookingData.service || lead.services, // Store full service array
       bookingDate: bookingData.bookingDetails.bookingDate
    ? new Date(bookingData.bookingDetails.bookingDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "N/A",
        time: bookingData.bookingDetails.bookingTime || lead.time,
          formName: bookingData.formName || "—",
        city: bookingData.address 
          ? `${bookingData.address.houseFlatNumber || ""}, ${bookingData.address.streetArea || ""}${bookingData.address.landMark ? `, ${bookingData.address.landMark}` : ""}`
          : lead.city,
        status: bookingData.bookingDetails.status || lead.status,
        vendor: bookingData.assignedProfessional ? bookingData.assignedProfessional.name : "Unassigned",
        type: bookingData.selectedSlot?.slotDate 
          ? new Date(bookingData.selectedSlot.slotDate).toDateString() === new Date().toDateString() ? "Today" : "Tomorrow"
          : lead.type,
        phone: bookingData.customer.phone || lead.phone,
        totalAmount: bookingData.service 
          ? bookingData.service.reduce((sum, s) => sum + (s.price || 0) * (s.quantity || 1), 0)
          : lead.totalAmount,
        amountPaid: bookingData.bookingDetails.paidAmount || lead.amountPaid,
        paymentId: bookingData.bookingDetails.otp ? bookingData.bookingDetails.otp.toString() : lead.paymentId,
        vendorReceived: bookingData.assignedProfessional?.acceptedDate 
          ? new Date(bookingData.assignedProfessional.acceptedDate).toLocaleString() 
          : "N/A",
        vendorResponded: bookingData.assignedProfessional?.startedDate 
          ? new Date(bookingData.assignedProfessional.startedDate).toLocaleString() 
          : "N/A",
      };

      // Set the selected lead with the detailed data
      setSelectedLead(detailedLead);
      setPaymentDetails({
        totalAmount: detailedLead.totalAmount,
        amountPaid: detailedLead.amountPaid,
        paymentId: detailedLead.paymentId,
      });
    } catch (error) {
      console.error("Error fetching booking details for lead ID:", lead.id, error.message);
      // Fallback to the original lead data if API call fails
      setSelectedLead(lead);
      setPaymentDetails({
        totalAmount: lead.totalAmount,
        amountPaid: lead.amountPaid,
        paymentId: lead.paymentId,
      });
    }
  };

  const handleBackToList = () => {
    setSelectedLead(null);
    setMeasurementData({});
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleMeasurements = (section) => {
    setExpandedMeasurements((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleToggleQuotations = (section) => {
    setExpandedQuotations((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const totalSqft = Object.values(measurementData).reduce((acc, curr) => {
    return acc + (curr.size ? parseFloat(curr.size) : 0);
  }, 0);

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
          <option>Bangalore</option>
          <option>Mumbai</option>
        </select>
        <select style={styles.dropdown} value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
          {uniqueServices.map((service, index) => (
            <option key={index} value={service}>{service}</option>
          ))}
        </select>
        <select style={styles.dropdown} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          <option>Ongoing</option>
          <option>Pending</option>
        </select>
        <select style={styles.dropdown} value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
          <option>All</option>
          <option>Dhinesh</option>
          <option>Unassigned</option>
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
                    <p className="text-danger fw-bold mb-1">{selectedLead.services[0]?.category || "Unknown Service"}</p>
                    <p className="fw-bold mb-1">{selectedLead.name}</p>
                    <p className="text-muted mb-1" style={{ fontSize: "12px" }}>
                      <FaMapMarkerAlt className="me-1" /> {selectedLead.city}
                    </p>
                    <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                      <FaPhone className="me-1" /> {selectedLead.phone}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-black mb-0" style={{ fontSize: "12px" }}>{selectedLead.bookingDate}</p>
                    <p className="fw-bold mb-2" style={{ fontSize: "12px" }}>{selectedLead.time}</p>
                    <button className="btn btn-danger mb-2 w-100" style={{ borderRadius: "8px", fontSize: "12px", padding: "4px 8px" }}>Directions</button>
                    <button className="btn btn-outline-danger w-100" style={{ borderRadius: "8px", fontSize: "12px", padding: "4px 8px" }}>Call</button>
                  </div>
                </div>

                {/* <p className="text-dark fw-semibold mb-1" style={{ fontSize: "14px", marginTop: "2%" }}>
                  Package Name: {selectedLead.services.some(s => s.category.includes("Painting")) ? "Painting Package" : selectedLead.services[0]?.category || "Standard Service Package"}
                </p> */}

                <hr />

                <div className="d-flex justify-content-between mt-4">
                  <div className="d-flex flex-column" style={{ width: "50%" }}>
                    {selectedLead.services.some(s => s.category.includes("Painting")) && Object.keys(measurementData).length > 0 && (
                      <>
                        <div className="card p-3 mb-3" style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}>
                          <h6 className="fw-bold" style={{ fontSize: "14px" }}>Measurements Summary</h6>
                          {Object.entries(measurementData).map(([section, data]) => (
                            <div key={section}>
                              <div
                                className="d-flex justify-content-between align-items-center"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleToggleMeasurements(section)}
                              >
                                <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                                  <span className="text-muted">{section}:</span> <strong>{data.size}</strong>
                                </p>
                                <span style={{ fontSize: "12px", color: "red" }}>
                                  {expandedMeasurements[section] ? <FaChevronDown /> : <FaChevronRight />}
                                </span>
                              </div>
                              {expandedMeasurements[section] && (
                                <div className="ps-3" style={{ fontSize: "12px" }}>
                                  {data.items.map((room, idx) => (
                                    <div key={idx} className="mb-2">
                                      <strong>{room.name}</strong>
                                      <p className="mb-0">
                                        Ceiling({room.ceilingCount}): {room.ceiling} | Walls({room.wallsCount}): {room.walls} | Total: {room.total}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          <p style={{ fontSize: "12px", marginTop: "8px" }}>
                            <span className="text-muted">Total measurement:</span> <strong>{totalSqft.toFixed(2)} sq ft</strong>
                          </p>
                        </div>

                       <div className="card p-3 mb-3" style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}>
  <h6 className="fw-bold" style={{ fontSize: "14px" }}>Quotation Summary</h6>

  {/* Loader / Error / Empty states */}
  {quotesLoading && (
    <p className="text-muted" style={{ fontSize: "12px" }}>Loading quotes…</p>
  )}
  {!quotesLoading && quotesError && (
    <p className="text-danger" style={{ fontSize: "12px" }}>{quotesError}</p>
  )}
  {!quotesLoading && !quotesError && quotesList.length === 0 && (
    <p className="text-muted" style={{ fontSize: "12px" }}>No quotes yet for this lead.</p>
  )}

  {/* Quotes list */}
  {!quotesLoading && !quotesError && quotesList.map((q) => (
    <div key={q.id} className="mb-2">
      <div
        className="d-flex justify-content-between align-items-center"
        style={{ cursor: "pointer" }}
        onClick={() => handleToggleQuotations(q.id)}
      >
        <p style={{ fontSize: "12px", marginBottom: 0 }}>
          <strong>{q.title || "Quote"}</strong> • <span className="text-muted">Total:</span> <strong>{formatINR(q.amount ?? 0)}</strong>
          {q.finalized ? <span className="badge bg-success ms-2" style={{ fontSize: "10px" }}>Final</span> : null}
        </p>
        <span style={{ fontSize: "12px", color: "red" }}>
          {expandedQuotations[q.id] ? <FaChevronDown /> : <FaChevronRight />}
        </span>
      </div>

      {expandedQuotations[q.id] && (
        <div className="card p-2 mt-2" style={{ background: "#f9f9f9", fontSize: "12px", borderRadius: "6px" }}>
          {/* q.breakdown is returned by the API in the controller you shared */}
          {(q.breakdown || []).map((b, i) => (
            <p className="mb-1" key={i}>
              <strong>{b.label}:</strong> {formatINR(b.amount ?? 0)}
            </p>
          ))}
          <div className="d-flex gap-2 mt-1">
            <button
              className="btn btn-outline-dark btn-sm"
              style={{ fontSize: "12px", padding: "2px 8px" }}
              onClick={(e) => { e.stopPropagation(); /* TODO: navigate to a quote detail screen */ }}
            >
              View Quote
            </button>
            <button
              className="btn btn-outline-dark btn-sm"
              style={{ fontSize: "12px", padding: "2px 8px" }}
              onClick={(e) => { e.stopPropagation(); /* TODO: mark as final via PATCH /quotes/:id */ }}
              disabled={!!q.finalized}
              title={q.finalized ? "Already final" : "Mark as Final"}
            >
              Mark as Final
            </button>
          </div>
        </div>
      )}
    </div>
  ))}
</div>

                      </>
                    )}

                    <div className="card p-3 mb-3" style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold" style={{ fontSize: "14px" }}>Payment Details</h6>
                        <FaEdit className="text-black" style={{ cursor: "pointer", fontSize: "14px" }} onClick={() => setIsEditingPayment(!isEditingPayment)} />
                      </div>
                      {isEditingPayment ? (
                        <>
                          <div className="mb-2">
                            <label style={{ fontSize: "12px" }} className="text-muted">Total Amount:</label>
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
                            <label style={{ fontSize: "12px" }} className="text-muted">Amount Paid:</label>
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
                                  border: "1px solid black"
                                }}
                                onClick={() => console.log("Sending payment:", paymentDetails.amountPaid)}
                              >
                                Send
                              </button>
                            </div>
                          </div>
                          <div className="mb-2">
                            <label style={{ fontSize: "12px" }} className="text-muted">Payment ID:</label>
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
                            <span className="text-muted">Total Amount:</span> <strong>Rs. {paymentDetails.totalAmount}</strong>
                          </p>
                          <p style={{ fontSize: "12px", marginBottom: "1%" }}>
                            <span className="text-muted">Amount Paid:</span> <strong>Rs. {paymentDetails.amountPaid}</strong>
                          </p>
                          <p style={{ fontSize: "12px" }}>
                            <span className="text-muted">Payment ID:</span> <strong>{paymentDetails.paymentId}</strong>
                            <FaCopy className="ms-1 text-danger" style={{ cursor: "pointer" }} onClick={() => navigator.clipboard.writeText(paymentDetails.paymentId)} />
                          </p>
                        </>
                      )}
                    </div>

                    {!selectedLead.services.some(s => s.category.includes("Painting")) && (
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

                   <div className="card p-3" style={{ borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}>
  <h6 className="fw-bold" style={{ fontSize: "14px" }}>Form Details</h6>

  <p style={{ fontSize: "12px" }}>
    <span className="text-muted">Form Name:</span>{" "}
    <strong>{selectedLead.formName || "—"}</strong>
  </p>

  <p style={{ fontSize: "12px" }}>
    <span className="text-muted">Form Filling Date & Time:</span>{" "}
    <strong>
      {selectedLead.bookingDate !== "N/A" && selectedLead.time !== "N/A"
        ? `${selectedLead.bookingDate} ${selectedLead.time}`
        : "N/A"}
    </strong>
  </p>
</div>

                  </div>

                  <div className="card p-3" style={{ width: "48%", borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}>
                    <h6 className="fw-bold" style={{ fontSize: "14px" }}>Vendor Assign</h6>
                    <div className="text-center me-3">
                      <img src={vendor} alt="Vendor" className="rounded-circle" width="50" />
                      <p className="mb-0" style={{ fontSize: "12px", fontWeight: "bold" }}>{selectedLead.vendor}</p>
                    </div>
                    <p className="mb-1" style={{ fontSize: "12px", marginTop: "4%" }}><span className="text-muted">Vendor Received:</span> <strong>{selectedLead.vendorReceived}</strong></p>
                    <p className="mb-1" style={{ fontSize: "12px" }}><span className="text-muted">Vendor Responded:</span> <strong>{selectedLead.vendorResponded}</strong></p>
                    {/* <h6 className="fw-bold mt-3" style={{ fontSize: "14px" }}>Team Assignment:</h6>
                    <div className="d-flex">
                      <div className="text-center me-3">
                        <img src={vendor} alt="Karan" className="rounded-circle" width="50" />
                        <p className="mb-0" style={{ fontSize: "12px" }}>Karan</p>
                      </div>
                      <div className="text-center">
                        <img src={vendor2} alt="Arjun" className="rounded-circle" width="50" />
                        <p className="mb-0" style={{ fontSize: "12px" }}>Arjun</p>
                      </div>
                    </div> */}
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
                    <option value="Vendor1">Vendor 1</option>
                    <option value="Vendor2">Vendor 2</option>
                    <option value="Vendor3">Vendor 3</option>
                  </select>

                  <button className="btn btn-danger" style={{ borderRadius: "8px", fontSize: "10px" }}>Cancel Lead</button>
                </div>
              </div>
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
                        color: lead.services.some(s => s.category.includes("Painting")) ? "#008E00" : "red",
                      }}
                    >
                      {lead.services[0]?.category || "Unknown Service"}
                    </span>
                    <div style={styles.dateContainer}>
                      <span style={styles.bookingDate}>{lead.bookingDate}</span>
                      <span style={styles.bookingTime}>{lead.time}</span>
                      <Button
                        style={{
                          backgroundColor: lead.status === "Ongoing" ? "#E24F00" : "#FFC107",
                          borderColor: "transparent",
                          borderRadius: "20px",
                          fontSize: "12px"
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
  cardCity: { fontSize: "12px", color: "black" },
  noResults: { textAlign: "center", padding: "10px" },
};

export default OngoingLeads;