import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateLeadModal from "./CreateLeadModal";
import { FaMapMarkerAlt } from "react-icons/fa";

const NewLeads = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [completedLeads, setCompletedLeads] = useState([]);

  // useEffect(() => {
  //   const fetchAllLeads = async () => {
  //     try {
  //       const res = await fetch("https://homjee-backend.onrender.com/api/bookings/get-all-leads");
  //       const data = await res.json();
  //       console.log("Fetched data:", data);

  //       const leadsData = data.allLeads || data.bookings || [];
  //       const transformed = leadsData.map((booking, index) => {
          
  //         const serviceNames = booking.service.map((s) => s.serviceName).join(", ");
  //         const categories = [...new Set(booking.service.map((s) => s.category))].join(", ");

  //         return {
  //           id: booking._id || index + 1,
  //           date: new Date(booking.bookingDetails.bookingDate).toLocaleDateString("en-GB", {
  //             day: "2-digit",
  //             month: "2-digit",
  //             year: "numeric",
  //           }),
  //           time: booking.bookingDetails.bookingTime,
  //           name: booking.customer.name,
  //           contact: "+91 " + booking.customer.phone,
  //           formName: categories,
  //           serviceType: serviceNames,
  //           location: booking.address.streetArea,
  //           status: booking.bookingDetails.status,
  //           filledData: {
  //             serviceType: serviceNames,
  //             location: {
  //               name: booking.address.streetArea || "Unknown Location",
  //               lat: booking.address.location?.coordinates?.[1] || 0, // Latitude: 12.9005387
  //               lng: booking.address.location?.coordinates?.[0] || 0, // Longitude: 77.5231078
  //             },
  //             houseNumber: booking.address.houseFlatNumber || "",
  //             landmark: booking.address.landMark || "",
  //             timeSlot: booking.selectedSlot?.slotTime || "",
  //             payment: `${
  //               booking.bookingDetails.paymentStatus === "Paid"
  //                 ? "₹" + booking.bookingDetails.paidAmount + " (Paid)"
  //                 : "Unpaid"
  //             }`,
  //             assignedVendor: booking.assignedProfessional?.name || "",
  //           },
  //         };
  //       });

  //       console.log("Transformed leads:", transformed); // Log transformed data
  //       setCompletedLeads(transformed);
  //     } catch (err) {
  //       console.error("Error loading leads:", err);
  //     }
  //   };

  //   fetchAllLeads();
  // }, []);


  useEffect(() => {
  const fetchAllLeads = async () => {
    try {
      const res = await fetch("https://homjee-backend.onrender.com/api/bookings/get-all-leads");
      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

      const data = await res.json();
      const leadsData = data?.allLeads || data?.bookings || [];

      const transformed = leadsData.map((booking, index) => {
        // ---- form name from backend with safe fallbacks ----
     // ---- form name from backend with safe fallbacks ----
const derivedFormName =
  (
    booking?.formName ??
    booking?.form?.name ??
    booking?.form?.title ??
    booking?.meta?.formName
  ) ||
  [...new Set((booking?.service || [])
    .map((s) => s?.category)
    .filter(Boolean))].join(", ") ||
  "—";


        // ---- service names ----
        const serviceNames = (booking?.service || [])
          .map((s) => s?.serviceName)
          .filter(Boolean)
          .join(", ");

        // ---- booking date/time (form filling date & time) ----
        const rawDate = booking?.bookingDetails?.bookingDate;
        const date = rawDate
          ? new Date(rawDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "N/A";
        const time = booking?.bookingDetails?.bookingTime || "N/A";

        // ---- location + coords ----
        const streetArea = booking?.address?.streetArea || "Unknown Location";
        const coords = booking?.address?.location?.coordinates; // [lng, lat]
        const [lng, lat] = Array.isArray(coords) && coords.length === 2 ? coords : [0, 0];

        return {
          id: booking?._id || index + 1,
          date,
          time,
          name: booking?.customer?.name || "Unknown Customer",
          contact: booking?.customer?.phone ? `+91 ${booking.customer.phone}` : "N/A",
          formName: derivedFormName,
          serviceType: serviceNames,
          location: streetArea,
          status: booking?.bookingDetails?.status || "N/A",
          filledData: {
            serviceType: serviceNames,
            location: {
              name: streetArea,
              lat,
              lng,
            },
            houseNumber: booking?.address?.houseFlatNumber || "",
            landmark: booking?.address?.landMark || "",
            timeSlot: booking?.selectedSlot?.slotTime || "",
            payment:
              booking?.bookingDetails?.paymentStatus === "Paid"
                ? `₹${booking?.bookingDetails?.paidAmount || 0} (Paid)`
                : "Unpaid",
            assignedVendor: booking?.assignedProfessional?.name || "",
          },
        };
      });

      setCompletedLeads(transformed);
    } catch (err) {
      console.error("Error loading leads:", err);
      setCompletedLeads([]);
    }
  };

  fetchAllLeads();
}, []);

  const filteredLeads = completedLeads.filter(
    (lead) =>
      (city === "" || lead.location.toLowerCase().includes(city.toLowerCase())) &&
      (service === "" || lead.serviceType.toLowerCase().includes(service.toLowerCase()))
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h5 style={styles.heading}>New Leads</h5>
        <div style={{ marginRight: "-35%" }}>
          <select style={styles.dropdown} value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">All Cities</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Mumbai">Mumbai</option>
          </select>
          <select style={styles.dropdown} value={service} onChange={(e) => setService(e.target.value)}>
            <option value="">All Services</option>
            <option value="House Painting">House Painting</option>
            <option value="Deep Cleaning">Deep Cleaning</option>
          </select>
        </div>
        <button style={styles.buttonPrimary} onClick={() => setShowModal(true)}>
          + Create New Lead/Enquiry
        </button>
      </div>

      <div style={styles.leadList}>
        {(showAll ? filteredLeads : filteredLeads.slice(0, 3)).map((lead) => (
          <div key={lead.id} style={styles.leadCard}>
            <div style={styles.leadDetails}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: lead.filledData?.serviceType === "Deep Cleaning" ? "red" : "#008E00",
                }}
              >
                {lead.formName}
              </p>
              <p style={styles.leadName}>{lead.name}</p>
              <p style={styles.leadInfo}>
                <FaMapMarkerAlt style={{ marginRight: "5px" }} />
                {lead.filledData?.location?.name || lead.location || "No Location"}
              </p>
            </div>
            <div style={styles.leadTime}>
              <p style={{ marginBottom: "1%", fontSize: "12px", fontWeight: "600" }}>{lead.date}</p>
              <p style={{ fontSize: "12px", fontWeight: "600" }}>{lead.time}</p>
              <button
                style={styles.buttonView}
                onClick={() => navigate(`/lead-details/${lead.id}`, { state: { lead } })}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {!showAll && filteredLeads.length > 3 && (
        <button style={styles.buttonLoadMore} onClick={() => setShowAll(true)}>
          Load More
        </button>
      )}

      {showModal && <CreateLeadModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

const styles = {
  container: { padding: "20px", fontFamily: "'Poppins', sans-serif", marginLeft: "", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  heading: { fontSize: "", fontWeight: "bold", color: "#333" },
  buttonPrimary: { color: "black", padding: "10px 15px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  dropdown: { padding: "8px", borderRadius: "5px", border: "1px solid #ccc", marginRight: "10px", fontSize: "12px" },
  leadList: { display: "flex", flexDirection: "column", gap: "12px" },
  leadCard: {
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leadDetails: { flex: 1, textAlign: "left" },
  leadTime: { textAlign: "right", fontSize: "14px" },
  leadName: { fontSize: "13px", fontWeight: "bold", color: "#333" },
  leadInfo: { fontSize: "12px", color: "#555", marginTop: "-13px" },
  leadService: { fontSize: "14px", fontWeight: "bold", color: "#008E00" },
  buttonView: { backgroundColor: "#ed1f24", color: "white", padding: "6px 12px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "10px" },
  buttonLoadMore: { color: "black", padding: "4px 10px", borderRadius: "10px", border: "black", cursor: "pointer", marginTop: "15px", fontWeight: "600", fontSize: "12px" },
};

export default NewLeads;