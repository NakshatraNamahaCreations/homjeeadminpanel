// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { FaMapMarkerAlt } from "react-icons/fa";
// import { Button } from "react-bootstrap";
// import { BASE_URL } from "../utils/config";

// const OngoingLeads = () => {
//   const navigate = useNavigate();

//   const [filterType, setFilterType] = useState("All Leads");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [cityFilter, setCityFilter] = useState("All Cities");
//   const [serviceFilter, setServiceFilter] = useState("All Services");
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [vendorFilter, setVendorFilter] = useState("All");
//   const [vendors, setVendors] = useState([]);

//   const [leads, setLeads] = useState([]);

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const tomorrow = new Date(today);
//   tomorrow.setDate(today.getDate() + 1);

//   // ----------------------------
//   // Fetch Vendors
//   // ----------------------------
//   useEffect(() => {
//     const fetchVendors = async () => {
//       try {
//         const res = await fetch(` ${BASE_URL}vendor/get-all-vendor`);

//         const data = await res.json();
//         setVendors(data?.vendor || []);
//       } catch (err) {
//         console.error("Vendor fetch error:", err);
//       }
//     };

//     fetchVendors();
//   }, []);

//   // ----------------------------
//   // IST Format Helper
//   // ----------------------------
//   const formatIST = (isoLike) => {
//     if (!isoLike) return { d: "N/A", t: "N/A" };
//     const d = new Date(isoLike);

//     return {
//       d: d.toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//         timeZone: "Asia/Kolkata",
//       }),
//       t: d.toLocaleTimeString("en-IN", {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//         timeZone: "Asia/Kolkata",
//       }),
//     };
//   };

//   // ----------------------------
//   // Fetch Leads
//   // ----------------------------
//   useEffect(() => {
//     const fetchLeads = async () => {
//       try {
//         const response = await fetch(
//           `${BASE_URL}/bookings/get-non-pending-leads`
//         );
//         const data = await response.json();

//         const mappedLeads = (data.allLeads || [])
//           .filter((lead) =>
//             [
//               "Confirmed", //accepted or responded
//               "Job Ongoing", // started - deep cleaning
//               "Survey Ongoing", //started - house painting
//               "Survey Completed", //ended - house painting
//               "Job Completed", //ended - deep cleaning
//               "Customer Cancelled", // from the vendor app
//               "Admin Cancelled", // from the vendor app
//               "Cancelled", // from the website by customer themself
//               "Customer Unreachable",
//               "Rescheduled", // rescheduled by vendor from vendor app
//               "Admin Cancelled",
//               "Pending Hiring", // mark hiring
//               "Hired", // first payment done
//               "Project Ongoing", // project started house painting
//               "Waiting for final payment",
//               "Project Completed", // project completed
//               "Negotiation",
//               "Set Remainder",
//             ].includes(lead?.bookingDetails?.status)
//           )
//           .map((lead) => {
//             const createdAtISO =
//               lead.createdDate || lead.bookingDetails?.bookingDate || null;

//             const { d: createdOnDate, t: createdOnTime } =
//               formatIST(createdAtISO);

//             return {
//               id: lead._id,
//               name: lead.customer?.name || "Unknown Customer",
//               services: lead.service || [],
//               formName: lead.formName || "—",
//               bookingDate: lead.selectedSlot?.slotDate
//                 ? new Date(lead.selectedSlot.slotDate).toLocaleDateString(
//                     "en-GB"
//                   )
//                 : "N/A",
//               time: lead.selectedSlot?.slotTime || "N/A",
//               city: lead.address
//                 ? `${lead.address.houseFlatNumber || ""}, ${
//                     lead.address.streetArea || ""
//                   }${lead.address.landMark ? `, ${lead.address.landMark}` : ""}`
//                 : "N/A",
//               status: lead.bookingDetails?.status || "N/A",
//               vendor: lead.assignedProfessional
//                 ? lead.assignedProfessional.name
//                 : "Unassigned",
//               createdAt: createdAtISO,
//               createdOnDate,
//               createdOnTime,
//               phone: lead.customer?.phone || "N/A",
//             };
//           });

//         const sorted = mappedLeads.sort(
//           (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//         );

//         setLeads(sorted);
//       } catch (err) {
//         console.error("Lead fetch error:", err);
//       }
//     };

//     fetchLeads();
//   }, []);

//   // ----------------------------
//   // Today/Tomorrow filtering logic
//   // ----------------------------
//   const filteredLeads = leads.filter((lead) => {
//     // Convert slot date to Date object
//     const slotDate = lead.bookingDate
//       ? new Date(lead.bookingDate.split("/").reverse().join("-"))
//       : null;

//     const isToday =
//       slotDate &&
//       slotDate.getFullYear() === today.getFullYear() &&
//       slotDate.getMonth() === today.getMonth() &&
//       slotDate.getDate() === today.getDate();

//     const isTomorrow =
//       slotDate &&
//       slotDate.getFullYear() === tomorrow.getFullYear() &&
//       slotDate.getMonth() === tomorrow.getMonth() &&
//       slotDate.getDate() === tomorrow.getDate();

//     const matchesFilterType =
//       filterType === "All Leads" ||
//       (filterType === "Today" && isToday) ||
//       (filterType === "Tomorrow" && isTomorrow);

//     const matchesCity =
//       cityFilter === "All Cities" || (lead.city || "").includes(cityFilter);

//     const matchesService =
//       serviceFilter === "All Services" ||
//       (lead.services || []).some((s) => s.category === serviceFilter);

//     const matchesStatus =
//       statusFilter === "All" || lead.status === statusFilter;

//     const matchesVendor =
//       vendorFilter === "All" || lead.vendor === vendorFilter;

//     const haystack = [
//       lead.name,
//       lead.city,
//       lead.vendor,
//       lead.status,
//       lead.formName,
//       lead.bookingDate,
//       lead.time,
//       ...(lead.services || []).map(
//         (s) => `${s.category} ${s.subCategory} ${s.serviceName}`
//       ),
//     ]
//       .filter(Boolean)
//       .join(" ")
//       .toLowerCase();

//     const matchesSearch = haystack.includes(searchQuery.toLowerCase());

//     return (
//       matchesFilterType &&
//       matchesCity &&
//       matchesService &&
//       matchesStatus &&
//       matchesVendor &&
//       matchesSearch
//     );
//   });

//   // ----------------------------
//   // JSX RETURN
//   // ----------------------------
//   return (
//     <div style={styles.container}>
//       {/* HEADER */}
//       <div style={styles.header}>
//         <h5 style={styles.heading}>Ongoing & Pending Leads</h5>

//         <div style={styles.filtersContainer}>
//           {["All Leads", "Today", "Tomorrow"].map((filter) => (
//             <button
//               key={filter}
//               onClick={() => setFilterType(filter)}
//               style={{
//                 ...styles.filterButton,
//                 backgroundColor: filterType === filter ? "red" : "transparent",
//                 color: filterType === filter ? "white" : "black",
//               }}
//             >
//               {filter}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* FILTERS */}
//       <div style={styles.filterRow}>
//         <select
//           style={styles.dropdown}
//           value={cityFilter}
//           onChange={(e) => setCityFilter(e.target.value)}
//         >
//           <option>All Cities</option>
//           <option>Bengaluru</option>
//           <option>Pune</option>
//         </select>

//         <select
//           style={styles.dropdown}
//           value={serviceFilter}
//           onChange={(e) => setServiceFilter(e.target.value)}
//         >
//           <option>All Services</option>
//           <option>House Painting</option>
//           <option>Deep Cleaning</option>
//         </select>

//         <select
//           style={styles.dropdown}
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//         >
//           <option value="All">All</option>

//           <option value="Confirmed">Confirmed</option>
//           <option value="Job Ongoing">Job Ongoing</option>
//           <option value="Survey Ongoing">Survey Ongoing</option>
//           <option value="Survey Completed">Survey Completed</option>
//           <option value="Job Completed">Job Completed</option>
//           <option value="Customer Cancelled">Customer Cancelled</option>
//           <option value="Cancelled">Cancelled</option>
//           <option value="Customer Unreachable">Customer Unreachable</option>
//           <option value="Admin Cancelled">Admin Cancelled</option>
//           <option value="Pending Hiring">Pending Hiring</option>
//           <option value="Hired">Hired</option>
//           <option value="Project Ongoing">Project Ongoing</option>
//           <option value="Waiting for final payment">
//             Waiting for final payment
//           </option>
//           <option value="Project Completed">Project Completed</option>
//           <option value="Negotiation">Negotiation</option>
//           <option value="Set Remainder">Set Remainder</option>
//         </select>

//         <select
//           style={styles.dropdown}
//           value={vendorFilter}
//           onChange={(e) => setVendorFilter(e.target.value)}
//         >
//           <option value="All">All Vendors</option>
//           {vendors.map((v) => (
//             <option key={v._id} value={v.vendor.vendorName}>
//               {v.vendor.vendorName}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* MAIN LIST */}
//       <div style={styles.leadsContainer}>
//         {filteredLeads.length > 0 ? (
//           filteredLeads.map((lead) => (
//             <div
//               key={lead.id}
//               style={styles.card}
//               onClick={() => navigate(`/lead-details/${lead.id}`)}
//             >
//               <div style={styles.cardHeader}>
//                 <span
//                   style={{
//                     fontSize: "14px",
//                     fontWeight: "bold",
//                     color: (lead.services || []).some((s) =>
//                       (s.category || "").includes("Painting")
//                     )
//                       ? "#008E00"
//                       : "red",
//                   }}
//                 >
//                   {lead.services?.[0]?.category || "Unknown Service"}
//                 </span>

//                 <div style={styles.dateContainer}>
//                   <span style={styles.bookingDate}>{lead.bookingDate}</span>
//                   <span style={styles.bookingTime}>{lead.time}</span>

//                   <Button
//                     style={{
//                       backgroundColor:
//                         lead.status === "Ongoing" ? "#E24F00" : "#FFC107",
//                       borderColor: "transparent",
//                       borderRadius: "20px",
//                       fontSize: "12px",
//                     }}
//                   >
//                     {lead.status}
//                   </Button>
//                 </div>
//               </div>

//               <div style={styles.cardBody}>
//                 <h5 style={styles.cardTitle}>{lead.name}</h5>
//                 <p style={styles.cardCity}>
//                   <FaMapMarkerAlt /> {lead.city}
//                 </p>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p style={styles.noResults}>No leads found.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// // ----------------------------
// // STYLES
// // ----------------------------
// const styles = {
//   container: { padding: "20px", fontFamily: "'Poppins', sans-serif" },

//   header: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: "20px",
//   },

//   heading: { fontSize: "18px", fontWeight: "bold" },

//   filtersContainer: { display: "flex", gap: "10px" },

//   filterButton: {
//     padding: "6px 12px",
//     borderRadius: "26px",
//     border: "1px solid #ccc",
//     cursor: "pointer",
//     fontSize: "12px",
//   },

//   filterRow: { display: "flex", gap: "10px", marginBottom: "15px" },

//   dropdown: {
//     padding: "8px",
//     borderRadius: "5px",
//     border: "1px solid #ccc",
//     fontSize: "12px",
//     minWidth: "120px",
//     whiteSpace: "nowrap",
//   },

//   leadsContainer: {
//     flex: 1,
//     display: "flex",
//     flexDirection: "column",
//     gap: "15px",
//   },

//   card: {
//     background: "#fff",
//     padding: "15px",
//     borderRadius: "8px",
//     boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
//     cursor: "pointer",
//   },

//   cardHeader: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginBottom: "5px",
//   },

//   dateContainer: {
//     textAlign: "right",
//     display: "flex",
//     flexDirection: "column",
//   },

//   bookingDate: { fontSize: "12px", fontWeight: 600 },
//   bookingTime: { fontSize: "12px", fontWeight: 600 },

//   cardBody: { marginTop: "-42px" },

//   cardTitle: { fontWeight: 700, fontSize: "14px" },

//   cardCity: { fontSize: "12px", marginTop: "3%" },

//   noResults: { textAlign: "center", padding: "10px" },
// };

// export default OngoingLeads;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";
import { Button } from "react-bootstrap";
import { BASE_URL } from "../utils/config";

const OngoingLeads = () => {
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState("All Leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [serviceFilter, setServiceFilter] = useState("All Services");
  const [statusFilter, setStatusFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [vendors, setVendors] = useState([]);

  const [leads, setLeads] = useState([]);

  // ✅ loader
  const [loading, setLoading] = useState(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // ----------------------------
  // Fetch Vendors
  // ----------------------------
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch(`${BASE_URL}vendor/get-all-vendor`);
        const data = await res.json();
        setVendors(data?.vendor || []);
      } catch (err) {
        console.error("Vendor fetch error:", err);
      }
    };

    fetchVendors();
  }, []);

  // ----------------------------
  // IST Format Helper
  // ----------------------------
  const formatIST = (isoLike) => {
    if (!isoLike) return { d: "N/A", t: "N/A" };
    const d = new Date(isoLike);

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

  // ----------------------------
  // Fetch Leads
  // ----------------------------
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${BASE_URL}/bookings/get-non-pending-leads`
        );
        const data = await response.json();

        const mappedLeads = (data.allLeads || [])
          .filter((lead) =>
            [
              "Confirmed",
              "Job Ongoing",
              "Survey Ongoing",
              "Survey Completed",
              "Job Completed",
              "Customer Cancelled",
              "Admin Cancelled",
              "Cancelled",
              "Customer Unreachable",
              "Rescheduled",
              "Pending Hiring",
              "Hired",
              "Project Ongoing",
              "Waiting for final payment",
              "Project Completed",
              "Negotiation",
              "Set Remainder",
            ].includes(lead?.bookingDetails?.status)
          )
          .map((lead) => {
            const createdAtISO =
              lead.createdDate || lead.bookingDetails?.bookingDate || null;

            const { d: createdOnDate, t: createdOnTime } =
              formatIST(createdAtISO);

            return {
              id: lead._id,
              name: lead.customer?.name || "Unknown Customer",
              services: lead.service || [],
              formName: lead.formName || "—",
              bookingDate: lead.selectedSlot?.slotDate
                ? new Date(lead.selectedSlot.slotDate).toLocaleDateString(
                    "en-GB"
                  )
                : "N/A",
              time: lead.selectedSlot?.slotTime || "N/A",
              city: lead.address
                ? `${lead.address.houseFlatNumber || ""}, ${
                    lead.address.streetArea || ""
                  }${lead.address.landMark ? `, ${lead.address.landMark}` : ""}`
                : "N/A",
              status: lead.bookingDetails?.status || "N/A",
              vendor: lead.assignedProfessional
                ? lead.assignedProfessional.name
                : "Unassigned",
              createdAt: createdAtISO,
              createdOnDate,
              createdOnTime,
              phone: lead.customer?.phone || "N/A",
            };
          });

        const sorted = mappedLeads.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setLeads(sorted);
      } catch (err) {
        console.error("Lead fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // ----------------------------
  // Today / Tomorrow filter
  // ----------------------------
  const filteredLeads = leads.filter((lead) => {
    const slotDate = lead.bookingDate
      ? new Date(lead.bookingDate.split("/").reverse().join("-"))
      : null;

    const isToday =
      slotDate &&
      slotDate.getFullYear() === today.getFullYear() &&
      slotDate.getMonth() === today.getMonth() &&
      slotDate.getDate() === today.getDate();

    const isTomorrow =
      slotDate &&
      slotDate.getFullYear() === tomorrow.getFullYear() &&
      slotDate.getMonth() === tomorrow.getMonth() &&
      slotDate.getDate() === tomorrow.getDate();

    const matchesFilterType =
      filterType === "All Leads" ||
      (filterType === "Today" && isToday) ||
      (filterType === "Tomorrow" && isTomorrow);

    const matchesCity =
      cityFilter === "All Cities" || (lead.city || "").includes(cityFilter);

    const matchesService =
      serviceFilter === "All Services" ||
      (lead.services || []).some((s) => s.category === serviceFilter);

    const matchesStatus =
      statusFilter === "All" || lead.status === statusFilter;

    const matchesVendor =
      vendorFilter === "All" || lead.vendor === vendorFilter;

    const haystack = [
      lead.name,
      lead.city,
      lead.vendor,
      lead.status,
      lead.formName,
      lead.bookingDate,
      lead.time,
      ...(lead.services || []).map(
        (s) => `${s.category} ${s.subCategory} ${s.serviceName}`
      ),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = haystack.includes(searchQuery.toLowerCase());

    return (
      matchesFilterType &&
      matchesCity &&
      matchesService &&
      matchesStatus &&
      matchesVendor &&
      matchesSearch
    );
  });

  // ----------------------------
  // LOADER
  // ----------------------------

  // ----------------------------
  // JSX RETURN
  // ----------------------------
  return (
    <div style={styles.container}>
      {/* HEADER */}
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

      {/* FILTERS */}
      <div style={styles.filterRow}>
        <select
          style={styles.dropdown}
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option>All Cities</option>
          <option>Bengaluru</option>
          <option>Pune</option>
        </select>

        <select
          style={styles.dropdown}
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
        >
          <option>All Services</option>
          <option>House Painting</option>
          <option>Deep Cleaning</option>
        </select>

        <select
          style={styles.dropdown}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Job Ongoing">Job Ongoing</option>
          <option value="Survey Ongoing">Survey Ongoing</option>
          <option value="Survey Completed">Survey Completed</option>
          <option value="Job Completed">Job Completed</option>
          <option value="Customer Cancelled">Customer Cancelled</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Customer Unreachable">Customer Unreachable</option>
          <option value="Admin Cancelled">Admin Cancelled</option>
          <option value="Pending Hiring">Pending Hiring</option>
          <option value="Hired">Hired</option>
          <option value="Project Ongoing">Project Ongoing</option>
          <option value="Waiting for final payment">
            Waiting for final payment
          </option>
          <option value="Project Completed">Project Completed</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Set Remainder">Set Remainder</option>
        </select>

        {/* <select
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
        </select> */}
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
      ) : (
        <div style={styles.leadsContainer}>
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                style={styles.card}
                onClick={() => navigate(`/lead-details/${lead.id}`)}
              >
                <div style={styles.cardHeader}>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: (lead.services || []).some((s) =>
                        (s.category || "").includes("Painting")
                      )
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
                        backgroundColor:
                          lead.status === "Ongoing" ? "#E24F00" : "#FFC107",
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
            <p style={styles.noResults}>No leads found.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ----------------------------
// STYLES
// ----------------------------
const styles = {
  container: { padding: "20px", fontFamily: "'Poppins', sans-serif" },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  heading: { fontSize: "18px", fontWeight: "bold" },

  filtersContainer: { display: "flex", gap: "10px" },

  filterButton: {
    padding: "6px 12px",
    borderRadius: "26px",
    border: "1px solid #ccc",
    cursor: "pointer",
    fontSize: "12px",
  },

  filterRow: { display: "flex", gap: "10px", marginBottom: "15px" },

  dropdown: {
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "12px",
    minWidth: "120px",
    whiteSpace: "nowrap",
  },

  leadsContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  card: {
    background: "#fff",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
    cursor: "pointer",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
  },

  dateContainer: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
  },

  bookingDate: { fontSize: "12px", fontWeight: 600 },
  bookingTime: { fontSize: "12px", fontWeight: 600 },

  cardBody: { marginTop: "-42px" },

  cardTitle: { fontWeight: 700, fontSize: "14px" },

  cardCity: { fontSize: "12px", marginTop: "3%" },

  noResults: { textAlign: "center", padding: "10px" },
};

export default OngoingLeads;
