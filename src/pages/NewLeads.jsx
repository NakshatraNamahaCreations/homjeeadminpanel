// // NewLeads.jsx
// import React, { useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { FaMapMarkerAlt } from "react-icons/fa";
// import { toast } from "react-toastify";
// import CreateLeadModal from "./CreateLeadModal";
// import { BASE_URL } from "../utils/config";

// const genUID = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// const toISTParts = (isoLike) => {
//   if (!isoLike) return { d: "N/A", t: "N/A" };
//   const d = new Date(isoLike);
//   if (isNaN(d.getTime())) return { d: "N/A", t: "N/A" };
//   const date = d.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//     timeZone: "Asia/Kolkata",
//   });
//   const time = d.toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true,
//     timeZone: "Asia/Kolkata",
//   });
//   return { d: date, t: time };
// };

// const NewLeads = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [showModal, setShowModal] = useState(false);
//   const [showAll, setShowAll] = useState(false);
//   const [city, setCity] = useState("");
//   const [service, setService] = useState("");
//   const [completedLeads, setCompletedLeads] = useState([]);

//   useEffect(() => {
//     if (location.state?.cancelled) {
//       toast.success("Lead is cancelled");
//       navigate(location.pathname, { replace: true });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [location]);

//   useEffect(() => {
//     const fetchAllLeads = async () => {
//       try {
//         const res = await fetch(`${BASE_URL}/bookings/get-pending-leads`);
//         if (!res.ok) throw new Error(`API error ${res.status}`);
//         const data = await res.json();

//         const leadsData = Array.isArray(data?.allLeads)
//           ? data.allLeads
//           : Array.isArray(data?.bookings)
//           ? data.bookings
//           : [];

//         const transformed = leadsData.map((booking, index) => {
//           const derivedFormName =
//             booking?.formName ||
//             booking?.form?.name ||
//             booking?.form?.title ||
//             booking?.meta?.formName ||
//             [
//               ...new Set(
//                 (booking?.service || []).map((s) => s?.category).filter(Boolean)
//               ),
//             ].join(", ") ||
//             "—";

//           const serviceNames = (booking?.service || [])
//             .map((s) => s?.serviceName)
//             .filter(Boolean)
//             .join(", ");

//           const serviceCategories = [
//             ...new Set(
//               (booking?.service || []).map((s) => s?.category).filter(Boolean)
//             ),
//           ].join(", ");

//           const rawSlotDate = booking?.selectedSlot?.slotDate;
//           const date = rawSlotDate
//             ? new Date(rawSlotDate).toLocaleDateString("en-GB", {
//                 day: "2-digit",
//                 month: "2-digit",
//                 year: "numeric",
//               })
//             : "N/A";
//           const time = booking?.selectedSlot?.slotTime || "N/A";

//           const streetArea =
//             booking?.address?.streetArea ||
//             booking?.address?.street ||
//             "Unknown Location";

//           const coords = booking?.address?.location?.coordinates;
//           const [lng, lat] =
//             Array.isArray(coords) && coords.length === 2 ? coords : [0, 0];

//           const createdAtISO =
//             booking?.createdDate || booking?.bookingDetails?.bookingDate || null;

//           const { d: createdAtLocalDate, t: createdAtLocalTime } =
//             toISTParts(createdAtISO);

//           // final transformed card object - also include raw for convenience
//           return {
//             id: booking?._id || `lead_${index + 1}`,
//             createdAt: createdAtISO,
//             createdAtLocalDate,
//             createdAtLocalTime,
//             date,
//             time,
//             name: booking?.customer?.name || "Unknown Customer",
//             contact: booking?.customer?.phone
//               ? `+91 ${booking.customer.phone}`
//               : "N/A",
//             formName: derivedFormName,
//             serviceCategory: serviceCategories,
//             serviceType: serviceNames,
//             location: streetArea,
//             status: booking?.bookingDetails?.status || "N/A",
//             filledData: {
//               serviceCategory: serviceCategories,
//               serviceType: serviceNames,
//               location: { name: streetArea, lat, lng },
//               houseNumber: booking?.address?.houseFlatNumber || "",
//               landmark: booking?.address?.landMark || "",
//               timeSlot: booking?.selectedSlot?.slotTime || "",
//               payment:
//                 booking?.bookingDetails?.paymentStatus === "Paid"
//                   ? `₹${booking?.bookingDetails?.paidAmount || 0} (Paid)`
//                   : "Unpaid",
//               assignedVendor: booking?.assignedProfessional?.name || "",
//               createdAtLocalDate,
//               createdAtLocalTime,
//             },
//             // IMPORTANT: include raw booking object so downstream pages can use it directly
//             raw: booking,
//           };
//         });

//         const sorted = transformed.sort((a, b) => {
//           const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
//           const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
//           return tb - ta;
//         });

//         setCompletedLeads(sorted);
//       } catch (err) {
//         console.error("Error loading leads:", err);
//         setCompletedLeads([]);
//       }
//     };

//     fetchAllLeads();
//   }, []);

//   // Filters
//   const filteredLeads = completedLeads.filter((lead) => {
//     const addr = (lead.location || lead.filledData?.location?.name || "").toLowerCase();
//     const category = (lead.serviceCategory || "").toLowerCase();
//     const cityMatch = city === "" || addr.includes(city.toLowerCase());
//     const serviceMatch = service === "" || category.includes(service.toLowerCase());
//     return cityMatch && serviceMatch;
//   });

//   return (
//     <div style={styles.container}>
//       <div style={styles.header}>
//         <h5 style={styles.heading}>New Leads</h5>

//         <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//           <select style={styles.dropdown} value={city} onChange={(e) => setCity(e.target.value)}>
//             <option value="">All Cities</option>
//             <option value="Bengaluru">Bengaluru</option>
//             <option value="Pune">Pune</option>
//           </select>

//           <select style={styles.dropdown} value={service} onChange={(e) => setService(e.target.value)}>
//             <option value="">All Services</option>
//             <option value="House Painting">House Painting</option>
//             <option value="Deep Cleaning">Deep Cleaning</option>
//           </select>

//           <button style={styles.buttonPrimary} onClick={() => setShowModal(true)}>
//             + Create New Lead/Enquiry
//           </button>
//         </div>
//       </div>

//       <div style={styles.leadList}>
//         {(showAll ? filteredLeads : filteredLeads.slice(0, 3)).map((lead) => (
//           <div key={lead.id} style={styles.leadCard}>
//             <div style={styles.leadDetails}>
//               <p style={{
//                 fontSize: 14,
//                 fontWeight: "bold",
//                 color: (lead.filledData?.serviceCategory || "").includes("Deep Cleaning") ? "red" : "#008E00",
//                 margin: 0
//               }}>
//                 {lead.filledData?.serviceCategory || "N/A"}
//               </p>

//               <p style={styles.leadName}>{lead.name}</p>

//               <p style={styles.leadInfo}>
//                 <FaMapMarkerAlt style={{ marginRight: "5px" }} />
//                 {lead.filledData?.location?.name || lead.location || "No Location"}
//               </p>
//             </div>

//             <div style={styles.leadTime}>
//               <p style={{ marginBottom: "1%", fontSize: "12px", fontWeight: "600" }}>
//                 {lead.date}
//               </p>
//               <p style={{ fontSize: "12px", fontWeight: "600" }}>{lead.time}</p>

//               {/* Navigate with full `lead` including raw booking - LeadDetails will prefer raw if present */}
//               <button
//                 style={styles.buttonView}
//                 onClick={() => navigate(`/lead-details/${lead.id}`, { state: { lead } })}
//               >
//                 View Details
//               </button>
//             </div>
//           </div>
//         ))}

//         {filteredLeads.length === 0 && (
//           <div style={styles.noLeadsWrap}>
//             <h2 style={styles.noLeadsText}>Lead not found</h2>
//             <p style={{ color: "#666" }}>Try changing filters or create a new lead.</p>
//           </div>
//         )}
//       </div>

//       {!showAll && filteredLeads.length > 3 && (
//         <button style={styles.buttonLoadMore} onClick={() => setShowAll(true)}>
//           Load More
//         </button>
//       )}

//       {showModal && <CreateLeadModal onClose={() => setShowModal(false)} />}
//     </div>
//   );
// };

// const styles = {
//    container: {
//     padding: "20px",
//     fontFamily: "'Poppins', sans-serif",
//     minHeight: "100vh",
//   },

//   heading: {
//     fontSize: "0.9rem",
//     fontWeight: "600",
//     marginBottom: "12px",
//   },

//   header: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     gap: 10,
//   },

//   dropdown: {
//     padding: "4px 8px",
//     borderRadius: 4,
//     border: "1px solid #ddd",
//     fontSize: "12px",
//   },

//   buttonPrimary: {
//     background: "#f0f0f0",
//     border: "none",
//     padding: "6px 10px",
//     borderRadius: 4,
//     cursor: "pointer",
//     fontSize: "12px",
//     fontWeight: "500",
//   },

//   leadList: {
//     marginTop: 18,
//     display: "flex",
//     flexDirection: "column",
//     gap: 10,
//   },

//   leadCard: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 12,
//     background: "#fff",
//     borderRadius: 6,
//     boxShadow: "0 3px 6px rgba(0,0,0,0.05)",
//   },

//   leadName: {
//     fontWeight: 600,
//     margin: "4px 0",
//     fontSize: "14px",
//   },

//   leadInfo: {
//     color: "#666",
//     fontSize: "12px",
//   },

//   leadTime: {
//     minWidth: 140,
//     textAlign: "right",
//   },

//   buttonView: {
//     marginTop: 6,
//     background: "#e83e3e",
//     color: "#fff",
//     padding: "5px 8px",
//     borderRadius: 6,
//     border: "none",
//     fontSize: "11px",
//     cursor: "pointer",
//     fontWeight: "500",
//   },

//   noLeadsWrap: {
//     padding: 30,
//     textAlign: "center",
//     background: "#fafafa",
//     borderRadius: 8,
//   },

//   noLeadsText: {
//     color: "#777",
//     margin: 0,
//     fontSize: "14px",
//   },

//   buttonLoadMore: {
//     marginTop: 16,
//     padding: "6px 10px",
//     borderRadius: 4,
//     border: "1px solid #ddd",
//     background: "#fff",
//     cursor: "pointer",
//     fontSize: "12px",
//   },
// };

// export default NewLeads;

// NewLeads.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import CreateLeadModal from "./CreateLeadModal";
import { BASE_URL } from "../utils/config";

const genUID = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const toISTParts = (isoLike) => {
  if (!isoLike) return { d: "N/A", t: "N/A" };
  const d = new Date(isoLike);
  if (isNaN(d.getTime())) return { d: "N/A", t: "N/A" };
  const date = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  return { d: date, t: time };
};

const NewLeads = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [completedLeads, setCompletedLeads] = useState([]);

  // ✅ loader state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.cancelled) {
      toast.success("Lead is cancelled");
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    const fetchAllLeads = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${BASE_URL}/bookings/get-pending-leads`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();

        const leadsData = Array.isArray(data?.allLeads)
          ? data.allLeads
          : Array.isArray(data?.bookings)
          ? data.bookings
          : [];

        const transformed = leadsData.map((booking, index) => {
          const derivedFormName =
            booking?.formName ||
            booking?.form?.name ||
            booking?.form?.title ||
            booking?.meta?.formName ||
            [
              ...new Set(
                (booking?.service || []).map((s) => s?.category).filter(Boolean)
              ),
            ].join(", ") ||
            "—";

          const serviceNames = (booking?.service || [])
            .map((s) => s?.serviceName)
            .filter(Boolean)
            .join(", ");

          const serviceCategories = [
            ...new Set(
              (booking?.service || []).map((s) => s?.category).filter(Boolean)
            ),
          ].join(", ");

          const rawSlotDate = booking?.selectedSlot?.slotDate;
          const date = rawSlotDate
            ? new Date(rawSlotDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "N/A";
          const time = booking?.selectedSlot?.slotTime || "N/A";

          const streetArea =
            booking?.address?.streetArea ||
            booking?.address?.street ||
            "Unknown Location";

          const coords = booking?.address?.location?.coordinates;
          const [lng, lat] =
            Array.isArray(coords) && coords.length === 2 ? coords : [0, 0];

          const createdAtISO =
            booking?.createdDate ||
            booking?.bookingDetails?.bookingDate ||
            null;

          const { d: createdAtLocalDate, t: createdAtLocalTime } =
            toISTParts(createdAtISO);

          return {
            id: booking?._id || `lead_${index + 1}`,
            createdAt: createdAtISO,
            createdAtLocalDate,
            createdAtLocalTime,
            date,
            time,
            name: booking?.customer?.name || "Unknown Customer",
            contact: booking?.customer?.phone
              ? `+91 ${booking.customer.phone}`
              : "N/A",
            formName: derivedFormName,
            serviceCategory: serviceCategories,
            serviceType: serviceNames,
            location: streetArea,
            status: booking?.bookingDetails?.status || "N/A",
            filledData: {
              serviceCategory: serviceCategories,
              serviceType: serviceNames,
              location: { name: streetArea, lat, lng },
              houseNumber: booking?.address?.houseFlatNumber || "",
              landmark: booking?.address?.landMark || "",
              timeSlot: booking?.selectedSlot?.slotTime || "",
              payment:
                booking?.bookingDetails?.paymentStatus === "Paid"
                  ? `₹${booking?.bookingDetails?.paidAmount || 0} (Paid)`
                  : "Unpaid",
              assignedVendor: booking?.assignedProfessional?.name || "",
              createdAtLocalDate,
              createdAtLocalTime,
            },
            raw: booking,
          };
        });

        const sorted = transformed.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });

        setCompletedLeads(sorted);
      } catch (err) {
        console.error("Error loading leads:", err);
        setCompletedLeads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLeads();
  }, []);

  const filteredLeads = completedLeads.filter((lead) => {
    const addr = (
      lead.location ||
      lead.filledData?.location?.name ||
      ""
    ).toLowerCase();
    const category = (lead.serviceCategory || "").toLowerCase();
    const cityMatch = city === "" || addr.includes(city.toLowerCase());
    const serviceMatch =
      service === "" || category.includes(service.toLowerCase());
    return cityMatch && serviceMatch;
  });



  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h5 style={styles.heading}>New Leads</h5>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            style={styles.dropdown}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">All Cities</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Pune">Pune</option>
          </select>

          <select
            style={styles.dropdown}
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">All Services</option>
            <option value="House Painting">House Painting</option>
            <option value="Deep Cleaning">Deep Cleaning</option>
          </select>

          <button
            style={styles.buttonPrimary}
            onClick={() => setShowModal(true)}
          >
            + Create New Lead/Enquiry
          </button>
        </div>
      </div>

      {loading ? (
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
          .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
          .loader-dots span:nth-child(3) { animation-delay: 0.4s; }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.6); opacity: 1; }
          }
        `}</style>
        </div>
      ) : (
        <>
          <div style={styles.leadList}>
            {(showAll ? filteredLeads : filteredLeads.slice(0, 3)).map(
              (lead) => (
                <div key={lead.id} style={styles.leadCard}>
                  <div style={styles.leadDetails}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        color: (
                          lead.filledData?.serviceCategory || ""
                        ).includes("Deep Cleaning")
                          ? "red"
                          : "#008E00",
                        margin: 0,
                      }}
                    >
                      {lead.filledData?.serviceCategory || "N/A"}
                    </p>

                    <p style={styles.leadName}>{lead.name}</p>

                    <p style={styles.leadInfo}>
                      <FaMapMarkerAlt style={{ marginRight: "5px" }} />
                      {lead.filledData?.location?.name ||
                        lead.location ||
                        "No Location"}
                    </p>
                  </div>

                  <div style={styles.leadTime}>
                    <p
                      style={{
                        marginBottom: "1%",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {lead.date}
                    </p>
                    <p style={{ fontSize: "12px", fontWeight: "600" }}>
                      {lead.time}
                    </p>

                    <button
                      style={styles.buttonView}
                      onClick={() =>
                        navigate(`/lead-details/${lead.id}`, {
                          state: { lead },
                        })
                      }
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )
            )}

            {filteredLeads.length === 0 && (
              <div style={styles.noLeadsWrap}>
                <h2 style={styles.noLeadsText}>Lead not found</h2>
                <p style={{ color: "#666" }}>
                  Try changing filters or create a new lead.
                </p>
              </div>
            )}
          </div>

          {!showAll && filteredLeads.length > 3 && (
            <button
              style={styles.buttonLoadMore}
              onClick={() => setShowAll(true)}
            >
              Load More
            </button>
          )}
        </>
      )}

      {showModal && <CreateLeadModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    fontFamily: "'Poppins', sans-serif",
    minHeight: "100vh",
  },
  heading: { fontSize: "0.9rem", fontWeight: "600", marginBottom: "12px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  dropdown: {
    padding: "4px 8px",
    borderRadius: 4,
    border: "1px solid #ddd",
    fontSize: "12px",
  },
  buttonPrimary: {
    background: "#f0f0f0",
    border: "none",
    padding: "6px 10px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
  },
  leadList: {
    marginTop: 18,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  leadCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    background: "#fff",
    borderRadius: 6,
    boxShadow: "0 3px 6px rgba(0,0,0,0.05)",
  },
  leadName: { fontWeight: 600, margin: "4px 0", fontSize: "14px" },
  leadInfo: { color: "#666", fontSize: "12px" },
  leadTime: { minWidth: 140, textAlign: "right" },
  buttonView: {
    marginTop: 6,
    background: "#e83e3e",
    color: "#fff",
    padding: "5px 8px",
    borderRadius: 6,
    border: "none",
    fontSize: "11px",
    cursor: "pointer",
    fontWeight: "500",
  },
  noLeadsWrap: {
    padding: 30,
    textAlign: "center",
    background: "#fafafa",
    borderRadius: 8,
  },
  noLeadsText: { color: "#777", margin: 0, fontSize: "14px" },
  buttonLoadMore: {
    marginTop: 16,
    padding: "6px 10px",
    borderRadius: 4,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontSize: "12px",
  },
};

export default NewLeads;
