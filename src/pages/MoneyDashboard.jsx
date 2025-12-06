import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Button,
  Table,
  Form,
  Container,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import { FaArrowUp } from "react-icons/fa";
import { CSVLink } from "react-csv";
import axios from "axios";
import { BASE_URL } from "../utils/config";

const MoneyDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [payments, setPayments] = useState([]);
  const [manualPayments, setManualPayments] = useState([]);
  const [filter, setFilter] = useState("paid");
  const [paymentMode, setPaymentMode] = useState("booking");
  const [hoverTab, setHoverTab] = useState("");

  const [errors, setErrors] = useState({ phone: "" });

  const [filters, setFilters] = useState({
    service: "All Services",
    city: "All Cities",
  });

  const [customDate, setCustomDate] = useState({ start: "", end: "" });

  const [formData, setFormData] = useState({
    type: "customer",
    name: "",
    phone: "",
    amount: "",
    service: "",
    city: "",
    context: "others",
  });

  const [totalSales, setTotalSales] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [cashAmount, setCashAmount] = useState(0);
  const [onlineAmount, setOnlineAmount] = useState(0);

  /* ======================================================
        API CALLS
  ====================================================== */

  const fetchManualPayments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/manual-payment/`);
      setManualPayments(res.data.data || []);
    } catch (err) {
      console.error("Manual Payment Fetch Error:", err);
      setManualPayments([]);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/bookings/get-all-leads`, {
        params: {
          service: filters.service === "All Services" ? "" : filters.service,
          city: filters.city === "All Cities" ? "" : filters.city,
          startDate: customDate.start || "",
          endDate: customDate.end || "",
        },
      });

      setPayments(res.data.allLeads || []);
    } catch (err) {
      console.error("Booking Payment Fetch Error:", err);
      setPayments([]);
    }
  };

  /* ======================================================
        LOAD BOTH (once)
  ====================================================== */
  useEffect(() => {
    const loadAll = async () => {
      await fetchManualPayments();
      await fetchPayments();
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ======================================================
        Recalculate totals whenever lists change
  ====================================================== */
  useEffect(() => {
    calculateTotals(payments, manualPayments);
  }, [payments, manualPayments]);

  /* ======================================================
        TOTALS CALCULATION
  ====================================================== */
  const calculateManualPaid = (list) => {
    return list
      .filter((m) => m.payment?.status === "Paid")
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);
  };

  const calculateManualPending = (list) => {
    return list
      .filter((m) => m.payment?.status === "Pending")
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);
  };

  const calculateTotals = (bookingList, manualList) => {
    let bookingPaid = 0;
    let bookingPending = 0;
    let cashCalc = 0;
    let onlineCalc = 0;

    bookingList.forEach((item) => {
      const b = item.bookingDetails || {};

      const paid = Number(b.paidAmount || 0);
      const due = Number(b.amountYetToPay || 0);
      const method = b.paymentMethod || "";

      bookingPaid += paid;
      bookingPending += due;

      if (method === "Cash") cashCalc += paid;
      if (method === "UPI") onlineCalc += paid;
    });

    const manualPaid = calculateManualPaid(manualList);
    const manualPending = calculateManualPending(manualList);

    setTotalSales(bookingPaid + manualPaid);
    setPendingAmount(bookingPending + manualPending);
    setCashAmount(cashCalc);
    setOnlineAmount(onlineCalc);
  };

  /* ======================================================
        SEARCH
  ====================================================== */
  const handleSearch = async () => {
    await fetchPayments();
  };

  /* ======================================================
        BUILD BOOKING PAID & PENDING ROWS
        - Paid: installment-wise rows (first/second/final) where installment.status === 'paid'
        - Pending: one row per booking where amountYetToPay > 0 (show total pending)
  ====================================================== */

  const bookingPaidRows = useMemo(() => {
    try {
      const rows = [];

      payments.forEach((p) => {
        const b = p.bookingDetails || {};
        const customer = p.customer
          ? `${p.customer.name} (${p.customer.phone})`
          : "-";
        const vendor = p.assignedProfessional?.name || "-";
        const orderId = b.booking_id || p._id || "-";
        const service = (p.service || [])
          .map((s) => s.serviceName || s.category)
          .join(", ");
        const city = p.address?.city || "-";

        // Prepare a set of installment payment amounts to avoid duplicates
        const installmentAmounts = new Set();

        const pushInstallment = (inst) => {
          if (!inst) return;
          if (String(inst.status).toLowerCase() === "paid") {
            const amt = Number(inst.amount || 0);
            installmentAmounts.add(amt);

            const paidAt =
              inst.paidAt || inst.at || b.bookingDate || p.createdDate;

            rows.push({
              date: paidAt ? new Date(paidAt).toLocaleString("en-GB") : "-",
              customer,
              orderId,
              vendor,
              paymentId: "N/A",
              amount: amt,
              service,
              city,
            });
          }
        };

        pushInstallment(b.firstPayment);
        pushInstallment(b.secondPayment);
        pushInstallment(b.finalPayment);

        // Now add payments[] history ONLY if amount not already included
        if (Array.isArray(p.payments)) {
          p.payments.forEach((hist) => {
            const amt = Number(hist.amount || 0);
            if (amt > 0 && !installmentAmounts.has(amt)) {
              const date = hist.at || hist.paidAt || p.createdDate;
              rows.push({
                date: date ? new Date(date).toLocaleString("en-GB") : "-",
                customer,
                orderId,
                vendor,
                paymentId: "N/A",
                amount: amt,
                service,
                city,
              });
            }
          });
        }
      });

      // Sort rows by date descending
      rows.sort((a, b) => new Date(b.date) - new Date(a.date));

      return rows;
    } catch (err) {
      console.error("bookingPaidRows error:", err);
      return [];
    }
  }, [payments]);

  const bookingPendingRows = useMemo(() => {
    try {
      const rows = payments
        .filter((p) => Number(p.bookingDetails?.amountYetToPay || 0) > 0)
        .map((p) => {
          const b = p.bookingDetails || {};
          const customer = p.customer
            ? `${p.customer.name} (${p.customer.phone})`
            : "-";
          const vendor = p.assignedProfessional?.name || "-";
          const orderId = b.booking_id || p._id || "-";
          const service = (p.service || [])
            .map((s) => s.serviceName || s.category)
            .join(", ");
          const city = p.address?.city || "-";
          const date = p.selectedSlot
            ? `${p.selectedSlot.slotDate} ${p.selectedSlot.slotTime}`
            : b.bookingDate
            ? new Date(b.bookingDate).toLocaleString("en-GB")
            : "-";

          return {
            date,
            customer,
            orderId,
            vendor,
            paymentId: "N/A",
            amountDue: Number(b.amountYetToPay || 0),
            service,
            city,
          };
        });

      // sort by date descending
      rows.sort((a, b) => {
        const da = new Date(a.date).getTime() || 0;
        const db = new Date(b.date).getTime() || 0;
        return db - da;
      });

      return rows;
    } catch (err) {
      console.error("bookingPendingRows error:", err);
      return [];
    }
  }, [payments]);

  /* ======================================================
        CSV EXPORT (bookings only) - use bookingPaidRows
  ====================================================== */
  const csvData = bookingPaidRows.map((r) => ({
    "Date & Time": r.date,
    Customer: r.customer,
    "Order Id": r.orderId,
    Vendor: r.vendor,
    "Payment ID": r.paymentId,
    Amount: r.amount,
    Service: r.service,
    City: r.city,
  }));

  /* ======================================================
        FORM VALIDATION
  ====================================================== */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;

      setFormData((prev) => ({ ...prev, phone: value }));
      setErrors((prev) => ({
        ...prev,
        phone: value.length === 10 ? "" : "Phone must be 10 digits",
      }));

      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generatePaymentLink = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/manual-payment/`, formData);

      alert("Payment Link: " + res.data.data.payment.url);
      setShowModal(false);
      // refetch manual payments so new link appears
      await fetchManualPayments();
    } catch (err) {
      console.error(err);
      alert("Error creating link");
    }
  };

  /* ======================================================
        DATE/TIME FORMATTER
  ====================================================== */
  const formatSlotDateTime = (payment) => {
    const slot = payment.selectedSlot;
    if (slot) return `${slot.slotDate} ${slot.slotTime}`;

    const bDate = payment.bookingDetails?.bookingDate;
    return bDate ? new Date(bDate).toLocaleString("en-GB") : "-";
  };

  const installmentsSum = (payment) => {
    const b = payment.bookingDetails || {};
    return (
      Number(b.firstPayment?.amount || 0) +
      Number(b.secondPayment?.amount || 0) +
      Number(b.finalPayment?.amount || 0)
    );
  };

  /* ======================================================
        RENDER UI
  ====================================================== */
  return (
    <Container className="mt-4" style={{ fontFamily: "Poppins, sans-serif" }}>
      <h5 className="fw-bold">Money Dashboard</h5>

      {/* FILTER BAR */}
      <div className="mb-3 d-flex justify-content-end gap-2">
        <Form.Select
          className="w-auto"
          style={{ height: 38, fontSize: 12 }}
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
        >
          <option>All Cities</option>
          <option>Bengaluru</option>
          <option>Pune</option>
        </Form.Select>

        <Form.Select
          className="w-auto"
          style={{ height: 38, fontSize: 12 }}
          value={filters.service}
          onChange={(e) => setFilters({ ...filters, service: e.target.value })}
        >
          <option>All Services</option>
          <option>House Painting</option>
          <option>Deep Cleaning</option>
        </Form.Select>

        <input
          type="date"
          value={customDate.start}
          onChange={(e) =>
            setCustomDate({ ...customDate, start: e.target.value })
          }
          style={{ fontSize: 12 }}
        />

        <input
          type="date"
          value={customDate.end}
          onChange={(e) =>
            setCustomDate({ ...customDate, end: e.target.value })
          }
          style={{ fontSize: 12 }}
        />

        <Button
          onClick={handleSearch}
          style={{
            border: "1px solid black",
            background: "white",
            color: "black",
            fontSize: 12,
          }}
        >
          Search
        </Button>

        <Button
          onClick={() => setShowModal(true)}
          style={{
            border: "1px solid black",
            background: "white",
            color: "black",
            fontSize: 12,
          }}
        >
          Create Payment Link
        </Button>
      </div>

      {/* SUMMARY CARDS */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="p-3 shadow-sm">
            <h6 className="fw-bold">
              Total Sales: ₹{totalSales.toLocaleString()}
            </h6>
            <p style={{ fontSize: 12 }}>
              Online Payment: ₹{onlineAmount.toLocaleString()}
            </p>
            <p style={{ fontSize: 12 }}>
              Cash Payment: ₹{cashAmount.toLocaleString()}
            </p>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="p-3 shadow-sm">
            <h6 className="fw-bold">
              Amount Yet to Be Collected: ₹{pendingAmount.toLocaleString()}
            </h6>
            <p style={{ fontSize: 12 }}>Coins Sold: ₹0</p>
            <p style={{ fontSize: 12 }}>Income from Coins: ₹0</p>
          </Card>
        </Col>
      </Row>

      {/* TABS */}
      <div style={styles.paymentTabs}>
        <div
          onClick={() => setPaymentMode("booking")}
          style={{
            ...styles.paymentTab,
            ...(paymentMode === "booking" ? styles.paymentTabActive : {}),
          }}
        >
          Booking Payments
        </div>

        <div
          onClick={() => setPaymentMode("manual")}
          style={{
            ...styles.paymentTab,
            ...(paymentMode === "manual" ? styles.paymentTabActive : {}),
          }}
        >
          Manual Payments
        </div>
      </div>

      {/* PAID/PENDING TOGGLE */}
      <div className="mb-3">
        <button
          className={`btn ${
            filter === "paid" ? "btn-dark text-white" : "btn-outline-dark"
          }`}
          onClick={() => setFilter("paid")}
          style={{ fontSize: 12, marginRight: 8 }}
        >
          Paid List
        </button>

        <button
          className={`btn ${
            filter === "pending" ? "btn-dark text-white" : "btn-outline-dark"
          }`}
          onClick={() => setFilter("pending")}
          style={{ fontSize: 12 }}
        >
          Pending List
        </button>
      </div>

      {/* TABLE */}
      <Table striped bordered hover>
        <thead>
          {paymentMode === "booking" ? (
            <tr style={{ fontSize: 12 }}>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Order Id</th>
              <th>Vendor</th>
              <th>Payment ID</th>
              <th>Amount</th>
              <th>Service</th>
              <th>City</th>
            </tr>
          ) : (
            <tr style={{ fontSize: 12 }}>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Payment ID</th>
              <th>Amount</th>
              <th>Service</th>
              <th>City</th>
            </tr>
          )}
        </thead>

        <tbody>
          {paymentMode === "booking" ? (
            <>
              {filter === "paid" ? (
                bookingPaidRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-4">
                      No Records Found
                    </td>
                  </tr>
                ) : (
                  bookingPaidRows.map((r, i) => (
                    <tr key={i} style={{ fontSize: 12 }}>
                      <td>{r.date}</td>
                      <td>{r.customer}</td>
                      <td>{r.orderId}</td>
                      <td>{r.vendor}</td>
                      <td>{r.paymentId}</td>
                      <td>₹{r.amount}</td>
                      <td>{r.service}</td>
                      <td>{r.city}</td>
                    </tr>
                  ))
                )
              ) : bookingPendingRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4">
                    No Records Found
                  </td>
                </tr>
              ) : (
                bookingPendingRows.map((r, i) => (
                  <tr key={i} style={{ fontSize: 12 }}>
                    <td>{r.date}</td>
                    <td>{r.customer}</td>
                    <td>{r.orderId}</td>
                    <td>{r.vendor}</td>
                    <td>{r.paymentId}</td>
                    <td>₹{r.amountDue}</td>
                    <td>{r.service}</td>
                    <td>{r.city}</td>
                  </tr>
                ))
              )}
            </>
          ) : (
            <>
              {manualPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-4">
                    No Records Found
                  </td>
                </tr>
              ) : (
                manualPayments
                  .filter((m) =>
                    filter === "paid"
                      ? m.payment?.status === "Paid"
                      : m.payment?.status === "Pending"
                  )
                  .map((m, i) => (
                    <tr key={i} style={{ fontSize: 12 }}>
                      <td>{new Date(m.createdAt).toLocaleString("en-GB")}</td>
                      <td>
                        {m.name} ({m.phone})
                      </td>
                      <td>
                        <a
                          href={m.payment?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Link
                        </a>
                      </td>
                      <td>₹{m.amount}</td>
                      <td>{m.service}</td>
                      <td>{m.city}</td>
                    </tr>
                  ))
              )}
            </>
          )}
        </tbody>
      </Table>

      <CSVLink
        data={csvData}
        filename={`${filter}-payments.csv`}
        className="btn btn-success mt-3"
        style={{ fontSize: 12 }}
      >
        Export CSV
      </CSVLink>

      {/* CREATE PAYMENT LINK MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Payment Link</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Check
                inline
                label="Customer"
                name="type"
                value="customer"
                type="radio"
                checked={formData.type === "customer"}
                onChange={handleInputChange}
              />

              <Form.Check
                inline
                label="Vendor"
                name="type"
                value="vendor"
                type="radio"
                checked={formData.type === "vendor"}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control name="name" required onChange={handleInputChange} />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Phone *</Form.Label>
              <Form.Control
                name="phone"
                value={formData.phone}
                maxLength={10}
                inputMode="numeric"
                required
                style={{ borderColor: errors.phone ? "red" : "" }}
                onChange={handleInputChange}
              />
              {errors.phone && (
                <small style={{ color: "red" }}>{errors.phone}</small>
              )}
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Amount *</Form.Label>
              <Form.Control
                type="number"
                name="amount"
                required
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Service *</Form.Label>
              <Form.Select name="service" required onChange={handleInputChange}>
                <option value="">Select Service</option>
                <option>House Painting</option>
                <option>Deep Cleaning</option>
                <option>Interior</option>
                <option>Packers & Movers</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>City *</Form.Label>
              <Form.Select name="city" required onChange={handleInputChange}>
                <option value="">Select City</option>
                <option>Bengaluru</option>
                <option>Pune</option>
              </Form.Select>
            </Form.Group>

            {formData.type === "vendor" && (
              <Form.Group className="mt-3">
                <Form.Label>Context *</Form.Label>
                <Form.Check
                  label="Others"
                  type="radio"
                  name="context"
                  value="others"
                  onChange={handleInputChange}
                />
                <Form.Check
                  label="Coins"
                  type="radio"
                  name="context"
                  value="coins"
                  onChange={handleInputChange}
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            style={{
              borderColor: "black",
              color: "black",
              background: "white",
            }}
            onClick={generatePaymentLink}
          >
            Generate Payment Link
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

/* ======================================================
      TAB STYLES
====================================================== */
const styles = {
  paymentTabs: {
    display: "flex",
    gap: 12,
    borderBottom: "2px solid #eee",
    marginBottom: 10,
  },
  paymentTab: {
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  paymentTabActive: {
    background: "black",
    color: "white",
    borderBottom: "2px solid black",
  },
};

export default MoneyDashboard;

// import React, { useState, useEffect } from "react";
// import {
//   Modal,
//   Button,
//   Table,
//   Form,
//   Container,
//   Row,
//   Col,
//   Card,
// } from "react-bootstrap";
// import { FaArrowUp } from "react-icons/fa";
// import { CSVLink } from "react-csv";
// import axios from "axios";
// import { BASE_URL } from "../utils/config";

// const MoneyDashboard = () => {
//   const [showModal, setShowModal] = useState(false);
//   const [payments, setPayments] = useState([]);
//   const [manualPayments, setManualPayments] = useState([]);
//   const [filter, setFilter] = useState("paid");
//   const [paymentMode, setPaymentMode] = useState("booking");
//   const [hoverTab, setHoverTab] = useState("");

//   const [errors, setErrors] = useState({ phone: "" });

//   const [filters, setFilters] = useState({
//     service: "All Services",
//     city: "All Cities",
//   });

//   const [customDate, setCustomDate] = useState({ start: "", end: "" });

//   const [formData, setFormData] = useState({
//     type: "customer",
//     name: "",
//     phone: "",
//     amount: "",
//     service: "",
//     city: "",
//     context: "others",
//   });

//   const [totalSales, setTotalSales] = useState(0);
//   const [pendingAmount, setPendingAmount] = useState(0);
//   const [cashAmount, setCashAmount] = useState(0);
//   const [onlineAmount, setOnlineAmount] = useState(0);

//   /* ======================================================
//         API CALLS
//   ====================================================== */

//   const fetchManualPayments = async () => {
//     try {
//       const res = await axios.get(`${BASE_URL}/manual-payment/`);
//       setManualPayments(res.data.data || []);
//     } catch (err) {
//       console.error("Manual Payment Fetch Error:", err);
//       setManualPayments([]);
//     }
//   };

//   const fetchPayments = async () => {
//     try {
//       const res = await axios.get(`${BASE_URL}/bookings/get-all-leads`, {
//         params: {
//           service: filters.service === "All Services" ? "" : filters.service,
//           city: filters.city === "All Cities" ? "" : filters.city,
//           startDate: customDate.start || "",
//           endDate: customDate.end || "",
//         },
//       });

//       setPayments(res.data.allLeads || []);
//     } catch (err) {
//       console.error("Booking Payment Fetch Error:", err);
//       setPayments([]);
//     }
//   };

//   /* ======================================================
//         LOAD BOTH (once)
//   ====================================================== */
//   useEffect(() => {
//     const loadAll = async () => {
//       await fetchManualPayments();
//       await fetchPayments();
//     };
//     loadAll();
//   }, []);

//   /* ======================================================
//         Recalculate totals whenever lists change
//   ====================================================== */
//   useEffect(() => {
//     calculateTotals(payments, manualPayments);
//   }, [payments, manualPayments]);

//   /* ======================================================
//         TOTALS CALCULATION
//   ====================================================== */
//   const calculateManualPaid = (list) => {
//     return list
//       .filter((m) => m.payment?.status === "Paid")
//       .reduce((sum, m) => sum + Number(m.amount || 0), 0);
//   };

//   const calculateManualPending = (list) => {
//     return list
//       .filter((m) => m.payment?.status === "Pending")
//       .reduce((sum, m) => sum + Number(m.amount || 0), 0);
//   };

//   const calculateTotals = (bookingList, manualList) => {
//     let bookingPaid = 0;
//     let bookingPending = 0;
//     let cashCalc = 0;
//     let onlineCalc = 0;

//     bookingList.forEach((item) => {
//       const b = item.bookingDetails || {};

//       const paid = Number(b.paidAmount || 0);
//       const due = Number(b.amountYetToPay || 0);
//       const method = b.paymentMethod || "";

//       bookingPaid += paid;
//       bookingPending += due;

//       if (method === "Cash") cashCalc += paid;
//       if (method === "UPI") onlineCalc += paid;
//     });

//     const manualPaid = calculateManualPaid(manualList);
//     const manualPending = calculateManualPending(manualList);

//     setTotalSales(bookingPaid + manualPaid);
//     setPendingAmount(bookingPending + manualPending);
//     setCashAmount(cashCalc);
//     setOnlineAmount(onlineCalc);
//   };

//   /* ======================================================
//         SEARCH
//   ====================================================== */
//   const handleSearch = async () => {
//     await fetchPayments();
//   };

//   /* ======================================================
//         CSV EXPORT (bookings only)
//   ====================================================== */
//   const filteredPayments = payments.filter((p) => {
//     const status = p?.bookingDetails?.paymentStatus || "";
//     return filter === "paid" ? status === "Paid" : status !== "Paid";
//   });

//   const csvData = filteredPayments.map((payment) => {
//     const b = payment.bookingDetails || {};
//     const first = Number(b.firstPayment?.amount || 0);
//     const second = Number(b.secondPayment?.amount || 0);
//     const final = Number(b.finalPayment?.amount || 0);

//     const dateTime = payment.selectedSlot?.slotDate
//       ? `${payment.selectedSlot.slotDate} ${payment.selectedSlot.slotTime}`
//       : new Date(b.bookingDate).toLocaleString("en-GB");

//     return {
//       "Date & Time": dateTime,
//       Customer: `${payment.customer?.name} (${payment.customer?.phone})`,
//       "Order Id": payment.bookingDetails?.booking_id,
//       Vendor: payment.assignedProfessional?.name || "-",
//       "Payment ID": "N/A",
//       Amount: first + second + final,
//       Service: payment.service?.map((s) => s.serviceName).join(", "),
//       City: payment.address?.city,
//     };
//   });

//   /* ======================================================
//         FORM VALIDATION
//   ====================================================== */
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "phone") {
//       if (!/^\d*$/.test(value)) return;
//       if (value.length > 10) return;

//       setFormData((prev) => ({ ...prev, phone: value }));
//       setErrors((prev) => ({
//         ...prev,
//         phone: value.length === 10 ? "" : "Phone must be 10 digits",
//       }));

//       return;
//     }

//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const generatePaymentLink = async () => {
//     try {
//       const res = await axios.post(
//         `${BASE_URL}/manual-payment/`,
//         formData
//       );

//       alert("Payment Link: " + res.data.data.payment.url);
//       setShowModal(false);
//     } catch (err) {
//       console.error(err);
//       alert("Error creating link");
//     }
//   };

//   /* ======================================================
//         DATE/TIME FORMATTER
//   ====================================================== */
//   const formatSlotDateTime = (payment) => {
//     const slot = payment.selectedSlot;
//     if (slot) return `${slot.slotDate} ${slot.slotTime}`;

//     const bDate = payment.bookingDetails?.bookingDate;
//     return bDate ? new Date(bDate).toLocaleString("en-GB") : "-";
//   };

//   const installmentsSum = (payment) => {
//     const b = payment.bookingDetails || {};
//     return (
//       Number(b.firstPayment?.amount || 0) +
//       Number(b.secondPayment?.amount || 0) +
//       Number(b.finalPayment?.amount || 0)
//     );
//   };

//   /* ======================================================
//         RENDER UI
//   ====================================================== */
//   return (
//     <Container className="mt-4" style={{ fontFamily: "Poppins, sans-serif" }}>
//       <h5 className="fw-bold">Money Dashboard</h5>

//       {/* FILTER BAR */}
//       <div className="mb-3 d-flex justify-content-end gap-2">
//         <Form.Select
//           className="w-auto"
//           style={{ height: 38, fontSize: 12 }}
//           value={filters.city}
//           onChange={(e) => setFilters({ ...filters, city: e.target.value })}
//         >
//           <option>All Cities</option>
//           <option>Bengaluru</option>
//           <option>Pune</option>
//         </Form.Select>

//         <Form.Select
//           className="w-auto"
//           style={{ height: 38, fontSize: 12 }}
//           value={filters.service}
//           onChange={(e) => setFilters({ ...filters, service: e.target.value })}
//         >
//           <option>All Services</option>
//           <option>House Painting</option>
//           <option>Deep Cleaning</option>
//         </Form.Select>

//         <input
//           type="date"
//           value={customDate.start}
//           onChange={(e) =>
//             setCustomDate({ ...customDate, start: e.target.value })
//           }
//           style={{ fontSize: 12 }}
//         />

//         <input
//           type="date"
//           value={customDate.end}
//           onChange={(e) =>
//             setCustomDate({ ...customDate, end: e.target.value })
//           }
//           style={{ fontSize: 12 }}
//         />

//         <Button
//           onClick={handleSearch}
//           style={{
//             border: "1px solid black",
//             background: "white",
//             color: "black",
//             fontSize: 12,
//           }}
//         >
//           Search
//         </Button>

//         <Button
//           onClick={() => setShowModal(true)}
//           style={{
//             border: "1px solid black",
//             background: "white",
//             color: "black",
//             fontSize: 12,
//           }}
//         >
//           Create Payment Link
//         </Button>
//       </div>

//       {/* SUMMARY CARDS */}
//       <Row className="mb-4">
//         <Col md={6}>
//           <Card className="p-3 shadow-sm">
//             <h6 className="fw-bold">
//               Total Sales: ₹{totalSales.toLocaleString()}
//             </h6>
//             <p style={{ fontSize: 12 }}>
//               Online Payment: ₹{onlineAmount.toLocaleString()}
//             </p>
//             <p style={{ fontSize: 12 }}>
//               Cash Payment: ₹{cashAmount.toLocaleString()}
//             </p>
//           </Card>
//         </Col>

//         <Col md={6}>
//           <Card className="p-3 shadow-sm">
//             <h6 className="fw-bold">
//               Amount Yet to Be Collected: ₹{pendingAmount.toLocaleString()}
//             </h6>
//             <p style={{ fontSize: 12 }}>Coins Sold: ₹0</p>
//             <p style={{ fontSize: 12 }}>Income from Coins: ₹0</p>
//           </Card>
//         </Col>
//       </Row>

//       {/* TABS */}
//       <div style={styles.paymentTabs}>
//         <div
//           onClick={() => setPaymentMode("booking")}
//           style={{
//             ...styles.paymentTab,
//             ...(paymentMode === "booking" ? styles.paymentTabActive : {}),
//           }}
//         >
//           Booking Payments
//         </div>

//         <div
//           onClick={() => setPaymentMode("manual")}
//           style={{
//             ...styles.paymentTab,
//             ...(paymentMode === "manual" ? styles.paymentTabActive : {}),
//           }}
//         >
//           Manual Payments
//         </div>
//       </div>

//       {/* PAID/PENDING TOGGLE */}
//       <div className="mb-3">
//         <button
//           className={`btn ${
//             filter === "paid" ? "btn-dark text-white" : "btn-outline-dark"
//           }`}
//           onClick={() => setFilter("paid")}
//           style={{ fontSize: 12, marginRight: 8 }}
//         >
//           Paid List
//         </button>

//         <button
//           className={`btn ${
//             filter === "pending" ? "btn-dark text-white" : "btn-outline-dark"
//           }`}
//           onClick={() => setFilter("pending")}
//           style={{ fontSize: 12 }}
//         >
//           Pending List
//         </button>
//       </div>

//       {/* TABLE */}
//       <Table striped bordered hover>
//         <thead>
//           <tr style={{ fontSize: 12 }}>
//             <th>Date & Time</th>
//             <th>Customer</th>
//             <th>Order Id</th>
//             <th>Vendor</th>
//             <th>Payment ID</th>
//             <th>Amount</th>
//             <th>Service</th>
//             <th>City</th>
//           </tr>
//         </thead>

//         <tbody>
//           {paymentMode === "booking" ? (
//             <>
//               {filteredPayments.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} className="text-center p-4">
//                     No Records Found
//                   </td>
//                 </tr>
//               ) : (
//                 filteredPayments.map((p, i) => (
//                   <tr key={i} style={{ fontSize: 12 }}>
//                     <td>{formatSlotDateTime(p)}</td>
//                     <td>
//                       {p.customer?.name} ({p.customer?.phone})
//                     </td>
//                     <td>{p.bookingDetails?.booking_id}</td>
//                     <td>{p.assignedProfessional?.name || "-"}</td>
//                     <td>N/A</td>
//                     <td>₹{installmentsSum(p)}</td>
//                     <td>{p.serviceType?.replace(/_/g, " ")}</td>
//                     <td>{p.address?.city}</td>
//                   </tr>
//                 ))
//               )}
//             </>
//           ) : (
//             <>
//               {manualPayments.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} className="text-center p-4">
//                     No Records Found
//                   </td>
//                 </tr>
//               ) : (
//                 manualPayments
//                   .filter((m) =>
//                     filter === "paid"
//                       ? m.payment?.status === "Paid"
//                       : m.payment?.status === "Pending"
//                   )
//                   .map((m, i) => (
//                     <tr key={i} style={{ fontSize: 12 }}>
//                       <td>{new Date(m.createdAt).toLocaleString("en-GB")}</td>
//                       <td>
//                         {m.name} ({m.phone})
//                       </td>
//                       <td>{m._id}</td>
//                       <td>-</td>
//                       <td>
//                         <a
//                           href={m.payment?.url}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                         >
//                           Open Link
//                         </a>
//                       </td>
//                       <td>₹{m.amount}</td>
//                       <td>{m.service}</td>
//                       <td>{m.city}</td>
//                     </tr>
//                   ))
//               )}
//             </>
//           )}
//         </tbody>
//       </Table>

//       <CSVLink
//         data={csvData}
//         filename={`${filter}-payments.csv`}
//         className="btn btn-success mt-3"
//         style={{ fontSize: 12 }}
//       >
//         Export CSV
//       </CSVLink>

//       {/* CREATE PAYMENT LINK MODAL */}
//       <Modal show={showModal} onHide={() => setShowModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Create Payment Link</Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <Form>
//             <Form.Group>
//               <Form.Check
//                 inline
//                 label="Customer"
//                 name="type"
//                 value="customer"
//                 type="radio"
//                 checked={formData.type === "customer"}
//                 onChange={handleInputChange}
//               />

//               <Form.Check
//                 inline
//                 label="Vendor"
//                 name="type"
//                 value="vendor"
//                 type="radio"
//                 checked={formData.type === "vendor"}
//                 onChange={handleInputChange}
//               />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Name *</Form.Label>
//               <Form.Control
//                 name="name"
//                 required
//                 onChange={handleInputChange}
//               />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Phone *</Form.Label>
//               <Form.Control
//                 name="phone"
//                 value={formData.phone}
//                 maxLength={10}
//                 inputMode="numeric"
//                 required
//                 style={{ borderColor: errors.phone ? "red" : "" }}
//                 onChange={handleInputChange}
//               />
//               {errors.phone && (
//                 <small style={{ color: "red" }}>{errors.phone}</small>
//               )}
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Amount *</Form.Label>
//               <Form.Control
//                 type="number"
//                 name="amount"
//                 required
//                 onChange={handleInputChange}
//               />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Service *</Form.Label>
//               <Form.Select
//                 name="service"
//                 required
//                 onChange={handleInputChange}
//               >
//                 <option value="">Select Service</option>
//                 <option>House Painting</option>
//                 <option>Deep Cleaning</option>
//                 <option>Interior</option>
//                 <option>Packers & Movers</option>
//               </Form.Select>
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>City *</Form.Label>
//               <Form.Select
//                 name="city"
//                 required
//                 onChange={handleInputChange}
//               >
//                 <option value="">Select City</option>
//                 <option>Bengaluru</option>
//                 <option>Pune</option>
//               </Form.Select>
//             </Form.Group>

//             {formData.type === "vendor" && (
//               <Form.Group className="mt-3">
//                 <Form.Label>Context *</Form.Label>
//                 <Form.Check
//                   label="Others"
//                   type="radio"
//                   name="context"
//                   value="others"
//                   onChange={handleInputChange}
//                 />
//                 <Form.Check
//                   label="Coins"
//                   type="radio"
//                   name="context"
//                   value="coins"
//                   onChange={handleInputChange}
//                 />
//               </Form.Group>
//             )}
//           </Form>
//         </Modal.Body>

//         <Modal.Footer>
//           <Button
//             style={{
//               borderColor: "black",
//               color: "black",
//               background: "white",
//             }}
//             onClick={generatePaymentLink}
//           >
//             Generate Payment Link
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// /* ======================================================
//       TAB STYLES
// ====================================================== */
// const styles = {
//   paymentTabs: {
//     display: "flex",
//     gap: 12,
//     borderBottom: "2px solid #eee",
//     marginBottom: 10,
//   },
//   paymentTab: {
//     padding: "8px 16px",
//     cursor: "pointer",
//     fontSize: 13,
//     fontWeight: 600,
//   },
//   paymentTabActive: {
//     background: "black",
//     color: "white",
//     borderBottom: "2px solid black",
//   },
// };

// export default MoneyDashboard;
