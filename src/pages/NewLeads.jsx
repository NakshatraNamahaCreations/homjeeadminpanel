import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateLeadModal from "./CreateLeadModal";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const NewLeads = () => {
  const navigate = useNavigate();
   const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [completedLeads, setCompletedLeads] = useState([]);

  // helper to format a date to IST
  const toISTParts = (isoLike) => {
    if (!isoLike) return { d: "N/A", t: "N/A" };
    const d = new Date(isoLike);
    if (isNaN(d.getTime())) return { d: "N/A", t: "N/A" };
    const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" });
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
    return { d: date, t: time };
  };

   useEffect(() => {
    if (location.state?.cancelled) {
      toast.success("Lead is cancelled"); // ✅ show toast
      navigate(location.pathname, { replace: true }); 
      // clears the state so toast doesn't reappear on refresh
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchAllLeads = async () => {
      try {
        const res = await fetch("https://homjee-backend.onrender.com/api/bookings/get-all-leads");
        if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

        const data = await res.json();
        const leadsData = data?.allLeads || data?.bookings || [];

        const transformed = leadsData.map((booking, index) => {
          // ---- form name (derived) ----
          const derivedFormName =
            (
              booking?.formName ??
              booking?.form?.name ??
              booking?.form?.title ??
              booking?.meta?.formName
            ) ||
            [...new Set((booking?.service || []).map((s) => s?.category).filter(Boolean))].join(", ") ||
            "—";

          // ---- service names ----
          const serviceNames = (booking?.service || [])
            .map((s) => s?.serviceName)
            .filter(Boolean)
            .join(", ");

          // ---- unique service categories ----
          const serviceCategories = [
            ...new Set((booking?.service || []).map((s) => s?.category).filter(Boolean))
          ].join(", ");

          // ---- selected slot date/time (what you show as lead date/time) ----
          const rawSlotDate = booking?.selectedSlot?.slotDate; // e.g., "2025-09-09"
          const date = rawSlotDate
            ? new Date(rawSlotDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
            : "N/A";
          const time = booking?.selectedSlot?.slotTime || "N/A";

          // ---- location + coords ----
          const streetArea = booking?.address?.streetArea || "Unknown Location";
          const coords = booking?.address?.location?.coordinates; // [lng, lat]
          const [lng, lat] = Array.isArray(coords) && coords.length === 2 ? coords : [0, 0];

          // ---- created date/time (for Form Details) ----
          const createdAtISO = booking?.createdDate || booking?.bookingDetails?.bookingDate || null;
          const { d: createdAtLocalDate, t: createdAtLocalTime } = toISTParts(createdAtISO);

          return {
            id: booking?._id || index + 1,
            createdAt: createdAtISO,                // raw, for sorting
            createdAtLocalDate,                     // "DD/MM/YYYY" in IST
            createdAtLocalTime,                     // "HH:MM AM/PM" in IST
            date,                                   // selected slot date (existing)
            time,                                   // selected slot time (existing)
            name: booking?.customer?.name || "Unknown Customer",
            contact: booking?.customer?.phone ? `+91 ${booking.customer.phone}` : "N/A",
            formName: derivedFormName,
            serviceCategory: serviceCategories,
            serviceType: serviceNames,
            location: streetArea,
            status: booking?.bookingDetails?.status || "N/A",
            filledData: {
              serviceCategory: serviceCategories,
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
              // also pass created-at in case you prefer reading from filledData later
              createdAtLocalDate,
              createdAtLocalTime,
            },
          };
        });

        const sorted = transformed.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setCompletedLeads(sorted);
      } catch (err) {
        console.error("Error loading leads:", err);
        setCompletedLeads([]);
      }
    };

    fetchAllLeads();
  }, []);

  const filteredLeads = completedLeads.filter(
    (lead) =>
      (city === "" || (lead.location || "").toLowerCase().includes(city.toLowerCase())) &&
      (service === "" || (lead.serviceType || "").toLowerCase().includes(service.toLowerCase()))
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
                  color: (lead.filledData?.serviceCategory || "").includes("Deep Cleaning") ? "red" : "#008E00",
                }}
              >
                {lead.filledData?.serviceCategory || "N/A"}
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
  container: { padding: "20px", fontFamily: "'Poppins', sans-serif", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  heading: { fontWeight: "bold", color: "#333" },
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
  buttonView: { backgroundColor: "#ed1f24", color: "white", padding: "6px 12px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "10px" },
  buttonLoadMore: { color: "black", padding: "4px 10px", borderRadius: "10px", border: "black", cursor: "pointer", marginTop: "15px", fontWeight: "600", fontSize: "12px" },
};

export default NewLeads;
