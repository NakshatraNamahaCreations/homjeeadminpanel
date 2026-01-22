import React, { useState, useEffect, useMemo } from "react";
import { Container } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";
import { BASE_URL } from "../utils/config";
import { useNavigate } from "react-router-dom";

/** ---- API endpoints ---- */
const ENQUIRIES_API = `${BASE_URL}/bookings/get-all-enquiries`;
const LEADS_API = `${BASE_URL}/bookings/get-all-leads`;
const MANUAL_PAYMENTS_API = `${BASE_URL}/manual-payment/`;

/** ---- Helpers ---- */
const monthShort = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
];

const NON_ONGOING_STATUSES = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Admin Cancelled",
  "Customer Cancelled",
  "Customer Unreachable",
  "Cancelled Rescheduled",
];

const NON_UPCOMING_STATUSES = [
  "pending",
  "cancelled",
  "admin cancelled",
  "customer cancelled",
  "customer unreachable",
];

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
  const found = options
    .filter((c) => c !== "All Cities")
    .find((city) => lower.includes(city.toLowerCase()));
  return found || "Bengaluru";
};

const pickDateForCard = (it) => it?.selectedSlot?.slotDate || it?.bookingDetails?.bookingDate;
const pickTimeForCard = (it) => it?.selectedSlot?.slotTime || it?.bookingDetails?.bookingTime || "";

const toCardRowEnquiry = (raw, cities) => {
  const street = raw?.address?.streetArea || raw?.address?.houseFlatNumber || "";
  return {
    _id: raw?._id,
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
    _id: raw?._id,
    name: raw?.customer?.name || "—",
    date: fmtDateLabel(pickDateForCard(raw)),
    time: fmtTime(pickTimeForCard(raw)),
    service: raw?.service?.[0]?.category || "—",
    address: street,
    city: inferCity(street, cities),
  };
};

/** --------------------------
 * PERIOD CALCULATIONS
 * -------------------------- */
const toYMD = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const calculatePeriod = (type) => {
  const today = new Date();
  let start = null;
  let end = null;

  switch (type) {
    case "last7":
      end = new Date(today);
      start = new Date(today);
      start.setDate(today.getDate() - 6);
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
      const qStartMonth = Math.floor(today.getMonth() / 3) * 3;
      start = new Date(today.getFullYear(), qStartMonth, 1);
      end = new Date(today.getFullYear(), qStartMonth + 3, 0);
      break;
    }

    case "lastQuarter": {
      const qStartMonth = Math.floor(today.getMonth() / 3) * 3 - 3;
      start = new Date(today.getFullYear(), qStartMonth, 1);
      end = new Date(today.getFullYear(), qStartMonth + 3, 0);
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
      return { start: "", end: "" };

    default:
      return null;
  }

  return { start: toYMD(start), end: toYMD(end) };
};

const isOngoingLead = (lead) => {
  const status = String(lead?.bookingDetails?.status || "").toLowerCase();
  return !NON_ONGOING_STATUSES.map((s) => String(s).toLowerCase()).includes(status);
};

/** --------------------------
 * ✅ MONEY DASHBOARD STYLE FINANCE (Booking + Manual)
 * -------------------------- */
const isHousePainting = (serviceType) => {
  try {
    return String(serviceType || "").toLowerCase() === "house_painting";
  } catch {
    return false;
  }
};

const isCancelled = (status = "") => {
  try {
    return String(status || "").toLowerCase().includes("cancelled");
  } catch {
    return false;
  }
};

const isInstallmentTx = (tx) => {
  try {
    const inst = String(tx?.installment || "").toLowerCase();
    return ["first", "second", "final"].includes(inst);
  } catch {
    return false;
  }
};

const isSiteVisitTx = (p, tx) => {
  try {
    if (!isHousePainting(p?.serviceType)) return false;
    const purpose = String(tx?.purpose || "").toLowerCase();
    return purpose === "site_visit";
  } catch {
    return false;
  }
};

const isBookingMoneyTx = (p, tx) => {
  try {
    return isInstallmentTx(tx) || isSiteVisitTx(p, tx);
  } catch {
    return false;
  }
};

const getInstallmentTarget = (b, key) => {
  try {
    const node = b?.[key] || {};
    return Number(node?.requestedAmount ?? node?.amount ?? 0);
  } catch {
    return 0;
  }
};

const sumTx = (txs, predicate) => {
  try {
    return (txs || []).reduce((sum, tx) => {
      if (!predicate(tx)) return sum;
      const amt = Number(tx?.amount || 0);
      return sum + (amt > 0 ? amt : 0);
    }, 0);
  } catch {
    return 0;
  }
};

const sumByMethod = (items, predicate, getMethodFn = (x) => x?.method) => {
  try {
    let cash = 0;
    let online = 0;

    (items || []).forEach((item) => {
      if (!predicate(item)) return;
      const amt = Number(item?.amount || 0);
      if (!(amt > 0)) return;

      const m = String(getMethodFn(item) || "").toLowerCase().trim();
      if (m === "cash") cash += amt;
      else online += amt;
    });

    return { cash, online };
  } catch {
    return { cash: 0, online: 0 };
  }
};

const getManualMethod = (m) => {
  try {
    return (
      m?.payment?.method ||
      m?.payment?.paymentMethod ||
      m?.paymentMethod ||
      m?.method ||
      m?.mode ||
      ""
    );
  } catch {
    return "";
  }
};

const computeBookingTotals = (p) => {
  try {
    const b = p?.bookingDetails || {};
    const txs = Array.isArray(p?.payments) ? p.payments : [];

    const siteVisitCharges = isHousePainting(p?.serviceType)
      ? Number(b.siteVisitCharges || 0)
      : 0;

    const firstTarget = getInstallmentTarget(b, "firstPayment");
    const secondTarget = getInstallmentTarget(b, "secondPayment");
    const finalTarget = getInstallmentTarget(b, "finalPayment");
    const installmentTarget = firstTarget + secondTarget + finalTarget;

    const paidFirst = sumTx(txs, (tx) => String(tx?.installment || "").toLowerCase() === "first");
    const paidSecond = sumTx(txs, (tx) => String(tx?.installment || "").toLowerCase() === "second");
    const paidFinal = sumTx(txs, (tx) => String(tx?.installment || "").toLowerCase() === "final");

    const installmentPaid = paidFirst + paidSecond + paidFinal;
    const installmentPending = Math.max(installmentTarget - installmentPaid, 0);

    const rawSiteVisitPaid = sumTx(txs, (tx) => isSiteVisitTx(p, tx));
    const paidSiteVisit = siteVisitCharges > 0 ? Math.min(rawSiteVisitPaid, siteVisitCharges) : 0;
    const siteVisitPending = Math.max(siteVisitCharges - paidSiteVisit, 0);

    const overallPaid = installmentPaid + paidSiteVisit;
    const overallPending = installmentPending + siteVisitPending;

    const splitBooking = sumByMethod(txs, (tx) => isBookingMoneyTx(p, tx), (tx) => tx?.method);

    return {
      paid: { overallPaid },
      remaining: { overallPending },
      bookingCash: splitBooking.cash,
      bookingOnline: splitBooking.online,
    };
  } catch {
    return {
      paid: { overallPaid: 0 },
      remaining: { overallPending: 0 },
      bookingCash: 0,
      bookingOnline: 0,
    };
  }
};

const Dashboard = () => {
  /** Period */
  const [period, setPeriod] = useState("thisMonth");

  /** Filters */
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
  const [manualPayments, setManualPayments] = useState([]);

  const [updatedKeyMetrics, setUpdatedKeyMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /** Active tab */
  const [activeTab, setActiveTab] = useState("enquiries");

  /** When period changes, auto calculate dates */
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
      const [enqRes, leadsRes, manualRes] = await Promise.all([
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
        axios.get(MANUAL_PAYMENTS_API),
      ]);

      const enqs = enqRes.data?.allEnquies || [];
      const leads = leadsRes.data?.allLeads || [];
      const manualAll = manualRes.data?.data || [];

      setEnquiriesRaw(enqs);
      setLeadsRaw(leads);

      // ✅ Filter manual payments by the same period + service + city
      const manualFiltered = (manualAll || []).filter((m) => {
        try {
          // service/city filters
          if (service !== "All Services" && String(m?.service || "") !== String(service)) return false;
          if (city !== "All Cities" && String(m?.city || "") !== String(city)) return false;

          if (!startDate || !endDate) return true; // all-time / missing range
          const created = new Date(m?.createdAt || m?.updatedAt || null);
          if (isNaN(created)) return true;

          const s = new Date(startDate);
          const e = new Date(endDate);

          // include full end day
          e.setHours(23, 59, 59, 999);

          return created >= s && created <= e;
        } catch {
          return true;
        }
      });

      setManualPayments(manualFiltered);

      // ✅ Totals EXACTLY like MoneyDashboard (booking installment/siteVisit + manual)
      let bookingPaidTotal = 0;
      let bookingPendingTotal = 0;
      let cash = 0;
      let online = 0;

      (leads || []).forEach((p) => {
        const b = p?.bookingDetails || {};
        if (isCancelled(b.status)) return;

        const t = computeBookingTotals(p);

        bookingPaidTotal += Number(t?.paid?.overallPaid || 0);
        bookingPendingTotal += Number(t?.remaining?.overallPending || 0);

        cash += Number(t?.bookingCash || 0);
        online += Number(t?.bookingOnline || 0);
      });

      const manualPaidList = (manualFiltered || []).filter((m) => m.payment?.status === "Paid");

      const manualPending = (manualFiltered || [])
        .filter((m) => m.payment?.status === "Pending")
        .reduce((sum, m) => sum + Number(m.amount || 0), 0);

      const manualPaid = manualPaidList.reduce((sum, m) => sum + Number(m.amount || 0), 0);

      const manualSplit = sumByMethod(manualPaidList, () => true, (m) => getManualMethod(m));
      cash += Number(manualSplit.cash || 0);
      online += Number(manualSplit.online || 0);

      const totalSales = bookingPaidTotal + manualPaid;
      const totalPending = bookingPendingTotal + manualPending;

      const ongoing = leads.filter(isOngoingLead).length;

      const upcoming = leads.filter((l) => {
        const status = String(l?.bookingDetails?.status || "").toLowerCase();
        if (NON_UPCOMING_STATUSES.includes(status)) return false;

        const slotDate = l?.selectedSlot?.slotDate;
        if (!slotDate) return false;

        const d = new Date(slotDate);
        const t = new Date();

        const diff =
          (new Date(d.getFullYear(), d.getMonth(), d.getDate()) -
            new Date(t.getFullYear(), t.getMonth(), t.getDate())) /
          (1000 * 60 * 60 * 24);

        return diff === 1 || diff === 2;
      }).length;

      setUpdatedKeyMetrics([
        { title: "Total Sales", value: totalSales, },
        { title: "Amount Yet to Be Collected", value: totalPending, },
        { title: "Total Leads", value: leads.length,  },
        { title: "Ongoing Projects", value: ongoing, },
        { title: "Upcoming Projects", value: upcoming,  },

        // ✅ Optional: if you want these 2 extra cards, uncomment
        // { title: "Online Payments", value: online, trend: "+1%" },
        // { title: "Cash Payments", value: cash, trend: "+1%" },
      ]);
    } catch (e) {
      console.error("Dashboard handleSearch error:", e);
      alert("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enquiries = useMemo(
    () => enquiriesRaw.map((r) => toCardRowEnquiry(r, cityOptions)),
    [enquiriesRaw]
  );

  const newLeads = useMemo(
    () =>
      leadsRaw
        .filter((l) => String(l?.bookingDetails?.status || "") === "Pending")
        .map((r) => toCardRowLead(r, cityOptions)),
    [leadsRaw]
  );

  const last4Enquiries = enquiries.slice(-4);
  const last4Leads = newLeads.slice(-4);

  const openDetails = (id, type) => {
    if (type === "enq") navigate(`/enquiry-details/${id}`);
    if (type === "lead") navigate(`/lead-details/${id}`);
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
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        {/* CUSTOM DATE RANGE ONLY IF CUSTOM SELECTED */}
        {period === "custom" && (
          <>
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
const MetricCard = ({ title, value }) => {
  const isRupee = title === "Total Sales" || title === "Amount Yet to Be Collected";

  return (
    <div style={styles.metricCard}>
      <h3 style={styles.metricTitle}>{title}</h3>
      <p style={styles.metricValue}>
        {isRupee ? `₹ ${value?.toLocaleString?.()}` : value}
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
    border: "none",
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
    fontSize: 12,
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
    gap: 20,
    flexWrap: "wrap",
    // justifyContent: "center",
  },
  card: {
    padding: 16,
    width: 240,
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

// working
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

// const NON_ONGOING_STATUSES = [
//   "Pending",
//   "Confirmed",
//   "Cancelled",
//   "Admin Cancelled",
//   "Customer Cancelled",
//   "Customer Unreachable",
//   "Cancelled Rescheduled"
//   // "rescheduled",
// ];

// const NON_UPCOMING_STATUSES = [
//   "pending",
//   "cancelled",
//   "admin cancelled",
//   "customer cancelled",
//   "customer unreachable",
//   // "rescheduled",
// ];

// const fmtDateLabel = (isoLike) => {
//   if (!isoLike) return "";
//   const today = new Date();
//   const d = new Date(isoLike);
//   if (isNaN(d)) return isoLike;
//   const startOf = (dt) =>
//     new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
//   const diff = (startOf(d) - startOf(today)) / (1000 * 60 * 60 * 24);
//   if (diff === 0) return "Today";
//   if (diff === -1) return "Yesterday";
//   if (diff === 1) return "Tomorrow";
//   return `${d.getDate()} ${monthShort[d.getMonth()]} ${d.getFullYear()}`;
// };

// const fmtTime = (str) => str || "";

// const inferCity = (street = "", options = []) => {
//   const lower = street.toLowerCase();
//   const found = options
//     .filter((c) => c !== "All Cities")
//     .find((city) => lower.includes(city.toLowerCase()));
//   return found || "Bengaluru";
// };

// const pickDateForCard = (it) =>
//   it?.selectedSlot?.slotDate || it?.bookingDetails?.bookingDate;

// const pickTimeForCard = (it) =>
//   it?.selectedSlot?.slotTime || it?.bookingDetails?.bookingTime || "";

// const toCardRowEnquiry = (raw, cities) => {
//   const street =
//     raw?.address?.streetArea || raw?.address?.houseFlatNumber || "";
//   return {
//     _id: raw?._id,
//     name: raw?.customer?.name || "—",
//     date: fmtDateLabel(pickDateForCard(raw)),
//     time: fmtTime(pickTimeForCard(raw)),
//     service: raw?.service?.[0]?.category || "—",
//     address: street,
//     city: inferCity(street, cities),
//   };
// };

// const toCardRowLead = (raw, cities) => {
//   const street =
//     raw?.address?.streetArea || raw?.address?.houseFlatNumber || "";
//   return {
//     _id: raw?._id,
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
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// };

// const calculateBookingFinance = (booking) => {
//   const b = booking.bookingDetails || {};

//   const finalTotal = Number(b.finalTotal || b.totalAmount || 0);
//   const paidAmount = Number(b.paidAmount || 0);
//   const refundAmount = Number(b.refundAmount || 0);

//   const netPaid = Math.max(paidAmount - refundAmount, 0);

//   const status = String(b.status || "").toLowerCase();
//   const isCancelled = status.includes("cancelled");

//   if (isCancelled) {
//     return {
//       sales: netPaid,
//       pending: 0,
//     };
//   }

//   return {
//     sales: netPaid,
//     pending: Math.max(finalTotal - netPaid, 0),
//   };
// };

// /** --------------------------
//  * PERIOD CALCULATIONS
//  * -------------------------- */
// const toYMD = (d) => {
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// };

// const calculatePeriod = (type) => {
//   const today = new Date();
//   let start = null;
//   let end = null;

//   switch (type) {
//     case "last7":
//       end = new Date(today);
//       start = new Date(today);
//       start.setDate(today.getDate() - 6);
//       break;

//     case "thisMonth":
//       start = new Date(today.getFullYear(), today.getMonth(), 1);
//       end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//       break;

//     case "lastMonth":
//       start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//       end = new Date(today.getFullYear(), today.getMonth(), 0);
//       break;

//     case "thisQuarter": {
//       const qStartMonth = Math.floor(today.getMonth() / 3) * 3;
//       start = new Date(today.getFullYear(), qStartMonth, 1);
//       end = new Date(today.getFullYear(), qStartMonth + 3, 0);
//       break;
//     }

//     case "lastQuarter": {
//       const qStartMonth = Math.floor(today.getMonth() / 3) * 3 - 3;
//       start = new Date(today.getFullYear(), qStartMonth, 1);
//       end = new Date(today.getFullYear(), qStartMonth + 3, 0);
//       break;
//     }

//     case "thisYear":
//       start = new Date(today.getFullYear(), 0, 1);
//       end = new Date(today.getFullYear(), 11, 31);
//       break;

//     case "lastYear":
//       start = new Date(today.getFullYear() - 1, 0, 1);
//       end = new Date(today.getFullYear() - 1, 11, 31);
//       break;

//     case "all":
//       return { start: "", end: "" };

//     default:
//       return null;
//   }

//   return {
//     start: toYMD(start),
//     end: toYMD(end),
//   };
// };

// const isOngoingLead = (lead) => {
//   const status = String(lead?.bookingDetails?.status || "").toLowerCase();
//   return !NON_ONGOING_STATUSES.includes(status);
// };

// const Dashboard = () => {
//   /** NEW: Period state */
//   const [period, setPeriod] = useState("thisMonth");

//   /** Old filters */
//   const [service, setService] = useState("All Services");
//   const [city, setCity] = useState("All Cities");

//   /** Default this month */
//   const thisMonthPeriod = calculatePeriod("thisMonth");

//   const [customDate, setCustomDate] = useState({
//     start: thisMonthPeriod.start,
//     end: thisMonthPeriod.end,
//   });

//   const navigate = useNavigate();

//   const periodOptions = [
//     { value: "last7", label: "Last 7 Days" },
//     { value: "thisMonth", label: "This Month" },
//     { value: "lastMonth", label: "Last Month" },
//     { value: "thisQuarter", label: "This Quarter" },
//     { value: "lastQuarter", label: "Last Quarter" },
//     { value: "thisYear", label: "This Year" },
//     { value: "lastYear", label: "Last Year" },
//     { value: "all", label: "All Time" },
//     { value: "custom", label: "Custom Period" },
//   ];

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

//   /** 🆕 Active tab */
//   const [activeTab, setActiveTab] = useState("enquiries");

//   /** 🆕 When period changes, auto calculate dates */
//   useEffect(() => {
//     if (period !== "custom") {
//       const range = calculatePeriod(period);
//       if (range) setCustomDate(range);
//     }
//   }, [period]);

//   /** SEARCH */
//   const handleSearch = async () => {
//     if (isLoading) return;

//     setIsLoading(true);
//     setHasSearched(true);

//     const startDate = period === "all" ? "" : customDate.start;
//     const endDate = period === "all" ? "" : customDate.end;

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

//       let totalSales = 0;
//       let totalPending = 0;

//       leads.forEach((lead) => {
//         const { sales, pending } = calculateBookingFinance(lead);
//         totalSales += sales;
//         totalPending += pending;
//       });

//       // const statuses = ["Ongoing", "Pending", "Job Ongoing", "Job Ended"];
//       const ongoing = leads.filter(isOngoingLead).length;

//       const upcoming = leads.filter((l) => {
//         const status = String(l?.bookingDetails?.status || "").toLowerCase();
//         if (NON_UPCOMING_STATUSES.includes(status)) return false;

//         const slotDate = l?.selectedSlot?.slotDate;
//         if (!slotDate) return false;

//         const d = new Date(slotDate);
//         const t = new Date();

//         const diff =
//           (new Date(d.getFullYear(), d.getMonth(), d.getDate()) -
//             new Date(t.getFullYear(), t.getMonth(), t.getDate())) /
//           (1000 * 60 * 60 * 24);

//         return diff === 1 || diff === 2;
//       }).length;

//       setUpdatedKeyMetrics([
//         { title: "Total Sales", value: totalSales, trend: "+10%" },
//         {
//           title: "Amount Yet to Be Collected",
//           value: totalPending,
//           trend: "-5%",
//         },
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
//     () =>
//       leadsRaw
//         .filter((l) => String(l?.bookingDetails?.status || "") === "Pending")
//         .map((r) => toCardRowLead(r, cityOptions)),
//     [leadsRaw]
//   );

//   const last4Enquiries = enquiries.slice(-4);
//   const last4Leads = newLeads.slice(-4);

//   const openDetails = (id, type) => {
//     if (type === "enq") navigate(`/enquiry-details/${id}`);
//     if (type === "lead") navigate(`/lead-details/${id}`);
//   };

//   return (
//     <Container fluid style={styles.container}>
//       {/* ---------- Filters ---------- */}
//       <div style={styles.filters}>
//         <Dropdown
//           value={service}
//           onChange={setService}
//           options={serviceOptions}
//         />
//         <Dropdown value={city} onChange={setCity} options={cityOptions} />

//         {/* PERIOD DROPDOWN */}
//         <select
//           value={period}
//           onChange={(e) => setPeriod(e.target.value)}
//           style={styles.dropdown}
//         >
//           {periodOptions.map((p) => (
//             <option key={p.value} value={p.value}>
//               {p.label}
//             </option>
//           ))}
//         </select>

//         {/* CUSTOM DATE RANGE ONLY IF CUSTOM SELECTED */}
//         {period === "custom" && (
//           <>
//             <input
//               type="date"
//               style={styles.dateInput}
//               value={customDate.start}
//               onChange={(e) =>
//                 setCustomDate({ ...customDate, start: e.target.value })
//               }
//             />

//             <input
//               type="date"
//               style={styles.dateInput}
//               value={customDate.end}
//               onChange={(e) =>
//                 setCustomDate({ ...customDate, end: e.target.value })
//               }
//             />
//           </>
//         )}

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
//           style={
//             activeTab === "enquiries" ? styles.activeTab : styles.inactiveTab
//           }
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
//               last4Enquiries.map((item) => (
//                 <div
//                   key={item?._id}
//                   style={styles.card}
//                   onClick={() => openDetails(item?._id, "enq")}
//                 >
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
//               last4Leads.map((item) => (
//                 <div
//                   key={item?._id}
//                   style={styles.card}
//                   onClick={() => openDetails(item?._id, "lead")}
//                 >
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

// /** Reusable Dropdown */
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

// /** Cards */
// const MetricCard = ({ title, value, trend }) => {
//   const isRupee =
//     title === "Total Sales" || title === "Amount Yet to Be Collected";

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

// /** Styles */
// export const styles = {
//   container: { padding: 20, fontFamily: "'Poppins', sans-serif" },
//   filters: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
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
//     background: "#3a3c3dff",
//     borderRadius: 5,
//     border: "none",
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
//     fontSize: 12,
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
//     cursor: "pointer",
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
