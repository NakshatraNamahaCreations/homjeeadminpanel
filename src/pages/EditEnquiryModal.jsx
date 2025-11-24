import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
import AddressPickerModal from "./AddressPickerModal";
import TimePickerModal from "./TimePickerModal";
import { BASE_URL } from "../utils/config";

// util: strip +91 from contact
const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

const EditEnquiryModal = ({ show, onClose, enquiry, onUpdated, title }) => {
  const [saving, setSaving] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [formName, setFormName] = useState("");

  const [houseFlatNumber, setHouseFlatNumber] = useState("");
  const [streetArea, setStreetArea] = useState("");
  const [landMark, setLandMark] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState(null);

  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");

  const [services, setServices] = useState([]);
  const [initialServiceCount, setInitialServiceCount] = useState(0);

  const [status, setStatus] = useState("Pending");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [paidAmount, setPaidAmount] = useState("");

  // Server data states
  const [deepList, setDeepList] = useState([]);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  // Fetch Deep Cleaning packages once
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fixed URL (removed stray quote)
        const res = await fetch(
          `${BASE_URL}/deeppackage/deep-cleaning-packages`
        );
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          setDeepList(data.data);
        } else {
          // If API returns success:false or unexpected shape, still set empty list
          setDeepList(Array.isArray(data?.data) ? data.data : []);
          console.warn("Deep cleaning API returned unexpected data", data);
        }
      } catch (err) {
        console.log("Error fetching deep cleaning data:", err);
        setDeepList([]);
      }
    };
    fetchData();
  }, []);

  // Load enquiry data
  useEffect(() => {
    if (!enquiry?.raw) return;

    const {
      customer,
      address,
      selectedSlot,
      service,
      bookingDetails,
      formName: fm,
    } = enquiry.raw;

    setCustomerName(customer?.name || "");
    setCustomerPhone(normalizePhone(enquiry?.contact) || customer?.phone || "");
    setFormName(fm || enquiry?.formName || "");

    setHouseFlatNumber(address?.houseFlatNumber || "");
    setStreetArea(address?.streetArea || "");
    setLandMark(address?.landMark || "");
    setCity(address?.city || "");
    setLocation(address?.location || null);

    setSlotDate(selectedSlot?.slotDate || "");
    setSlotTime(selectedSlot?.slotTime || "");

    setServices(
      (service || []).map((s) => {
        // try to get bookingAmount from service item or from deepList when available
        let bookingAmt = s.bookingAmount !== undefined && s.bookingAmount !== null ? s.bookingAmount : undefined;
        if ((bookingAmt === undefined || bookingAmt === null || bookingAmt === "") && Array.isArray(deepList)) {
          const match = deepList.find(
            (d) =>
              (d.name && s.serviceName && d.name.toString().trim() === s.serviceName.toString().trim()) ||
              (d.service && s.serviceName && d.service.toString().trim() === s.serviceName.toString().trim())
          );
          if (match && match.bookingAmount !== undefined && match.bookingAmount !== null) {
            bookingAmt = match.bookingAmount;
          }
        }

        return {
          category: s.category,
          subCategory: s.subCategory,
          serviceName: s.serviceName,
          price: String(s.price),
          bookingAmount: bookingAmt !== undefined && bookingAmt !== null ? String(bookingAmt) : "",
        };
      })
    );
    // remember how many services were loaded initially so we can add bookingAmount only for newly added services
    setInitialServiceCount((service || []).length || 0);

    setStatus(bookingDetails?.status || "Pending");
    setPaymentMethod(bookingDetails?.paymentMethod || "Cash");
    setPaymentStatus(bookingDetails?.paymentStatus || "Unpaid");
    setPaidAmount(
      bookingDetails?.paidAmount !== undefined &&
        bookingDetails?.paidAmount !== null
        ? String(bookingDetails?.paidAmount)
        : ""
    );
  }, [enquiry]);

  // If deepList loads after enquiry, try to fill missing bookingAmount values for services
  useEffect(() => {
    if (!Array.isArray(deepList) || deepList.length === 0) return;
    if (!Array.isArray(services) || services.length === 0) return;

    setServices((prev) =>
      prev.map((s) => {
        if (s.bookingAmount !== undefined && s.bookingAmount !== "") return s;
        const match = deepList.find(
          (d) =>
            (d.name && s.serviceName && d.name.toString().trim() === s.serviceName.toString().trim()) ||
            (d.service && s.serviceName && d.service.toString().trim() === s.serviceName.toString().trim())
        );
        if (match && match.bookingAmount !== undefined && match.bookingAmount !== null) {
          return { ...s, bookingAmount: String(match.bookingAmount) };
        }
        return s;
      })
    );
  }, [deepList]);

  const onServiceChange = (idx, field, value) => {
    setServices((prev) => {
      const copy = [...prev];
      const updated = {
        ...copy[idx],
        [field]: (field === "price" || field === "bookingAmount") && value === "" ? "" : value,
      };
      copy[idx] = updated;
      return copy;
    });
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      {
        category: "Deep Cleaning",
        subCategory: "",
        serviceName: "",
        price: "",
        bookingAmount: "",
      },
    ]);
  };

  const removeService = (idx) =>
    setServices((prev) => prev.filter((_, i) => i !== idx));

  const isHousePaintingService = services.some(
    (s) => s.category?.toLowerCase() === "house painting"
  );

  // Updated address selection handler - now only updates local state
  const handleAddressSelect = (addressData) => {
    // Update local state only
    setHouseFlatNumber(addressData.houseFlatNumber || "");
    setStreetArea(addressData.formattedAddress || "");
    setLandMark(addressData.landmark || "");
    setCity(addressData.city || "");
    if (
      addressData.lng !== undefined &&
      addressData.lat !== undefined &&
      !Number.isNaN(addressData.lng) &&
      !Number.isNaN(addressData.lat)
    ) {
      setLocation({
        type: "Point",
        coordinates: [addressData.lng, addressData.lat],
      });
    }

    // Reset slot fields since address update clears them
    setSlotDate("");
    setSlotTime("");
  };

  // Updated slot selection handler - now only updates local state
  const handleSlotSelect = (sel) => {
    setSlotDate(sel.slotDate || "");
    setSlotTime(sel.slotTime || "");
  };

  const derivedLatLng = (() => {
    if (!location) return undefined;
    if (Array.isArray(location.coordinates))
      return {
        lat: location.coordinates[1],
        lng: location.coordinates[0],
      };
    return undefined;
  })();

  // site visit charges from backend (used for House Painting)
  const siteVisitCharges = Number(enquiry?.raw?.bookingDetails?.siteVisitCharges ?? enquiry?.raw?.bookingDetails?.siteVisitCharges ?? 0) || 0;

  // Totals used in UI
  const totalAmount = isHousePaintingService
    ? Number(services[0]?.price || siteVisitCharges || 0)
    : services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

  const bookingAmountTotal = isHousePaintingService
    ? Number(siteVisitCharges || 0)
    : (() => {
        const baseBooking = Number(enquiry?.raw?.bookingDetails?.bookingAmount) || 0;
        const newServices = services.slice(initialServiceCount || 0);
        const sumNew = newServices.reduce((sum, s) => sum + (Number(s.bookingAmount) || 0), 0);
        return baseBooking + sumNew;
      })();

  // Validate all required fields before saving
  const validateFields = () => {
    // Customer validation
    if (!customerName.trim()) {
      alert("Customer name is required");
      return false;
    }

    if (!customerPhone.trim() || customerPhone.length !== 10) {
      alert("Valid 10-digit phone number is required");
      return false;
    }

    // Address validation
    if (!houseFlatNumber.trim()) {
      alert("House/Flat number is required");
      return false;
    }

    if (!streetArea.trim()) {
      alert("Street/Area is required");
      return false;
    }

    if (!city.trim()) {
      alert("City is required");
      return false;
    }

    if (!location || !location.coordinates) {
      alert("Location coordinates are required");
      return false;
    }

    // Slot validation
    if (!slotDate.trim()) {
      alert("Slot date is required");
      return false;
    }

    if (!slotTime.trim()) {
      alert("Slot time is required");
      return false;
    }

    // Services validation
    if (services.length === 0) {
      alert("At least one service is required");
      return false;
    }

    // Validate each service
    for (let i = 0; i < services.length; i++) {
      const service = services[i];

      if (!service.category?.trim()) {
        alert(`Service ${i + 1}: Category is required`);
        return false;
      }

      if (service.category?.toLowerCase() !== "house painting") {
        if (!service.subCategory?.trim()) {
          alert(`Service ${i + 1}: Subcategory is required`);
          return false;
        }

        if (!service.serviceName?.trim()) {
          alert(`Service ${i + 1}: Service name is required`);
          return false;
        }
      }

      if (
        !service.price ||
        isNaN(Number(service.price)) ||
        Number(service.price) <= 0
      ) {
        alert(`Service ${i + 1}: Valid price is required`);
        return false;
      }
    }

    return true;
  };

  // Save handler - only calls update-user-booking API
  const handleSave = async () => {
    if (!enquiry?.bookingId) return;
    if (!validateFields()) {
      return;
    }

    setSaving(true);

    const normalizedServices = services
      .map((s) => {
        const priceTrim =
          typeof s.price === "string" ? s.price.trim() : s.price;
        const priceNum =
          priceTrim === "" || priceTrim === undefined
            ? undefined
            : Number(priceTrim);
        const bookingTrim = typeof s.bookingAmount === "string" ? s.bookingAmount.trim() : s.bookingAmount;
        const bookingNum = bookingTrim === "" || bookingTrim === undefined ? undefined : Number(bookingTrim);

        // For House Painting, use category name for all fields
        if (s.category?.toLowerCase() === "house painting") {
          // For House Painting, prefer siteVisitCharges from backend; fall back to entered price
          const hpPrice = Number.isFinite(Number(siteVisitCharges)) && Number(siteVisitCharges) > 0 ? Number(siteVisitCharges) : priceNum;
          return {
            category: s.category?.trim() || "",
            subCategory: s.category?.trim() || "",
            serviceName: s.category?.trim() || "",
            quantity: 1,
            teamMembersRequired: 1,
            ...(Number.isFinite(hpPrice) ? { price: hpPrice } : {}),
            ...(Number.isFinite(bookingNum) ? { bookingAmount: bookingNum } : {}),
          };
        }

        // For other services (Deep Cleaning)
        return {
          category: s.category?.trim() || "",
          subCategory: s.subCategory?.trim() || "",
          serviceName: s.serviceName?.trim() || "",
          quantity: 1,
          teamMembersRequired: 1,
          ...(Number.isFinite(priceNum) ? { price: priceNum } : {}),
          ...(Number.isFinite(bookingNum) ? { bookingAmount: bookingNum } : {}),
        };
      })
      .filter((s) => s.category || s.subCategory || s.serviceName);

    // Validate House Painting
    const hasHP = normalizedServices.some(
      (s) => s.category?.toLowerCase() === "house painting"
    );
    if (hasHP && normalizedServices.length > 1) {
      alert("House Painting can only have one service.");
      setSaving(false);
      return;
    }

    const paidTrim = String(paidAmount ?? "").trim();
    const paidNum = paidTrim === "" ? undefined : Number(paidTrim);

    const addressPayload = {
      houseFlatNumber,
      streetArea,
      landMark,
      city: city || "Bengaluru", // Default city if not detected
      ...(location
        ? {
            location: {
              type: "Point",
              coordinates: location.coordinates,
            },
          }
        : {}),
    };

    // Construct the payload for the PUT request
    const payload = {
      customer: {
        name: customerName,
        phone: customerPhone,
        customerId: enquiry?.raw?.customer?.customerId,
      },
      service: normalizedServices,
      bookingDetails: {
        status,
        paymentMethod,
        paymentStatus,
        bookingAmount: bookingAmountTotal,
        paidAmount:
          paidNum !== undefined && Number.isFinite(paidNum)
            ? paidNum
            : undefined,
      },
      address: addressPayload,
      selectedSlot: { slotDate, slotTime },
      isEnquiry: enquiry?.raw?.isEnquiry ?? true,
      formName,
    };

          console.log(" payload data:", payload);
          
    try {
      const res = await fetch(
        `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed");

      alert("Enquiry updated successfully!");
      console.log("Update response data:", data);
      console.log(" payload data:", payload);
      onUpdated?.(data.booking);
      onClose();
      // reload is kept as original behavior - you may remove in future
      // window.location.reload();
    } catch (err) {
      alert(err.message || "Error updating enquiry");
    } finally {
      setSaving(false);
    }
  };

  // Helper: unique subcategories from deepList (use item.subcategory)
  const getUniqueDeepCategories = () => {
    if (!Array.isArray(deepList)) return [];
    return [...new Set(deepList.map((it) => it.category).filter(Boolean))];
  };

  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        size="lg"
        centered
        enforceFocus={false}
        restoreFocus={false}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16 }}>
            {title || "Edit Enquiry"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ fontSize: 13 }}>
          {/* Customer */}
          <h6 className="mb-2">Customer *</h6>
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
              <Form.Label>Phone *</Form.Label>
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
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="mb-0">Address *</h6>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowAddressModal(true)}
            >
              Change Address
            </Button>
          </div>

          <Row className="g-2 mb-3">
            <Col md={4}>
              <Form.Label>House / Flat No. *</Form.Label>
              <Form.Control
                value={houseFlatNumber}
                onChange={(e) => setHouseFlatNumber(e.target.value)}
                placeholder="12A"
                size="sm"
                readOnly
              />
            </Col>

            <Col md={4}>
              <Form.Label>Street / Area *</Form.Label>
              <Form.Control
                value={streetArea}
                onChange={(e) => setStreetArea(e.target.value)}
                placeholder="MG Road"
                size="sm"
                readOnly
              />
            </Col>

            <Col md={4}>
              <Form.Label>Landmark</Form.Label>
              <Form.Control
                value={landMark}
                onChange={(e) => setLandMark(e.target.value)}
                placeholder="Near Metro"
                size="sm"
                readOnly
              />
            </Col>
          </Row>

          <Row className="g-2 mb-3">
            <Col md={4}>
              <Form.Label>City *</Form.Label>
              <Form.Control
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Detected city"
                size="sm"
                readOnly
              />
            </Col>
          </Row>

          {/* Slot */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="mb-0">Preferred Slot </h6>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowTimeModal(true)}
            >
              Change Date & Slot
            </Button>
          </div>

          <Row className="g-2 mb-3">
            <Col md={6}>
              <Form.Label>Date *</Form.Label>
              <Form.Control
                value={slotDate}
                readOnly
                placeholder="Select via Date & Slot"
                size="sm"
              />
            </Col>

            <Col md={6}>
              <Form.Label>Time *</Form.Label>
              <Form.Control
                value={slotTime}
                readOnly
                placeholder="Select via Date & Slot"
                size="sm"
              />
            </Col>
          </Row>

          {/* Services Section */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="mb-0">Services </h6>
            {!isHousePaintingService && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={addService}
              >
                + Add Service
              </Button>
            )}
          </div>

          {isHousePaintingService && (
            <div className="text-muted mb-2" style={{ fontSize: 12 }}>
              House Painting allows only one service entry.
            </div>
          )}

          {services.map((s, idx) => {
            const isDeepCleaning =
              s.category?.toLowerCase() === "deep cleaning";
            const isHousePainting =
              s.category?.toLowerCase() === "house painting";

            const filteredServiceNames = deepList
              .filter((item) => item.category?.toLowerCase() === s.subCategory?.toLowerCase())
              .map((item) => ({
                label: item.name,
                value: item.name,
                price: item.totalAmount,
                bookingAmount: item.bookingAmount,
              }));

            return (
              <Row key={idx} className="g-2 align-items-end mb-3">
                <Col md={isHousePainting ? 4 : 3}>
                  <Form.Label className="mb-1">Category *</Form.Label>
                  {isDeepCleaning || isHousePainting ? (
                    <Form.Control value={s.category} size="sm" disabled />
                  ) : (
                    <Form.Control
                      value={s.category}
                      onChange={(e) =>
                        onServiceChange(idx, "category", e.target.value)
                      }
                      placeholder="Deep Cleaning / House Painting"
                      size="sm"
                    />
                  )}
                </Col>

                {!isHousePainting && (
                  <Col md={3}>
                    <Form.Label className="mb-1">Subcategory</Form.Label>
                    {isDeepCleaning ? (
                      <Form.Select
                        size="sm"
                        value={s.subCategory}
                        onChange={(e) =>
                          onServiceChange(idx, "subCategory", e.target.value)
                        }
                      >
                        <option value="">Select Category *</option>
                        {getUniqueDeepCategories().map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </Form.Select>
                    ) : null}
                  </Col>
                )}

                {!isHousePainting && (
                  <Col md={3}>
                    <Form.Label className="mb-1">Service Name *</Form.Label>
                    {isDeepCleaning ? (
                      <Form.Select
                        size="sm"
                        value={s.serviceName}
                        onChange={(e) => {
                          const selectedItem = filteredServiceNames.find((it) => it.value === e.target.value);
                          onServiceChange(idx, "serviceName", e.target.value);
                          if (selectedItem) {
                            onServiceChange(idx, "price", selectedItem.price);
                            onServiceChange(idx, "bookingAmount", selectedItem.bookingAmount ?? "");
                          } else {
                            // if user cleared or selected unknown, reset price & bookingAmount
                            onServiceChange(idx, "price", "");
                            onServiceChange(idx, "bookingAmount", "");
                          }
                        }}
                      >
                        <option value="">Select Service *</option>
                        {filteredServiceNames.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </Form.Select>
                    ) : (
                      <Form.Control
                        size="sm"
                        value={s.serviceName}
                        onChange={(e) =>
                          onServiceChange(idx, "serviceName", e.target.value)
                        }
                        placeholder="Full Kitchen / Interior"
                      />
                    )}
                  </Col>
                )}

                <Col md={isHousePainting ? 4 : 2}>
                  <Form.Label className="mb-1">Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    size="sm"
                    value={s.price}
                    min="0"
                    onChange={(e) =>
                      onServiceChange(idx, "price", e.target.value)
                    }
                    placeholder="0"
                    disabled={isDeepCleaning && s.serviceName === ""}
                  />
                </Col>

                {/* booking amount per-service hidden in UI — total shown in Payment Summary */}

                {!isHousePainting && (
                  <Col md={1} className="text-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeService(idx)}
                    >
                      ×
                    </Button>
                  </Col>
                )}
              </Row>
            );
          })}

          <Row className="g-2 mt-3">
            <Col md={3}>
              <Form.Label>Form Name *</Form.Label>
              <Form.Control
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Form identifier"
                size="sm"
                disabled
              />
            </Col>
          </Row>
        </Modal.Body>

        {/* AMOUNT SUMMARY */}
        <div
          className="mt-3 p-3"
          style={{
            background: "#f8f9fa",
            borderRadius: 8,
            border: "1px solid #e3e3e3",
          }}
        >
          <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

          <div className="d-flex justify-content-between mb-2">
            <span>Total Amount:</span>
            <strong>
              ₹
              {totalAmount}
            </strong>
          </div>

          <div className="d-flex justify-content-between mb-1">
            <span>Booking Amount:</span>
            <strong>₹{bookingAmountTotal}</strong>
          </div>
        </div>

        {/* FOOTER */}
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>

          <Button variant="danger" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ADDRESS MODAL */}
      {showAddressModal && (
        <AddressPickerModal
          initialAddress={streetArea}
          initialLatLng={derivedLatLng}
          onClose={() => setShowAddressModal(false)}
          onSelect={handleAddressSelect}
          bookingId={enquiry?.bookingId}
        />
      )}

      {/* TIME MODAL */}
      {showTimeModal && (
        <TimePickerModal
          onClose={() => setShowTimeModal(false)}
          onSelect={handleSlotSelect}
          bookingId={enquiry?.bookingId}
        />
      )}
    </>
  );
};

export default EditEnquiryModal;

// import React, { useEffect, useState } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { BASE_URL } from "../utils/config";

// // util: strip +91 from contact
// const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

// const EditEnquiryModal = ({ show, onClose, enquiry, onUpdated, title }) => {
//   const [saving, setSaving] = useState(false);

//   const [customerName, setCustomerName] = useState("");
//   const [customerPhone, setCustomerPhone] = useState("");
//   const [formName, setFormName] = useState("");

//   const [houseFlatNumber, setHouseFlatNumber] = useState("");
//   const [streetArea, setStreetArea] = useState("");
//   const [landMark, setLandMark] = useState("");
//   const [city, setCity] = useState("");
//   const [location, setLocation] = useState(null);

//   const [slotDate, setSlotDate] = useState("");
//   const [slotTime, setSlotTime] = useState("");

//   const [services, setServices] = useState([]);

//   const [status, setStatus] = useState("Pending");
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paymentStatus, setPaymentStatus] = useState("Unpaid");
//   const [paidAmount, setPaidAmount] = useState("");

//   // Server data states
//   const [deepList, setDeepList] = useState([]);

//   const [showAddressModal, setShowAddressModal] = useState(false);
//   const [showTimeModal, setShowTimeModal] = useState(false);

//   // Fetch Deep Cleaning packages once
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(
//           `${BASE_URL}/deeppackage/deep-cleaning-packages"`
//         );
//         const data = await res.json();
//         if (data.success) setDeepList(data.data);
//       } catch (err) {
//         console.log("Error fetching deep cleaning data:", err);
//       }
//     };
//     fetchData();
//   }, []);

//   // Load enquiry data
//   useEffect(() => {
//     if (!enquiry?.raw) return;

//     const {
//       customer,
//       address,
//       selectedSlot,
//       service,
//       bookingDetails,
//       formName: fm,
//     } = enquiry.raw;

//     setCustomerName(customer?.name || "");
//     setCustomerPhone(normalizePhone(enquiry?.contact) || customer?.phone || "");
//     setFormName(fm || enquiry?.formName || "");

//     setHouseFlatNumber(address?.houseFlatNumber || "");
//     setStreetArea(address?.streetArea || "");
//     setLandMark(address?.landMark || "");
//     setCity(address?.city || "");
//     setLocation(address?.location || null);

//     setSlotDate(selectedSlot?.slotDate || "");
//     setSlotTime(selectedSlot?.slotTime || "");

//     setServices(
//       (service || []).map((s) => ({
//         category: s?.category || "",
//         subCategory: s?.subCategory || "",
//         serviceName: s?.serviceName || "",
//         price: s?.price !== undefined ? String(s.price) : "",
//       }))
//     );

//     setStatus(bookingDetails?.status || "Pending");
//     setPaymentMethod(bookingDetails?.paymentMethod || "Cash");
//     setPaymentStatus(bookingDetails?.paymentStatus || "Unpaid");
//     setPaidAmount(
//       bookingDetails?.paidAmount !== undefined
//         ? String(bookingDetails.paidAmount)
//         : ""
//     );
//   }, [enquiry]);

//   const onServiceChange = (idx, field, value) => {
//     setServices((prev) => {
//       const copy = [...prev];
//       copy[idx] = {
//         ...copy[idx],
//         [field]: field === "price" && value === "" ? "" : value,
//       };
//       return copy;
//     });
//   };

//   const addService = () => {
//     setServices((prev) => [
//       ...prev,
//       {
//         category: "Deep Cleaning",
//         subCategory: "",
//         serviceName: "",
//         price: "",
//       },
//     ]);
//   };

//   const removeService = (idx) =>
//     setServices((prev) => prev.filter((_, i) => i !== idx));

//   const isHousePaintingService = services.some(
//     (s) => s.category?.toLowerCase() === "house painting"
//   );

//   // Updated address selection handler - now only updates local state
//   const handleAddressSelect = (addressData) => {
//     // Update local state only
//     setHouseFlatNumber(addressData.houseFlatNumber);
//     setStreetArea(addressData.formattedAddress);
//     setLandMark(addressData.landmark);
//     setCity(addressData.city);
//     setLocation({
//       type: "Point",
//       coordinates: [addressData.lng, addressData.lat],
//     });

//     // Reset slot fields since address update clears them
//     setSlotDate("");
//     setSlotTime("");
//   };

//   // Updated slot selection handler - now only updates local state
//   const handleSlotSelect = (sel) => {
//     // Update local state only
//     setSlotDate(sel.slotDate || "");
//     setSlotTime(sel.slotTime || "");
//   };

//   const derivedLatLng = (() => {
//     if (!location) return undefined;
//     if (Array.isArray(location.coordinates))
//       return {
//         lat: location.coordinates[1],
//         lng: location.coordinates[0],
//       };
//     return undefined;
//   })();

//   // Validate all required fields before saving
//   const validateFields = () => {
//     // Customer validation
//     if (!customerName.trim()) {
//       alert("Customer name is required");
//       return false;
//     }

//     if (!customerPhone.trim() || customerPhone.length !== 10) {
//       alert("Valid 10-digit phone number is required");
//       return false;
//     }

//     // Address validation
//     if (!houseFlatNumber.trim()) {
//       alert("House/Flat number is required");
//       return false;
//     }

//     if (!streetArea.trim()) {
//       alert("Street/Area is required");
//       return false;
//     }

//     if (!city.trim()) {
//       alert("City is required");
//       return false;
//     }

//     if (!location || !location.coordinates) {
//       alert("Location coordinates are required");
//       return false;
//     }

//     // Slot validation
//     if (!slotDate.trim()) {
//       alert("Slot date is required");
//       return false;
//     }

//     if (!slotTime.trim()) {
//       alert("Slot time is required");
//       return false;
//     }

//     // Services validation
//     if (services.length === 0) {
//       alert("At least one service is required");
//       return false;
//     }

//     // Validate each service
//     for (let i = 0; i < services.length; i++) {
//       const service = services[i];

//       if (!service.category?.trim()) {
//         alert(`Service ${i + 1}: Category is required`);
//         return false;
//       }

//       if (service.category?.toLowerCase() !== "house painting") {
//         if (!service.subCategory?.trim()) {
//           alert(`Service ${i + 1}: Subcategory is required`);
//           return false;
//         }

//         if (!service.serviceName?.trim()) {
//           alert(`Service ${i + 1}: Service name is required`);
//           return false;
//         }
//       }

//       if (
//         !service.price ||
//         isNaN(Number(service.price)) ||
//         Number(service.price) <= 0
//       ) {
//         alert(`Service ${i + 1}: Valid price is required`);
//         return false;
//       }
//     }

//     return true;
//   };

//   // Save handler - only calls update-user-booking API
//   const handleSave = async () => {
//     if (!enquiry?.bookingId) return;
//     if (!validateFields()) {
//       return;
//     }

//     setSaving(true);

//     const normalizedServices = services
//       .map((s) => {
//         const priceTrim =
//           typeof s.price === "string" ? s.price.trim() : s.price;
//         const priceNum =
//           priceTrim === "" || priceTrim === undefined
//             ? undefined
//             : Number(priceTrim);

//         // For House Painting, use category name for all fields
//         if (s.category?.toLowerCase() === "house painting") {
//           return {
//             category: s.category?.trim() || "",
//             subCategory: s.category?.trim() || "",
//             serviceName: s.category?.trim() || "",
//             quantity: 1,
//             teamMembersRequired: 1,
//             ...(Number.isFinite(priceNum) ? { price: priceNum } : {}),
//           };
//         }

//         // For other services (Deep Cleaning)
//         return {
//           category: s.category?.trim() || "",
//           subCategory: s.subCategory?.trim() || "",
//           serviceName: s.serviceName?.trim() || "",
//           quantity: 1,
//           teamMembersRequired: 1,
//           ...(Number.isFinite(priceNum) ? { price: priceNum } : {}),
//         };
//       })
//       .filter((s) => s.category || s.subCategory || s.serviceName);

//     // Validate House Painting
//     const hasHP = normalizedServices.some(
//       (s) => s.category?.toLowerCase() === "house painting"
//     );
//     if (hasHP && normalizedServices.length > 1) {
//       alert("House Painting can only have one service.");
//       setSaving(false);
//       return;
//     }

//     const paidTrim = String(paidAmount ?? "").trim();
//     const paidNum = paidTrim === "" ? undefined : Number(paidTrim);

//     const addressPayload = {
//       houseFlatNumber,
//       streetArea,
//       landMark,
//       city: city || "Bengaluru", // Default city if not detected
//       ...(location
//         ? {
//             location: {
//               type: "Point",
//               coordinates: location.coordinates,
//             },
//           }
//         : {}),
//     };

//     // Construct the payload for the PUT request
//     const payload = {
//       customer: {
//         name: customerName,
//         phone: customerPhone,
//         customerId: enquiry?.raw?.customer?.customerId,
//       },
//       service: normalizedServices,
//       bookingDetails: {
//         status,
//         paymentMethod,
//         paymentStatus,
//         paidAmount:
//           paidNum !== undefined && Number.isFinite(paidNum)
//             ? paidNum
//             : undefined,
//       },
//       address: addressPayload,
//       selectedSlot: { slotDate, slotTime },
//       isEnquiry: enquiry?.raw?.isEnquiry ?? true,
//       formName,
//     };

//     try {
//       const res = await fetch(
//         `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.message || "Update failed");

//       alert("Enquiry updated successfully!");
//       onUpdated?.(data.booking);
//       onClose();
//       window.location.reload();
//     } catch (err) {
//       alert(err.message || "Error updating enquiry");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <>
//       <Modal
//         show={show}
//         onHide={onClose}
//         size="lg"
//         centered
//         enforceFocus={false}
//         restoreFocus={false}
//       >
//         <Modal.Header closeButton>
//           <Modal.Title style={{ fontSize: 16 }}>
//             {title || "Edit Enquiry"}
//           </Modal.Title>
//         </Modal.Header>

//         <Modal.Body style={{ fontSize: 13 }}>
//           {/* Customer */}
//           <h6 className="mb-2">Customer *</h6>
//           <Row className="g-2 mb-3">
//             <Col md={6}>
//               <Form.Label>Name</Form.Label>
//               <Form.Control
//                 value={customerName}
//                 onChange={(e) => setCustomerName(e.target.value)}
//                 placeholder="Customer name"
//                 size="sm"
//               />
//             </Col>

//             <Col md={6}>
//               <Form.Label>Phone *</Form.Label>
//               <InputGroup size="sm">
//                 <InputGroup.Text>+91</InputGroup.Text>
//                 <Form.Control
//                   value={customerPhone}
//                   onChange={(e) => setCustomerPhone(e.target.value)}
//                   placeholder="10-digit number"
//                 />
//               </InputGroup>
//             </Col>
//           </Row>

//           {/* Address */}
//           <div className="d-flex align-items-center justify-content-between mb-2">
//             <h6 className="mb-0">Address *</h6>
//             <Button
//               variant="outline-secondary"
//               size="sm"
//               onClick={() => setShowAddressModal(true)}
//             >
//               Change Address
//             </Button>
//           </div>

//           <Row className="g-2 mb-3">
//             <Col md={4}>
//               <Form.Label>House / Flat No. *</Form.Label>
//               <Form.Control
//                 value={houseFlatNumber}
//                 onChange={(e) => setHouseFlatNumber(e.target.value)}
//                 placeholder="12A"
//                 size="sm"
//                 readOnly
//               />
//             </Col>

//             <Col md={4}>
//               <Form.Label>Street / Area *</Form.Label>
//               <Form.Control
//                 value={streetArea}
//                 onChange={(e) => setStreetArea(e.target.value)}
//                 placeholder="MG Road"
//                 size="sm"
//                 readOnly
//               />
//             </Col>

//             <Col md={4}>
//               <Form.Label>Landmark</Form.Label>
//               <Form.Control
//                 value={landMark}
//                 onChange={(e) => setLandMark(e.target.value)}
//                 placeholder="Near Metro"
//                 size="sm"
//                 readOnly
//               />
//             </Col>
//           </Row>

//           <Row className="g-2 mb-3">
//             <Col md={4}>
//               <Form.Label>City *</Form.Label>
//               <Form.Control
//                 value={city}
//                 onChange={(e) => setCity(e.target.value)}
//                 placeholder="Detected city"
//                 size="sm"
//                 readOnly
//               />
//             </Col>
//           </Row>

//           {/* Slot */}
//           <div className="d-flex align-items-center justify-content-between mb-2">
//             <h6 className="mb-0">Preferred Slot </h6>
//             <Button
//               variant="outline-secondary"
//               size="sm"
//               onClick={() => setShowTimeModal(true)}
//             >
//               Change Date & Slot
//             </Button>
//           </div>

//           <Row className="g-2 mb-3">
//             <Col md={6}>
//               <Form.Label>Date *</Form.Label>
//               <Form.Control
//                 value={slotDate}
//                 readOnly
//                 placeholder="Select via Date & Slot"
//                 size="sm"
//               />
//             </Col>

//             <Col md={6}>
//               <Form.Label>Time *</Form.Label>
//               <Form.Control
//                 value={slotTime}
//                 readOnly
//                 placeholder="Select via Date & Slot"
//                 size="sm"
//               />
//             </Col>
//           </Row>

//           {/* Services Section */}
//           <div className="d-flex align-items-center justify-content-between mb-2">
//             <h6 className="mb-0">Services </h6>
//             {!isHousePaintingService && (
//               <Button
//                 variant="outline-secondary"
//                 size="sm"
//                 onClick={addService}
//               >
//                 + Add Service
//               </Button>
//             )}
//           </div>

//           {isHousePaintingService && (
//             <div className="text-muted mb-2" style={{ fontSize: 12 }}>
//               House Painting allows only one service entry.
//             </div>
//           )}

//           {services.map((s, idx) => {
//             const isDeepCleaning =
//               s.category?.toLowerCase() === "deep cleaning";
//             const isHousePainting =
//               s.category?.toLowerCase() === "house painting";

//             const filteredServiceNames = deepList
//               .filter(
//                 (item) =>
//                   item.category?.toLowerCase() === s.subCategory?.toLowerCase()
//               )
//               .map((item) => ({
//                 label: item.name,
//                 value: item.name,
//                 price: item.totalAmount,
//               }));

//             return (
//               <Row key={idx} className="g-2 align-items-end mb-3">
//                 <Col md={isHousePainting ? 4 : 3}>
//                   <Form.Label className="mb-1">Category *</Form.Label>
//                   {isDeepCleaning || isHousePainting ? (
//                     <Form.Control value={s.category} size="sm" disabled />
//                   ) : (
//                     <Form.Control
//                       value={s.category}
//                       onChange={(e) =>
//                         onServiceChange(idx, "category", e.target.value)
//                       }
//                       placeholder="Deep Cleaning / House Painting"
//                       size="sm"
//                     />
//                   )}
//                 </Col>

//                 {!isHousePainting && (
//                   <Col md={3}>
//                     <Form.Label className="mb-1">Subcategory</Form.Label>
//                     {isDeepCleaning ? (
//                       <Form.Select
//                         size="sm"
//                         value={s.subCategory}
//                         onChange={(e) =>
//                           onServiceChange(idx, "subCategory", e.target.value)
//                         }
//                       >
//                         <option value="">Select Subcategory *</option>
//                         {[
//                           ...new Set(deepList.map((item) => item.category)),
//                         ].map((cat) => (
//                           <option key={cat} value={cat}>
//                             {cat}
//                           </option>
//                         ))}
//                       </Form.Select>
//                     ) : null}
//                   </Col>
//                 )}

//                 {!isHousePainting && (
//                   <Col md={3}>
//                     <Form.Label className="mb-1">Service Name *</Form.Label>
//                     {isDeepCleaning ? (
//                       <Form.Select
//                         size="sm"
//                         value={s.serviceName}
//                         onChange={(e) => {
//                           const selectedItem = filteredServiceNames.find(
//                             (it) => it.value === e.target.value
//                           );
//                           onServiceChange(idx, "serviceName", e.target.value);
//                           if (selectedItem) {
//                             onServiceChange(idx, "price", selectedItem.price);
//                           }
//                         }}
//                       >
//                         <option value="">Select Service *</option>
//                         {filteredServiceNames.map((item) => (
//                           <option key={item.value} value={item.value}>
//                             {item.label}
//                           </option>
//                         ))}
//                       </Form.Select>
//                     ) : (
//                       <Form.Control
//                         size="sm"
//                         value={s.serviceName}
//                         onChange={(e) =>
//                           onServiceChange(idx, "serviceName", e.target.value)
//                         }
//                         placeholder="Full Kitchen / Interior"
//                       />
//                     )}
//                   </Col>
//                 )}

//                 <Col md={isHousePainting ? 4 : 2}>
//                   <Form.Label className="mb-1">Price (₹)</Form.Label>
//                   <Form.Control
//                     type="number"
//                     size="sm"
//                     value={s.price}
//                     min="0"
//                     onChange={(e) =>
//                       onServiceChange(idx, "price", e.target.value)
//                     }
//                     placeholder="0"
//                     disabled={isDeepCleaning && s.serviceName === ""}
//                   />
//                 </Col>

//                 {!isHousePainting && (
//                   <Col md={1} className="text-end">
//                     <Button
//                       variant="outline-danger"
//                       size="sm"
//                       onClick={() => removeService(idx)}
//                     >
//                       ×
//                     </Button>
//                   </Col>
//                 )}
//               </Row>
//             );
//           })}

//           <Row className="g-2 mt-3">
//             <Col md={3}>
//               <Form.Label>Form Name *</Form.Label>
//               <Form.Control
//                 value={formName}
//                 onChange={(e) => setFormName(e.target.value)}
//                 placeholder="Form identifier"
//                 size="sm"
//                 disabled
//               />
//             </Col>
//           </Row>
//         </Modal.Body>

//         {/* AMOUNT SUMMARY */}
//         <div
//           className="mt-3 p-3"
//           style={{
//             background: "#f8f9fa",
//             borderRadius: 8,
//             border: "1px solid #e3e3e3",
//           }}
//         >
//           <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

//           <div className="d-flex justify-content-between mb-2">
//             <span>Total Amount:</span>
//             <strong>
//               ₹
//               {isHousePaintingService
//                 ? Number(services[0]?.price || 0)
//                 : services.reduce((sum, s) => sum + (Number(s.price) || 0), 0)}
//             </strong>
//           </div>

//           <div className="d-flex justify-content-between mb-1">
//             <span>Booking Amount:</span>
//             <strong>₹{enquiry?.raw?.bookingDetails?.bookingAmount || 0}</strong>
//           </div>
//         </div>

//         {/* FOOTER */}
//         <Modal.Footer>
//           <Button variant="secondary" onClick={onClose} disabled={saving}>
//             Cancel
//           </Button>

//           <Button variant="danger" onClick={handleSave} disabled={saving}>
//             {saving ? "Saving..." : "Save Changes"}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* ADDRESS MODAL */}
//       {showAddressModal && (
//         <AddressPickerModal
//           initialAddress={streetArea}
//           initialLatLng={derivedLatLng}
//           onClose={() => setShowAddressModal(false)}
//           onSelect={handleAddressSelect}
//           bookingId={enquiry?.bookingId}
//         />
//       )}

//       {/* TIME MODAL */}
//       {showTimeModal && (
//         <TimePickerModal
//           onClose={() => setShowTimeModal(false)}
//           onSelect={handleSlotSelect}
//           bookingId={enquiry?.bookingId}
//         />
//       )}
//     </>
//   );
// };

// export default EditEnquiryModal;

// mine
// import React, { useEffect, useState } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { BASE_URL } from "../utils/config";

// // util: strip +91 from contact
// const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

// // Deep Cleaning Subcategories
// const DEEP_SUBCATEGORIES = [
//   "Furnished apartment",
//   "Unfurnished apartment",
//   "Book by room",
//   "Furnished bungalow/duplex",
//   "Unfurnished bungalow/duplex",
//   "Mini services",
// ];

// const EditEnquiryModal = ({ show, onClose, enquiry, onUpdated }) => {
//   const [saving, setSaving] = useState(false);

//   const [customerName, setCustomerName] = useState("");
//   const [customerPhone, setCustomerPhone] = useState("");
//   const [formName, setFormName] = useState("");

//   const [houseFlatNumber, setHouseFlatNumber] = useState("");
//   const [streetArea, setStreetArea] = useState("");
//   const [landMark, setLandMark] = useState("");
//   const [city, setCity] = useState("");
//   const [location, setLocation] = useState(null);

//   const [slotDate, setSlotDate] = useState("");
//   const [slotTime, setSlotTime] = useState("");

//   const [services, setServices] = useState([]);

//   const [status, setStatus] = useState("Pending");
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paymentStatus, setPaymentStatus] = useState("Unpaid");
//   const [paidAmount, setPaidAmount] = useState("");

//   // NEW: Store Deep Cleaning API data
//   const [deepList, setDeepList] = useState([]);

//   const [showAddressModal, setShowAddressModal] = useState(false);
//   const [showTimeModal, setShowTimeModal] = useState(false);

//   // Fetch Deep Cleaning packages once
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(
//           "https://homjee-backend.onrender.com/api/deeppackage/deep-cleaning-packages"
//         );
//         const data = await res.json();
//         if (data.success) setDeepList(data.data);
//       } catch (err) {
//         console.log("Error fetching deep cleaning data:", err);
//       }
//     };
//     fetchData();
//   }, []);

//   // Load enquiry data
//   useEffect(() => {
//     if (!enquiry?.raw) return;

//     const {
//       customer,
//       address,
//       selectedSlot,
//       service,
//       bookingDetails,
//       formName: fm,
//     } = enquiry.raw;

//     setCustomerName(customer?.name || "");
//     setCustomerPhone(normalizePhone(enquiry?.contact) || customer?.phone || "");
//     setFormName(fm || enquiry?.formName || "");

//     setHouseFlatNumber(address?.houseFlatNumber || "");
//     setStreetArea(address?.streetArea || "");
//     setLandMark(address?.landMark || "");
//     setCity(address?.city || "");
//     setLocation(address?.location || null);

//     setSlotDate(selectedSlot?.slotDate || "");
//     setSlotTime(selectedSlot?.slotTime || "");

//     setServices(
//       (service || []).map((s) => ({
//         category: s?.category || "",
//         subCategory: s?.subCategory || "",
//         serviceName: s?.serviceName || "",
//         price: s?.price !== undefined ? String(s.price) : "",
//       }))
//     );

//     setStatus(bookingDetails?.status || "Pending");
//     setPaymentMethod(bookingDetails?.paymentMethod || "Cash");
//     setPaymentStatus(bookingDetails?.paymentStatus || "Unpaid");
//     setPaidAmount(
//       bookingDetails?.paidAmount !== undefined
//         ? String(bookingDetails.paidAmount)
//         : ""
//     );
//   }, [enquiry]);

//   const onServiceChange = (idx, field, value) => {
//     setServices((prev) => {
//       const copy = [...prev];
//       copy[idx] = {
//         ...copy[idx],
//         [field]: field === "price" && value === "" ? "" : value,
//       };
//       return copy;
//     });
//   };

//   const addService = () => {
//     setServices((prev) => [
//       ...prev,
//       {
//         category: "Deep Cleaning", // FIXED
//         subCategory: "",
//         serviceName: "",
//         price: "",
//       },
//     ]);
//   };

//   const removeService = (idx) =>
//     setServices((prev) => prev.filter((_, i) => i !== idx));

//   const isHousePaintingService = services.some(
//     (s) => s.category?.toLowerCase() === "house painting"
//   );

//  const handleAddressSelect = (sel) => {
//   if (sel.formattedAddress) setStreetArea(sel.formattedAddress);
//   if (sel.houseFlatNumber) setHouseFlatNumber(sel.houseFlatNumber);
//   if (sel.landmark) setLandMark(sel.landmark);
//   if (sel.city) setCity(sel.city);
//   if (sel.lat && sel.lng) {
//     setLocation({
//       type: "Point",
//       coordinates: [sel.lng, sel.lat],
//     });
//   }

// };

//   const handleSlotSelect = (sel) => {
//     sel.slotDate && setSlotDate(sel.slotDate);
//     sel.slotTime && setSlotTime(sel.slotTime);
//   };

//   const derivedLatLng = (() => {
//     if (!location) return undefined;
//     if (Array.isArray(location.coordinates))
//       return {
//         lat: location.coordinates[1],
//         lng: location.coordinates[0],
//       };
//     return undefined;
//   })();

// // Save handler
// // const handleSave = async () => {
// //     if (!enquiry?.bookingId) return;
// //     setSaving(true);

// //     const normalizedServices = services
// //       .map((s) => {
// //         const priceTrim =
// //           typeof s.price === "string" ? s.price.trim() : s.price;
// //         const priceNum =
// //           priceTrim === "" || priceTrim === undefined
// //             ? undefined
// //             : Number(priceTrim);

// //         // --- MODIFICATION: Adding quantity and teamMembersRequired (default to 1) ---
// //         // The backend expects quantity and teamMembersRequired when updating 'service'
// //         return {
// //           category: s.category?.trim() || "",
// //           subCategory: s.subCategory?.trim() || "",
// //           serviceName: s.serviceName?.trim() || "",
// //           quantity: 1, // Assuming quantity is 1 for now, as not tracked in UI
// //           teamMembersRequired: 1, // Assuming 1 team member, as not tracked in UI
// //           ...(Number.isFinite(priceNum) ? { price: priceNum } : {}),
// //         };
// //         // -----------------------------------------------------------------------------
// //       })
// //       .filter((s) => s.category || s.subCategory || s.serviceName);

// //     // Validate House Painting
// //     const hasHP = normalizedServices.some(
// //       (s) => s.category?.toLowerCase() === "house painting"
// //     );
// //     if (hasHP && normalizedServices.length > 1) {
// //       alert("House Painting can only have one service.");
// //       setSaving(false);
// //       return;
// //     }

// //     const paidTrim = String(paidAmount ?? "").trim();
// //     const paidNum = paidTrim === "" ? undefined : Number(paidTrim);

// //     const addressPayload = {
// //       houseFlatNumber,
// //       streetArea,
// //       landMark,
// //       ...(city ? { city } : {}),
// //       ...(location
// //         ? {
// //             location: {
// //               type: "Point", // Ensure GeoJSON type is included
// //               coordinates: location.coordinates,
// //             },
// //           }
// //         : {}),
// //     };

// //     // Construct the payload for the PUT request
// //     const payload = {
// //       // 1. CUSTOMER UPDATE
// //       customer: {
// //         name: customerName,
// //         phone: customerPhone,
// //         customerId: enquiry?.raw?.customer?.customerId,
// //       },
// //       // 2. SERVICE UPDATE (Triggers total recalculation on the backend)
// //       service: normalizedServices,
// //       // 3. BOOKING DETAILS (For status/payment changes)
// //       bookingDetails: {
// //         status,
// //         paymentMethod,
// //         paymentStatus,
// //         // The paidAmount field is critical for the backend to handle payments
// //         paidAmount:
// //           paidNum !== undefined && Number.isFinite(paidNum)
// //             ? paidNum
// //             : undefined,
// //       },
// //       // 4. ADDRESS UPDATE
// //       address: addressPayload,
// //       // 6. SELECTED SLOT
// //       selectedSlot: { slotDate, slotTime },
// //       // 8. isEnquiry / formName
// //       isEnquiry: enquiry?.raw?.isEnquiry ?? true,
// //       formName,
// //     };

// //     try {
// //       const res = await fetch(
// //         `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`,
// //         {
// //           method: "PUT",
// //           headers: { "Content-Type": "application/json" },
// //           body: JSON.stringify(payload),
// //         }
// //       );

// //       const data = await res.json();
// //       if (!res.ok) throw new Error(data?.message || "Update failed");

// //       // Show success message and close modal
// //       alert("Enquiry updated successfully!");
// //       onUpdated?.(data.booking);
// //       onClose();
// //     } catch (err) {
// //       alert(err.message || "Error updating enquiry");
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

//   const handleSave = async () => {
//     if (!enquiry?.bookingId) return;
//     setSaving(true);

//     const normalizedServices = services
//       .map((s) => {
//         const priceTrim =
//           typeof s.price === "string" ? s.price.trim() : s.price;
//         const priceNum =
//           priceTrim === "" || priceTrim === undefined
//             ? undefined
//             : Number(priceTrim);

//         // For House Painting, use category name for all fields
//         if (s.category?.toLowerCase() === "house painting") {
//           return {
//             category: s.category?.trim() || "",
//             subCategory: s.category?.trim() || "", // Same as category
//             serviceName: s.category?.trim() || "", // Same as category
//             quantity: 1,
//             teamMembersRequired: 1,
//             ...(Number.isFinite(priceNum) ? { price: priceNum } : {}),
//           };
//         }

//         // For other services (Deep Cleaning)
//         return {
//           category: s.category?.trim() || "",
//           subCategory: s.subCategory?.trim() || "",
//           serviceName: s.serviceName?.trim() || "",
//           quantity: 1,
//           teamMembersRequired: 1,
//           ...(Number.isFinite(priceNum) ? { price: priceNum } : {}),
//         };
//       })
//       .filter((s) => s.category || s.subCategory || s.serviceName);

//     // Validate House Painting
//     const hasHP = normalizedServices.some(
//       (s) => s.category?.toLowerCase() === "house painting"
//     );
//     if (hasHP && normalizedServices.length > 1) {
//       alert("House Painting can only have one service.");
//       setSaving(false);
//       return;
//     }

//     const paidTrim = String(paidAmount ?? "").trim();
//     const paidNum = paidTrim === "" ? undefined : Number(paidTrim);

//     const addressPayload = {
//       houseFlatNumber,
//       streetArea,
//       landMark,
//       ...(city ? { city } : {}),
//       ...(location
//         ? {
//             location: {
//               type: "Point", // Ensure GeoJSON type is included
//               coordinates: location.coordinates,
//             },
//           }
//         : {}),
//     };

//     // Construct the payload for the PUT request
//     const payload = {
//       // 1. CUSTOMER UPDATE
//       customer: {
//         name: customerName,
//         phone: customerPhone,
//         customerId: enquiry?.raw?.customer?.customerId,
//       },
//       // 2. SERVICE UPDATE (Triggers total recalculation on the backend)
//       service: normalizedServices,
//       // 3. BOOKING DETAILS (For status/payment changes)
//       bookingDetails: {
//         status,
//         paymentMethod,
//         paymentStatus,
//         // The paidAmount field is critical for the backend to handle payments
//         paidAmount:
//           paidNum !== undefined && Number.isFinite(paidNum)
//             ? paidNum
//             : undefined,
//       },
//       // 4. ADDRESS UPDATE
//       address: addressPayload,
//       // 6. SELECTED SLOT
//       selectedSlot: { slotDate, slotTime },
//       // 8. isEnquiry / formName
//       isEnquiry: enquiry?.raw?.isEnquiry ?? true,
//       formName,
//     };

//     try {
//       const res = await fetch(
//         `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.message || "Update failed");

//       // Show success message and close modal
//       alert("Enquiry updated successfully!");
//       onUpdated?.(data.booking);
//       onClose();
//     } catch (err) {
//       alert(err.message || "Error updating enquiry");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // -------------- UI --------------
//   return (
//     <>
//         <Modal
//         show={show}
//         onHide={onClose}
//         size="lg"
//         centered
//         enforceFocus={false}
//         restoreFocus={false}
//       >
//         <Modal.Header closeButton>
//           <Modal.Title style={{ fontSize: 16 }}>Edit Enquiry</Modal.Title>
//         </Modal.Header>

//         <Modal.Body style={{ fontSize: 13 }}>
//           {/* Customer */}
//           <h6 className="mb-2">Customer</h6>
//           <Row className="g-2 mb-3">
//             <Col md={6}>
//               <Form.Label>Name</Form.Label>
//               <Form.Control
//                 value={customerName}
//                 onChange={(e) => setCustomerName(e.target.value)}
//                 placeholder="Customer name"
//                 size="sm"
//               />
//             </Col>

//             <Col md={6}>
//               <Form.Label>Phone</Form.Label>
//               <InputGroup size="sm">
//                 <InputGroup.Text>+91</InputGroup.Text>
//                 <Form.Control
//                   value={customerPhone}
//                   onChange={(e) => setCustomerPhone(e.target.value)}
//                   placeholder="10-digit number"
//                 />
//               </InputGroup>
//             </Col>
//           </Row>

//           {/* Address */}
//           <div className="d-flex align-items-center justify-content-between mb-2">
//             <h6 className="mb-0">Address</h6>
//             <Button
//               variant="outline-secondary"
//               size="sm"
//               onClick={() => setShowAddressModal(true)}
//             >
//               Change Address
//             </Button>
//           </div>

//           <Row className="g-2 mb-3">
//             <Col md={4}>
//               <Form.Label>House / Flat No.</Form.Label>
//               <Form.Control
//                 value={houseFlatNumber}
//                 onChange={(e) => setHouseFlatNumber(e.target.value)}
//                 placeholder="12A"
//                 size="sm"
//               />
//             </Col>

//             <Col md={4}>
//               <Form.Label>Street / Area</Form.Label>
//               <Form.Control
//                 value={streetArea}
//                 onChange={(e) => setStreetArea(e.target.value)}
//                 placeholder="MG Road"
//                 size="sm"
//               />
//             </Col>

//             <Col md={4}>
//               <Form.Label>Landmark</Form.Label>
//               <Form.Control
//                 value={landMark}
//                 onChange={(e) => setLandMark(e.target.value)}
//                 placeholder="Near Metro"
//                 size="sm"
//               />
//             </Col>
//           </Row>

//           <Row className="g-2 mb-3">
//             <Col md={4}>
//               <Form.Label>City</Form.Label>
//               <Form.Control
//                 value={city}
//                 onChange={(e) => setCity(e.target.value)}
//                 placeholder="Detected city"
//                 size="sm"
//               />
//             </Col>
//           </Row>

//           {/* Slot */}
//           <div className="d-flex align-items-center justify-content-between mb-2">
//             <h6 className="mb-0">Preferred Slot</h6>
//             <Button
//               variant="outline-secondary"
//               size="sm"
//               onClick={() => setShowTimeModal(true)}
//             >
//               Change Date & Slot
//             </Button>
//           </div>

//           <Row className="g-2 mb-3">
//             <Col md={6}>
//               <Form.Label>Date</Form.Label>
//               <Form.Control
//                 value={slotDate}
//                 readOnly
//                 placeholder="Select via Date & Slot"
//                 size="sm"
//               />
//             </Col>

//             <Col md={6}>
//               <Form.Label>Time</Form.Label>
//               <Form.Control
//                 value={slotTime}
//                 readOnly
//                 placeholder="Select via Date & Slot"
//                 size="sm"
//               />
//             </Col>
//           </Row>

//           {/* ---------------------- SERVICES SECTION ---------------------- */}
//           <div className="d-flex align-items-center justify-content-between mb-2">
//             <h6 className="mb-0">Services</h6>
//             {!isHousePaintingService && (
//               <Button
//                 variant="outline-secondary"
//                 size="sm"
//                 onClick={addService}
//               >
//                 + Add Service
//               </Button>
//             )}
//           </div>

//           {isHousePaintingService && (
//             <div className="text-muted mb-2" style={{ fontSize: 12 }}>
//               House Painting allows only one service entry.
//             </div>
//           )}

//           {services.map((s, idx) => {
//             const isDeepCleaning =
//               s.category?.toLowerCase() === "deep cleaning";

//             const isHousePainting =
//               s.category?.toLowerCase() === "house painting";

//             // Filter deep list by subcategory for dropdown
//             const filteredServiceNames = deepList
//               .filter(
//                 (item) =>
//                   item.category?.toLowerCase() === s.subCategory?.toLowerCase()
//               )
//               .map((item) => ({
//                 label: item.name, // full combined name
//                 value: item.name,
//                 price: item.totalAmount,
//               }));

//             return (
//               <Row key={idx} className="g-2 align-items-end mb-3">
//                 {/* CATEGORY */}
//                 <Col md={isHousePainting ? 4 : 3}>
//                   <Form.Label className="mb-1">Category</Form.Label>

//                   {/* If Deep Cleaning: FIXED to "Deep Cleaning" */}
//                   {/* If House Painting: FIXED to "House Painting" */}
//                   {/* Else: normal text input */}

//                   {isDeepCleaning || isHousePainting ? (
//                     <Form.Control value={s.category} size="sm" disabled />
//                   ) : (
//                     <Form.Control
//                       value={s.category}
//                       onChange={(e) =>
//                         onServiceChange(idx, "category", e.target.value)
//                       }
//                       placeholder="Deep Cleaning / House Painting"
//                       size="sm"
//                     />
//                   )}
//                 </Col>

//                 {/* SUBCATEGORY - Hidden for House Painting */}
//                 {!isHousePainting && (
//                   <Col md={3}>
//                     <Form.Label className="mb-1">Subcategory</Form.Label>

//                     {isDeepCleaning ? (
//                       <Form.Select
//                         size="sm"
//                         value={s.subCategory} // This holds the API's 'category' value (e.g., "Book by room")
//                         onChange={(e) =>
//                           onServiceChange(idx, "subCategory", e.target.value)
//                         }
//                       >
//                         <option value="">Select Subcategory</option>
//                         {[
//                           ...new Set(deepList.map((item) => item.category)), // Populates options with API's 'category'
//                         ].map((cat) => (
//                           <option key={cat} value={cat}>
//                             {cat}
//                           </option>
//                         ))}
//                       </Form.Select>
//                     ) : null}
//                   </Col>
//                 )}

//                 {/* SERVICE NAME - Hidden for House Painting */}
//                 {!isHousePainting && (
//                   <Col md={3}>
//                     <Form.Label className="mb-1">Service Name</Form.Label>

//                     {/* Deep Cleaning → service list based on selected subcategory */}
//                     {isDeepCleaning ? (
//                       <Form.Select
//                         size="sm"
//                         value={s.serviceName}
//                         onChange={(e) => {
//                           const selectedItem = filteredServiceNames.find(
//                             (it) => it.value === e.target.value // it.value is item.name (e.g., "Kitchen Cleaning - Empty Kitchen With Appliances")
//                           );
//                           onServiceChange(idx, "serviceName", e.target.value);
//                           if (selectedItem) {
//                             onServiceChange(idx, "price", selectedItem.price);
//                           }
//                         }}
//                       >
//                         <option value="">Select Service</option>
//                         {filteredServiceNames.map((item) => (
//                           <option key={item.value} value={item.value}>
//                             {item.label}
//                           </option>
//                         ))}
//                       </Form.Select>
//                     ) : (
//                       <Form.Control
//                         size="sm"
//                         value={s.serviceName}
//                         onChange={(e) =>
//                           onServiceChange(idx, "serviceName", e.target.value)
//                         }
//                         placeholder="Full Kitchen / Interior"
//                       />
//                     )}
//                   </Col>
//                 )}

//                 {/* PRICE */}
//                 <Col md={isHousePainting ? 4 : 2}>
//                   <Form.Label className="mb-1">Price (₹)</Form.Label>
//                   <Form.Control
//                     type="number"
//                     size="sm"
//                     value={s.price}
//                     min="0"
//                     onChange={(e) =>
//                       onServiceChange(idx, "price", e.target.value)
//                     }
//                     placeholder="0"
//                     disabled={isDeepCleaning && s.serviceName === ""}
//                   />
//                 </Col>

//                 {/* REMOVE BUTTON - Hidden for House Painting */}
//                 {!isHousePainting && (
//                   <Col md={1} className="text-end">
//                     <Button
//                       variant="outline-danger"
//                       size="sm"
//                       onClick={() => removeService(idx)}
//                     >
//                       ×
//                     </Button>
//                   </Col>
//                 )}
//               </Row>
//             );
//           })}

//           {/* FORM META */}
//           <Row className="g-2 mt-3">
//             <Col md={6}>
//               <Form.Label>Form Name</Form.Label>
//               <Form.Control
//                 value={formName}
//                 onChange={(e) => setFormName(e.target.value)}
//                 placeholder="Form identifier"
//                 size="sm"
//                 disabled
//               />
//             </Col>
//           </Row>
//         </Modal.Body>

//         {/* AMOUNT SUMMARY */}
//         <div
//           className="mt-3 p-3"
//           style={{
//             background: "#f8f9fa",
//             borderRadius: 8,
//             border: "1px solid #e3e3e3",
//           }}
//         >
//           <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

//           <div className="d-flex justify-content-between mb-2">
//             <span>Total Amount:</span>
//             <strong>
//               ₹
//               {isHousePaintingService
//                 ? Number(services[0]?.price || 0)
//                 : services.reduce((sum, s) => sum + (Number(s.price) || 0), 0)}
//             </strong>
//           </div>

//           <div className="d-flex justify-content-between mb-1">
//             <span>Booking Amount:</span>
//             <strong>₹{enquiry?.raw?.bookingDetails?.bookingAmount || 0}</strong>
//           </div>
//         </div>

//         {/* FOOTER */}
//         <Modal.Footer>
//           <Button variant="secondary" onClick={onClose} disabled={saving}>
//             Cancel
//           </Button>

//           <Button variant="danger" onClick={handleSave} disabled={saving}>
//             {saving ? "Saving..." : "Save Changes"}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* ADDRESS MODAL */}
//       {showAddressModal && (
//         <AddressPickerModal
//           initialAddress={streetArea}
//           initialLatLng={derivedLatLng}
//           onClose={() => setShowAddressModal(false)}
//           onSelect={handleAddressSelect}
//         />
//       )}

//       {/* TIME MODAL */}
//       {showTimeModal && (
//         <TimePickerModal
//           onClose={() => setShowTimeModal(false)}
//           onSelect={handleSlotSelect}
//         />
//       )}
//     </>
//   );
// };

// export default EditEnquiryModal;

// import React, { useEffect, useState } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { BASE_URL } from "../utils/config";
// // util: strip +91 from contact
// const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

// const EditEnquiryModal = ({ show, onClose, enquiry, onUpdated }) => {
//   const [saving, setSaving] = useState(false);

//   // Local form state (prefilled from enquiry.raw)
//   const [customerName, setCustomerName] = useState("");
//   const [customerPhone, setCustomerPhone] = useState("");
//   const [formName, setFormName] = useState("");

//   const [houseFlatNumber, setHouseFlatNumber] = useState("");
//   const [streetArea, setStreetArea] = useState("");
//   const [landMark, setLandMark] = useState("");

//   const [slotDate, setSlotDate] = useState(""); // YYYY-MM-DD
//   const [slotTime, setSlotTime] = useState(""); // e.g., "04:00 PM"

//   const [services, setServices] = useState([]); // [{category, subCategory, serviceName, price}]

//   const [status, setStatus] = useState("Pending"); // optional
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paymentStatus, setPaymentStatus] = useState("Unpaid");
//   const [paidAmount, setPaidAmount] = useState("");
//   const [city, setCity] = useState("");
//   const [showAddressModal, setShowAddressModal] = useState(false);
//   const [showTimeModal, setShowTimeModal] = useState(false);
//   const [location, setLocation] = useState(null);

//   useEffect(() => {
//     if (!enquiry?.raw) return;

//     console.log("🔍 EDITING ENQUIRY →", enquiry);

//     // If you want to see only raw backend data:
//     console.log("📌 RAW BOOKING DATA →", enquiry?.raw);

//     // Or only the booking ID:
//     console.log("🆔 Booking ID:", enquiry?.bookingId);

//     const {
//       customer,
//       address,
//       selectedSlot,
//       service,
//       bookingDetails,
//       formName: fm,
//     } = enquiry.raw;

//     setCustomerName(customer?.name || "");
//     setCustomerPhone(normalizePhone(enquiry?.contact) || customer?.phone || "");

//     setFormName(fm || enquiry?.formName || "");

//     setHouseFlatNumber(address?.houseFlatNumber || "");
//     setStreetArea(address?.streetArea || "");
//     setLandMark(address?.landMark || "");
//     setCity(address?.city || "");
//     setLocation(address?.location || null);

//     setSlotDate(selectedSlot?.slotDate || ""); // assume stored as "YYYY-MM-DD"
//     setSlotTime(selectedSlot?.slotTime || ""); // "hh:mm AM/PM"

//     setServices(
//       (service || []).map((s) => ({
//         category: s?.category || "",
//         subCategory: s?.subCategory || "",
//         serviceName: s?.serviceName || "",
//         price:
//           s?.price !== undefined && s?.price !== null
//             ? String(s.price)
//             : "",
//       }))
//     );

//     setStatus(bookingDetails?.status || "Pending");
//     setPaymentMethod(bookingDetails?.paymentMethod || "Cash");
//     setPaymentStatus(bookingDetails?.paymentStatus || "Unpaid");
//     setPaidAmount(
//       bookingDetails?.paidAmount !== undefined &&
//         bookingDetails?.paidAmount !== null
//         ? String(bookingDetails?.paidAmount)
//         : ""
//     );
//   }, [enquiry]);

//   const onServiceChange = (idx, field, value) => {
//     setServices((prev) => {
//       const copy = [...prev];
//       copy[idx] = {
//         ...copy[idx],
//         [field]:
//           field === "price"
//             ? value === ""
//               ? ""
//               : value
//             : value,
//       };
//       return copy;
//     });
//   };

//   const addService = () => {
//     setServices((prev) => {
//       const hasHousePainting = prev.some(
//         (s) => s.category?.toLowerCase() === "house painting"
//       );
//       if (hasHousePainting) {
//         alert("House Painting allows only one service entry.");
//         return prev;
//       }
//       return [
//         ...prev,
//         {
//           category: "",
//           subCategory: "",
//           serviceName: "",
//           price: "",
//         },
//       ];
//     });
//   };

//   const removeService = (idx) => {
//     setServices((prev) => prev.filter((_, i) => i !== idx));
//   };

//   const isHousePaintingService = services.some(
//     (s) => s.category?.toLowerCase() === "house painting"
//   );

//   const handleAddressSelect = (sel) => {
//     if (sel.formattedAddress) {
//       setStreetArea(sel.formattedAddress);
//     }
//     if (sel.houseFlatNumber !== undefined && sel.houseFlatNumber !== null) {
//       setHouseFlatNumber(sel.houseFlatNumber);
//     }
//     if (sel.landmark !== undefined && sel.landmark !== null) {
//       setLandMark(sel.landmark);
//     }
//     if (sel.city) {
//       setCity(sel.city);
//     }
//     if (
//       typeof sel.lat === "number" &&
//       typeof sel.lng === "number" &&
//       !Number.isNaN(sel.lat) &&
//       !Number.isNaN(sel.lng)
//     ) {
//       setLocation({
//         type: "Point",
//         coordinates: [sel.lng, sel.lat],
//       });
//     }
//   };

//   const handleSlotSelect = (sel) => {
//     if (sel.slotDate) setSlotDate(sel.slotDate);
//     if (sel.slotTime) setSlotTime(sel.slotTime);
//   };

//   const derivedLatLng = (() => {
//     if (!location) return undefined;
//     if (
//       Array.isArray(location.coordinates) &&
//       location.coordinates.length === 2
//     ) {
//       return {
//         lat: location.coordinates[1],
//         lng: location.coordinates[0],
//       };
//     }
//     if (
//       typeof location.lat === "number" &&
//       typeof location.lng === "number"
//     ) {
//       return { lat: location.lat, lng: location.lng };
//     }
//     return undefined;
//   })();

//   const handleSave = async () => {
//     if (!enquiry?.bookingId) return;
//     setSaving(true);

//     const normalizedServices = services
//       .map((s) => {
//         const trimmedPrice =
//           typeof s.price === "string" ? s.price.trim() : s.price;
//         const numericPrice =
//           trimmedPrice === "" || trimmedPrice === undefined
//             ? undefined
//             : Number(trimmedPrice);

//         return {
//           category: s.category?.trim() || "",
//           subCategory: s.subCategory?.trim() || "",
//           serviceName: s.serviceName?.trim() || "",
//           ...(Number.isFinite(numericPrice) ? { price: numericPrice } : {}),
//         };
//       })
//       .filter((s) => s.category || s.subCategory || s.serviceName);

//     const hasHousePainting = normalizedServices.some(
//       (s) => s.category?.toLowerCase() === "house painting"
//     );
//     if (hasHousePainting && normalizedServices.length > 1) {
//       alert("House Painting allows only one service entry.");
//       setSaving(false);
//       return;
//     }

//     const paidAmountTrimmed = String(paidAmount ?? "").trim();
//     const paidAmountNumber =
//       paidAmountTrimmed === "" ? undefined : Number(paidAmountTrimmed);

//     const addressPayload = {
//       houseFlatNumber,
//       streetArea,
//       landMark,
//       ...(city ? { city } : {}),
//       ...(location ? { location } : {}),
//     };

//     // Build payload matching your updateBooking controller
//     const payload = {
//       customer: {
//         name: customerName,
//         phone: customerPhone,
//         customerId: enquiry?.raw?.customer?.customerId, // keep if available
//       },
//       service: normalizedServices,
//       bookingDetails: {
//         status,
//         paymentMethod,
//         paymentStatus,
//         paidAmount:
//           paidAmountNumber !== undefined && Number.isFinite(paidAmountNumber)
//             ? paidAmountNumber
//             : undefined,
//         // you can add editedPrice/amountYetToPay/scope if you expose them in the form
//       },
//       address: addressPayload,
//       selectedSlot: {
//         slotDate,
//         slotTime,
//       },
//       isEnquiry: enquiry?.raw?.isEnquiry ?? true,
//       formName,
//     };

//     try {
//       const res = await fetch(
//         `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );
//       const data = await res.json();
//       if (!res.ok) {
//         throw new Error(data?.message || "Failed to update");
//       }

//       // Notify parent to refresh/update list view state
//       onUpdated?.(data.booking);
//       onClose();
//     } catch (err) {
//       alert(err.message || "Update failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <>
//       <Modal
//         show={show}
//         onHide={onClose}
//         size="lg"
//         centered
//         enforceFocus={false}
//         restoreFocus={false}
//       >
//       <Modal.Header closeButton>
//         <Modal.Title style={{ fontSize: 16 }}>Edit Enquiry</Modal.Title>
//       </Modal.Header>

//       <Modal.Body style={{ fontSize: 13 }}>
//         {/* Customer */}
//         <h6 className="mb-2">Customer</h6>
//         <Row className="g-2 mb-3">
//           <Col md={6}>
//             <Form.Label>Name</Form.Label>
//             <Form.Control
//               value={customerName}
//               onChange={(e) => setCustomerName(e.target.value)}
//               placeholder="Customer name"
//               size="sm"
//             />
//           </Col>
//           <Col md={6}>
//             <Form.Label>Phone</Form.Label>
//             <InputGroup size="sm">
//               <InputGroup.Text>+91</InputGroup.Text>
//               <Form.Control
//                 value={customerPhone}
//                 onChange={(e) => setCustomerPhone(e.target.value)}
//                 placeholder="10-digit number"
//               />
//             </InputGroup>
//           </Col>
//         </Row>

//         {/* Address */}
//         <div className="d-flex align-items-center justify-content-between mb-2">
//           <h6 className="mb-0">Address</h6>
//           <Button
//             variant="outline-secondary"
//             size="sm"
//             onClick={() => setShowAddressModal(true)}
//           >
//             Change Address
//           </Button>
//         </div>
//         <Row className="g-2 mb-3">
//           <Col md={4}>
//             <Form.Label>House / Flat No.</Form.Label>
//             <Form.Control
//               value={houseFlatNumber}
//               onChange={(e) => setHouseFlatNumber(e.target.value)}
//               placeholder="12A"
//               size="sm"
//             />
//           </Col>
//           <Col md={4}>
//             <Form.Label>Street / Area</Form.Label>
//             <Form.Control
//               value={streetArea}
//               onChange={(e) => setStreetArea(e.target.value)}
//               placeholder="MG Road"
//               size="sm"
//             />
//           </Col>
//           <Col md={4}>
//             <Form.Label>Landmark</Form.Label>
//             <Form.Control
//               value={landMark}
//               onChange={(e) => setLandMark(e.target.value)}
//               placeholder="Near Metro"
//               size="sm"
//             />
//           </Col>
//         </Row>
//         <Row className="g-2 mb-3">
//           <Col md={4}>
//             <Form.Label>City</Form.Label>
//             <Form.Control
//               value={city}
//               onChange={(e) => setCity(e.target.value)}
//               placeholder="Detected city"
//               size="sm"
//             />
//           </Col>
//         </Row>

//         {/* Slot */}
//         <div className="d-flex align-items-center justify-content-between mb-2">
//           <h6 className="mb-0">Preferred Slot</h6>
//           <Button
//             variant="outline-secondary"
//             size="sm"
//             onClick={() => setShowTimeModal(true)}
//           >
//             Change Date &amp; Slot
//           </Button>
//         </div>
//         <Row className="g-2 mb-3">
//           <Col md={6}>
//             <Form.Label>Date</Form.Label>
//             <Form.Control
//               value={slotDate || ""}
//               readOnly
//               placeholder="Select via Change Date & Slot"
//               size="sm"
//             />
//           </Col>
//           <Col md={6}>
//             <Form.Label>Time</Form.Label>
//             <Form.Control
//               value={slotTime}
//               readOnly
//               placeholder="Select via Change Date & Slot"
//               size="sm"
//             />
//           </Col>
//         </Row>

//         {/* Services */}
//         <div className="d-flex align-items-center justify-content-between mb-2">
//           <h6 className="mb-0">Services</h6>
//           <Button
//             variant="outline-secondary"
//             size="sm"
//             onClick={addService}
//             disabled={isHousePaintingService}
//           >
//             + Add Service
//           </Button>
//         </div>
//         {isHousePaintingService && (
//           <div className="text-muted mb-2" style={{ fontSize: 12 }}>
//             House Painting bookings support only a single service entry.
//           </div>
//         )}

//         {services.map((s, idx) => (
//           <Row key={idx} className="g-2 align-items-end mb-2">
//             <Col md={3}>
//               <Form.Label className="mb-1">Category</Form.Label>
//               <Form.Control
//                 value={s.category}
//                 onChange={(e) =>
//                   onServiceChange(idx, "category", e.target.value)
//                 }
//                 placeholder="Deep Cleaning / House Painting"
//                 size="sm"
//               />
//             </Col>
//             <Col md={3}>
//               <Form.Label className="mb-1">Subcategory</Form.Label>
//               <Form.Control
//                 value={s.subCategory}
//                 onChange={(e) =>
//                   onServiceChange(idx, "subCategory", e.target.value)
//                 }
//                 placeholder="Kitchen / 2BHK"
//                 size="sm"
//               />
//             </Col>
//             <Col md={3}>
//               <Form.Label className="mb-1">Service Name</Form.Label>
//               <Form.Control
//                 value={s.serviceName}
//                 onChange={(e) =>
//                   onServiceChange(idx, "serviceName", e.target.value)
//                 }
//                 placeholder="Full Kitchen / Interior"
//                 size="sm"
//               />
//             </Col>
//             <Col md={2}>
//               <Form.Label className="mb-1">Price (₹)</Form.Label>
//               <Form.Control
//                 type="number"
//                 value={s.price}
//                 onChange={(e) => onServiceChange(idx, "price", e.target.value)}
//                 size="sm"
//                 min="0"
//               />
//             </Col>
//             <Col md={1} className="text-end">
//               <Button
//                 variant="outline-danger"
//                 size="sm"
//                 onClick={() => removeService(idx)}
//               >
//                 ×
//               </Button>
//             </Col>
//           </Row>
//         ))}

//         {/* Meta */}
//         <Row className="g-2 mt-3">
//           <Col md={6}>
//             <Form.Label>Form Name</Form.Label>
//             <Form.Control
//               value={formName}
//               onChange={(e) => setFormName(e.target.value)}
//               placeholder="Form identifier"
//               size="sm"
//               disabled
//             />
//           </Col>

//         </Row>

//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={onClose} disabled={saving}>
//           Cancel
//         </Button>
//         <Button variant="danger" onClick={handleSave} disabled={saving}>
//           {saving ? "Saving..." : "Save Changes"}
//         </Button>
//       </Modal.Footer>
//       </Modal>

//       {showAddressModal && (
//         <AddressPickerModal
//           initialAddress={streetArea}
//           initialLatLng={derivedLatLng}
//           onClose={() => setShowAddressModal(false)}
//           onSelect={handleAddressSelect}
//         />
//       )}

//       {showTimeModal && (
//         <TimePickerModal
//           onClose={() => setShowTimeModal(false)}
//           onSelect={handleSlotSelect}
//         />
//       )}
//     </>
//   );
// };

// export default EditEnquiryModal;
