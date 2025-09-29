import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";

// util: strip +91 from contact
const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");



const EditEnquiryModal = ({ show, onClose, enquiry, onUpdated }) => {
  const [saving, setSaving] = useState(false);

  // Local form state (prefilled from enquiry.raw)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [formName, setFormName] = useState("");

  const [houseFlatNumber, setHouseFlatNumber] = useState("");
  const [streetArea, setStreetArea] = useState("");
  const [landMark, setLandMark] = useState("");

  const [slotDate, setSlotDate] = useState(""); // YYYY-MM-DD
  const [slotTime, setSlotTime] = useState(""); // e.g., "04:00 PM"

  const [services, setServices] = useState([]); // [{category, subCategory, serviceName, price, quantity}]

  const [status, setStatus] = useState("Pending"); // optional
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [paidAmount, setPaidAmount] = useState("");

  useEffect(() => {
    if (!enquiry?.raw) return;
    const { customer, address, selectedSlot, service, bookingDetails, formName: fm } = enquiry.raw;

    setCustomerName(customer?.name || "");
    setCustomerPhone(normalizePhone(enquiry?.contact) || customer?.phone || "");

    setFormName(fm || enquiry?.formName || "");

    setHouseFlatNumber(address?.houseFlatNumber || "");
    setStreetArea(address?.streetArea || "");
    setLandMark(address?.landMark || "");

    setSlotDate(selectedSlot?.slotDate || ""); // assume stored as "YYYY-MM-DD"
    setSlotTime(selectedSlot?.slotTime || ""); // "hh:mm AM/PM"

    setServices(
      (service || []).map(s => ({
        category: s?.category || "",
        subCategory: s?.subCategory || "",
        serviceName: s?.serviceName || "",
        price: s?.price ?? "",
        quantity: s?.quantity ?? 1,
      }))
    );

    setStatus(bookingDetails?.status || "Pending");
    setPaymentMethod(bookingDetails?.paymentMethod || "Cash");
    setPaymentStatus(bookingDetails?.paymentStatus || "Unpaid");
    setPaidAmount(
      bookingDetails?.paidAmount !== undefined && bookingDetails?.paidAmount !== null
        ? String(bookingDetails?.paidAmount)
        : ""
    );
  }, [enquiry]);

  const onServiceChange = (idx, field, value) => {
    setServices(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: field === "price" || field === "quantity" ? (value === "" ? "" : Number(value)) : value };
      return copy;
    });
  };

  const addService = () => {
    setServices(prev => [
      ...prev,
      { category: "", subCategory: "", serviceName: "", price: "", quantity: 1 },
    ]);
  };

  const removeService = (idx) => {
    setServices(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!enquiry?.bookingId) return;
    setSaving(true);

    // Build payload matching your updateBooking controller
    const payload = {
      customer: {
        name: customerName,
        phone: customerPhone,
        customerId: enquiry?.raw?.customer?.customerId, // keep if available
      },
      service: services.map(s => ({
        category: s.category,
        subCategory: s.subCategory,
        serviceName: s.serviceName,
        price: s.price === "" ? undefined : Number(s.price),
        quantity: s.quantity === "" ? undefined : Number(s.quantity),
      })),
      bookingDetails: {
        status,
        paymentMethod,
        paymentStatus,
        paidAmount: paidAmount === "" ? undefined : Number(paidAmount),
        // you can add editedPrice/amountYetToPay/scope if you expose them in the form
      },
      address: {
        houseFlatNumber,
        streetArea,
        landMark,
        location: enquiry?.raw?.address?.location ?? undefined, // keep coordinates as-is
      },
      selectedSlot: {
        slotDate,
        slotTime,
      },
      isEnquiry: enquiry?.raw?.isEnquiry ?? true,
      formName,
    };

    // Clean undefined numeric fields from service array
    payload.service = payload.service.map(s => ({
      category: s.category,
      subCategory: s.subCategory,
      serviceName: s.serviceName,
      ...(typeof s.price === "number" ? { price: s.price } : {}),
      ...(typeof s.quantity === "number" ? { quantity: s.quantity } : {}),
    }));

    try {
      const res = await fetch(
        `https://homjee-backend.onrender.com/api/bookings/update-user-booking/${enquiry.bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update");
      }

      // Notify parent to refresh/update list view state
      onUpdated?.(data.booking);
      onClose();
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 16 }}>Edit Enquiry</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ fontSize: 13 }}>
        {/* Customer */}
        <h6 className="mb-2">Customer</h6>
        <Row className="g-2 mb-3">
          <Col md={6}>
            <Form.Label>Name</Form.Label>
            <Form.Control
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              size="sm"
            />
          </Col>
          <Col md={6}>
            <Form.Label>Phone</Form.Label>
            <InputGroup size="sm">
              <InputGroup.Text>+91</InputGroup.Text>
              <Form.Control
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit number"
              />
            </InputGroup>
          </Col>
        </Row>

        {/* Address */}
        <h6 className="mb-2">Address</h6>
        <Row className="g-2 mb-3">
          <Col md={4}>
            <Form.Label>House / Flat No.</Form.Label>
            <Form.Control
              value={houseFlatNumber}
              onChange={(e) => setHouseFlatNumber(e.target.value)}
              placeholder="12A"
              size="sm"
            />
          </Col>
          <Col md={4}>
            <Form.Label>Street / Area</Form.Label>
            <Form.Control
              value={streetArea}
              onChange={(e) => setStreetArea(e.target.value)}
              placeholder="MG Road"
              size="sm"
            />
          </Col>
          <Col md={4}>
            <Form.Label>Landmark</Form.Label>
            <Form.Control
              value={landMark}
              onChange={(e) => setLandMark(e.target.value)}
              placeholder="Near Metro"
              size="sm"
            />
          </Col>
        </Row>

        {/* Slot */}
        <h6 className="mb-2">Preferred Slot</h6>
        <Row className="g-2 mb-3">
          <Col md={6}>
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              value={slotDate || ""}
              onChange={(e) => setSlotDate(e.target.value)}
              size="sm"
            />
          </Col>
          <Col md={6}>
            <Form.Label>Time</Form.Label>
            <Form.Control
              value={slotTime}
              onChange={(e) => setSlotTime(e.target.value)}
              placeholder="e.g., 04:00 PM"
              size="sm"
            />
          </Col>
        </Row>

        {/* Services */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="mb-0">Services</h6>
          <Button variant="outline-secondary" size="sm" onClick={addService}>
            + Add Service
          </Button>
        </div>

        {services.map((s, idx) => (
          <Row key={idx} className="g-2 align-items-end mb-2">
            <Col md={3}>
              <Form.Label className="mb-1">Category</Form.Label>
              <Form.Control
                value={s.category}
                onChange={(e) => onServiceChange(idx, "category", e.target.value)}
                placeholder="Deep Cleaning / House Painting"
                size="sm"
              />
            </Col>
            <Col md={2}>
              <Form.Label className="mb-1">Subcategory</Form.Label>
              <Form.Control
                value={s.subCategory}
                onChange={(e) => onServiceChange(idx, "subCategory", e.target.value)}
                placeholder="Kitchen / 2BHK"
                size="sm"
              />
            </Col>
            <Col md={3}>
              <Form.Label className="mb-1">Service Name</Form.Label>
              <Form.Control
                value={s.serviceName}
                onChange={(e) => onServiceChange(idx, "serviceName", e.target.value)}
                placeholder="Full Kitchen / Interior"
                size="sm"
              />
            </Col>
            <Col md={2}>
              <Form.Label className="mb-1">Price (₹)</Form.Label>
              <Form.Control
                type="number"
                value={s.price}
                onChange={(e) => onServiceChange(idx, "price", e.target.value)}
                size="sm"
                min="0"
              />
            </Col>
            <Col md={1}>
              <Form.Label className="mb-1">Qty</Form.Label>
              <Form.Control
                type="number"
                value={s.quantity}
                onChange={(e) => onServiceChange(idx, "quantity", e.target.value)}
                size="sm"
                min="1"
              />
            </Col>
            <Col md={1} className="text-end">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => removeService(idx)}
              >
                ×
              </Button>
            </Col>
          </Row>
        ))}

        {/* Meta */}
        <Row className="g-2 mt-3">
          <Col md={6}>
            <Form.Label>Form Name</Form.Label>
            <Form.Control
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Form identifier"
              size="sm"
            />
          </Col>
          <Col md={6}>
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              size="sm"
            >
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Ongoing</option>
              <option>Completed</option>
              <option>Customer Cancelled</option>
              <option>Customer Unreachable</option>
            </Form.Select>
          </Col>
        </Row>

        <Row className="g-2 mt-2">
          <Col md={4}>
            <Form.Label>Payment Method</Form.Label>
            <Form.Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              size="sm"
            >
              <option>Cash</option>
              <option>Card</option>
              <option>UPI</option>
              <option>Wallet</option>
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>Payment Status</Form.Label>
            <Form.Select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              size="sm"
            >
              <option>Unpaid</option>
              <option>Paid</option>
              <option>Refunded</option>
              <option>Waiting for final payment</option>
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>Paid Amount (₹)</Form.Label>
            <Form.Control
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              size="sm"
              min="0"
              placeholder="0"
            />
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};



export default EditEnquiryModal;
