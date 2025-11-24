import React, { useState, useEffect, useMemo } from "react";
import { Container } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";
import { BASE_URL } from "../utils/config";
import { useNavigate } from "react-router-dom";

/** ---- API endpoints ---- */
const ENQUIRIES_API = `${BASE_URL}/bookings/get-all-enquiries`;
const LEADS_API = `${BASE_URL}/bookings/get-all-leads`;
const BOOKINGS_API = `${BASE_URL}/bookings/get-all-bookings`;

/** ---- Helpers ---- */
const monthShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmtDateLabel = (isoLike) => {
  if (!isoLike) return "";
  const today = new Date();
  const d = new Date(isoLike);
  if (isNaN(d)) return isoLike;
  const startOf = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const diff = (startOf(d) - startOf(today)) / (1000 * 60 * 60 * 24);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return `${d.getDate()} ${monthShort[d.getMonth()]} ${d.getFullYear()}`;
};

const fmtTime = (str) => str || "";

const inferCity = (street = "", options = []) => {
  const lower = street.toLowerCase();
  const found = options.filter((c) => c !== "All Cities")
    .find((city) => lower.includes(city.toLowerCase()));
  return found || "Bengaluru";
};

const pickDateForCard = (it) =>
  it?.selectedSlot?.slotDate || it?.bookingDetails?.bookingDate;

const pickTimeForCard = (it) =>
  it?.selectedSlot?.slotTime || it?.bookingDetails?.bookingTime || "";

const toCardRowEnquiry = (raw, cities) => {
  const street = raw?.address?.streetArea || raw?.address?.houseFlatNumber || "";
  return {
    _id:raw?._id,
    name: raw?.customer?.name || "—",
    date: fmtDateLabel(pickDateForCard(raw)),
    time: fmtTime(pickTimeForCard(raw)),
    service: raw?.service?.[0]?.category || "—",
    address: street,
    city: inferCity(street, cities),
  };
};

const toCardRowLead = (raw, cities) => {
  const street = raw?.address?.streetArea || raw?.address?.houseFlatNumber || "";
  return {
    _id:raw?._id,
    name: raw?.customer?.name || "—",
    date: fmtDateLabel(pickDateForCard(raw)),
    time: fmtTime(pickTimeForCard(raw)),
    service: raw?.service?.[0]?.category || "—",
    address: street,
    city: inferCity(street, cities),
  };
};

const formatDateInput = (d) => {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
};

/** --------------------------
 * PERIOD CALCULATIONS
 * -------------------------- */
const calculatePeriod = (type) => {
  const today = new Date();
  let start, end;

  switch (type) {
    case "last7":
      end = today;
      start = new Date();
      start.setDate(today.getDate() - 7);
      break;

    case "thisMonth":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;

    case "lastMonth":
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;

    case "thisQuarter": {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      start = new Date(today.getFullYear(), quarterStartMonth, 1);
      end = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
      break;
    }

    case "lastQuarter": {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3 - 3;
      start = new Date(today.getFullYear(), quarterStartMonth, 1);
      end = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
      break;
    }

    case "thisYear":
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
      break;

    case "lastYear":
      start = new Date(today.getFullYear() - 1, 0, 1);
      end = new Date(today.getFullYear() - 1, 11, 31);
      break;

    case "all":
      start = "";
      end = "";
      break;

    default:
      return null;
  }

  return {
    start: start ? formatDateInput(start) : "",
    end: end ? formatDateInput(end) : "",
  };
};

const Dashboard = () => {
  /** NEW: Period state */
  const [period, setPeriod] = useState("thisMonth");

  /** Old filters */
  const [service, setService] = useState("All Services");
  const [city, setCity] = useState("All Cities");

  /** Default this month */
  const thisMonthPeriod = calculatePeriod("thisMonth");

  const [customDate, setCustomDate] = useState({
    start: thisMonthPeriod.start,
    end: thisMonthPeriod.end,
  });

  const navigate = useNavigate();

  const periodOptions = [
    { value: "last7", label: "Last 7 Days" },
    { value: "thisMonth", label: "This Month" },
    { value: "lastMonth", label: "Last Month" },
    { value: "thisQuarter", label: "This Quarter" },
    { value: "lastQuarter", label: "Last Quarter" },
    { value: "thisYear", label: "This Year" },
    { value: "lastYear", label: "Last Year" },
    { value: "all", label: "All Time" },
    { value: "custom", label: "Custom Period" },
  ];

  const serviceOptions = [
    "All Services",
    "House Painting",
    "Deep Cleaning",
    "Home Interior",
    "Packers & Movers",
  ];

  const cityOptions = ["All Cities", "Bengaluru", "Pune"];

  const [enquiriesRaw, setEnquiriesRaw] = useState([]);
  const [leadsRaw, setLeadsRaw] = useState([]);
  const [updatedKeyMetrics, setUpdatedKeyMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /** 🆕 Active tab */
  const [activeTab, setActiveTab] = useState("enquiries");

  /** 🆕 When period changes, auto calculate dates */
  useEffect(() => {
    if (period !== "custom") {
      const range = calculatePeriod(period);
      if (range) setCustomDate(range);
    }
  }, [period]);

  /** SEARCH */
  const handleSearch = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setHasSearched(true);

    const startDate = period === "all" ? "" : customDate.start;
    const endDate = period === "all" ? "" : customDate.end;

    try {
      const [enqRes, leadsRes, bookingsRes] = await Promise.all([
        axios.get(ENQUIRIES_API, {
          params: {
            service: service === "All Services" ? "" : service,
            city: city === "All Cities" ? "" : city,
            startDate,
            endDate,
          },
        }),
        axios.get(LEADS_API, {
          params: {
            service: service === "All Services" ? "" : service,
            city: city === "All Cities" ? "" : city,
            startDate,
            endDate,
          },
        }),
        axios.get(BOOKINGS_API, {
          params: {
            service: service === "All Services" ? "" : service,
            city: city === "All Cities" ? "" : city,
            startDate,
            endDate,
          },
        }),
      ]);

      const enqs = enqRes.data?.allEnquies || [];
      const leads = leadsRes.data?.allLeads || [];
      const bookings = bookingsRes.data?.bookings || [];

      setEnquiriesRaw(enqs);
      setLeadsRaw(leads);

      const sales = bookings.reduce(
        (acc, b) => acc + (Number(b.bookingDetails?.paidAmount) || 0),
        0
      );

      const amountYetToPay = bookings.reduce(
        (acc, b) => acc + (Number(b.bookingDetails?.amountYetToPay) || 0),
        0
      );

      const statuses = ["Ongoing","Pending","Job Ongoing","Job Ended"];
      const ongoing = leads.filter((l) => statuses.includes(l?.bookingDetails?.status)).length;

      const upcoming = leads.filter((l) => {
        const d = new Date(l?.selectedSlot?.slotDate);
        const t = new Date();
        const diff =
          (new Date(d.getFullYear(), d.getMonth(), d.getDate()) -
            new Date(t.getFullYear(), t.getMonth(), t.getDate())) /
          (1000 * 60 * 60 * 24);
        return diff === 1 || diff === 2;
      }).length;

      setUpdatedKeyMetrics([
        { title: "Total Sales", value: sales, trend: "+10%" },
        { title: "Amount Yet to Be Collected", value: amountYetToPay, trend: "-5%" },
        { title: "Total Leads", value: leads.length, trend: "+8%" },
        { title: "Ongoing Projects", value: ongoing, trend: "+2%" },
        { title: "Upcoming Projects", value: upcoming, trend: "-3%" },
      ]);
    } catch (e) {
      alert("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const enquiries = useMemo(
    () => enquiriesRaw.map((r) => toCardRowEnquiry(r, cityOptions)),
    [enquiriesRaw]
  );

  const newLeads = useMemo(
    () => leadsRaw.map((r) => toCardRowLead(r, cityOptions)),
    [leadsRaw]
  );

  const last4Enquiries = enquiries.slice(-4);
  const last4Leads = newLeads.slice(-4);

  const openDetails = (id, type) => {
    if(type === "enq") navigate(`/enquiry-details/${id}`);
    if(type === "lead") navigate(`/lead-details/${id}`);
  };

  return (
    <Container fluid style={styles.container}>

      {/* ---------- Filters ---------- */}
      <div style={styles.filters}>
        <Dropdown value={service} onChange={setService} options={serviceOptions} />
        <Dropdown value={city} onChange={setCity} options={cityOptions} />

        {/* PERIOD DROPDOWN */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={styles.dropdown}
        >
          {periodOptions.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* CUSTOM DATE RANGE ONLY IF CUSTOM SELECTED */}
        {period === "custom" && (
          <>
            <input
              type="date"
              style={styles.dateInput}
              value={customDate.start}
              onChange={(e) =>
                setCustomDate({ ...customDate, start: e.target.value })
              }
            />

            <input
              type="date"
              style={styles.dateInput}
              value={customDate.end}
              onChange={(e) =>
                setCustomDate({ ...customDate, end: e.target.value })
              }
            />
          </>
        )}

        <button
          onClick={handleSearch}
          style={styles.searchButton}
          disabled={isLoading}
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* ---------- Metrics ---------- */}
      <div style={styles.metricsGrid}>
        {updatedKeyMetrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>

      {/* ---------- Tabs ---------- */}
      <div style={styles.tabContainer}>
        <div
          style={activeTab === "enquiries" ? styles.activeTab : styles.inactiveTab}
          onClick={() => setActiveTab("enquiries")}
        >
          Enquiries ({enquiries.length})
        </div>

        <div
          style={activeTab === "leads" ? styles.activeTab : styles.inactiveTab}
          onClick={() => setActiveTab("leads")}
        >
          New Leads ({newLeads.length})
        </div>
      </div>

      {/* ---------- Cards ---------- */}
      <div style={styles.cardContainer}>
        {hasSearched ? (
          <>
            {activeTab === "enquiries" &&
              last4Enquiries.map((item) => (
                <div
                  key={item?._id}
                  style={styles.card}
                  onClick={() => openDetails(item?._id, "enq")}
                >
                  <div style={styles.cardRow}>
                    <span style={styles.serviceTag}>{item.service}</span>
                    <span style={styles.dateTag}>{item.date}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <h4 style={styles.cardTitle}>{item.name}</h4>
                    <span style={styles.timeTag}>{item.time}</span>
                  </div>
                  <p style={styles.cardText}>
                    <FaMapMarkerAlt /> {item.address}
                  </p>
                </div>
              ))}

            {activeTab === "leads" &&
              last4Leads.map((item) => (
                <div
                  key={item?._id}
                  style={styles.card}
                  onClick={() => openDetails(item?._id, "lead")}
                >
                  <div style={styles.cardRow}>
                    <span style={styles.serviceTag}>{item.service}</span>
                    <span style={styles.dateTag}>{item.date}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <h4 style={styles.cardTitle}>{item.name}</h4>
                    <span style={styles.timeTag}>{item.time}</span>
                  </div>
                  <p style={styles.cardText}>
                    <FaMapMarkerAlt /> {item.address}
                  </p>
                </div>
              ))}
          </>
        ) : (
          <div style={styles.placeholder}>Click Search to see results</div>
        )}
      </div>
    </Container>
  );
};

/** Reusable Dropdown */
const Dropdown = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={styles.dropdown}
  >
    {options.map((o) => (
      <option key={o}>{o}</option>
    ))}
  </select>
);

/** Cards */
const MetricCard = ({ title, value, trend }) => {
  const isRupee =
    title === "Total Sales" ||
    title === "Amount Yet to Be Collected";

  return (
    <div style={styles.metricCard}>
      <h3 style={styles.metricTitle}>{title}</h3>
      <p style={styles.metricValue}>
        {isRupee ? `₹ ${value?.toLocaleString?.()}` : value}
      </p>
      <p
        style={{
          color: trend.includes("+") ? "green" : "red",
          fontSize: 12,
          fontWeight: "bold",
        }}
      >
        {trend}
      </p>
    </div>
  );
};

/** Styles */
export const styles = {
  container: { padding: 20, fontFamily: "'Poppins', sans-serif" },
  filters: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  dropdown: {
    padding: 10,
    borderRadius: 5,
    border: "1px solid #ccc",
    fontSize: 12,
    width: 150,
  },
  dateInput: {
    padding: 10,
    borderRadius: 5,
    border: "1px solid #ccc",
    fontSize: 12,
    width: 150,
  },
  searchButton: {
    padding: "10px 20px",
    background: "#3a3c3dff",
    borderRadius: 5,
    border:"none",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: 20,
  },
  metricCard: {
    padding: 15,
    borderRadius: 10,
    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  metricTitle: { fontSize: 12, color: "#666" },
  metricValue: { fontSize: 18, fontWeight: "bold" },
  tabContainer: {
    display: "flex",
    marginTop: 20,
    marginBottom: 10,
    gap: 10,
    fontSize:12
  },
  activeTab: {
    flex: 1,
    padding: 10,
    background: "#ececec",
    borderRadius: 5,
    textAlign: "center",
    fontWeight: "bold",
    cursor: "pointer",
  },
  inactiveTab: {
    flex: 1,
    padding: 10,
    background: "#f7f7f7",
    borderRadius: 5,
    textAlign: "center",
    cursor: "pointer",
    opacity: 0.6,
  },
  cardContainer: {
    marginTop: 20,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  card: {
    padding: 15,
    width: 220,
    borderRadius: 8,
    background: "#fff",
    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
    cursor: "pointer",
  },
  cardRow: { display: "flex", justifyContent: "space-between" },
  serviceTag: { fontSize: 12, color: "red", fontWeight: 600 },
  dateTag: {
    fontSize: 10,
    background: "#eee",
    padding: "2px 5px",
    borderRadius: 4,
  },
  timeTag: { fontSize: 10, color: "#444" },
  cardTitle: { fontSize: 12, fontWeight: 600 },
  cardText: { fontSize: 12, marginTop: 8 },
  placeholder: { marginTop: 40, fontSize: 16, color: "#777" },
};

export default Dashboard;


// import React, { useState, useEffect, useMemo } from "react";
// import { Container } from "react-bootstrap";
// import { FaMapMarkerAlt } from "react-icons/fa";
// import axios from "axios";
// import { BASE_URL } from "../utils/config";
// import { useNavigate } from "react-router-dom";

// /** ---- API endpoints ---- */
// const ENQUIRIES_API = `${BASE_URL}/bookings/get-all-enquiries`;
// const LEADS_API = `${BASE_URL}/bookings/get-all-leads`;
// const BOOKINGS_API = `${BASE_URL}/bookings/get-all-bookings`;

// /** ---- Helpers ---- */
// const monthShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// const fmtDateLabel = (isoLike) => {
//   if (!isoLike) return "";
//   const today = new Date();
//   const d = new Date(isoLike);
//   if (isNaN(d)) return isoLike;
//   const startOf = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
//   const diff = (startOf(d) - startOf(today)) / (1000 * 60 * 60 * 24);
//   if (diff === 0) return "Today";
//   if (diff === -1) return "Yesterday";
//   if (diff === 1) return "Tomorrow";
//   return `${d.getDate()} ${monthShort[d.getMonth()]} ${d.getFullYear()}`;
// };

// const fmtTime = (str) => str || "";

// const inferCity = (street = "", options = []) => {
//   const lower = street.toLowerCase();
//   const found = options.filter((c) => c !== "All Cities")
//     .find((city) => lower.includes(city.toLowerCase()));
//   return found || "Bengaluru";
// };

// const pickDateForCard = (it) =>
//   it?.selectedSlot?.slotDate || it?.bookingDetails?.bookingDate;

// const pickTimeForCard = (it) =>
//   it?.selectedSlot?.slotTime || it?.bookingDetails?.bookingTime || "";

// const toCardRowEnquiry = (raw, cities) => {
//   const street = raw?.address?.streetArea || raw?.address?.houseFlatNumber || "";
//   return {
//     _id:raw?._id,
//     name: raw?.customer?.name || "—",
//     date: fmtDateLabel(pickDateForCard(raw)),
//     time: fmtTime(pickTimeForCard(raw)),
//     service: raw?.service?.[0]?.category || "—",
//     address: street,
//     city: inferCity(street, cities),
//   };
// };

// const toCardRowLead = (raw, cities) => {
//   const street = raw?.address?.streetArea || raw?.address?.houseFlatNumber || "";
//   return {
//       _id:raw?._id,
//     name: raw?.customer?.name || "—",
//     date: fmtDateLabel(pickDateForCard(raw)),
//     time: fmtTime(pickTimeForCard(raw)),
//     service: raw?.service?.[0]?.category || "—",
//     address: street,
//     city: inferCity(street, cities),
//   };
// };

// const formatDateInput = (d) => {
//   if (!d) return "";
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2,"0");
//   const dd = String(d.getDate()).padStart(2,"0");
//   return `${yyyy}-${mm}-${dd}`;
// };

// const Dashboard = () => {
//   const [service, setService] = useState("All Services");
//   const [city, setCity] = useState("All Cities");

//   const today = new Date();
//   const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
//   const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

//   const [customDate, setCustomDate] = useState({
//     start: formatDateInput(firstDay),
//     end: formatDateInput(lastDay),
//   });
  
//   const navigate = useNavigate()

//   const serviceOptions = [
//     "All Services",
//     "House Painting",
//     "Deep Cleaning",
//     "Home Interior",
//     "Packers & Movers",
//   ];

//   const cityOptions = ["All Cities", "Bengaluru", "Pune"];

//   const [enquiriesRaw, setEnquiriesRaw] = useState([]);
//   const [leadsRaw, setLeadsRaw] = useState([]);
//   const [updatedKeyMetrics, setUpdatedKeyMetrics] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [hasSearched, setHasSearched] = useState(false);

//   /** 🆕 Active tab state */
//   const [activeTab, setActiveTab] = useState("enquiries");

//   /** 🔥 SEARCH */
//   const handleSearch = async () => {
//     if (isLoading) return;

//     setIsLoading(true);
//     setHasSearched(true);

//     const startDate =
//       customDate.start && customDate.end ? customDate.start : "";
//     const endDate =
//       customDate.start && customDate.end ? customDate.end : "";

//     try {
//       const [enqRes, leadsRes, bookingsRes] = await Promise.all([
//         axios.get(ENQUIRIES_API, {
//           params: {
//             service: service === "All Services" ? "" : service,
//             city: city === "All Cities" ? "" : city,
//             startDate,
//             endDate,
//           },
//         }),
//         axios.get(LEADS_API, {
//           params: {
//             service: service === "All Services" ? "" : service,
//             city: city === "All Cities" ? "" : city,
//             startDate,
//             endDate,
//           },
//         }),
//         axios.get(BOOKINGS_API, {
//           params: {
//             service: service === "All Services" ? "" : service,
//             city: city === "All Cities" ? "" : city,
//             startDate,
//             endDate,
//           },
//         }),
//       ]);

//       const enqs = enqRes.data?.allEnquies || [];
//       const leads = leadsRes.data?.allLeads || [];
//       const bookings = bookingsRes.data?.bookings || [];

//       setEnquiriesRaw(enqs);
//       setLeadsRaw(leads);

//       const sales = bookings.reduce(
//         (acc, b) => acc + (Number(b.bookingDetails?.paidAmount) || 0),
//         0
//       );

//       const amountYetToPay = bookings.reduce(
//         (acc, b) => acc + (Number(b.bookingDetails?.amountYetToPay) || 0),
//         0
//       );

//       const statuses = ["Ongoing","Pending","Job Ongoing","Job Ended"];
//       const ongoing = leads.filter((l) => statuses.includes(l?.bookingDetails?.status)).length;

//       const upcoming = leads.filter((l) => {
//         const d = new Date(l?.selectedSlot?.slotDate);
//         const t = new Date();
//         const diff =
//           (new Date(d.getFullYear(), d.getMonth(), d.getDate()) -
//             new Date(t.getFullYear(), t.getMonth(), t.getDate())) /
//           (1000 * 60 * 60 * 24);
//         return diff === 1 || diff === 2;
//       }).length;

//       setUpdatedKeyMetrics([
//         { title: "Total Sales", value: sales, trend: "+10%" },
//         { title: "Amount Yet to Be Collected", value: amountYetToPay, trend: "-5%" },
//         { title: "Total Leads", value: leads.length, trend: "+8%" },
//         { title: "Ongoing Projects", value: ongoing, trend: "+2%" },
//         { title: "Upcoming Projects", value: upcoming, trend: "-3%" },
//       ]);
//     } catch (e) {
//       alert("Failed to fetch data");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     handleSearch();
//   }, []);

//   const enquiries = useMemo(
//     () => enquiriesRaw.map((r) => toCardRowEnquiry(r, cityOptions)),
//     [enquiriesRaw]
//   );

//   const newLeads = useMemo(
//     () => leadsRaw.map((r) => toCardRowLead(r, cityOptions)),
//     [leadsRaw]
//   );

//   const last4Enquiries = enquiries.slice(-4);
//   const last4Leads = newLeads.slice(-4);

//    const openDetails = (id, type) => {
//     if(type === "enq"){
//       navigate(`/enquiry-details/${id}`);
//     }
//     if(type === "lead"){
//       navigate(`/lead-details/${id}`);
//     }
//   };

//   useEffect(()=>{
//     console.log("last4Enquiries", last4Enquiries)
//     console.log("last4Leads", last4Leads)
//   })
//   return (
//     <Container fluid style={styles.container}>

//       {/* ---------- Filters ---------- */}
//       <div style={styles.filters}>
//         <Dropdown value={service} onChange={setService} options={serviceOptions} />
//         <Dropdown value={city} onChange={setCity} options={cityOptions} />

//         <input
//           type="date"
//           style={styles.dateInput}
//           value={customDate.start}
//           onChange={(e) =>
//             setCustomDate({ ...customDate, start: e.target.value })
//           }
//         />

//         <input
//           type="date"
//           style={styles.dateInput}
//           value={customDate.end}
//           onChange={(e) =>
//             setCustomDate({ ...customDate, end: e.target.value })
//           }
//         />

//         <button
//           onClick={handleSearch}
//           style={styles.searchButton}
//           disabled={isLoading}
//         >
//           {isLoading ? "Searching..." : "Search"}
//         </button>
//       </div>

//       {/* ---------- Metrics ---------- */}
//       <div style={styles.metricsGrid}>
//         {updatedKeyMetrics.map((m, i) => (
//           <MetricCard key={i} {...m} />
//         ))}
//       </div>

//       {/* ---------- Tabs ---------- */}
//       <div style={styles.tabContainer}>
//         <div
//           style={activeTab === "enquiries" ? styles.activeTab : styles.inactiveTab}
//           onClick={() => setActiveTab("enquiries")}
//         >
//           Enquiries ({enquiries.length})
//         </div>

//         <div
//           style={activeTab === "leads" ? styles.activeTab : styles.inactiveTab}
//           onClick={() => setActiveTab("leads")}
//         >
//           New Leads ({newLeads.length})
//         </div>
//       </div>

//       {/* ---------- Cards ---------- */}
//       <div style={styles.cardContainer}>
//         {hasSearched ? (
//           <>
//             {activeTab === "enquiries" &&
//               last4Enquiries.map((item, index) => (
//                 <div key={item?._id} style={styles.card} onClick={()=>openDetails(item?._id, "enq")}>
//                   <div style={styles.cardRow}>
//                     <span style={styles.serviceTag}>{item.service}</span>
//                     <span style={styles.dateTag}>{item.date}</span>
//                   </div>
//                   <div style={styles.cardRow}>
//                     <h4 style={styles.cardTitle}>{item.name}</h4>
//                     <span style={styles.timeTag}>{item.time}</span>
//                   </div>
//                   <p style={styles.cardText}>
//                     <FaMapMarkerAlt /> {item.address}
//                   </p>
//                 </div>
//               ))}

//             {activeTab === "leads" &&
//               last4Leads.map((item, index) => (
//                 <div key={index} style={styles.card} onClick={()=>openDetails(item?._id, "lead")}>
//                   <div style={styles.cardRow}>
//                     <span style={styles.serviceTag}>{item.service}</span>
//                     <span style={styles.dateTag}>{item.date}</span>
//                   </div>
//                   <div style={styles.cardRow}>
//                     <h4 style={styles.cardTitle}>{item.name}</h4>
//                     <span style={styles.timeTag}>{item.time}</span>
//                   </div>
//                   <p style={styles.cardText}>
//                     <FaMapMarkerAlt /> {item.address}
//                   </p>
//                 </div>
//               ))}
//           </>
//         ) : (
//           <div style={styles.placeholder}>Click Search to see results</div>
//         )}
//       </div>
//     </Container>
//   );
// };

// const Dropdown = ({ value, onChange, options }) => (
//   <select
//     value={value}
//     onChange={(e) => onChange(e.target.value)}
//     style={styles.dropdown}
//   >
//     {options.map((o) => (
//       <option key={o}>{o}</option>
//     ))}
//   </select>
// );

// const MetricCard = ({ title, value, trend }) => {
//   const isRupee =
//     title === "Total Sales" ||
//     title === "Amount Yet to Be Collected";

//   return (
//     <div style={styles.metricCard}>
//       <h3 style={styles.metricTitle}>{title}</h3>
//       <p style={styles.metricValue}>
//         {isRupee ? `₹ ${value?.toLocaleString?.()}` : value}
//       </p>
//       <p
//         style={{
//           color: trend.includes("+") ? "green" : "red",
//           fontSize: 12,
//           fontWeight: "bold",
//         }}
//       >
//         {trend}
//       </p>
//     </div>
//   );
// };

// export const styles = {
//   container: { padding: 20, fontFamily: "'Poppins', sans-serif" },
//   filters: { display: "flex", gap: 10, marginBottom: 20 },
//   dropdown: {
//     padding: 10,
//     borderRadius: 5,
//     border: "1px solid #ccc",
//     fontSize: 12,
//     width: 150,
//   },
//   dateInput: {
//     padding: 10,
//     borderRadius: 5,
//     border: "1px solid #ccc",
//     fontSize: 12,
//     width: 150,
//   },
//   searchButton: {
//     padding: "10px 20px",
//     background: "#007bff",
//     borderRadius: 5,
//     border:"none",
//     color: "#fff",
//     cursor: "pointer",
//     fontSize: 12,
//   },
//   metricsGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
//     gap: 20,
//   },
//   metricCard: {
//     padding: 15,
//     borderRadius: 10,
//     boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
//     textAlign: "center",
//   },
//   metricTitle: { fontSize: 12, color: "#666" },
//   metricValue: { fontSize: 18, fontWeight: "bold" },
//   tabContainer: {
//     display: "flex",
//     marginTop: 20,
//     marginBottom: 10,
//     gap: 10,
//     fontSize:12
//   },
//   activeTab: {
//     flex: 1,
//     padding: 10,
//     background: "#ececec",
//     borderRadius: 5,
//     textAlign: "center",
//     fontWeight: "bold",
//     cursor: "pointer",
//   },
//   inactiveTab: {
//     flex: 1,
//     padding: 10,
//     background: "#f7f7f7",
//     borderRadius: 5,
//     textAlign: "center",
//     cursor: "pointer",
//     opacity: 0.6,
//   },
//   cardContainer: {
//     marginTop: 20,
//     display: "flex",
//     gap: 10,
//     flexWrap: "wrap",
//     justifyContent: "center",
//   },
//   card: {
//     padding: 15,
//     width: 220,
//     borderRadius: 8,
//     background: "#fff",
//     boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
//   },
//   cardRow: { display: "flex", justifyContent: "space-between" },
//   serviceTag: { fontSize: 12, color: "red", fontWeight: 600 },
//   dateTag: {
//     fontSize: 10,
//     background: "#eee",
//     padding: "2px 5px",
//     borderRadius: 4,
//   },
//   timeTag: { fontSize: 10, color: "#444" },
//   cardTitle: { fontSize: 12, fontWeight: 600 },
//   cardText: { fontSize: 12, marginTop: 8 },
//   placeholder: { marginTop: 40, fontSize: 16, color: "#777" },
// };

// export default Dashboard;


// import React, { useState, useEffect, useMemo } from "react";
// import { Container } from "react-bootstrap";
// import { FaMapMarkerAlt } from "react-icons/fa";
// import axios from "axios";
// import { BASE_URL } from "../utils/config";

// /** ---- API endpoints ---- */
// const ENQUIRIES_API = `${BASE_URL}/bookings/get-all-enquiries`;
// const LEADS_API = `${BASE_URL}/bookings/get-all-leads`;
// const BOOKINGS_API = `${BASE_URL}/bookings/get-all-bookings`;

// /** ---- Helpers ---- */
// const monthShort = [
//   "Jan",
//   "Feb",
//   "Mar",
//   "Apr",
//   "May",
//   "Jun",
//   "Jul",
//   "Aug",
//   "Sep",
//   "Oct",
//   "Nov",
//   "Dec",
// ];

// const fmtDateLabel = (isoLike) => {
//   if (!isoLike) return "";
//   const today = new Date();
//   const d = new Date(isoLike);
//   if (isNaN(d.getTime())) return isoLike;
//   const startOf = (dt) =>
//     new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
//   const t0 = startOf(today).getTime();
//   const d0 = startOf(d).getTime();
//   const diffDays = Math.round((d0 - t0) / (1000 * 60 * 60 * 24));
//   if (diffDays === 0) return "Today";
//   if (diffDays === -1) return "Yesterday";
//   if (diffDays === 1) return "Tomorrow";
//   return `${String(d.getDate()).padStart(2, "0")} ${
//     monthShort[d.getMonth()]
//   } ${d.getFullYear()}`;
// };

// const fmtTime = (str) => str || "";

// const inferCity = (streetArea = "", options = []) => {
//   const lowered = streetArea.toLowerCase();
//   const known = options
//     .filter((c) => c !== "All Cities")
//     .find((city) => lowered.includes(city.toLowerCase()));
//   return known || "Bengaluru";
// };

// const firstServiceName = (svcArr = []) => {
//   const s = svcArr?.[0];
//   return s?.serviceName || s?.subCategory || s?.category || "—";
// };

// const firstServiceCategory = (svcArr = []) => {
//   const s = svcArr?.[0];
//   return s?.category || "—";
// };

// const pickDateForCard = (item) =>
//   item?.selectedSlot?.slotDate || item?.bookingDetails?.bookingDate;
// const pickTimeForCard = (item) =>
//   item?.selectedSlot?.slotTime || item?.bookingDetails?.bookingTime || "";

// const toCardRowEnquiry = (raw, cityOptions) => {
//   const dateRaw = pickDateForCard(raw);
//   const timeRaw = pickTimeForCard(raw);
//   const street =
//     raw?.address?.streetArea || raw?.address?.houseFlatNumber || "";
//   const city = inferCity(street, cityOptions);
//   return {
//     name: raw?.customer?.name || "—",
//     date: fmtDateLabel(dateRaw),
//     time: fmtTime(timeRaw),
//     service: firstServiceName(raw?.service),
//     address: street || "—",
//     city,
//   };
// };

// const toCardRowLead = (raw, cityOptions) => {
//   const dateRaw = pickDateForCard(raw);
//   const timeRaw = pickTimeForCard(raw);
//   const street =
//     raw?.address?.streetArea || raw?.address?.houseFlatNumber || "";
//   const city = inferCity(street, cityOptions);
//   return {
//     name: raw?.customer?.name || "—",
//     date: fmtDateLabel(dateRaw),
//     time: fmtTime(timeRaw),
//     service: firstServiceCategory(raw?.service),
//     address: street || "—",
//     city,
//   };
// };

// const formatDateInput = (d) => {
//   if (!d) return "";
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// };

// const Dashboard = () => {
//   const [timePeriod, setTimePeriod] = useState("This Month");
//   const [activeTab, setActiveTab] = useState("Enquiries");
//   const [service, setService] = useState("All Services");
//   const [city, setCity] = useState("All Cities");

//   /** ✅ Initialize customDate with "This Month" */
//   const today = new Date();
//   const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
//   const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

//   const [customDate, setCustomDate] = useState({
//     start: formatDateInput(firstDay),
//     end: formatDateInput(lastDay),
//   });

//   const serviceOptions = [
//     "All Services",
//     "House Painting",
//     "Deep Cleaning",
//     "Home Interior",
//     "Packers & Movers",
//   ];
//   const cityOptions = ["All Cities", "Bengaluru", "Pune"];
//   const timePeriodOptions = [
//     "Select Period",
//     "Last 7 Days",
//     "Last 30 Days",
//     "This Month",
//     "Last Month",
//     "All Time",
//     "Custom Period",
//   ];

//   const [enquiriesRaw, setEnquiriesRaw] = useState([]);
//   const [leadsRaw, setLeadsRaw] = useState([]);
//   const [bookingsCount, setBookingsCount] = useState(0);
//   const [updatedKeyMetrics, setUpdatedKeyMetrics] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [hasSearched, setHasSearched] = useState(false); // Track if search has been performed

//   /** ✅ Update date ranges when timePeriod changes (without API call) */
//   useEffect(() => {
//     const today = new Date();
//     let start = "";
//     let end = "";

//     switch (timePeriod) {
//       case "Last 7 Days": {
//         const startDate = new Date(today);
//         startDate.setDate(today.getDate() - 6);
//         start = formatDateInput(startDate);
//         end = formatDateInput(today);
//         break;
//       }
//       case "Last 30 Days": {
//         const startDate = new Date(today);
//         startDate.setDate(today.getDate() - 30);
//         start = formatDateInput(startDate);
//         end = formatDateInput(today);
//         break;
//       }
//       case "This Month": {
//         const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
//         const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//         start = formatDateInput(firstDay);
//         end = formatDateInput(lastDay);
//         break;
//       }
//       case "Last Month": {
//         const firstDayLast = new Date(
//           today.getFullYear(),
//           today.getMonth() - 1,
//           1
//         );
//         const lastDayLast = new Date(today.getFullYear(), today.getMonth(), 0);
//         start = formatDateInput(firstDayLast);
//         end = formatDateInput(lastDayLast);
//         break;
//       }
//       case "All Time":
//         start = "";
//         end = "";
//         break;
//       case "Custom Period":
//         return; // allow manual date input
//       default:
//         start = "";
//         end = "";
//     }

//     setCustomDate({ start, end });
//   }, [timePeriod]);

//   useEffect(() => {
//     handleSearch();
//   }, []);
//   /** ✅ REMOVED: Automatic API call when customDate changes */

//   /** ✅ Fetch data handler - ONLY called when Search button is clicked */
//   const handleSearch = async () => {
//     if (isLoading) return;

//     setIsLoading(true);
//     setHasSearched(true); // Mark that search has been performed
//     console.log("Search triggered with:");
//     console.log("service:", service);
//     console.log("city:", city);
//     console.log("timePeriod:", timePeriod);
//     console.log("start date:", customDate.start);
//     console.log("end date:", customDate.end);

//     try {
//       const [enqRes, leadsRes, bookingsRes] = await Promise.all([
//         axios.get(ENQUIRIES_API, {
//           params: {
//             service: service === "All Services" ? "" : service,
//             city: city === "All Cities" ? "" : city,
//             timePeriod: timePeriod === "Select Period" ? "" : timePeriod,
//             startDate: customDate.start || "",
//             endDate: customDate.end || "",
//           },
//         }),
//         axios.get(LEADS_API, {
//           params: {
//             service: service === "All Services" ? "" : service,
//             city: city === "All Cities" ? "" : city,
//             timePeriod: timePeriod === "Select Period" ? "" : timePeriod,
//             startDate: customDate.start || "",
//             endDate: customDate.end || "",
//           },
//         }),
//         axios.get(BOOKINGS_API, {
//           params: {
//             service: service === "All Services" ? "" : service,
//             city: city === "All Cities" ? "" : city,
//             timePeriod: timePeriod === "Select Period" ? "" : timePeriod,
//             startDate: customDate.start || "",
//             endDate: customDate.end || "",
//           },
//         }),
//       ]);

//       const enqs = Array.isArray(enqRes.data?.allEnquies)
//         ? enqRes.data.allEnquies
//         : [];
//       const leads = Array.isArray(leadsRes.data?.allLeads)
//         ? leadsRes.data.allLeads
//         : [];
//       const bookings = Array.isArray(bookingsRes.data?.bookings)
//         ? bookingsRes.data.bookings
//         : [];

//       console.log("Fetched enquiries:", enqs);
//       console.log("Fetched leads:", leads);
//       console.log("Fetched bookings:", bookings);

//       setEnquiriesRaw(enqs);
//       setLeadsRaw(leads);
//       setBookingsCount(bookings.length);

//       const sales = bookings.reduce(
//         (acc, b) => acc + (Number(b.bookingDetails?.paidAmount) || 0),
//         0
//       );
//       const amountYetToPay = bookings.reduce(
//         (acc, b) => acc + (Number(b.bookingDetails?.amountYetToPay) || 0),
//         0
//       );

//       const statuses = ["Ongoing", "Pending", "Job Ongoing", "Job Ended"];
//       const ongoing = leads.filter((lead) =>
//         statuses.includes(lead?.bookingDetails?.status)
//       ).length;

//       const today = new Date();
//       const startOfDay = (dt) =>
//         new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
//       const tomorrow = new Date(startOfDay(today));
//       tomorrow.setDate(today.getDate() + 1);
//       const dayAfter = new Date(startOfDay(today));
//       dayAfter.setDate(today.getDate() + 2);

//       const isUpcoming = (slotDate) => {
//         if (!slotDate) return false;
//         const d = new Date(slotDate);
//         const sd = startOfDay(d).getTime();
//         return sd === tomorrow.getTime() || sd === dayAfter.getTime();
//       };

//       const upcoming = leads.filter((lead) =>
//         isUpcoming(lead?.selectedSlot?.slotDate)
//       ).length;

//       setUpdatedKeyMetrics([
//         { title: "Total Sales", value: sales, trend: "+10%" },
//         {
//           title: "Amount Yet to Be Collected",
//           value: amountYetToPay,
//           trend: "-5%",
//         },
//         { title: "Total Leads", value: leads.length, trend: "+8%" },
//         { title: "Ongoing Projects", value: ongoing, trend: "+2%" },
//         { title: "Upcoming Projects", value: upcoming, trend: "-3%" },
//       ]);
//     } catch (e) {
//       console.error("Search failed:", e);
//       alert("Failed to fetch data. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const enquiries = useMemo(
//     () => enquiriesRaw.map((r) => toCardRowEnquiry(r, cityOptions)),
//     [enquiriesRaw]
//   );
//   const newLeads = useMemo(
//     () => leadsRaw.map((r) => toCardRowLead(r, cityOptions)),
//     [leadsRaw]
//   );

//   // REMOVED: Frontend filtering since it's now handled by backend API
//   const filteredEnquiries = enquiries;
//   const filteredNewLeads = newLeads;

//   const last4Enquiries = filteredEnquiries.slice(-4);
//   const last4NewLeads = filteredNewLeads.slice(-4);

//   return (
//     <Container fluid style={styles.container}>
//       {/* Filters */}
//       <div style={styles.filters}>
//         <Dropdown
//           value={service}
//           onChange={setService}
//           options={serviceOptions}
//         />
//         <Dropdown value={city} onChange={setCity} options={cityOptions} />
//         <Dropdown
//           value={timePeriod}
//           onChange={setTimePeriod}
//           options={timePeriodOptions}
//         />
//         <input
//           type="date"
//           style={styles.dateInput}
//           value={customDate.start}
//           onChange={(e) =>
//             setCustomDate({ ...customDate, start: e.target.value })
//           }
//           disabled={timePeriod !== "Custom Period"}
//         />
//         <input
//           type="date"
//           style={styles.dateInput}
//           value={customDate.end}
//           onChange={(e) =>
//             setCustomDate({ ...customDate, end: e.target.value })
//           }
//           disabled={timePeriod !== "Custom Period"}
//         />
//         <button
//           onClick={handleSearch}
//           style={styles.searchButton}
//           disabled={isLoading}
//         >
//           {isLoading ? "Searching..." : "Search"}
//         </button>
//       </div>

//       {/* Metrics */}
//       <div style={styles.metricsGrid}>
//         {updatedKeyMetrics.map((metric, i) => (
//           <MetricCard key={i} {...metric} />
//         ))}
//       </div>

//       {/* Tabs */}
//       <div style={styles.tabContainer}>
//         <div
//           style={activeTab === "Enquiries" ? styles.activeTab : styles.tab}
//           onClick={() => setActiveTab("Enquiries")}
//         >
//           Enquiries ({hasSearched ? filteredEnquiries.length : 0})
//         </div>
//         <div
//           style={activeTab === "New Leads" ? styles.activeTab : styles.tab}
//           onClick={() => setActiveTab("New Leads")}
//         >
//           New Leads ({hasSearched ? filteredNewLeads.length : 0})
//         </div>
//       </div>

//       {/* Cards - Only show after search */}
//       <div style={styles.cardContainer}>
//         {hasSearched ? (
//           (activeTab === "Enquiries" ? last4Enquiries : last4NewLeads).map(
//             (item, index) => (
//               <div key={index} style={styles.card}>
//                 <div style={styles.cardRow}>
//                   <span style={styles.serviceTag}>{item.service}</span>
//                   <span style={styles.dateTag}>{item.date}</span>
//                 </div>
//                 <div style={styles.cardRow}>
//                   <h4 style={styles.cardTitle}>{item.name}</h4>
//                   <span style={styles.timeTag}>{item.time}</span>
//                 </div>
//                 <p style={styles.cardText}>
//                   <FaMapMarkerAlt /> {item.address}
//                 </p>
//               </div>
//             )
//           )
//         ) : (
//           <div style={styles.placeholder}>
//             <p>Click "Search" to see results</p>
//           </div>
//         )}
//       </div>
//     </Container>
//   );
// };

// /** ---- Dropdown ---- */
// const Dropdown = ({ value, onChange, options }) => (
//   <select
//     value={value}
//     onChange={(e) => onChange(e.target.value)}
//     style={styles.dropdown}
//   >
//     {options.map((o) => (
//       <option key={o}>{o}</option>
//     ))}
//   </select>
// );

// /** ---- Metric Card ---- */
// const MetricCard = ({ title, value, trend }) => {
//   const isRupeeField =
//     title === "Total Sales" ||
//     title === "Amount Yet to Be Collected";

//   return (
//     <div style={styles.metricCard}>
//       <h3 style={styles.metricTitle}>{title}</h3>

//       <p style={styles.metricValue}>
//         {isRupeeField ? `₹ ${value?.toLocaleString?.()}` : value}
//       </p>

//       <p
//         style={{
//           color: trend?.includes("+") ? "green" : "red",
//           fontSize: "0.9rem",
//           fontWeight: "bold",
//         }}
//       >
//         {trend}
//       </p>
//     </div>
//   );
// };

// /** ---- Styles ---- */
// export const styles = {
//   container: { padding: "20px", fontFamily: "'Poppins', sans-serif" },
//   filters: {
//     display: "flex",
//     gap: "10px",
//     marginBottom: "20px",
//     alignItems: "center",
//   },
//   dropdown: {
//     padding: "10px",
//     borderRadius: "5px",
//     border: "1px solid #ccc",
//     fontSize: "12px",
//     width: "150px",
//   },
//   dateInput: {
//     padding: "10px",
//     borderRadius: "5px",
//     border: "1px solid #ccc",
//     fontSize: "12px",
//     width: "150px",
//   },
//   searchButton: {
//     padding: "10px 20px",
//     borderRadius: "5px",
//     border: "none",
//     backgroundColor: "#007bff",
//     color: "white",
//     fontSize: "12px",
//     cursor: "pointer",
//     fontWeight: "bold",
//   },
//   metricsGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
//     gap: "25px",
//   },
//   metricCard: {
//     padding: "15px",
//     borderRadius: "8px",
//     boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
//     textAlign: "center",
//   },
//   metricTitle: { fontSize: "12px", color: "#555" },
//   metricValue: { fontSize: "18px", fontWeight: "bold" },
//   tabContainer: { display: "flex", marginBottom: "10px", marginTop: "4%" },
//   tab: {
//     flex: 1,
//     padding: "10px",
//     textAlign: "center",
//     cursor: "pointer",
//     fontSize: "12px",
//     fontWeight: "bold",
//   },
//   activeTab: {
//     flex: 1,
//     padding: "10px",
//     textAlign: "center",
//     cursor: "pointer",
//     fontSize: "12px",
//     fontWeight: "bold",
//     backgroundColor: "#e8ecec",
//   },
//   cardContainer: {
//     display: "flex",
//     gap: "10px",
//     flexWrap: "wrap",
//     marginTop: "10px",
//     minHeight: "200px",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   card: {
//     backgroundColor: "#fff",
//     padding: "15px",
//     borderRadius: "8px",
//     boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
//     width: "225px",
//   },
//   cardRow: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   serviceTag: { color: "red", fontSize: "12px", fontWeight: "600" },
//   dateTag: {
//     backgroundColor: "#f3f4f6",
//     fontSize: "10px",
//     padding: "2px 6px",
//     borderRadius: "4px",
//   },
//   cardTitle: { fontSize: "12px", fontWeight: "500", color: "#333" },
//   timeTag: { color: "#555", fontSize: "10px" },
//   cardText: { fontSize: "12px", color: "#555", marginTop: "8px" },
//   placeholder: {
//     textAlign: "center",
//     color: "#666",
//     fontSize: "16px",
//     width: "100%",
//   },
// };

// export default Dashboard;
