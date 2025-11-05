import React, { useState, useEffect, useMemo } from "react";
import { Container, Table } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";

/** ---- API endpoints ---- */
const ENQUIRIES_API = "https://homjee-backend.onrender.com/api/bookings/get-all-enquiries";
const LEADS_API = "https://homjee-backend.onrender.com/api/bookings/get-all-leads";
const BOOKINGS_API =
  "https://homjee-backend.onrender.com/api/bookings/get-all-bookings";

/** ---- Helpers ---- */
const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtDateLabel = (isoLike) => {
  if (!isoLike) return "";
  const today = new Date();
  const d = new Date(isoLike);
  if (isNaN(d.getTime())) return isoLike;

  const startOf = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const t0 = startOf(today).getTime();
  const d0 = startOf(d).getTime();
  const diffDays = Math.round((d0 - t0) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";
  return `${String(d.getDate()).padStart(2, "0")} ${monthShort[d.getMonth()]} ${d.getFullYear()}`;
};

const fmtTime = (str) => (str || "");

const inferCity = (streetArea = "", options = []) => {
  const lowered = streetArea.toLowerCase();
  const known = options
    .filter((c) => c !== "All Cities")
    .find((city) => lowered.includes(city.toLowerCase()));
  return known || "Bangalore";
};

const firstServiceName = (svcArr = []) => {
  const s = svcArr?.[0];
  return s?.serviceName || s?.subCategory || s?.category || "—";
};

const firstServiceCategory = (svcArr = []) => {
  const s = svcArr?.[0];
  return s?.category || "—";
};

const pickDateForCard = (item) => item?.selectedSlot?.slotDate || item?.bookingDetails?.bookingDate;
const pickTimeForCard = (item) => item?.selectedSlot?.slotTime || item?.bookingDetails?.bookingTime || "";

/** Map raw → card rows (Enquiries use serviceName) */
const toCardRowEnquiry = (raw, cityOptions) => {
  const dateRaw = pickDateForCard(raw);
  const timeRaw = pickTimeForCard(raw);
  const street = raw?.address?.streetArea || raw?.address?.houseFlatNumber || "";
  const city = inferCity(street, cityOptions);

  return {
    name: raw?.customer?.name || "—",
    date: fmtDateLabel(dateRaw),
    time: fmtTime(timeRaw),
    service: firstServiceName(raw?.service),   // <-- serviceName for enquiries
    address: street || "—",
    city,
  };
};

/** Map raw → card rows (New Leads use category) */
const toCardRowLead = (raw, cityOptions) => {
  const dateRaw = pickDateForCard(raw);
  const timeRaw = pickTimeForCard(raw);
  const street = raw?.address?.streetArea || raw?.address?.houseFlatNumber || "";
  const city = inferCity(street, cityOptions);

  return {
    name: raw?.customer?.name || "—",
    date: fmtDateLabel(dateRaw),
    time: fmtTime(timeRaw),
    service: firstServiceCategory(raw?.service),
    address: street || "—",
    city,
  };
};

const Dashboard = () => {
  const [timePeriod, setTimePeriod] = useState("Today");
  const [activeTab, setActiveTab] = useState("Enquiries");
  const [service, setService] = useState("All Services");
  const [city, setCity] = useState("All Cities");
  const [customDate, setCustomDate] = useState({ start: "", end: "" });

  const serviceOptions = ["All Services", "House Painting", "Deep Cleaning"];
  const cityOptions = ["All Cities", "Bangalore", "Pune",];

  const timePeriodOptions = [
    "Last 7 Days",
    "Last 30 Days",
    "This Month",
    "Last Month",
    "All Time",
    "Custom Period",
  ];


  const [enquiriesRaw, setEnquiriesRaw] = useState([]);
  const [leadsRaw, setLeadsRaw] = useState([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [ongoingCount, setOngoingCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [enqRes, leadsRes, bookingsRes] = await Promise.all([
          fetch(ENQUIRIES_API),
          fetch(LEADS_API),
          fetch(BOOKINGS_API),
        ]);

        const enqJson = await enqRes.json().catch(() => ({}));
        const leadsJson = await leadsRes.json().catch(() => ({}));
        const bookingsJson = await bookingsRes.json().catch(() => ({}));

        setEnquiriesRaw(
          Array.isArray(enqJson?.allEnquies) ? enqJson.allEnquies : []
        );
        setLeadsRaw(Array.isArray(leadsJson?.allLeads) ? leadsJson.allLeads : []);

        // ✅ Total bookings count
        if (Array.isArray(bookingsJson?.bookings)) {
          // ✅ Count
          setBookingsCount(bookingsJson.bookings.length);

          // ✅ Sum price × quantity for each service in each booking
          const sales = bookingsJson.bookings.reduce((acc, booking) => {
            const services = booking?.service || [];
            const bookingTotal = services.reduce((sum, s) => {
              const price = Number(s?.price) || 0;
              const qty = Number(s?.quantity) || 1;
              return sum + price * qty;
            }, 0);
            return acc + bookingTotal;
          }, 0);

          setTotalSales(sales);
        } else {
          setBookingsCount(0);
          setTotalSales(0);
        }


        // ✅ Ongoing projects count
        if (Array.isArray(leadsJson?.allLeads)) {
          const statuses = ["Ongoing", "Pending", "Job Ongoing", "Job Ended"];
          const ongoing = leadsJson.allLeads.filter((lead) =>
            statuses.includes(lead?.bookingDetails?.status)
          ).length;
          setOngoingCount(ongoing);

          // ✅ Upcoming projects (tomorrow or day after tomorrow)
          const today = new Date();
          const startOfDay = (dt) =>
            new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());

          const tomorrow = new Date(startOfDay(today));
          tomorrow.setDate(today.getDate() + 1);

          const dayAfter = new Date(startOfDay(today));
          dayAfter.setDate(today.getDate() + 2);

          const isUpcoming = (slotDate) => {
            if (!slotDate) return false;
            const d = new Date(slotDate);
            const sd = startOfDay(d).getTime();
            return (
              sd === tomorrow.getTime() ||
              sd === dayAfter.getTime()
            );
          };

          const upcoming = leadsJson.allLeads.filter((lead) =>
            isUpcoming(lead?.selectedSlot?.slotDate)
          ).length;

          setUpcomingCount(upcoming);
        } else {
          setOngoingCount(0);
          setUpcomingCount(0);
        }
      } catch (e) {
        console.warn("Failed to load data:", e);
        setEnquiriesRaw([]);
        setLeadsRaw([]);
        setBookingsCount(0);
        setOngoingCount(0);
        setUpcomingCount(0);
      }
    };
    load();
  }, []);


  const keyMetricsData = [
    { title: "Total Sales", value: totalSales, trend: "+10%", color: "#E3F2FD", fontSize: "12px" },
    { title: "Amount Yet to Be Collected", value: 0, trend: "-5%", color: "#FFEBEE", fontSize: "12px" },
    { title: "Total Leads", value: bookingsCount, trend: "+8%", color: "#E8F5E9", fontSize: "12px" },
    { title: "Ongoing Projects", value: ongoingCount, trend: "+2%", color: "#FFF3E0", fontSize: "12px" },
    { title: "Upcoming Projects", value: upcomingCount, trend: "-3%", color: "#F3E5F5", fontSize: "12px" },
  ];


  // Raw → card rows
  const enquiries = useMemo(
    () => enquiriesRaw.map((r) => toCardRowEnquiry(r, cityOptions)),
    [enquiriesRaw]
  );
  const newLeads = useMemo(
    () => leadsRaw.map((r) => toCardRowLead(r, cityOptions)),
    [leadsRaw]
  );

  // Filters
  const serviceMatches = (item) => service === "All Services" || item.service === service;
  const cityMatches = (item) => city === "All Cities" || item.city === city;

  const filteredEnquiries = enquiries.filter((item) => serviceMatches(item) && cityMatches(item));
  const filteredNewLeads = newLeads.filter((item) => serviceMatches(item) && cityMatches(item));

  // Only last 4 items for display
  const last4Enquiries = filteredEnquiries.slice(-4);
  const last4NewLeads = filteredNewLeads.slice(-4);

  const updatedKeyMetrics = keyMetricsData;
  //  const updatedKeyMetrics = keyMetricsData.map((metric) => {
  //   if (metric.title === "Total Leads") {
  //     return metric;
  //   }
  //   return {
  //     ...metric,
  //     value: Math.floor(metric.value * (Math.random() * 0.5 + 0.75)),
  //   };
  // });


  const payments = [
    {
      dateTime: "2025-02-12 10:30 AM",
      customer: "John Doe",
      vendor: "Vendor A",
      context: "Booking Payment",
      paymentID: "PAY12345",
      amount: "₹2000",
      service: "House Painting",
      city: "Pune",
    },
    {
      dateTime: "2025-02-11 02:45 PM",
      customer: "Jane Smith",
      vendor: "Vendor B",
      context: "Second Partial Payment",
      paymentID: "PAY12346",
      amount: "₹5500",
      service: "Deep Cleaning",
      city: "Bangalore",
    },
  ];

  return (
    <Container fluid style={styles.container}>
      {/* Filters */}
      <div style={styles.filters}>
        <Dropdown value={service} onChange={setService} options={serviceOptions} style={{ fontSize: "12px" }} />
        <Dropdown value={city} onChange={setCity} options={cityOptions} />
        <Dropdown
          value={timePeriod}
          onChange={(value) => {
            setTimePeriod(value);
            setService("All Services");
            setCity("All Cities");
          }}
          options={timePeriodOptions}
        />
        <input
          type="date"
          style={styles.dateInput}
          value={customDate.start}
          onChange={(e) => setCustomDate({ ...customDate, start: e.target.value })}
        />
        <input
          type="date"
          style={styles.dateInput}
          value={customDate.end}
          onChange={(e) => setCustomDate({ ...customDate, end: e.target.value })}
        />
      </div>

      {/* Key Metrics */}
      <div style={styles.metricsGrid}>
        {updatedKeyMetrics.map((metric, index) => {
          let formattedValue = metric.value;
          if (metric.title === "Total Sales" || metric.title === "Amount Yet to Be Collected") {
            formattedValue = `₹ ${metric.value.toLocaleString()}`;
          }
          return (
            <MetricCard
              key={index}
              title={metric.title}
              value={formattedValue}
              trend={metric.trend}
              color={metric.color}
            />
          );
        })}
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <div
          style={activeTab === "Enquiries" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("Enquiries")}
        >
          Enquiries ({filteredEnquiries.length})
        </div>
        <div
          style={activeTab === "New Leads" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("New Leads")}
        >
          New Leads ({filteredNewLeads.length})
        </div>
      </div>

      {/* Cards (only last 4) */}
      <div style={styles.cardContainer}>
        {(activeTab === "Enquiries" ? last4Enquiries : last4NewLeads).map((item, index) => (
          <div key={index} style={styles.card}>
            <div style={styles.cardRow}>
              <span style={styles.serviceTag}>{item.service}</span>
              <span style={styles.dateTag}>{item.date}</span>
            </div>
            <div style={styles.cardRow}>
              <h4 style={styles.cardTitle}>{item.name}</h4>
              <span style={styles.timeTag}>{item.time}</span>
            </div>
            <p style={styles.cardText}>
              <span><FaMapMarkerAlt /></span> {item.address}
            </p>
          </div>
        ))}
      </div>

      {/* Payments */}
      <div style={styles.paymentContainer}>
        <h4 style={styles.sectionTitle}>Payments</h4>
        <Table striped bordered hover responsive>
          <thead>
            <tr style={{ fontSize: "14px", textAlign: "center" }}>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Vendor</th>
              <th>Context</th>
              <th>Payment ID</th>
              <th>Amount</th>
              <th>Service</th>
              <th>City</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, index) => (
              <tr key={index} style={{ fontSize: "12px" }}>
                <td>{payment.dateTime}</td>
                <td>{payment.customer}</td>
                <td>{payment.vendor}</td>
                <td>{payment.context}</td>
                <td>{payment.paymentID}</td>
                <td>{payment.amount}</td>
                <td>{payment.service}</td>
                <td style={styles.boldCity}>{payment.city}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
};

/** ---- Dropdown ---- */
const Dropdown = ({ value, onChange, options = [] }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.dropdown}>
    {options.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
);

/** ---- Metric Card ---- */
const MetricCard = ({ title, value, trend }) => (
  <div style={{ ...styles.metricCard }}>
    <h3 style={styles.metricTitle}>{title}</h3>
    <p style={styles.metricValue}>{value}</p>
    <p style={{ color: trend.includes("+") ? "green" : "red", fontSize: "0.9rem", fontWeight: "bold" }}>{trend}</p>
  </div>
);

/** ---- Styles (unchanged visual) ---- */
const styles = {
  container: { padding: "20px", backgroundColor: "", minHeight: "100vh", marginLeft: "", fontFamily: "'Poppins', sans-serif" },
  filters: { display: "flex", gap: "10px", marginBottom: "20px", fontSize: "12px" },
  dropdown: { padding: "10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "12px", width: "150px", cursor: "pointer" },
  customDate: { display: "flex", gap: "10px" },
  dateInput: { padding: "10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "12px" },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "25px" },
  tablesContainer: { display: "flex", gap: "20px", marginTop: "20px" },
  tableWrapper: { flex: 1 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  tableTitle: { fontSize: "1.4rem", fontWeight: "bold", marginBottom: "10px" },
  metricCard: { padding: "15px", borderRadius: "8px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", textAlign: "center", transition: "0.3s", cursor: "pointer", width: "110%" },
  metricTitle: { fontSize: "12px", color: "#555", marginBottom: "5px", whiteSpace: "nowrap" },
  metricValue: { fontSize: "18px", fontWeight: "bold", color: "#333" },
  trendUp: { color: "green", fontSize: "0.9rem", fontWeight: "bold" },
  trendDown: { color: "red", fontSize: "0.9rem", fontWeight: "bold" },
  toggleButton: { backgroundColor: "#2563eb", color: "white", border: "none", padding: "8px 12px", borderRadius: "5px", cursor: "pointer" },
  cardContainer: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" },
  card: { backgroundColor: "#fff", padding: "15px", borderRadius: "8px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", width: "225px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  serviceTag: { color: "red", borderRadius: "4px", fontSize: "12px", fontWeight: "600" },
  dateTag: { color: "black", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", backgroundColor: "#f3f4f6" },
  cardTitle: { fontSize: "12px", fontWeight: "500", margin: "0", color: "#333" },
  timeTag: { color: "#555", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" },
  cardText: { fontSize: "12px", color: "#555", marginTop: "8px" },
  paymentContainer: { marginTop: "20px" },
  sectionTitle: { fontSize: "1rem", fontWeight: "bold", marginBottom: "10px" },
  boldCity: { fontWeight: "bold" },
  tabContainer: { display: "flex", marginBottom: "10px", marginTop: "4%" },
  tab: { flex: 1, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: "12px", fontWeight: "bold" },
  activeTab: { flex: 1, padding: "10px", textAlign: "center", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: "#e8ecec" },
};

export default Dashboard;
