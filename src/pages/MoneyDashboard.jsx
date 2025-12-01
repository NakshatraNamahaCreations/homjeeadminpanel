import React, { useState, useEffect } from "react";
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
      const res = await axios.get(`${BASE_URL}/manual-payment/list`);
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
        CSV EXPORT (bookings only)
  ====================================================== */
  const filteredPayments = payments.filter((p) => {
    const status = p?.bookingDetails?.paymentStatus || "";
    return filter === "paid" ? status === "Paid" : status !== "Paid";
  });

  const csvData = filteredPayments.map((payment) => {
    const b = payment.bookingDetails || {};
    const first = Number(b.firstPayment?.amount || 0);
    const second = Number(b.secondPayment?.amount || 0);
    const final = Number(b.finalPayment?.amount || 0);

    const dateTime = payment.selectedSlot?.slotDate
      ? `${payment.selectedSlot.slotDate} ${payment.selectedSlot.slotTime}`
      : new Date(b.bookingDate).toLocaleString("en-GB");

    return {
      "Date & Time": dateTime,
      Customer: `${payment.customer?.name} (${payment.customer?.phone})`,
      "Order Id": payment.bookingDetails?.booking_id,
      Vendor: payment.assignedProfessional?.name || "-",
      "Payment ID": "N/A",
      Amount: first + second + final,
      Service: payment.service?.map((s) => s.serviceName).join(", "),
      City: payment.address?.city,
    };
  });

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
      const res = await axios.post(
        `${BASE_URL}/manual-payment/create`,
        formData
      );

      alert("Payment Link: " + res.data.data.payment.url);
      setShowModal(false);
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
        </thead>

        <tbody>
          {paymentMode === "booking" ? (
            <>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4">
                    No Records Found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, i) => (
                  <tr key={i} style={{ fontSize: 12 }}>
                    <td>{formatSlotDateTime(p)}</td>
                    <td>
                      {p.customer?.name} ({p.customer?.phone})
                    </td>
                    <td>{p.bookingDetails?.booking_id}</td>
                    <td>{p.assignedProfessional?.name || "-"}</td>
                    <td>N/A</td>
                    <td>₹{installmentsSum(p)}</td>
                    <td>{p.serviceType?.replace(/_/g, " ")}</td>
                    <td>{p.address?.city}</td>
                  </tr>
                ))
              )}
            </>
          ) : (
            <>
              {manualPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4">
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
                      <td>{m._id}</td>
                      <td>-</td>
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
              <Form.Control
                name="name"
                required
                onChange={handleInputChange}
              />
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
              <Form.Select
                name="service"
                required
                onChange={handleInputChange}
              >
                <option value="">Select Service</option>
                <option>House Painting</option>
                <option>Deep Cleaning</option>
                <option>Interior</option>
                <option>Packers & Movers</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>City *</Form.Label>
              <Form.Select
                name="city"
                required
                onChange={handleInputChange}
              >
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
// import { FaArrowUp, FaArrowDown } from "react-icons/fa";
// import { CSVLink } from "react-csv";
// import axios from "axios";
// import { BASE_URL } from "../utils/config";

// const MoneyDashboard = () => {
//   const [showModal, setShowModal] = useState(false);
//   const [payments, setPayments] = useState([]);
//   const [filter, setFilter] = useState("paid");
//   const [paymentMode, setPaymentMode] = useState("booking");
//   const [manualPayments, setManualPayments] = useState([]);
//   const [hoverTab, setHoverTab] = useState("");
//   const [errors, setErrors] = useState({
//     phone: "",
//   });

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

//   // Fetch Manual Payments
//   const fetchManualPayments = async () => {
//     try {
//       const res = await axios.get(
//         `${BASE_URL}/manual-payment/list?status=${filter}`
//       );
//       setManualPayments(res.data.data || []);
//     } catch (err) {
//       console.error("Manual Payment Fetch Error:", err);
//       setManualPayments([]);
//     }
//   };

//   // Fetch Booking Payments
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

//       const leads = res?.data?.allLeads || [];
//       setPayments(leads);
//       calculateTotals(leads, manualPayments);
//     } catch (err) {
//       console.error("Error fetching leads:", err);
//       setPayments([]);
//     }
//   };

//   useEffect(() => {
//     fetchPayments();
//     fetchManualPayments();
//   }, []);

//   useEffect(() => {
//     fetchManualPayments();
//   }, [filter, paymentMode]);

//   useEffect(() => {
//     calculateTotals(payments, manualPayments);
//   }, [payments, manualPayments]);

//   const calculateManualPaid = (list) => {
//     let sum = 0;
//     list.forEach((m) => {
//       if (m.payment?.status === "Paid") {
//         sum += Number(m.amount || 0);
//       }
//     });
//     return sum;
//   };

//   const calculateManualPending = (list) => {
//     let sum = 0;
//     list.forEach((m) => {
//       if (m.payment?.status === "Pending") {
//         sum += Number(m.amount || 0);
//       }
//     });
//     return sum;
//   };

//   // Calculate totals
//   const calculateTotals = (bookingList, manualList) => {
//     let bookingPaid = 0;
//     let bookingPending = 0;
//     let cashCalc = 0;
//     let onlineCalc = 0;

//     // --- BOOKING PAYMENTS ---
//     bookingList.forEach((item) => {
//       const b = item.bookingDetails || {};
//       const paidAmount = Number(b.paidAmount || 0);
//       const due = Number(b.amountYetToPay || 0);
//       const method = (b.paymentMethod || "").toString();

//       bookingPaid += paidAmount;
//       bookingPending += due;

//       if (method === "Cash") cashCalc += paidAmount;
//       if (method === "UPI") onlineCalc += paidAmount;
//     });

//     // --- MANUAL PAYMENTS ---
//     const manualPaidTotal = calculateManualPaid(manualList); // PAID
//     const manualPendingTotal = calculateManualPending(manualList); // PENDING

//     // --- FINAL TOTALS ---
//     const finalTotalSales = bookingPaid + manualPaidTotal;
//     const finalPendingAmount = bookingPending + manualPendingTotal;

//     setTotalSales(finalTotalSales);
//     setPendingAmount(finalPendingAmount);
//     setCashAmount(cashCalc);
//     setOnlineAmount(onlineCalc);
//   };

//   const handleSearch = () => fetchPayments();

//   // Booking Filter
//   const filteredPayments = payments.filter((p) => {
//     const status = p?.bookingDetails?.paymentStatus || "";
//     return filter === "paid" ? status === "Paid" : status !== "Paid";
//   });

//   // CSV Export
//   const csvData = filteredPayments.map((payment) => {
//     const b = payment.bookingDetails || {};
//     const first = Number(b.firstPayment?.amount || 0);
//     const second = Number(b.secondPayment?.amount || 0);
//     const final = Number(b.finalPayment?.amount || 0);
//     const totalInstallments = first + second + final;

//     const slotDate = payment.selectedSlot?.slotDate || "";
//     const slotTime = payment.selectedSlot?.slotTime || "";

//     const dateTime = slotDate
//       ? `${slotDate} ${slotTime}`
//       : b.bookingDate
//       ? new Date(b.bookingDate).toLocaleString("en-GB")
//       : "";

//     return {
//       "Date & Time": dateTime,
//       Customer: `${payment.customer?.name} (${payment.customer?.phone})`,
//       "Order Id": payment._id,
//       Vendor: payment.assignedProfessional?.name || "Not Assigned",
//       "Payment ID": "N/A",
//       Amount: totalInstallments,
//       Service: payment.service?.map((s) => s.serviceName).join(", "),
//       City: payment.address?.city,
//     };
//   });

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "phone") {
//       // Allow digits only
//       if (!/^\d*$/.test(value)) return;

//       // Max 10 digits
//       if (value.length > 10) return;

//       setFormData((prev) => ({ ...prev, phone: value }));

//       // Error message handling
//       if (value.length !== 10) {
//         setErrors((prev) => ({
//           ...prev,
//           phone: "Phone number must be exactly 10 digits",
//         }));
//       } else {
//         setErrors((prev) => ({ ...prev, phone: "" }));
//       }

//       return;
//     }

//     // For all other fields
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const generatePaymentLink = async () => {
//     try {
//       const res = await axios.post(
//         `${BASE_URL}/manual-payment/create`,
//         formData
//       );

//       alert("Payment Link Created:\n" + res.data.data.payment.url);

//       setShowModal(false);
//     } catch (err) {
//       console.error("Error creating manual payment:", err);
//       alert("Error creating payment link");
//     }
//   };

//   const formatSlotDateTime = (payment) => {
//     const slotDate = payment.selectedSlot?.slotDate;
//     const slotTime = payment.selectedSlot?.slotTime;
//     if (slotDate) return `${slotDate} ${slotTime || ""}`;

//     const bDate = payment.bookingDetails?.bookingDate;
//     if (bDate) return new Date(bDate).toLocaleString("en-GB");

//     return "-";
//   };

//   const installmentsSum = (payment) => {
//     const b = payment.bookingDetails || {};
//     return (
//       Number(b.firstPayment?.amount || 0) +
//       Number(b.secondPayment?.amount || 0) +
//       Number(b.finalPayment?.amount || 0)
//     );
//   };

//   return (
//     <Container className="mt-4" style={{ fontFamily: "Poppins, sans-serif" }}>
//       <h5 className="fw-bold">Money Dashboard</h5>

//       {/* Filters */}
//       <div className="mb-3 d-flex justify-content-end gap-2">
//         <Form.Select
//           className="w-auto"
//           style={{ height: "38px", fontSize: 12 }}
//           value={filters.city}
//           onChange={(e) => setFilters({ ...filters, city: e.target.value })}
//         >
//           <option>All Cities</option>
//           <option>Bengaluru</option>
//           <option>Pune</option>
//         </Form.Select>

//         <Form.Select
//           className="w-auto"
//           style={{ height: "38px", fontSize: 12 }}
//           value={filters.service}
//           onChange={(e) => setFilters({ ...filters, service: e.target.value })}
//         >
//           <option>All Services</option>
//           <option>House Painting</option>
//           <option>Deep Cleaning</option>
//         </Form.Select>

//         <input
//           type="date"
//           style={{ fontSize: 12 }}
//           value={customDate.start}
//           onChange={(e) =>
//             setCustomDate({ ...customDate, start: e.target.value })
//           }
//         />
//         <input
//           type="date"
//           style={{ fontSize: 12 }}
//           value={customDate.end}
//           onChange={(e) =>
//             setCustomDate({ ...customDate, end: e.target.value })
//           }
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
//             color: "black",
//             fontSize: 12,
//             border: "1px solid black",
//             background: "white",
//           }}
//         >
//           Create Payment Link
//         </Button>
//       </div>

//       {/* Cards */}
//       <Row className="mb-4">
//         <Col md={6}>
//           <Card className="p-3 shadow-sm">
//             <h6 className="fw-bold" style={{ fontSize: 14 }}>
//               Total Sales: ₹{totalSales.toLocaleString()}
//               <span style={{ marginLeft: 8 }}>
//                 <FaArrowUp color="green" />{" "}
//                 <span style={{ color: "green", fontWeight: 700 }}>+10%</span>
//               </span>
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
//             <h6 className="fw-bold" style={{ fontSize: 14 }}>
//               Amount Yet to Be Collected: ₹{pendingAmount.toLocaleString()}
//             </h6>

//             <p style={{ fontSize: 12, marginTop: 8 }}>Coins sold : ₹0</p>
//             <p style={{ fontSize: 12 }}>Income from Coins Sale : ₹0</p>
//           </Card>
//         </Col>
//       </Row>

//       {/* Tabs */}
//       <div style={styles.paymentTabs}>
//         <div
//           onMouseEnter={() => setHoverTab("booking")}
//           onMouseLeave={() => setHoverTab("")}
//           style={{
//             ...styles.paymentTab,
//             ...(paymentMode === "booking" ? styles.paymentTabActive : {}),
//             ...(hoverTab === "booking" && paymentMode !== "booking"
//               ? styles.paymentTabHover
//               : {}),
//           }}
//           onClick={() => setPaymentMode("booking")}
//         >
//           Booking Payments
//         </div>

//         <div
//           onMouseEnter={() => setHoverTab("manual")}
//           onMouseLeave={() => setHoverTab("")}
//           style={{
//             ...styles.paymentTab,
//             ...(paymentMode === "manual" ? styles.paymentTabActive : {}),
//             ...(hoverTab === "manual" && paymentMode !== "manual"
//               ? styles.paymentTabHover
//               : {}),
//           }}
//           onClick={() => setPaymentMode("manual")}
//         >
//           Manual Payments
//         </div>
//       </div>

//       {/* Paid/Pending */}
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

//       {/* Table */}
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
//           {/* BOOKING PAYMENT SINGLE ROW FIX */}
//           {paymentMode === "booking" ? (
//             <>
//               {filteredPayments.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
//                     No Records Found
//                   </td>
//                 </tr>
//               ) : (
//                 filteredPayments.map((payment, idx) => {
//                   const dateTime = formatSlotDateTime(payment);

//                   const customerText = `${payment.customer?.name} (${payment.customer?.phone})`;

//                   // ✅ SHOW booking_id instead of _id
//                   const bookingId = payment.bookingDetails?.booking_id || "-";

//                   const vendor =
//                     payment.assignedProfessional?.name || "Not Assigned";

//                   const amount = installmentsSum(payment);

//                   // ✅ SHOW ONLY serviceType (house_painting / deep_cleaning)
//                   const serviceType =
//                     payment.serviceType?.replace(/_/g, " ") || "-";

//                   const city = payment.address?.city || "-";

//                   return (
//                     <tr key={idx} style={{ fontSize: 12 }}>
//                       <td>{dateTime}</td>

//                       <td>{customerText}</td>

//                       <td>{bookingId}</td>

//                       <td>{vendor}</td>

//                       <td>N/A</td>

//                       <td>₹{amount.toLocaleString()}</td>

//                       <td>{serviceType}</td>

//                       <td>{city}</td>
//                     </tr>
//                   );
//                 })
//               )}
//             </>
//           ) : (
//             /* MANUAL PAYMENTS (unchanged) */
//             <>
//               {manualPayments.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
//                     No Records Found
//                   </td>
//                 </tr>
//               ) : (
//                 manualPayments.map((m, idx) => (
//                   <tr key={idx} style={{ fontSize: 12 }}>
//                     <td>{new Date(m.createdAt).toLocaleString("en-GB")}</td>
//                     <td>
//                       {m.name} ({m.phone})
//                     </td>
//                     <td>{m._id}</td>
//                     <td>-</td>
//                     <td>
//                       {m.payment.url ? (
//                         <a
//                           href={m.payment.url}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                         >
//                           Open Link
//                         </a>
//                       ) : (
//                         "N/A"
//                       )}
//                     </td>

//                     <td>₹{m.amount}</td>
//                     <td>{m.service}</td>
//                     <td>{m.city}</td>
//                   </tr>
//                 ))
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
//         Export to CSV
//       </CSVLink>

//       {/* Modal */}
//       <Modal show={showModal} onHide={() => setShowModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title style={{ fontSize: 16 }}>
//             Create Payment Link
//           </Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <Form>
//             <Form.Group>
//               <Form.Check
//                 inline
//                 label="Customer"
//                 type="radio"
//                 name="type"
//                 value="customer"
//                 checked={formData.type === "customer"}
//                 onChange={handleInputChange}
//               />

//               <Form.Check
//                 inline
//                 label="Vendor"
//                 type="radio"
//                 name="type"
//                 value="vendor"
//                 checked={formData.type === "vendor"}
//                 onChange={handleInputChange}
//               />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Name *</Form.Label>
//               <Form.Control name="name" onChange={handleInputChange} required />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Phone </Form.Label>
//               <Form.Control
//                 name="phone"
//                 value={formData.phone}
//                 onChange={handleInputChange}
//                 maxLength={10}
//                 inputMode="numeric"
//                 required
//                 style={{ borderColor: errors.phone ? "red" : "" }}
//               />

//               {errors.phone && (
//                 <small style={{ color: "red", fontSize: "11px" }}>
//                   {errors.phone}
//                 </small>
//               )}
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Amount</Form.Label>
//               <Form.Control
//                 type="number"
//                 name="amount"
//                 onChange={handleInputChange}
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Service *</Form.Label>
//               <Form.Select name="service" onChange={handleInputChange} required>
//                 <option value="">Select Service</option>
//                 <option value="House Painting">House Painting</option>
//                 <option value="Deep Cleaning">Deep Cleaning</option>
//                 <option value="Interior">Interior</option>
//                 <option value="Packers & Movers">Packers & Movers</option>
//               </Form.Select>
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>City *</Form.Label>
//               <Form.Select name="city" onChange={handleInputChange} required>
//                 <option value="">Select City</option>
//                 <option value="Bengaluru">Bengaluru</option>
//                 <option value="Pune">Pune</option>
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
//                   checked={formData.context === "others"}
//                   onChange={handleInputChange}
//                 />
//                 <Form.Check
//                   label="Coins"
//                   type="radio"
//                   name="context"
//                   value="coins"
//                   checked={formData.context === "coins"}
//                   onChange={handleInputChange}
//                 />
//               </Form.Group>
//             )}
//           </Form>
//         </Modal.Body>

//         <Modal.Footer>
//           <Button
//             style={{
//               color: "black",
//               borderColor: "black",
//               backgroundColor: "white",
//               fontWeight: "600",
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

// const styles = {
//   paymentTabs: {
//     display: "flex",
//     gap: "12px",
//     marginBottom: "10px",
//     borderBottom: "2px solid #e5e5e5",
//   },

//   paymentTab: {
//     padding: "8px 16px",
//     fontSize: "13px",
//     fontWeight: 600,
//     cursor: "pointer",
//     color: "#555",
//     borderRadius: "6px 6px 0 0",
//     transition: "all 0.2s ease",
//   },

//   paymentTabActive: {
//     backgroundColor: "#000",
//     color: "white",
//     borderBottom: "2px solid #000",
//   },

//   paymentTabHover: {
//     backgroundColor: "#f5f5f5",
//   },
// };

// export default MoneyDashboard;
