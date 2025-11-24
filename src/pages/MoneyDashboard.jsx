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
  const [filter, setFilter] = useState("paid"); // 'paid' | 'pending'

  const [filters, setFilters] = useState({
    service: "All Services",
    city: "All Cities",
  });

  const [customDate, setCustomDate] = useState({
    start: "",
    end: "",
  });

  const [formData, setFormData] = useState({
    type: "customer",
    name: "",
    phone: "",
    amount: "",
    service: "",
    city: "",
    context: "others",
  });

  // Totals
  const [totalSales, setTotalSales] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [cashAmount, setCashAmount] = useState(0);
  const [onlineAmount, setOnlineAmount] = useState(0); // UPI

  // -------------------------
  // Fetch leads (GET /bookings/get-all-leads)
  // -------------------------
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
      setTotalSales(0);
      setPendingAmount(0);
      setCashAmount(0);
      setOnlineAmount(0);
    }
  };

  // initial load
  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Totals calculation (Dashboard logic)
  // -------------------------
  const calculateTotals = (list) => {
    let totalSalesCalc = 0;
    let pendingCalc = 0;
    let cashCalc = 0;
    let onlineCalc = 0;

    list.forEach((item) => {
      const b = item.bookingDetails || {};
      const paidAmount = Number(b.paidAmount || 0);
      const amountYetToPay = Number(b.amountYetToPay || 0);
      const method = (b.paymentMethod || "").toString();

      totalSalesCalc += paidAmount;
      pendingCalc += amountYetToPay;

      if (method === "Cash") cashCalc += paidAmount;
      if (method === "UPI") onlineCalc += paidAmount;
    });

    setTotalSales(totalSalesCalc);
    setPendingAmount(pendingCalc);
    setCashAmount(cashCalc);
    setOnlineAmount(onlineCalc);
  };

  // -------------------------
  // Search (uses current filters)
  // -------------------------
  const handleSearch = () => {
    fetchPayments();
  };

  // -------------------------
  // Paid / Pending filter (by paymentStatus)
  // -------------------------
  const filteredPayments = payments.filter((p) => {
    const status = p?.bookingDetails?.paymentStatus || "";
    return filter === "paid" ? status === "Paid" : status !== "Paid";
  });

  // -------------------------
  // CSV export mapping (columns per requirement)
  // -------------------------
  const csvData = filteredPayments.flatMap((payment) => {
    const svcList = payment.service || [];
    return svcList.map((svc) => {
      // amount is sum of installments (first + second + final)
      const b = payment.bookingDetails || {};
      const first = Number(b.firstPayment?.amount || 0);
      const second = Number(b.secondPayment?.amount || 0);
      const final = Number(b.finalPayment?.amount || 0);
      const totalInstallments = first + second + final;

      // date/time: prefer selectedSlot, otherwise bookingDate
      const slotDate = payment.selectedSlot?.slotDate || "";
      const slotTime = payment.selectedSlot?.slotTime || "";
      const dateTime = slotDate ? `${slotDate} ${slotTime || ""}` : (b.bookingDate ? new Date(b.bookingDate).toLocaleString("en-GB") : "");

      return {
        "Date & Time": dateTime,
        "Customer": `${payment.customer?.name || "-"} (${payment.customer?.phone || "-"})`,
        "Order Id": payment._id || (payment._id?._id) || "-",
        "Vendor": payment.assignedProfessional?.name || "Not Assigned",
        "Payment ID": "N/A",
        "Amount": totalInstallments,
        "Service": payment.serviceType || "-",
        "City": payment.address?.city || "-",
      };
    });
  });

  // -------------------------
  // Form input handler for modal
  // -------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // -------------------------
  // Modal action: generate link (alert only)
  // -------------------------
  const generatePaymentLink = () => {
    alert(
      `Payment Link Generated!\n\n` +
        `Name: ${formData.name}\n` +
        `Phone: ${formData.phone}\n` +
        `Amount: ₹${formData.amount}\n` +
        `Service: ${formData.service}\n` +
        `City: ${formData.city}\n` +
        `Context: ${formData.context.toUpperCase()}`
    );
    setShowModal(false);
  };

  // helper to format date/time cell
  const formatSlotDateTime = (payment) => {
    const slotDate = payment.selectedSlot?.slotDate;
    const slotTime = payment.selectedSlot?.slotTime;
    if (slotDate) {
      return `${slotDate} ${slotTime || ""}`;
    }
    const bDate = payment.bookingDetails?.bookingDate;
    if (bDate) return new Date(bDate).toLocaleString("en-GB");
    return "-";
  };

  // helper to compute installment sum for a payment
  const installmentsSum = (payment) => {
    const b = payment.bookingDetails || {};
    const first = Number(b.firstPayment?.amount || 0);
    const second = Number(b.secondPayment?.amount || 0);
    const final = Number(b.finalPayment?.amount || 0);
    return first + second + final;
  };

  return (
    <Container className="mt-4" style={{ fontFamily: "Poppins, sans-serif" }}>
          <h5 className="fw-bold">Money Dashboard</h5>
      {/* top filters (City, Service, Start date, End date, Search, Create Payment Link) */}
      {/* <Row className="mb-3 align-items-center"> */}
        <div className="mb-3 d-flex justify-content-end gap-2">
          <Form.Select
            className="w-auto"
            style={{ height: "38px", fontSize: 12 }}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            value={filters.city}
          >
            <option>All Cities</option>
            <option>Bengaluru</option>
            <option>Pune</option>
          </Form.Select>

          <Form.Select
            className="w-auto"
            style={{ height: "38px", fontSize: 12 }}
            onChange={(e) => setFilters({ ...filters, service: e.target.value })}
            value={filters.service}
          >
            <option>All Services</option>
            <option>House Painting</option>
            <option>Deep Cleaning</option>
            {/* <option>Interior</option>
            <option>Packers & Movers</option> */}
          </Form.Select>

          <input
            type="date"
            style={{ fontSize: 12 }}
            value={customDate.start}
            onChange={(e) => setCustomDate({ ...customDate, start: e.target.value })}
          />
          <input
            type="date"
            style={{ fontSize: 12 }}
            value={customDate.end}
            onChange={(e) => setCustomDate({ ...customDate, end: e.target.value })}
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
      {/* </Row> */}

      {/* Cards */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="p-3 shadow-sm">
            <h6 className="fw-bold" style={{ fontSize: 14 }}>
              Total Sales: ₹{totalSales.toLocaleString()}
              <span style={{ marginLeft: 8 }}>
                {totalSales > 0 ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />}
                {"  "}
                <span style={{ color: "green", fontWeight: 700, marginLeft: 6 }}>+10%</span>
              </span>
            </h6>

            <p style={{ fontSize: 12 }}>Online Payment: ₹{onlineAmount.toLocaleString()}</p>
            <p style={{ fontSize: 12 }}>Cash Payment: ₹{cashAmount.toLocaleString()}</p>

       
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

      {/* Paid / Pending buttons */}
      <div className="mb-3">
        <button
          className={`btn ${filter === "paid" ? "btn-dark text-white" : "btn-outline-dark me-2"}`}
          onClick={() => setFilter("paid")}
          style={{ fontSize: 12, marginRight: 8 }}
        >
          Paid List
        </button>

        <button
          className={`btn ${filter === "pending" ? "btn-dark text-white" : "btn-outline-dark"}`}
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
          {filteredPayments.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
                No records found
              </td>
            </tr>
          )}

          {filteredPayments.map((payment, idx) =>
            (payment.service || []).map((svc, sidx) => {
              const dateTime = formatSlotDateTime(payment);
              const customerText = `${payment.customer?.name || "-"} (${payment.customer?.phone || "-"})`;
              const orderId = payment._id || (payment._id?._id) || "-";
              const vendor = payment.assignedProfessional?.name || "Not Assigned";
              const amountVal = installmentsSum(payment);
              const serviceText = payment.serviceType || "-";
              const city = payment.address?.city || "-";

              return (
                <tr key={`${idx}-${sidx}`} style={{ fontSize: 12 }}>
                  <td>{dateTime}</td>
                  <td>{customerText}</td>
                  <td>{orderId}</td>
                  <td>{vendor}</td>
                  <td>N/A</td>
                  <td>₹{amountVal.toLocaleString()}</td>
                  <td>{serviceText}</td>
                  <td>{city}</td>
                </tr>
              );
            })
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
          <Modal.Title style={{ fontSize: 16 }}>Create Payment Link</Modal.Title>
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
              <Form.Label>Name</Form.Label>
              <Form.Control name="name" onChange={handleInputChange} />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control name="phone" onChange={handleInputChange} />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control type="number" name="amount" onChange={handleInputChange} />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Service</Form.Label>
              <Form.Select name="service" onChange={handleInputChange}>
                <option value="">Select Service</option>
                <option value="House Painting">House Painting</option>
                <option value="Deep Cleaning">Deep Cleaning</option>
                <option value="Interior">Interior</option>
                <option value="Packers & Movers">Packers & Movers</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>City</Form.Label>
              <Form.Select name="city" onChange={handleInputChange}>
                <option value="">Select City</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Pune">Pune</option>
              </Form.Select>
            </Form.Group>

            {formData.type === "vendor" && (
              <Form.Group className="mt-3">
                <Form.Label>Context</Form.Label>
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

export default MoneyDashboard;
