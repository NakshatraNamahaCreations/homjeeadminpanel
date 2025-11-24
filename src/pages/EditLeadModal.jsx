// EditLeadModal.jsx
// Exact same fields and UI as EditEnquiryModal
// This modal updates a booking (lead) using PUT /bookings/update-user-booking/:bookingId
// NOTE: This file includes a local screenshot path for debugging/preview purposes:
// screenshot: /mnt/data/17807d8f-45d2-47b0-940e-0439c4c49f26.png

import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
import AddressPickerModal from "./AddressPickerModal";
import TimePickerModal from "./TimePickerModal";
import { BASE_URL } from "../utils/config";

// util: strip non-digits and leading country code
const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

// Accepts either `booking` (lead) or `enquiry` object for compatibility
const EditLeadModal = ({
  show,
  onClose,
  booking, // preferred prop name when editing a lead/booking
  enquiry, // fallback (keeps API compatible with older usage)
  onUpdated,
  title,
}) => {
  const source = booking || enquiry || null;
  const bookingId = source?._id || source?.bookingId || source?.id;

  const [saving, setSaving] = useState(false);

  // form fields (same as EditEnquiryModal)
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

  const [status, setStatus] = useState("Pending");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [paidAmount, setPaidAmount] = useState("");

  // server data states
  const [deepList, setDeepList] = useState([]);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  // load supporting data (deep cleaning packages) - same as enquiry modal
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/deeppackage/deep-cleaning-packages`);
        const data = await res.json();
        if (data && data.success) setDeepList(data.data || []);
      } catch (err) {
        console.warn("Error fetching deep cleaning packages", err);
      }
    };
    fetchData();
  }, []);

  // hydrate form from booking/enquiry raw structure
  useEffect(() => {
    if (!source) return;

    // booking (lead) shape differs slightly from enquiry; try to read both
    const customer = source.customer || source.raw?.customer || {};
    const address = source.address || source.raw?.address || {};
    const selectedSlot = source.selectedSlot || source.raw?.selectedSlot || {};
    const service = source.service || source.raw?.service || [];
    const bookingDetails = source.bookingDetails || source.raw?.bookingDetails || {};

    setCustomerName(customer?.name || source.name || "");
    setCustomerPhone(normalizePhone(customer?.phone || source.contact || ""));
    setFormName(source.formName || source.raw?.formName || "");

    setHouseFlatNumber(address?.houseFlatNumber || "");
    setStreetArea(address?.streetArea || "");
    setLandMark(address?.landMark || address?.landmark || "");
    setCity(address?.city || "");

    // normalize location to { type: 'Point', coordinates: [lng, lat] }
    if (address?.location && Array.isArray(address.location.coordinates)) {
      setLocation({ type: 'Point', coordinates: address.location.coordinates });
    } else if (address?.location && address.location.lat && address.location.lng) {
      setLocation({ type: 'Point', coordinates: [address.location.lng, address.location.lat] });
    } else if (source.raw?.filledData?.location && source.raw?.filledData?.location.lat) {
      const ld = source.raw.filledData.location;
      setLocation({ type: 'Point', coordinates: [ld.lng, ld.lat] });
    } else {
      setLocation(null);
    }

    setSlotDate(selectedSlot?.slotDate || source.date || "");
    setSlotTime(selectedSlot?.slotTime || source.time || "");

    setServices(
      (service || []).map((s) => ({
        category: s?.category || "",
        subCategory: s?.subCategory || "",
        serviceName: s?.serviceName || "",
        price: s?.price !== undefined ? String(s.price) : "",
      }))
    );

    setStatus(bookingDetails?.status || source.status || "Pending");
    setPaymentMethod(bookingDetails?.paymentMethod || source.filledData?.payment || "Cash");
    setPaymentStatus(bookingDetails?.paymentStatus || "Unpaid");
    setPaidAmount(
      bookingDetails?.paidAmount !== undefined
        ? String(bookingDetails.paidAmount)
        : (source.filledData?.payment ? String(source.filledData.payment) : "")
    );
  }, [source]);

  const onServiceChange = (idx, field, value) => {
    setServices((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      { category: "Deep Cleaning", subCategory: "", serviceName: "", price: "" },
    ]);
  };

  const removeService = (idx) => setServices((prev) => prev.filter((_, i) => i !== idx));

  const isHousePaintingService = services.some(
    (s) => s.category?.toLowerCase() === "house painting"
  );

  // address/time pickers callback
  const handleAddressSelect = (addressData) => {
    setHouseFlatNumber(addressData.houseFlatNumber || "");
    setStreetArea(addressData.formattedAddress || addressData.streetArea || "");
    setLandMark(addressData.landmark || "");
    setCity(addressData.city || "");
    if (addressData.lat !== undefined && addressData.lng !== undefined) {
      setLocation({ type: 'Point', coordinates: [addressData.lng, addressData.lat] });
    }

    // reset slot when address changes (same behaviour as Enquiry modal)
    setSlotDate("");
    setSlotTime("");
  };

  const handleSlotSelect = (sel) => {
    setSlotDate(sel.slotDate || "");
    setSlotTime(sel.slotTime || "");
  };

  const derivedLatLng = (() => {
    if (!location) return undefined;
    if (Array.isArray(location.coordinates)) return { lat: location.coordinates[1], lng: location.coordinates[0] };
    return undefined;
  })();

  // validations (same rules as EditEnquiryModal)
  const validateFields = () => {
    if (!customerName.trim()) { alert("Customer name is required"); return false; }

    const phone = (customerPhone || "").trim();
    if (!phone || phone.length !== 10) { alert("Valid 10-digit phone number is required"); return false; }

    if (!houseFlatNumber.trim()) { alert("House/Flat number is required"); return false; }
    if (!streetArea.trim()) { alert("Street/Area is required"); return false; }
    if (!city.trim()) { alert("City is required"); return false; }
    if (!location || !location.coordinates) { alert("Location coordinates are required"); return false; }

    if (!slotDate.trim()) { alert("Slot date is required"); return false; }
    if (!slotTime.trim()) { alert("Slot time is required"); return false; }

    if (services.length === 0) { alert("At least one service is required"); return false; }

    for (let i = 0; i < services.length; i++) {
      const s = services[i];
      if (!s.category?.trim()) { alert(`Service ${i + 1}: Category is required`); return false; }
      if (s.category?.toLowerCase() !== "house painting") {
        if (!s.subCategory?.trim()) { alert(`Service ${i + 1}: Subcategory is required`); return false; }
        if (!s.serviceName?.trim()) { alert(`Service ${i + 1}: Service name is required`); return false; }
      }

      if (!s.price || isNaN(Number(s.price)) || Number(s.price) <= 0) { alert(`Service ${i + 1}: Valid price is required`); return false; }
    }

    // house painting constraint
    const hasHP = services.some((s) => s.category?.toLowerCase() === "house painting");
    if (hasHP && services.length > 1) { alert("House Painting can only have one service."); return false; }

    return true;
  };

  // save handler: uses same API as enquiry modal but forces isEnquiry: false
  const handleSave = async () => {
    if (!bookingId) return;
    if (!validateFields()) return;

    setSaving(true);

    const normalizedServices = services
      .map((s) => {
        const priceTrim = typeof s.price === "string" ? s.price.trim() : s.price;
        const priceNum = priceTrim === "" || priceTrim === undefined ? undefined : Number(priceTrim);

        if (s.category?.toLowerCase() === "house painting") {
          return {
            category: s.category?.trim() || "",
            subCategory: s.category?.trim() || "",
            serviceName: s.category?.trim() || "",
            quantity: 1,
            teamMembersRequired: 1,
            ...(Number.isFinite(priceNum) ? { price: priceNum } : {}),
          };
        }

        return {
          category: s.category?.trim() || "",
          subCategory: s.subCategory?.trim() || "",
          serviceName: s.serviceName?.trim() || "",
          quantity: 1,
          teamMembersRequired: 1,
          ...(Number.isFinite(priceNum) ? { price: priceNum } : {}),
        };
      })
      .filter((s) => s.category || s.subCategory || s.serviceName);

    const paidTrim = String(paidAmount ?? "").trim();
    const paidNum = paidTrim === "" ? undefined : Number(paidTrim);

    const addressPayload = {
      houseFlatNumber,
      streetArea,
      landMark,
      city: city || "Bengaluru",
      ...(location
        ? { location: { type: "Point", coordinates: location.coordinates } }
        : {}),
    };

    const payload = {
      customer: { name: customerName, phone: customerPhone, customerId: source?.customer?.customerId },
      service: normalizedServices,
      bookingDetails: {
        status,
        paymentMethod,
        paymentStatus,
        paidAmount: paidNum !== undefined && Number.isFinite(paidNum) ? paidNum : undefined,
      },
      address: addressPayload,
      selectedSlot: { slotDate, slotTime },
      isEnquiry: false, // per your instruction
      formName,
    };

    try {
      const res = await fetch(`${BASE_URL}/bookings/update-user-booking/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed");

      alert("Booking updated successfully!");
      onUpdated?.(data.booking || data);
      onClose?.();
      // keep behaviour same as enquiry modal
      window.location.reload();
    } catch (err) {
      alert(err.message || "Error updating booking");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onClose} size="lg" centered enforceFocus={false} restoreFocus={false}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16 }}>{title || "Edit Booking"}</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ fontSize: 13 }}>
          {/* Customer */}
          <h6 className="mb-2">Customer *</h6>
          <Row className="g-2 mb-3">
            <Col md={6}>
              <Form.Label>Name</Form.Label>
              <Form.Control value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" size="sm" />
            </Col>

            <Col md={6}>
              <Form.Label>Phone *</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text>+91</InputGroup.Text>
                <Form.Control value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="10-digit number" />
              </InputGroup>
            </Col>
          </Row>

          {/* Address */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="mb-0">Address *</h6>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowAddressModal(true)}>Change Address</Button>
          </div>

          <Row className="g-2 mb-3">
            <Col md={4}>
              <Form.Label>House / Flat No. *</Form.Label>
              <Form.Control value={houseFlatNumber} onChange={(e) => setHouseFlatNumber(e.target.value)} placeholder="12A" size="sm" readOnly />
            </Col>

            <Col md={4}>
              <Form.Label>Street / Area *</Form.Label>
              <Form.Control value={streetArea} onChange={(e) => setStreetArea(e.target.value)} placeholder="MG Road" size="sm" readOnly />
            </Col>

            <Col md={4}>
              <Form.Label>Landmark</Form.Label>
              <Form.Control value={landMark} onChange={(e) => setLandMark(e.target.value)} placeholder="Near Metro" size="sm" readOnly />
            </Col>
          </Row>

          <Row className="g-2 mb-3">
            <Col md={4}>
              <Form.Label>City *</Form.Label>
              <Form.Control value={city} onChange={(e) => setCity(e.target.value)} placeholder="Detected city" size="sm" readOnly />
            </Col>
          </Row>

          {/* Slot */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="mb-0">Preferred Slot </h6>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowTimeModal(true)}>Change Date & Slot</Button>
          </div>

          <Row className="g-2 mb-3">
            <Col md={6}>
              <Form.Label>Date *</Form.Label>
              <Form.Control value={slotDate} readOnly placeholder="Select via Date & Slot" size="sm" />
            </Col>

            <Col md={6}>
              <Form.Label>Time *</Form.Label>
              <Form.Control value={slotTime} readOnly placeholder="Select via Date & Slot" size="sm" />
            </Col>
          </Row>

          {/* Services Section */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="mb-0">Services </h6>
            {!isHousePaintingService && (
              <Button variant="outline-secondary" size="sm" onClick={addService}>+ Add Service</Button>
            )}
          </div>

          {isHousePaintingService && (
            <div className="text-muted mb-2" style={{ fontSize: 12 }}>House Painting allows only one service entry.</div>
          )}

          {services.map((s, idx) => {
            const isDeepCleaning = s.category?.toLowerCase() === "deep cleaning";
            const isHousePainting = s.category?.toLowerCase() === "house painting";

            const filteredServiceNames = deepList
              .filter((item) => item.category?.toLowerCase() === s.subCategory?.toLowerCase())
              .map((item) => ({ label: item.name, value: item.name, price: item.totalAmount }));

            return (
              <Row key={idx} className="g-2 align-items-end mb-3">
                <Col md={isHousePainting ? 4 : 3}>
                  <Form.Label className="mb-1">Category *</Form.Label>
                  {isDeepCleaning || isHousePainting ? (
                    <Form.Control value={s.category} size="sm" disabled />
                  ) : (
                    <Form.Control value={s.category} onChange={(e) => onServiceChange(idx, "category", e.target.value)} placeholder="Deep Cleaning / House Painting" size="sm" />
                  )}
                </Col>

                {!isHousePainting && (
                  <Col md={3}>
                    <Form.Label className="mb-1">Subcategory</Form.Label>
                    {isDeepCleaning ? (
                      <Form.Select size="sm" value={s.subCategory} onChange={(e) => onServiceChange(idx, "subCategory", e.target.value)}>
                        <option value="">Select Subcategory *</option>
                        {[...new Set(deepList.map((item) => item.category))].map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </Form.Select>
                    ) : null}
                  </Col>
                )}

                {!isHousePainting && (
                  <Col md={3}>
                    <Form.Label className="mb-1">Service Name *</Form.Label>
                    {isDeepCleaning ? (
                      <Form.Select size="sm" value={s.serviceName} onChange={(e) => {
                        const selectedItem = filteredServiceNames.find((it) => it.value === e.target.value);
                        onServiceChange(idx, "serviceName", e.target.value);
                        if (selectedItem) onServiceChange(idx, "price", selectedItem.price);
                      }}>
                        <option value="">Select Service *</option>
                        {filteredServiceNames.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </Form.Select>
                    ) : (
                      <Form.Control size="sm" value={s.serviceName} onChange={(e) => onServiceChange(idx, "serviceName", e.target.value)} placeholder="Full Kitchen / Interior" />
                    )}
                  </Col>
                )}

                <Col md={isHousePainting ? 4 : 2}>
                  <Form.Label className="mb-1">Price (₹)</Form.Label>
                  <Form.Control type="number" size="sm" value={s.price} min="0" onChange={(e) => onServiceChange(idx, "price", e.target.value)} placeholder="0" disabled={isDeepCleaning && s.serviceName === ""} />
                </Col>

                {!isHousePainting && (
                  <Col md={1} className="text-end">
                    <Button variant="outline-danger" size="sm" onClick={() => removeService(idx)}>×</Button>
                  </Col>
                )}
              </Row>
            );
          })}

          <Row className="g-2 mt-3">
            <Col md={3}>
              <Form.Label>Form Name *</Form.Label>
              <Form.Control value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Form identifier" size="sm" disabled />
            </Col>
          </Row>
        </Modal.Body>

        {/* AMOUNT SUMMARY */}
        <div className="mt-3 p-3" style={{ background: "#f8f9fa", borderRadius: 8, border: "1px solid #e3e3e3" }}>
          <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

          <div className="d-flex justify-content-between mb-2">
            <span>Total Amount:</span>
            <strong>₹{isHousePaintingService ? Number(services[0]?.price || 0) : services.reduce((sum, s) => sum + (Number(s.price) || 0), 0)}</strong>
          </div>

          <div className="d-flex justify-content-between mb-1">
            <span>Booking Amount:</span>
            <strong>₹{source?.bookingDetails?.bookingAmount || 0}</strong>
          </div>
        </div>

        {/* FOOTER */}
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="danger" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </Modal.Footer>
      </Modal>

      {/* ADDRESS MODAL */}
      {showAddressModal && (
        <AddressPickerModal
          initialAddress={streetArea}
          initialLatLng={derivedLatLng}
          onClose={() => setShowAddressModal(false)}
          onSelect={handleAddressSelect}
          bookingId={bookingId}
        />
      )}

      {/* TIME MODAL */}
      {showTimeModal && (
        <TimePickerModal onClose={() => setShowTimeModal(false)} onSelect={handleSlotSelect} bookingId={bookingId} />
      )}
    </>
  );
};

export default EditLeadModal;


// old code

// import React, { useState } from "react";
// import { Modal, Button, Form } from "react-bootstrap";
// import { toast } from "react-toastify";
// import { GoogleMap, LoadScript, Autocomplete } from "@react-google-maps/api";
// import { BASE_URL } from "../utils/config";

// const GOOGLE_MAPS_API_KEY = "AIzaSyBF48uqsKVyp9P2NlDX-heBJksvvT_8Cqk";

// const EditLeadModal = ({ show, onClose, lead, onUpdate }) => {
//   const [formData, setFormData] = useState({
//     name: lead?.name || "",
//     phone: lead?.contact || "",
//     houseNumber: lead?.filledData?.houseNumber || "",
//     landmark: lead?.filledData?.landmark || "",
//     slot: lead?.time || "",
//     location: lead?.filledData?.location?.name || "",
//     lat: lead?.filledData?.location?.lat || 0,
//     lng: lead?.filledData?.location?.lng || 0,
//   });

//   const [autocomplete, setAutocomplete] = useState(null);

//   const handlePlaceChanged = () => {
//     if (autocomplete) {
//       const place = autocomplete.getPlace();
//       if (place.geometry) {
//         setFormData({
//           ...formData,
//           location: place.formatted_address,
//           lat: place.geometry.location.lat(),
//           lng: place.geometry.location.lng(),
//         });
//       }
//     }
//   };

//   const handleSubmit = async () => {
//     try {
//       const response = await fetch(
//         `${BASE_URL}/bookings/update-user-booking/${lead.id}`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(formData),
//         }
//       );
//       const result = await response.json();
//       if (response.ok) {
//         toast.success("Lead updated successfully!");
//         onUpdate(formData);
//         onClose();
//       } else {
//         toast.error(result?.message || "Failed to update lead");
//       }
//     } catch (error) {
//       console.error("Update error:", error);
//       toast.error("Error updating lead");
//     }
//   };

//   return (
//     <Modal show={show} onHide={onClose} size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title>Edit Lead</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <Form>
//           <Form.Group className="mb-3">
//             <Form.Label>Name</Form.Label>
//             <Form.Control
//               type="text"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//             />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Phone</Form.Label>
//             <Form.Control
//               type="text"
//               value={formData.phone}
//               onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//             />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Location</Form.Label>
//             <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
//               <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceChanged}>
//                 <Form.Control
//                   type="text"
//                   value={formData.location}
//                   onChange={(e) => setFormData({ ...formData, location: e.target.value })}
//                 />
//               </Autocomplete>
//             </LoadScript>
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>House/Flat Number</Form.Label>
//             <Form.Control
//               type="text"
//               value={formData.houseNumber}
//               onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
//             />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Landmark</Form.Label>
//             <Form.Control
//               type="text"
//               value={formData.landmark}
//               onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
//             />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Slot</Form.Label>
//             <Form.Control
//               type="text"
//               value={formData.slot}
//               onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
//             />
//           </Form.Group>
//         </Form>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="secondary" onClick={onClose}>
//           Cancel
//         </Button>
//         <Button variant="primary" onClick={handleSubmit}>
//           Save & Update
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default EditLeadModal;
