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
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { CSVLink } from "react-csv";
import axios from "axios";
import { BASE_URL } from "../utils/config";

const MoneyDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState("paid");
  const [paymentMode, setPaymentMode] = useState("booking");
  const [manualPayments, setManualPayments] = useState([]);
  const [hoverTab, setHoverTab] = useState("");
  const [errors, setErrors] = useState({
    phone: "",
  });

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

  // Fetch Manual Payments
  const fetchManualPayments = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/manual-payment/list?status=${filter}`
      );
      setManualPayments(res.data.data || []);
    } catch (err) {
      console.error("Manual Payment Fetch Error:", err);
      setManualPayments([]);
    }
  };

  // Fetch Booking Payments
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

      const leads = res?.data?.allLeads || [];
      setPayments(leads);
      calculateTotals(leads);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setPayments([]);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (paymentMode === "manual") fetchManualPayments();
  }, [paymentMode, filter]);

  // Calculate totals
  const calculateTotals = (list) => {
    let totalSalesCalc = 0;
    let pendingCalc = 0;
    let cashCalc = 0;
    let onlineCalc = 0;

    list.forEach((item) => {
      const b = item.bookingDetails || {};
      const paidAmount = Number(b.paidAmount || 0);
      const due = Number(b.amountYetToPay || 0);
      const method = (b.paymentMethod || "").toString();

      totalSalesCalc += paidAmount;
      pendingCalc += due;

      if (method === "Cash") cashCalc += paidAmount;
      if (method === "UPI") onlineCalc += paidAmount;
    });

    setTotalSales(totalSalesCalc);
    setPendingAmount(pendingCalc);
    setCashAmount(cashCalc);
    setOnlineAmount(onlineCalc);
  };

  const handleSearch = () => fetchPayments();

  // Booking Filter
  const filteredPayments = payments.filter((p) => {
    const status = p?.bookingDetails?.paymentStatus || "";
    return filter === "paid" ? status === "Paid" : status !== "Paid";
  });

  // CSV Export
  const csvData = filteredPayments.map((payment) => {
    const b = payment.bookingDetails || {};
    const first = Number(b.firstPayment?.amount || 0);
    const second = Number(b.secondPayment?.amount || 0);
    const final = Number(b.finalPayment?.amount || 0);
    const totalInstallments = first + second + final;

    const slotDate = payment.selectedSlot?.slotDate || "";
    const slotTime = payment.selectedSlot?.slotTime || "";

    const dateTime = slotDate
      ? `${slotDate} ${slotTime}`
      : b.bookingDate
      ? new Date(b.bookingDate).toLocaleString("en-GB")
      : "";

    return {
      "Date & Time": dateTime,
      Customer: `${payment.customer?.name} (${payment.customer?.phone})`,
      "Order Id": payment._id,
      Vendor: payment.assignedProfessional?.name || "Not Assigned",
      "Payment ID": "N/A",
      Amount: totalInstallments,
      Service: payment.service?.map((s) => s.serviceName).join(", "),
      City: payment.address?.city,
    };
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // Allow digits only
      if (!/^\d*$/.test(value)) return;

      // Max 10 digits
      if (value.length > 10) return;

      setFormData((prev) => ({ ...prev, phone: value }));

      // Error message handling
      if (value.length !== 10) {
        setErrors((prev) => ({
          ...prev,
          phone: "Phone number must be exactly 10 digits",
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone: "" }));
      }

      return;
    }

    // For all other fields
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generatePaymentLink = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/manual-payment/create`,
        formData
      );

      alert("Payment Link Created:\n" + res.data.data.payment.url);

      setShowModal(false);
    } catch (err) {
      console.error("Error creating manual payment:", err);
      alert("Error creating payment link");
    }
  };

  const formatSlotDateTime = (payment) => {
    const slotDate = payment.selectedSlot?.slotDate;
    const slotTime = payment.selectedSlot?.slotTime;
    if (slotDate) return `${slotDate} ${slotTime || ""}`;

    const bDate = payment.bookingDetails?.bookingDate;
    if (bDate) return new Date(bDate).toLocaleString("en-GB");

    return "-";
  };

  const installmentsSum = (payment) => {
    const b = payment.bookingDetails || {};
    return (
      Number(b.firstPayment?.amount || 0) +
      Number(b.secondPayment?.amount || 0) +
      Number(b.finalPayment?.amount || 0)
    );
  };

  return (
    <Container className="mt-4" style={{ fontFamily: "Poppins, sans-serif" }}>
      <h5 className="fw-bold">Money Dashboard</h5>

      {/* Filters */}
      <div className="mb-3 d-flex justify-content-end gap-2">
        <Form.Select
          className="w-auto"
          style={{ height: "38px", fontSize: 12 }}
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
        >
          <option>All Cities</option>
          <option>Bengaluru</option>
          <option>Pune</option>
        </Form.Select>

        <Form.Select
          className="w-auto"
          style={{ height: "38px", fontSize: 12 }}
          value={filters.service}
          onChange={(e) => setFilters({ ...filters, service: e.target.value })}
        >
          <option>All Services</option>
          <option>House Painting</option>
          <option>Deep Cleaning</option>
        </Form.Select>

        <input
          type="date"
          style={{ fontSize: 12 }}
          value={customDate.start}
          onChange={(e) =>
            setCustomDate({ ...customDate, start: e.target.value })
          }
        />
        <input
          type="date"
          style={{ fontSize: 12 }}
          value={customDate.end}
          onChange={(e) =>
            setCustomDate({ ...customDate, end: e.target.value })
          }
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
            color: "black",
            fontSize: 12,
            border: "1px solid black",
            background: "white",
          }}
        >
          Create Payment Link
        </Button>
      </div>

      {/* Cards */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="p-3 shadow-sm">
            <h6 className="fw-bold" style={{ fontSize: 14 }}>
              Total Sales: ₹{totalSales.toLocaleString()}
              <span style={{ marginLeft: 8 }}>
                <FaArrowUp color="green" />{" "}
                <span style={{ color: "green", fontWeight: 700 }}>+10%</span>
              </span>
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
            <h6 className="fw-bold" style={{ fontSize: 14 }}>
              Amount Yet to Be Collected: ₹{pendingAmount.toLocaleString()}
            </h6>

            <p style={{ fontSize: 12, marginTop: 8 }}>Coins sold : ₹0</p>
            <p style={{ fontSize: 12 }}>Income from Coins Sale : ₹0</p>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <div style={styles.paymentTabs}>
        <div
          onMouseEnter={() => setHoverTab("booking")}
          onMouseLeave={() => setHoverTab("")}
          style={{
            ...styles.paymentTab,
            ...(paymentMode === "booking" ? styles.paymentTabActive : {}),
            ...(hoverTab === "booking" && paymentMode !== "booking"
              ? styles.paymentTabHover
              : {}),
          }}
          onClick={() => setPaymentMode("booking")}
        >
          Booking Payments
        </div>

        <div
          onMouseEnter={() => setHoverTab("manual")}
          onMouseLeave={() => setHoverTab("")}
          style={{
            ...styles.paymentTab,
            ...(paymentMode === "manual" ? styles.paymentTabActive : {}),
            ...(hoverTab === "manual" && paymentMode !== "manual"
              ? styles.paymentTabHover
              : {}),
          }}
          onClick={() => setPaymentMode("manual")}
        >
          Manual Payments
        </div>
      </div>

      {/* Paid/Pending */}
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

      {/* Table */}
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
          {/* BOOKING PAYMENT SINGLE ROW FIX */}
          {paymentMode === "booking" ? (
            <>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
                    No Records Found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, idx) => {
                  const dateTime = formatSlotDateTime(payment);

                  const customerText = `${payment.customer?.name} (${payment.customer?.phone})`;

                  // ✅ SHOW booking_id instead of _id
                  const bookingId = payment.bookingDetails?.booking_id || "-";

                  const vendor =
                    payment.assignedProfessional?.name || "Not Assigned";

                  const amount = installmentsSum(payment);

                  // ✅ SHOW ONLY serviceType (house_painting / deep_cleaning)
                  const serviceType =
                    payment.serviceType?.replace(/_/g, " ") || "-";

                  const city = payment.address?.city || "-";

                  return (
                    <tr key={idx} style={{ fontSize: 12 }}>
                      <td>{dateTime}</td>

                      <td>{customerText}</td>

                      <td>{bookingId}</td>

                      <td>{vendor}</td>

                      <td>N/A</td>

                      <td>₹{amount.toLocaleString()}</td>

                      <td>{serviceType}</td>

                      <td>{city}</td>
                    </tr>
                  );
                })
              )}
            </>
          ) : (
            /* MANUAL PAYMENTS (unchanged) */
            <>
              {manualPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
                    No Records Found
                  </td>
                </tr>
              ) : (
                manualPayments.map((m, idx) => (
                  <tr key={idx} style={{ fontSize: 12 }}>
                    <td>{new Date(m.createdAt).toLocaleString("en-GB")}</td>
                    <td>
                      {m.name} ({m.phone})
                    </td>
                    <td>{m._id}</td>
                    <td>-</td>
                    <td>
                      {m.payment.url ? (
                        <a
                          href={m.payment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Link
                        </a>
                      ) : (
                        "N/A"
                      )}
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
        Export to CSV
      </CSVLink>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16 }}>
            Create Payment Link
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Check
                inline
                label="Customer"
                type="radio"
                name="type"
                value="customer"
                checked={formData.type === "customer"}
                onChange={handleInputChange}
              
              />

              <Form.Check
                inline
                label="Vendor"
                type="radio"
                name="type"
                value="vendor"
                checked={formData.type === "vendor"}
                onChange={handleInputChange}
             
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control name="name" onChange={handleInputChange} required />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Phone </Form.Label>
              <Form.Control
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                maxLength={10}
                inputMode="numeric"
                required
                style={{ borderColor: errors.phone ? "red" : "" }}
              />

              {errors.phone && (
                <small style={{ color: "red", fontSize: "11px" }}>
                  {errors.phone}
                </small>
              )}
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                name="amount"
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Service *</Form.Label>
              <Form.Select name="service" onChange={handleInputChange} required>
                <option value="">Select Service</option>
                <option value="House Painting">House Painting</option>
                <option value="Deep Cleaning">Deep Cleaning</option>
                <option value="Interior">Interior</option>
                <option value="Packers & Movers">Packers & Movers</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>City *</Form.Label>
              <Form.Select name="city" onChange={handleInputChange} required>
                <option value="">Select City</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Pune">Pune</option>
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
                  checked={formData.context === "others"}
                  onChange={handleInputChange}
                  
                />
                <Form.Check
                  label="Coins"
                  type="radio"
                  name="context"
                  value="coins"
                  checked={formData.context === "coins"}
                  onChange={handleInputChange}
              
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            style={{
              color: "black",
              borderColor: "black",
              backgroundColor: "white",
              fontWeight: "600",
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

const styles = {
  paymentTabs: {
    display: "flex",
    gap: "12px",
    marginBottom: "10px",
    borderBottom: "2px solid #e5e5e5",
  },

  paymentTab: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    color: "#555",
    borderRadius: "6px 6px 0 0",
    transition: "all 0.2s ease",
  },

  paymentTabActive: {
    backgroundColor: "#000",
    color: "white",
    borderBottom: "2px solid #000",
  },

  paymentTabHover: {
    backgroundColor: "#f5f5f5",
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
//   const [filter, setFilter] = useState("paid"); // 'paid' | 'pending'
//   const [paymentMode, setPaymentMode] = useState("booking");
//   const [manualPayments, setManualPayments] = useState([]);
//   const [hoverTab, setHoverTab] = useState("");
//   const [filters, setFilters] = useState({
//     service: "All Services",
//     city: "All Cities",
//   });

//   const [customDate, setCustomDate] = useState({
//     start: "",
//     end: "",
//   });

//   const [formData, setFormData] = useState({
//     type: "customer",
//     name: "",
//     phone: "",
//     amount: "",
//     service: "",
//     city: "",
//     context: "others",
//   });

//   // Totals
//   const [totalSales, setTotalSales] = useState(0);
//   const [pendingAmount, setPendingAmount] = useState(0);
//   const [cashAmount, setCashAmount] = useState(0);
//   const [onlineAmount, setOnlineAmount] = useState(0); // UPI

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

//   // -------------------------
//   // Fetch leads (GET /bookings/get-all-leads)
//   // -------------------------
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
//       calculateTotals(leads);
//     } catch (err) {
//       console.error("Error fetching leads:", err);
//       setPayments([]);
//       setTotalSales(0);
//       setPendingAmount(0);
//       setCashAmount(0);
//       setOnlineAmount(0);
//     }
//   };

//   // initial load
//   useEffect(() => {
//     fetchPayments();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (paymentMode === "manual") {
//       fetchManualPayments();
//     }
//   }, [paymentMode, filter]);

//   // -------------------------
//   // Totals calculation (Dashboard logic)
//   // -------------------------
//   const calculateTotals = (list) => {
//     let totalSalesCalc = 0;
//     let pendingCalc = 0;
//     let cashCalc = 0;
//     let onlineCalc = 0;

//     list.forEach((item) => {
//       const b = item.bookingDetails || {};
//       const paidAmount = Number(b.paidAmount || 0);
//       const amountYetToPay = Number(b.amountYetToPay || 0);
//       const method = (b.paymentMethod || "").toString();

//       totalSalesCalc += paidAmount;
//       pendingCalc += amountYetToPay;

//       if (method === "Cash") cashCalc += paidAmount;
//       if (method === "UPI") onlineCalc += paidAmount;
//     });

//     setTotalSales(totalSalesCalc);
//     setPendingAmount(pendingCalc);
//     setCashAmount(cashCalc);
//     setOnlineAmount(onlineCalc);
//   };

//   // -------------------------
//   // Search (uses current filters)
//   // -------------------------
//   const handleSearch = () => {
//     fetchPayments();
//   };

//   // -------------------------
//   // Paid / Pending filter (by paymentStatus)
//   // -------------------------
//   const filteredPayments = payments.filter((p) => {
//     const status = p?.bookingDetails?.paymentStatus || "";
//     return filter === "paid" ? status === "Paid" : status !== "Paid";
//   });

//   // -------------------------
//   // CSV export mapping (columns per requirement)
//   // -------------------------
//   const csvData = filteredPayments.flatMap((payment) => {
//     const svcList = payment.service || [];
//     return svcList.map((svc) => {
//       // amount is sum of installments (first + second + final)
//       const b = payment.bookingDetails || {};
//       const first = Number(b.firstPayment?.amount || 0);
//       const second = Number(b.secondPayment?.amount || 0);
//       const final = Number(b.finalPayment?.amount || 0);
//       const totalInstallments = first + second + final;

//       // date/time: prefer selectedSlot, otherwise bookingDate
//       const slotDate = payment.selectedSlot?.slotDate || "";
//       const slotTime = payment.selectedSlot?.slotTime || "";
//       const dateTime = slotDate
//         ? `${slotDate} ${slotTime || ""}`
//         : b.bookingDate
//         ? new Date(b.bookingDate).toLocaleString("en-GB")
//         : "";

//       return {
//         "Date & Time": dateTime,
//         Customer: `${payment.customer?.name || "-"} (${
//           payment.customer?.phone || "-"
//         })`,
//         "Order Id": payment._id || payment._id?._id || "-",
//         Vendor: payment.assignedProfessional?.name || "Not Assigned",
//         "Payment ID": "N/A",
//         Amount: totalInstallments,
//         Service: payment.serviceType || "-",
//         City: payment.address?.city || "-",
//       };
//     });
//   });

//   // -------------------------
//   // Form input handler for modal
//   // -------------------------
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // -------------------------
//   // Modal action: generate link (alert only)
//   // -------------------------
//   const generatePaymentLink = async () => {
//     try {
//       const res = await axios.post(
//         `${BASE_URL}/manual-payment/create`,
//         formData
//       );

//       alert("Payment Link Created:\n" + res.data.data.payment.paymentUrl);

//       setShowModal(false);
//     } catch (err) {
//       console.error("Error creating manual payment:", err);
//       alert("Error creating payment link");
//     }
//   };

//   // helper to format date/time cell
//   const formatSlotDateTime = (payment) => {
//     const slotDate = payment.selectedSlot?.slotDate;
//     const slotTime = payment.selectedSlot?.slotTime;
//     if (slotDate) {
//       return `${slotDate} ${slotTime || ""}`;
//     }
//     const bDate = payment.bookingDetails?.bookingDate;
//     if (bDate) return new Date(bDate).toLocaleString("en-GB");
//     return "-";
//   };

//   // helper to compute installment sum for a payment
//   const installmentsSum = (payment) => {
//     const b = payment.bookingDetails || {};
//     const first = Number(b.firstPayment?.amount || 0);
//     const second = Number(b.secondPayment?.amount || 0);
//     const final = Number(b.finalPayment?.amount || 0);
//     return first + second + final;
//   };

//   return (
//     <Container className="mt-4" style={{ fontFamily: "Poppins, sans-serif" }}>
//       <h5 className="fw-bold">Money Dashboard</h5>
//       {/* top filters (City, Service, Start date, End date, Search, Create Payment Link) */}
//       {/* <Row className="mb-3 align-items-center"> */}
//       <div className="mb-3 d-flex justify-content-end gap-2">
//         <Form.Select
//           className="w-auto"
//           style={{ height: "38px", fontSize: 12 }}
//           onChange={(e) => setFilters({ ...filters, city: e.target.value })}
//           value={filters.city}
//         >
//           <option>All Cities</option>
//           <option>Bengaluru</option>
//           <option>Pune</option>
//         </Form.Select>

//         <Form.Select
//           className="w-auto"
//           style={{ height: "38px", fontSize: 12 }}
//           onChange={(e) => setFilters({ ...filters, service: e.target.value })}
//           value={filters.service}
//         >
//           <option>All Services</option>
//           <option>House Painting</option>
//           <option>Deep Cleaning</option>
//           {/* <option>Interior</option>
//             <option>Packers & Movers</option> */}
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
//       {/* </Row> */}

//       {/* Cards */}
//       <Row className="mb-4">
//         <Col md={6}>
//           <Card className="p-3 shadow-sm">
//             <h6 className="fw-bold" style={{ fontSize: 14 }}>
//               Total Sales: ₹{totalSales.toLocaleString()}
//               <span style={{ marginLeft: 8 }}>
//                 {totalSales > 0 ? (
//                   <FaArrowUp color="green" />
//                 ) : (
//                   <FaArrowDown color="red" />
//                 )}
//                 {"  "}
//                 <span
//                   style={{ color: "green", fontWeight: 700, marginLeft: 6 }}
//                 >
//                   +10%
//                 </span>
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

//       {/* Paid / Pending buttons */}
//       <div className="mb-3">
//         <button
//           className={`btn ${
//             filter === "paid" ? "btn-dark text-white" : "btn-outline-dark me-2"
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
//           {/* WHEN SHOWING BOOKING PAYMENTS */}
//           {paymentMode === "booking" ? (
//             <>
//               {filteredPayments.length === 0 && (
//                 <tr>
//                   <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
//                     No records found
//                   </td>
//                 </tr>
//               )}

//               {filteredPayments.map((payment, idx) =>
//                 (payment.service || []).map((svc, sidx) => {
//                   const dateTime = formatSlotDateTime(payment);
//                   const customerText = `${payment.customer?.name || "-"} (${
//                     payment.customer?.phone || "-"
//                   })`;
//                   const orderId = payment._id || "-";
//                   const vendor =
//                     payment.assignedProfessional?.name || "Not Assigned";
//                   const amountVal = installmentsSum(payment);
//                   const serviceText = payment.serviceType || "-";
//                   const city = payment.address?.city || "-";

//                   return (
//                     <tr key={`${idx}-${sidx}`} style={{ fontSize: 12 }}>
//                       <td>{dateTime}</td>
//                       <td>{customerText}</td>
//                       <td>{orderId}</td>
//                       <td>{vendor}</td>
//                       <td>N/A</td>
//                       <td>₹{amountVal.toLocaleString()}</td>
//                       <td>{serviceText}</td>
//                       <td>{city}</td>
//                     </tr>
//                   );
//                 })
//               )}
//             </>
//           ) : (
//             <>
//               {/* WHEN SHOWING MANUAL PAYMENTS */}
//               {manualPayments.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
//                     No records found
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
//                       {m.payment.paymentUrl ? (
//                         <a
//                           href={m.payment.paymentUrl}
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
//               <Form.Label>Name</Form.Label>
//               <Form.Control name="name" onChange={handleInputChange} />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Phone</Form.Label>
//               <Form.Control name="phone" onChange={handleInputChange} />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Amount</Form.Label>
//               <Form.Control
//                 type="number"
//                 name="amount"
//                 onChange={handleInputChange}
//               />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Service</Form.Label>
//               <Form.Select name="service" onChange={handleInputChange}>
//                 <option value="">Select Service</option>
//                 <option value="House Painting">House Painting</option>
//                 <option value="Deep Cleaning">Deep Cleaning</option>
//                 <option value="Interior">Interior</option>
//                 <option value="Packers & Movers">Packers & Movers</option>
//               </Form.Select>
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>City</Form.Label>
//               <Form.Select name="city" onChange={handleInputChange}>
//                 <option value="">Select City</option>
//                 <option value="Bengaluru">Bengaluru</option>
//                 <option value="Pune">Pune</option>
//               </Form.Select>
//             </Form.Group>

//             {formData.type === "vendor" && (
//               <Form.Group className="mt-3">
//                 <Form.Label>Context</Form.Label>
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
