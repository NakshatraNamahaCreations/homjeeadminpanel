import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
import AddressPickerModal from "./AddressPickerModal";
import TimePickerModal from "./TimePickerModal";
import { BASE_URL } from "../utils/config";
import { ImCancelCircle } from "react-icons/im";
import { FaCheck } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";

// util: strip +91 from contact
const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

const EditEnquiryModal = ({
  show,
  onClose,
  enquiry,
  onUpdated,
  title,
  leadMode = false,
}) => {
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

  // Discount states (for Edit Enquiry - similar behaviour to Create Lead)
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountMode, setDiscountMode] = useState("percent"); // 'percent' | 'amount'
  const [discountValue, setDiscountValue] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  // Lead-only: allow editing final total inside modal (admin override)
  const [editingFinal, setEditingFinal] = useState(false);
  const [draftFinalTotal, setDraftFinalTotal] = useState("");

  // Base totals loaded from backend
  const [serverFinalTotal, setServerFinalTotal] = useState(0);
  const [serverBookingAmount, setServerBookingAmount] = useState(0);

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
        const raw = s || {};

        // Extract potential fields (defensive)
        const incomingCategory = (raw.category || "").toString().trim();
        const incomingSub = (raw.subCategory || raw.subcategory || "")
          .toString()
          .trim();
        const incomingName = (raw.serviceName || raw.name || raw.service || "")
          .toString()
          .trim();

        // Attempt to match deepList by service name or by category (subCategory)
        let matched = null;
        if (Array.isArray(deepList) && deepList.length > 0) {
          const incomingNameLc = incomingName.toLowerCase();
          const incomingSubLc = incomingSub.toLowerCase();
          matched = deepList.find((d) => {
            const dName = (d.name || d.service || "")
              .toString()
              .trim()
              .toLowerCase();
            const dCat = (d.category || "").toString().trim().toLowerCase();
            if (dName && incomingNameLc && dName === incomingNameLc)
              return true;
            if (dCat && incomingSubLc && dCat === incomingSubLc) return true;
            return false;
          });
        }

        // Booking amount fallbacks (raw or from matched deepList)
        let bookingAmt =
          raw.bookingAmount ?? raw.booking ?? raw.booking_amt ?? undefined;
        if (
          (bookingAmt === undefined ||
            bookingAmt === null ||
            bookingAmt === "") &&
          matched
        ) {
          bookingAmt =
            matched.bookingAmount ?? matched.totalAmount ?? undefined;
        }

        // Use matched values where available to ensure exact option strings
        const subCategory = matched
          ? matched.category || incomingSub
          : incomingSub;
        const serviceName = matched
          ? matched.name || incomingName
          : incomingName;
        const priceVal =
          raw.price ?? raw.totalAmount ?? raw.amount ?? raw.priceEstimate ?? "";

        return {
          category: incomingCategory || raw.serviceCategory || "Deep Cleaning",
          subCategory: subCategory || "",
          serviceName: serviceName || "",
          price:
            priceVal !== undefined && priceVal !== null ? String(priceVal) : "",
          bookingAmount:
            bookingAmt !== undefined && bookingAmt !== null
              ? String(bookingAmt)
              : "",
        };
      })
    );
    // remember how many services were loaded initially so we can add bookingAmount only for newly added services
    setInitialServiceCount((service || []).length || 0);

    // Use backend finalTotal and bookingAmount as the initial base values when present
    const serverFinal = Number(bookingDetails?.finalTotal ?? 0) || 0;
    const serverBooking = Number(bookingDetails?.bookingAmount ?? 0) || 0;
    // if backend doesn't provide finalTotal, fall back to sum of service prices
    if (serverFinal > 0) {
      setServerFinalTotal(serverFinal);
    } else {
      // compute sum of initial services
      const initialSum = (service || []).reduce(
        (sumi, it) => sumi + (Number(it.price) || 0),
        0
      );
      setServerFinalTotal(initialSum);
    }
    setServerBookingAmount(serverBooking || 0);

    // initialize draft value when server final changes
    setDraftFinalTotal(serverFinal > 0 ? String(serverFinal) : "");

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
        const current = { ...(s || {}) };

        // Try to find a matching deepList item — match by service name (case-insensitive)
        const nameMatch = deepList.find((d) => {
          const dName = (d.name || d.service || "")
            .toString()
            .trim()
            .toLowerCase();
          const sName = (s.serviceName || "").toString().trim().toLowerCase();
          return dName && sName && dName === sName;
        });

        // If not found, try match by subcategory (deepList.category vs s.subCategory) case-insensitive
        const subCatMatch = !nameMatch
          ? deepList.find((d) => {
              const dCat = (d.category || "").toString().trim().toLowerCase();
              const sSub = (s.subCategory || s.subcategory || "")
                .toString()
                .trim()
                .toLowerCase();
              return dCat && sSub && dCat === sSub;
            })
          : null;

        const match = nameMatch || subCatMatch;

        if (match) {
          // fill bookingAmount if missing
          if (
            (current.bookingAmount === undefined ||
              current.bookingAmount === "") &&
            match.bookingAmount !== undefined &&
            match.bookingAmount !== null
          ) {
            current.bookingAmount = String(match.bookingAmount);
          }

          // ensure subCategory uses exact deepList.category value (fixes case mismatches)
          if (
            !current.subCategory ||
            (current.subCategory || "").toString().trim().toLowerCase() !==
              (match.category || "").toString().trim().toLowerCase()
          ) {
            current.subCategory = match.category || current.subCategory;
          }

          // ensure serviceName uses exact deepList.name value (fixes casing/mismatch)
          if (
            !current.serviceName ||
            (current.serviceName || "").toString().trim().toLowerCase() !==
              (match.name || "").toString().trim().toLowerCase()
          ) {
            current.serviceName = match.name || current.serviceName;
          }
        }

        return current;
      })
    );
  }, [deepList]);

  const onServiceChange = (idx, field, value) => {
    setServices((prev) => {
      const copy = [...prev];
      const updated = {
        ...copy[idx],
        [field]:
          (field === "price" || field === "bookingAmount") && value === ""
            ? ""
            : value,
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
  const siteVisitCharges =
    Number(
      enquiry?.raw?.bookingDetails?.siteVisitCharges ??
        enquiry?.raw?.bookingDetails?.siteVisitCharges ??
        0
    ) || 0;

  // Total used in UI: base finalTotal from server plus newly-added services
  const addedServicesTotal = (() => {
    // sum of newly added services after initial load
    const added = services.slice(initialServiceCount || 0);
    return added.reduce((s, it) => s + (Number(it.price) || 0), 0);
  })();

  // Show server final total + any newly added services.
  // For House Painting we only render the detailed payment UI when editing a lead and
  // the server-provided final total is a meaningful positive number.
  const displayedTotal =
    Number(serverFinalTotal || 0) + Number(addedServicesTotal || 0);

  const showDetailedPayment =
    !isHousePaintingService ||
    (isHousePaintingService && leadMode && Number(serverFinalTotal || 0) > 0);

  // Effective total after discount
  const effectiveTotal = (() => {
    if (!discountApplied) return displayedTotal;
    const after = displayedTotal - Number(discountAmount || 0);
    return after >= 0 ? after : 0;
  })();

  // Determine whether user has modified booking (by adding services or applying discount)
  const hasBeenModified =
    services.length !== initialServiceCount || discountApplied;

  // (removed duplicate effectiveTotal declaration - using displayedTotal/effectiveTotal above)

  // Booking amount: house painting -> siteVisitCharges; deep cleaning -> if not modified use server value, otherwise 20% of effectiveTotal
  const bookingAmountTotal = isHousePaintingService
    ? Number(siteVisitCharges || 0)
    : (() => {
        // For lead edits we must preserve the backend-provided booking amount (don't recalc)
        if (leadMode) return Number(serverBookingAmount || 0);

        if (!hasBeenModified && serverBookingAmount > 0)
          return Number(serverBookingAmount || 0);
        return Math.round(Number(effectiveTotal || 0) * 0.2);
      })();

  // Paid amount: prefer local paidAmount if present, otherwise use server paidAmount
  const serverPaidAmount = Number(
    enquiry?.raw?.bookingDetails?.paidAmount ??
      enquiry?.raw?.bookingDetails?.paidAmount ??
      0
  );
  const uiPaidAmount =
    paidAmount !== "" ? Number(paidAmount || 0) : serverPaidAmount;

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

  const hasFinalTotal = Number(serverFinalTotal || 0) > 0;

  const handleSave = async () => {
    if (!enquiry?.bookingId) return;
    if (!validateFields()) return;

    setSaving(true);

    // Check if House Painting
    const isHousePaintingService = services.some(
      (s) => s.category?.toLowerCase() === "house painting"
    );

    // COMMON address payload
    const addressPayload = {
      houseFlatNumber,
      streetArea,
      landMark,
      city: city || "Bengaluru",
      ...(location
        ? {
            location: {
              type: "Point",
              coordinates: location.coordinates,
            },
          }
        : {}),
    };

    // COMMON slot payload
    const slotPayload = {
      slotDate,
      slotTime,
    };

    // ===========================================================
    // 📌 CASE 1 → HOUSE PAINTING → SEND ONLY ADDRESS + SLOT
    // ===========================================================
    if (isHousePaintingService && !showDetailedPayment) {
      const payload = {
        address: addressPayload,
        selectedSlot: slotPayload,
        // isEnquiry: enquiry?.raw?.isEnquiry ?? true,
        // formName,
      };

      console.log("HP Payload:", payload);

      try {
        const endpoint = leadMode
          ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
          : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

        const res = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Update failed");

        alert("House Painting enquiry updated.");
        onUpdated?.(data.booking);
        onClose();
      } catch (err) {
        alert(err.message || "Error updating enquiry");
      } finally {
        setSaving(false);
      }

      return; // STOP HERE — DO NOT PROCESS DEEP CLEANING LOGIC
    }

    // ===========================================================
    // 📌 CASE 2 → DEEP CLEANING (KEEP FULL ORIGINAL LOGIC)
    // ===========================================================

    const normalizedServices = services.map((s) => {
      const priceNum = Number(s.price || 0);
      const bookingNum = Number(s.bookingAmount || 0);

      return {
        category: s.category?.trim() || "",
        subCategory: s.subCategory?.trim() || "",
        serviceName: s.serviceName?.trim() || "",
        quantity: 1,
        teamMembersRequired: 0,
        price: priceNum,
        bookingAmount: bookingNum,
      };
    });

    const finalPayload = {
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
        finalTotal: Number(effectiveTotal || 0),
        originalTotalAmount: Number(effectiveTotal || 0),
        // send paidAmount as the UI value if present, otherwise use server paid amount
        paidAmount: Number(uiPaidAmount || 0),
      },
      address: addressPayload,
      selectedSlot: slotPayload,
      isEnquiry: enquiry?.raw?.isEnquiry ?? true,
      formName,
    };

    console.log("Deep Cleaning Payload:", finalPayload);

    try {
      const endpoint = leadMode
        ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
        : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

      // If editing a lead, finalTotal must be greater than 0
      if (leadMode) {
        const finalToSend = Number(
          finalPayload?.bookingDetails?.finalTotal ?? serverFinalTotal ?? 0
        );
        if (!Number.isFinite(finalToSend) || finalToSend <= 0) {
          alert("Final total must be greater than 0 before saving");
          setSaving(false);
          return;
        }
      }

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed");

      onUpdated?.(data.booking);
      onClose();
    } catch (err) {
      alert(err.message || "Error updating enquiry");
    } finally {
      setSaving(false);
    }
  };

  // Helper: unique subcategories from deepList (use item.subcategory)
  const getUniqueDeepCategories = () => {
    if (!Array.isArray(deepList)) return [];
    return [
      ...new Set(
        deepList
          .map((it) => (it.category || "").toString().trim())
          .filter(Boolean)
      ),
    ];
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
                // Name is not editable in Edit Enquiry
                readOnly
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
                  // Phone is not editable in Edit Enquiry
                  readOnly
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
              .filter((item) => {
                const a = (item.category || "").toString().trim().toLowerCase();
                const b = (s.subCategory || "").toString().trim().toLowerCase();
                return a && b && a === b;
              })
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
                          const selectedItem = filteredServiceNames.find(
                            (it) => it.value === e.target.value
                          );
                          onServiceChange(idx, "serviceName", e.target.value);
                          if (selectedItem) {
                            onServiceChange(idx, "price", selectedItem.price);
                            onServiceChange(
                              idx,
                              "bookingAmount",
                              selectedItem.bookingAmount ?? ""
                            );
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
                    // Make price non-editable in Edit Enquiry
                    disabled={true}
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

          {isHousePaintingService && !hasFinalTotal ? (
            <div className="d-flex justify-content-between mb-2">
              <div>
                <div>Payment</div>
                <div style={{ fontSize: 12 }} className="text-muted">
                  House Painting — only site-visit charges
                </div>
              </div>

              <div className="text-end">
                <div>
                  <strong>₹{Number(siteVisitCharges || 0)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="d-flex justify-content-between mb-2">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div>Total Amount:</div>

                {discountApplied ? (
                  <div style={{ fontSize: 12 }} className="text-muted">
                    <small>
                      Original: ₹{displayedTotal} &nbsp; • &nbsp; Discount: ₹
                      {discountAmount}
                    </small>
                  </div>
                ) : null}
              </div>

              <div className="text-end">
                <div>
                  {!editingFinal ? (
                    <div className="d-flex gap-2">
                      <strong>₹{effectiveTotal}</strong>
                      {leadMode && !editingFinal && (
                        <div
                          style={{ color: "#7F6663" }}
                          onClick={() => {
                            setDraftFinalTotal(
                              String(serverFinalTotal || effectiveTotal || 0)
                            );
                            setEditingFinal(true);
                          }}
                        >
                          <FaEdit />
                        </div>
                      )}
                      {leadMode && editingFinal && (
                        <div style={{ fontSize: 12 }} className="text-muted">
                          Editing total...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Form.Control
                        type="number"
                        size="sm"
                        value={draftFinalTotal}
                        min="1"
                        onChange={(e) => setDraftFinalTotal(e.target.value)}
                        style={{ width: 140 }}
                      />
                      <div
                        style={{ color: "#007a08ff" }}
                        onClick={() => {
                          const v = Number(draftFinalTotal || 0);
                          if (!Number.isFinite(v) || v <= 0) {
                            alert("Final total must be greater than 0");
                            return;
                          }
                          setServerFinalTotal(v);
                          setEditingFinal(false);
                        }}
                      >
                        <FaCheck />
                      </div>
                      <div
                        style={{ color: "#ce1500ff" }}
                        onClick={() => {
                          setDraftFinalTotal(String(serverFinalTotal || ""));
                          setEditingFinal(false);
                        }}
                      >
                        <ImCancelCircle />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isHousePaintingService && (
            <div className="d-flex justify-content-between mb-1">
              <span>Booking Amount:</span>
              <strong>₹{bookingAmountTotal}</strong>
            </div>
          )}

          {/* Payment details (only shown when editing a lead) */}
          {!isHousePaintingService && leadMode && (
            <>
              {/* Amount Paid */}
              <div className="d-flex justify-content-between mb-1">
                <span>Amount Paid:</span>
                <strong>₹{uiPaidAmount}</strong>
              </div>

              {/* Amount yet to pay (lead-only: 40% rule minus paid) */}
              <div className="d-flex justify-content-between mt-2">
                <span>Amount yet to pay</span>
                <strong>
                  ₹
                  {Math.max(
                    0,
                    Math.round(Number(effectiveTotal || 0) * 0.4) -
                      Number(uiPaidAmount || 0)
                  )}
                </strong>
              </div>

              <div
                style={{ fontSize: 11, marginTop: 6 }}
                className="text-muted"
              >
                (Calculated as 40% of final total after discount, minus paid
                amount)
              </div>
            </>
          )}

          {/* For House Painting we show site visit charges rather than final total */}
          {isHousePaintingService && (
            <div className="d-flex justify-content-between mt-2">
              <span>Site visit charges</span>
              <strong>₹{Number(siteVisitCharges || 0)}</strong>
            </div>
          )}
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
