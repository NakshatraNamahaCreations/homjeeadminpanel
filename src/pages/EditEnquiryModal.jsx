import React, { useEffect, useState, useRef } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
import AddressPickerModal from "./AddressPickerModal";
import TimePickerModal from "./TimePickerModal";
import { BASE_URL } from "../utils/config";
import { ImCancelCircle } from "react-icons/im";
import { FaCheck } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";

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

  const [deepList, setDeepList] = useState([]);

  const [editingFinal, setEditingFinal] = useState(false);
  const [draftFinalTotal, setDraftFinalTotal] = useState("");

  const [serverFinalTotal, setServerFinalTotal] = useState(0);
  const [originalFinalTotal, setOriginalFinalTotal] = useState(0);

  const [serverBookingAmount, setServerBookingAmount] = useState(0);

  // AYTP + refund for lead mode only
  const [amountYetToPay, setAmountYetToPay] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);

  // House painting fields
  const [siteVisitCharges, setSiteVisitCharges] = useState(0);
  const [firstPaid, setFirstPaid] = useState(false);
  const [secondPaid, setSecondPaid] = useState(false);
  const [finalPaid, setFinalPaid] = useState(false);

  const [firstAmount, setFirstAmount] = useState(0);
  const [secondAmount, setSecondAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const isHousePaintingService = services.some(
    (s) => s.category?.toLowerCase() === "house painting"
  );

  // Refs to track service changes
  const serviceUpdatesRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  // -------------------------------------------
  // LOAD ENQUIRY — restore EXACT old lead-mode AYTP logic
  // -------------------------------------------
  useEffect(() => {
    if (!enquiry?.raw) return;

    try {
      const {
        customer,
        address,
        selectedSlot,
        service,
        bookingDetails,
        formName: fm,
      } = enquiry.raw;

      setCustomerName(customer?.name || "");
      setCustomerPhone(
        normalizePhone(enquiry?.contact) || customer?.phone || ""
      );
      setFormName(fm || enquiry?.formName || "");

      setHouseFlatNumber(address?.houseFlatNumber || "");
      setStreetArea(address?.streetArea || "");
      setLandMark(address?.landMark || "");
      setCity(address?.city || "");
      setLocation(address?.location || null);

      setSlotDate(selectedSlot?.slotDate || "");
      setSlotTime(selectedSlot?.slotTime || "");

      // Load services
      const loadedServices = (service || []).map((s) => {
        const raw = s || {};
        const priceVal = raw.price ?? raw.totalAmount ?? raw.amount ?? "";
        return {
          category: raw.category || "Deep Cleaning",
          subCategory: raw.subCategory || "",
          serviceName: raw.serviceName || raw.name || "",
          price: priceVal !== undefined ? String(priceVal) : "",
          bookingAmount: raw.bookingAmount || "",
        };
      });

      setServices(loadedServices);
      setInitialServiceCount(service?.length || 0);

      // Backend totals
      const backendOriginal = Number(bookingDetails?.originalTotalAmount || 0);
      const backendFinal = Number(
        bookingDetails?.finalTotal ?? bookingDetails?.originalTotalAmount ?? 0
      );
      const backendPaid = Number(bookingDetails?.paidAmount || 0);
      const backendBooking = Number(bookingDetails?.bookingAmount || 0);

      setOriginalFinalTotal(backendOriginal);
      setServerFinalTotal(backendFinal);
      setDraftFinalTotal(String(backendFinal));
      setPaidAmount(String(backendPaid));
      setServerBookingAmount(backendBooking);

      // House painting information
      const isHP = (service || []).some(
        (it) => it.category?.toLowerCase() === "house painting"
      );
      const svc = Number(bookingDetails?.siteVisitCharges || 0);
      setSiteVisitCharges(svc);

      if (isHP) {
        const fPaid = bookingDetails?.firstPayment?.status === "paid";
        const sPaid = bookingDetails?.secondPayment?.status === "paid";
        const fnPaid = bookingDetails?.finalPayment?.status === "paid";

        setFirstPaid(!!fPaid);
        setSecondPaid(!!sPaid);
        setFinalPaid(!!fnPaid);

        setFirstAmount(Number(bookingDetails?.firstPayment?.amount || 0));
        setSecondAmount(Number(bookingDetails?.secondPayment?.amount || 0));
        setFinalAmount(Number(bookingDetails?.finalPayment?.amount || 0));
      }

      // ---------------------------------------------------
      // AYTP CALCULATION (RESTORED) — ONLY FOR LEAD MODE
      // ---------------------------------------------------
      if (leadMode) {
        if (isHP) {
          // House painting installment logic
          const FT = backendFinal;

          if (!firstPaid) {
            setAmountYetToPay(Math.round(FT * 0.4));
            setRefundAmount(0);
          } else if (firstPaid && !secondPaid) {
            setAmountYetToPay(Math.round(FT * 0.4));
            setRefundAmount(0);
          } else if (firstPaid && secondPaid && !finalPaid) {
            setAmountYetToPay(Math.round(FT * 0.2));
            setRefundAmount(0);
          } else {
            const totalPaid = firstAmount + secondAmount + finalAmount;
            const diff = FT - totalPaid;
            if (diff < 0) {
              setRefundAmount(Math.abs(diff));
              setAmountYetToPay(0);
            } else {
              setRefundAmount(0);
              setAmountYetToPay(diff);
            }
          }
        } else {
          // Deep cleaning AYTP = finalTotal - paid
          const aytp = backendFinal - backendPaid;
          if (aytp < 0) {
            setRefundAmount(Math.abs(aytp));
            setAmountYetToPay(0);
          } else {
            setRefundAmount(0);
            setAmountYetToPay(aytp);
          }
        }
      }
    } catch (err) {
      console.error("Load enquiry error:", err);
    }

    // Reset initial load flag after first load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
    }
  }, [enquiry, leadMode]);

  // ---------------------------------------
  // Deep cleaning list fetch
  // ---------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/deeppackage/deep-cleaning-packages`
        );
        const data = await res.json();
        setDeepList(data?.data || []);
      } catch (err) {
        console.error("Error fetching deep packages:", err);
        setDeepList([]);
      }
    };
    fetchData();
  }, []);

  // ---------------------------------------
  // Helper: compute house painting display amounts (used in leadMode)
  // ---------------------------------------
  const computeHousePaintingDisplay = (
    finalTotalValue,
    siteVisitChargesValue,
    flagsAndAmounts
  ) => {
    const FT = Number(finalTotalValue || 0);
    const SV = Number(siteVisitChargesValue || 0);

    const firstPaidFlag = !!flagsAndAmounts.firstPaid;
    const secondPaidFlag = !!flagsAndAmounts.secondPaid;
    const finalPaidFlag = !!flagsAndAmounts.finalPaid;

    const fAmt = Number(flagsAndAmounts.firstAmount || 0);
    const sAmt = Number(flagsAndAmounts.secondAmount || 0);
    const fnAmt = Number(flagsAndAmounts.finalAmount || 0);

    const slab40 = Math.round(FT * 0.4);
    const slab20 = Math.round(FT * 0.2);

    let paidDisplay = 0;
    let aytp = 0;
    let refund = 0;

    if (!firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
      paidDisplay = SV;
      aytp = slab40;
    } else if (firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
      paidDisplay = fAmt;
      aytp = slab40;
    } else if (firstPaidFlag && secondPaidFlag && !finalPaidFlag) {
      paidDisplay = fAmt + sAmt;
      aytp = slab20;
    } else if (firstPaidFlag && secondPaidFlag && finalPaidFlag) {
      paidDisplay = fAmt + sAmt + fnAmt;
      aytp = 0;
      if (paidDisplay > FT) refund = paidDisplay - FT;
    } else {
      paidDisplay = SV;
      aytp = slab40;
    }

    return { paidDisplay, aytp, refund, slab40, slab20 };
  };

  // ---------------------------------------
  // ADD SERVICE - SIMPLE ADDITION
  // ---------------------------------------
  const addService = () => {
    setServices((prev) => {
      const next = [
        ...prev,
        {
          category: "Deep Cleaning",
          subCategory: "",
          serviceName: "",
          price: "",
          bookingAmount: "",
        },
      ];
      return next;
    });
  };

  // ---------------------------------------
  // REMOVE SERVICE - COMPLETELY ATOMIC VERSION
  // ---------------------------------------
  const removeService = (idx) => {
    if (services.length === 1) {
      alert("At least one service must remain in the booking.");
      return;
    }

    // Create a copy of current services
    const currentServices = [...services];
    const serviceToRemove = currentServices[idx];
    const removedPrice = Number(serviceToRemove?.price || 0);

    // Calculate new values BEFORE any state updates
    const newServices = currentServices.filter((_, i) => i !== idx);
    const newFinalTotal = Math.max(0, serverFinalTotal - removedPrice);

    let newBookingAmount = serverBookingAmount;
    let newAmountYetToPay = amountYetToPay;
    let newRefundAmount = refundAmount;

    // Calculate booking amount for enquiry mode
    if (!leadMode) {
      newBookingAmount = Math.round(newFinalTotal * 0.2);
    }

    // For lead mode, calculate AYTP/refund
    if (leadMode) {
      const hpFlag = newServices.some(
        (s) => (s.category || "").toLowerCase() === "house painting"
      );

      if (!hpFlag) {
        // For non-house painting services in lead mode
        const aytp = newFinalTotal - Number(paidAmount || 0);
        if (aytp < 0) {
          newRefundAmount = Math.abs(aytp);
          newAmountYetToPay = 0;
        } else {
          newRefundAmount = 0;
          newAmountYetToPay = aytp;
        }
      } else {
        // For house painting in lead mode
        const computed = computeHousePaintingDisplay(
          newFinalTotal,
          siteVisitCharges,
          {
            firstPaid,
            secondPaid,
            finalPaid,
            firstAmount,
            secondAmount,
            finalAmount,
          }
        );
        if (computed.refund > 0) {
          newRefundAmount = computed.refund;
          newAmountYetToPay = 0;
        } else {
          newRefundAmount = 0;
          newAmountYetToPay = computed.aytp;
        }
      }
    }

    // Update ALL states in one synchronous batch
    // This prevents any intermediate re-renders that might trigger onServiceChange
    setServices(newServices);
    setServerFinalTotal(newFinalTotal);

    if (!leadMode) {
      setServerBookingAmount(newBookingAmount);
    }

    if (leadMode) {
      setAmountYetToPay(newAmountYetToPay);
      setRefundAmount(newRefundAmount);
    }
  };

  // ---------------------------------------
  // ON SERVICE CHANGE - FIXED VERSION
  // This now handles price changes correctly without double counting
  // ---------------------------------------
  const onServiceChange = (
    idx,
    field,
    value,
    isFromServiceSelection = false
  ) => {
    setServices((prev) => {
      const copy = [...prev];
      const oldPrice = Number(copy[idx]?.price || 0);

      // Update the field
      copy[idx] = {
        ...copy[idx],
        [field]: field === "price" && value === "" ? "" : value,
      };

      // Handle price field changes
      if (field === "price") {
        const newPrice = Number(value || 0);

        // Calculate the actual difference
        const priceDifference = newPrice - oldPrice;

        // Only update if there's a change AND we're not in the initial load
        if (priceDifference !== 0 && !initialLoadRef.current) {
          setServerFinalTotal((prevTotal) => {
            const newTotal = Number(prevTotal || 0) + priceDifference;

            // If we're in enquiry mode (not leadMode), calculate booking amount as 20% of newTotal
            if (!leadMode) {
              const bookingAmt = Math.round(newTotal * 0.2);
              setServerBookingAmount(bookingAmt);
            }

            // If leadMode, recalc AYTP/refund
            if (leadMode) {
              const hpFlag = copy.some(
                (s) => (s.category || "").toLowerCase() === "house painting"
              );
              if (!hpFlag) {
                const aytp = newTotal - Number(paidAmount || 0);
                if (aytp < 0) {
                  setRefundAmount(Math.abs(aytp));
                  setAmountYetToPay(0);
                } else {
                  setRefundAmount(0);
                  setAmountYetToPay(aytp);
                }
              }
            }

            return newTotal;
          });
        }
      }

      return copy;
    });
  };

  // ---------------------------------------
  // HANDLE SERVICE SELECTION FROM DROPDOWN
  // This ensures price is only added once when service is selected
  // ---------------------------------------
  const handleServiceSelection = (idx, selectedServiceName) => {
    // Find the selected service from deepList
    const selectedService = deepList.find(
      (item) =>
        item.name === selectedServiceName ||
        item.serviceName === selectedServiceName
    );

    if (selectedService) {
      const newPrice = Number(
        selectedService.totalAmount || selectedService.price || 0
      );
      const bookingAmount = Number(selectedService.bookingAmount || 0);

      // Get current service price before update
      const currentPrice = Number(services[idx]?.price || 0);

      // Calculate the difference
      const priceDifference = newPrice - currentPrice;

      // Update the service
      setServices((prev) => {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          serviceName: selectedServiceName,
          price: String(newPrice),
          bookingAmount: String(bookingAmount),
        };
        return copy;
      });

      // Only update serverFinalTotal if there's a price difference AND we're not in initial load
      if (priceDifference !== 0 && !initialLoadRef.current) {
        setServerFinalTotal((prevTotal) => {
          const newTotal = Number(prevTotal || 0) + priceDifference;

          // If we're in enquiry mode (not leadMode), calculate booking amount as 20% of newTotal
          if (!leadMode) {
            const bookingAmt = Math.round(newTotal * 0.2);
            setServerBookingAmount(bookingAmt);
          }

          // If leadMode, recalc AYTP/refund
          if (leadMode) {
            const hpFlag = services.some(
              (s) => (s.category || "").toLowerCase() === "house painting"
            );
            if (!hpFlag) {
              const aytp = newTotal - Number(paidAmount || 0);
              if (aytp < 0) {
                setRefundAmount(Math.abs(aytp));
                setAmountYetToPay(0);
              } else {
                setRefundAmount(0);
                setAmountYetToPay(aytp);
              }
            }
          }

          return newTotal;
        });
      }
    }
  };

  // Effect to handle AYTP calculation for non-house-painting services
  useEffect(() => {
    if (!services || services.length === 0 || initialLoadRef.current) return;

    // If house painting service present, AYTP logic uses slabs, handled in below effect
    if (!leadMode) {
      // For enquiry mode, calculate booking amount as 20% of serverFinalTotal
      const bookingAmt = Math.round(serverFinalTotal * 0.2);
      setServerBookingAmount(bookingAmt);
      return;
    }

    // For leadMode and non-house-painting, recalc AYTP as finalTotal - paid
    const hpFlag = services.some(
      (s) => (s.category || "").toLowerCase() === "house painting"
    );
    if (!hpFlag) {
      const aytp = Number(serverFinalTotal || 0) - Number(paidAmount || 0);
      if (aytp < 0) {
        setRefundAmount(Math.abs(aytp));
        setAmountYetToPay(0);
      } else {
        setRefundAmount(0);
        setAmountYetToPay(aytp);
      }
    }
  }, [services, leadMode, serverFinalTotal, paidAmount]);

  // ---------------------------------------
  // House painting AYTP recalculation for lead mode when relevant values change
  // ---------------------------------------
  useEffect(() => {
    if (!leadMode || initialLoadRef.current) return;

    const hpFlag = services.some(
      (s) => (s.category || "").toLowerCase() === "house painting"
    );
    if (!hpFlag) return;

    // Use computeHousePaintingDisplay to set amountYetToPay and refund
    const computed = computeHousePaintingDisplay(
      serverFinalTotal,
      siteVisitCharges,
      {
        firstPaid,
        secondPaid,
        finalPaid,
        firstAmount,
        secondAmount,
        finalAmount,
      }
    );

    if (computed.refund > 0) {
      setRefundAmount(computed.refund);
      setAmountYetToPay(0);
    } else {
      setRefundAmount(0);
      setAmountYetToPay(computed.aytp);
    }
  }, [
    leadMode,
    services,
    serverFinalTotal,
    siteVisitCharges,
    firstPaid,
    secondPaid,
    finalPaid,
    firstAmount,
    secondAmount,
    finalAmount,
  ]);
  // ---------------------------------------
  // Manual Final Total edit apply (when admin edits final total via input)
  // ---------------------------------------
  const applyManualFinalTotal = () => {
    const manualValue = Number(draftFinalTotal || 0);

    if (!Number.isFinite(manualValue) || manualValue < 0) {
      alert("Final total must be a positive number");
      return;
    }

    setServerFinalTotal(manualValue);

    // If we're in enquiry mode (not leadMode), calculate booking amount as 20% of manualValue
    if (!leadMode) {
      const bookingAmt = Math.round(manualValue * 0.2);
      setServerBookingAmount(bookingAmt);
    }

    // If leadMode, recalc AYTP/refund
    if (leadMode) {
      const hpFlag = services.some(
        (s) => (s.category || "").toLowerCase() === "house painting"
      );
      if (!hpFlag) {
        const aytp = manualValue - Number(paidAmount || 0);
        if (aytp < 0) {
          setRefundAmount(Math.abs(aytp));
          setAmountYetToPay(0);
        } else {
          setRefundAmount(0);
          setAmountYetToPay(aytp);
        }
      } else {
        const computed = computeHousePaintingDisplay(
          manualValue,
          siteVisitCharges,
          {
            firstPaid,
            secondPaid,
            finalPaid,
            firstAmount,
            secondAmount,
            finalAmount,
          }
        );
        if (computed.refund > 0) {
          setRefundAmount(computed.refund);
          setAmountYetToPay(0);
        } else {
          setRefundAmount(0);
          setAmountYetToPay(computed.aytp);
        }
      }
    }

    setEditingFinal(false);
  };

  // ---------------------------------------
  // Address & Slot handlers (used by address/time modals)
  // ---------------------------------------
  const handleAddressSelect = (addressObj) => {
    if (!addressObj) return;
    const { houseFlatNumber, streetArea, landmark, latLng } = addressObj;
    setHouseFlatNumber(houseFlatNumber || "");
    setStreetArea(streetArea || "");
    setLandMark(landmark || "");
    if (latLng && latLng.lat != null && latLng.lng != null) {
      setLocation({
        type: "Point",
        coordinates: [latLng.lng, latLng.lat],
      });
    }
  };

  const handleSlotSelect = ({ slotDate: sd, slotTime: st }) => {
    if (sd) setSlotDate(sd);
    if (st) setSlotTime(st);
  };

  // ---------------------------------------
  // Local UI flags for address/time modals
  // ---------------------------------------
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  // ---------------------------------------
  // Payment Summary UI (leadMode shows AYTP/refund; enquiry hides AYTP/refund)
  // ---------------------------------------
  const PaymentSummarySection = () => {
    return (
      <div
        className="mt-3 p-3"
        style={{
          background: "#f8f9fa",
          borderRadius: 8,
          border: "1px solid #e3e3e3",
        }}
      >
        <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

        {/* Show original amount ALWAYS if it exists - FIXED */}
        {originalFinalTotal != serverFinalTotal && (
          <>
            <div className="d-flex justify-content-between mb-1">
              <span>Old Total Amount:</span>
              <strong>₹{originalFinalTotal}</strong>
            </div>

            {/* Show change only if there's a difference */}
            {serverFinalTotal !== originalFinalTotal && (
              <div className="d-flex justify-content-between mb-2">
                <span>Change:</span>
                {serverFinalTotal > originalFinalTotal ? (
                  <strong style={{ color: "green" }}>
                    +₹{serverFinalTotal - originalFinalTotal}
                  </strong>
                ) : (
                  <strong style={{ color: "red" }}>
                    -₹{originalFinalTotal - serverFinalTotal}
                  </strong>
                )}
              </div>
            )}
          </>
        )}

        {/* House painting enquiry: site visit only */}
        {isHousePaintingService && !leadMode ? (
          <div className="d-flex justify-content-between mb-2">
            <span>Site Visit Charges:</span>
            <strong>₹{siteVisitCharges}</strong>
          </div>
        ) : (
          <>
            {/* Final Total display & manual edit */}
            <div
              className="d-flex justify-content-between mb-2"
              style={{ alignItems: "center" }}
            >
              <span> {originalFinalTotal == serverFinalTotal ? "Total Amount:" : "New Total Amount:"}</span>

              {editingFinal ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Form.Control
                    type="number"
                    size="sm"
                    value={draftFinalTotal}
                    onChange={(e) => setDraftFinalTotal(e.target.value)}
                    style={{ width: 120 }}
                  />
                  <div
                    style={{ color: "#007a0a", cursor: "pointer" }}
                    onClick={applyManualFinalTotal}
                    title="Apply"
                  >
                    <FaCheck />
                  </div>
                  <div
                    style={{ color: "#d40000", cursor: "pointer" }}
                    onClick={() => {
                      setDraftFinalTotal(String(serverFinalTotal));
                      setEditingFinal(false);
                    }}
                    title="Cancel"
                  >
                    <ImCancelCircle />
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ color: "#007a0a" }}>
                    ₹{serverFinalTotal}
                  </strong>
                  <span
                    style={{ cursor: "pointer", color: "#7F6663" }}
                    onClick={() => {
                      setDraftFinalTotal(String(serverFinalTotal));
                      setEditingFinal(true);
                    }}
                    title="Edit final total"
                  >
                    <FaEdit />
                  </span>
                </div>
              )}
            </div>

            {/* Booking amount — 20% of final total for enquiry mode */}
            {leadMode != true && (
              <div className="d-flex justify-content-between mb-2">
                <span>Booking Amount (20% of Final Total):</span>
                <strong>₹{serverBookingAmount}</strong>
              </div>
            )}

            {/* Paid amount */}
            <div className="d-flex justify-content-between mb-2">
              <span>Amount Paid:</span>
              <strong>₹{paidAmount}</strong>
            </div>

            {/* Lead mode only — show AYTP or refund */}
            {leadMode && (
              <>
                {refundAmount > 0 ? (
                  <div className="d-flex justify-content-between mt-2">
                    <span style={{ color: "red" }}>Refund Amount:</span>
                    <strong style={{ color: "red" }}>₹{refundAmount}</strong>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between mt-2">
                    <span>Amount Yet To Paid:</span>
                    <strong>₹{amountYetToPay}</strong>
                  </div>
                )}
              </>
            )}

            {/* House painting installments — leadMode only */}
            {leadMode && isHousePaintingService && serverFinalTotal > 0 && (
              <div
                className="d-flex justify-content-between mt-2"
                style={{ fontSize: 12 }}
              >
                <span className="text-muted">Current Installment:</span>

                <strong>
                  {!firstPaid
                    ? "1st Installment (40%)"
                    : firstPaid && !secondPaid
                    ? "2nd Installment (40%)"
                    : firstPaid && secondPaid && !finalPaid
                    ? "Final Installment (20%)"
                    : "Completed"}
                </strong>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // -------------------------------------------------------
  // HANDLE SAVE
  // -------------------------------------------------------
  const handleSave = async () => {
    if (!enquiry?.bookingId) return;

    // Basic Validation
    if (!customerName.trim()) return alert("Customer name is required");
    if (!customerPhone.trim() || customerPhone.length !== 10)
      return alert("Valid phone number is required");

    if (!houseFlatNumber.trim()) return alert("House/Flat number is required");
    if (!streetArea.trim()) return alert("Street/Area is required");
    if (!city.trim()) return alert("City is required");
    if (!location?.coordinates)
      return alert("Location coordinates are required");

    if (!slotDate.trim()) return alert("Slot date is required");
    if (!slotTime.trim()) return alert("Slot time is required");

    if (services.length === 0)
      return alert("At least one service must be added.");

    for (let i = 0; i < services.length; i++) {
      const s = services[i];
      if (!s.category?.trim())
        return alert(`Service ${i + 1}: Category is required`);
      if (s.category.toLowerCase() !== "house painting") {
        if (!s.subCategory?.trim())
          return alert(`Service ${i + 1}: Subcategory is required`);
        if (!s.serviceName?.trim())
          return alert(`Service ${i + 1}: Service Name is required`);
      }
      if (s.category.toLowerCase() === "deep cleaning") {
        if (!s.price || Number(s.price) <= 0)
          return alert(
            `Service ${i + 1}: Valid price required for Deep Cleaning`
          );
      }
    }

    setSaving(true);

    try {
      const addressPayload = {
        houseFlatNumber,
        streetArea,
        landMark,
        city,
        location: {
          type: "Point",
          coordinates: location.coordinates,
        },
      };

      const slotPayload = {
        slotDate,
        slotTime,
      };

      const normalizedServices = services.map((s) => ({
        category: s.category,
        subCategory: s.subCategory,
        serviceName: s.serviceName,
        price: Number(s.price || 0),
        quantity: 1,
        teamMembersRequired: 0,
        bookingAmount: Number(s.bookingAmount || 0),
      }));

      // ------------------------------
      // build bookingDetailsPayload
      // ------------------------------
      let bookingDetailsPayload = {
        finalTotal: serverFinalTotal,
        bookingAmount: serverBookingAmount,
        paidAmount: Number(paidAmount),
      };

      if (leadMode) {
        bookingDetailsPayload.status = status;
        bookingDetailsPayload.paymentMethod = paymentMethod;
        bookingDetailsPayload.paymentStatus = paymentStatus;
        bookingDetailsPayload.amountYetToPay = amountYetToPay;

        // House painting: include site visit
        if (isHousePaintingService) {
          bookingDetailsPayload.siteVisitCharges = siteVisitCharges;
        }
      }

      const finalPayload = {
        customer: {
          name: customerName,
          phone: customerPhone,
          customerId: enquiry?.raw?.customer?.customerId,
        },
        service: normalizedServices,
        bookingDetails: bookingDetailsPayload,
        address: addressPayload,
        selectedSlot: slotPayload,
        formName,
      };
      console.log("finalPayload", finalPayload);
      const endpoint = leadMode
        ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
        : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed.");

      onUpdated?.(data.booking);
      onClose();
    } catch (err) {
      alert(err.message || "Error updating enquiry.");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------
  // MAIN JSX RENDER
  // -------------------------------------------------------
  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        size="lg"
        centered
        enforceFocus={false}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16 }}>
            {title || "Edit Enquiry"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ fontSize: 13 }}>
          {/* CUSTOMER */}
          <h6 className="mb-2">Customer *</h6>
          <Row className="g-2 mb-3">
            <Col md={6}>
              <Form.Label>Name</Form.Label>
              <Form.Control value={customerName} readOnly size="sm" />
            </Col>

            <Col md={6}>
              <Form.Label>Phone *</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text>+91</InputGroup.Text>
                <Form.Control value={customerPhone} readOnly />
              </InputGroup>
            </Col>
          </Row>

          {/* ADDRESS SECTION */}
          <div className="d-flex justify-content-between mb-2">
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
              <Form.Label>House / Flat No.</Form.Label>
              <Form.Control value={houseFlatNumber} readOnly size="sm" />
            </Col>
            <Col md={4}>
              <Form.Label>Street / Area</Form.Label>
              <Form.Control value={streetArea} readOnly size="sm" />
            </Col>
            <Col md={4}>
              <Form.Label>Landmark</Form.Label>
              <Form.Control value={landMark} readOnly size="sm" />
            </Col>
          </Row>

          <Row className="g-2 mb-3">
            <Col md={4}>
              <Form.Label>City</Form.Label>
              <Form.Control value={city} readOnly size="sm" />
            </Col>
          </Row>

          {/* SLOT */}
          <div className="d-flex justify-content-between mb-2">
            <h6 className="mb-0">Preferred Slot</h6>
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
              <Form.Label>Date</Form.Label>
              <Form.Control value={slotDate} readOnly size="sm" />
            </Col>
            <Col md={6}>
              <Form.Label>Time</Form.Label>
              <Form.Control value={slotTime} readOnly size="sm" />
            </Col>
          </Row>

          {/* SERVICES */}
          <div className="d-flex justify-content-between mb-2">
            <h6 className="mb-0">Services</h6>
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

          {services.map((s, idx) => {
            const isDC = s.category?.toLowerCase() === "deep cleaning";
            const isHP = s.category?.toLowerCase() === "house painting";

            const filteredNames = deepList
              .filter((item) => item.category === s.subCategory)
              .map((item) => ({
                label: item.name,
                value: item.name,
                price: item.totalAmount,
                bookingAmount: item.bookingAmount,
              }));

            return (
              <Row key={idx} className="g-2 mb-3 align-items-end">
                <Col md={isHP ? 4 : 3}>
                  <Form.Label className="mb-1">Category *</Form.Label>
                  <Form.Control value={s.category} disabled size="sm" />
                </Col>

                {!isHP && (
                  <Col md={3}>
                    <Form.Label className="mb-1">Subcategory</Form.Label>
                    <Form.Select
                      size="sm"
                      value={s.subCategory}
                      onChange={(e) =>
                        onServiceChange(idx, "subCategory", e.target.value)
                      }
                    >
                      <option value="">Select Category *</option>
                      {[...new Set(deepList.map((i) => i.category))].map(
                        (cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        )
                      )}
                    </Form.Select>
                  </Col>
                )}

                {!isHP && (
                  <Col md={3}>
                    <Form.Label className="mb-1">Service Name *</Form.Label>
                    <Form.Select
                      size="sm"
                      value={s.serviceName}
                      onChange={(e) => {
                        handleServiceSelection(idx, e.target.value);
                      }}
                    >
                      <option value="">Select Service *</option>
                      {filteredNames.map((i) => (
                        <option key={i.value} value={i.value}>
                          {i.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                )}

                <Col md={isHP ? 4 : 2}>
                  <Form.Label className="mb-1">
                    {isDC ? "Price (₹)" : "Site Visit (₹)"}
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    value={s.price}
                    onChange={(e) =>
                      onServiceChange(idx, "price", e.target.value)
                    }
                    disabled={true}
                  />
                </Col>

                {!isHP && (
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

          <Row className="mt-3">
            <Col md={3}>
              <Form.Label>Form Name *</Form.Label>
              <Form.Control value={formName} size="sm" disabled />
            </Col>
          </Row>
        </Modal.Body>

        {/* PAYMENT SUMMARY */}
        {PaymentSummarySection()}

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
          initialLatLng={
            location
              ? { lat: location.coordinates[1], lng: location.coordinates[0] }
              : undefined
          }
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

// 10-12-2025 working
// import React, { useEffect, useState, useRef } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { BASE_URL } from "../utils/config";
// import { ImCancelCircle } from "react-icons/im";
// import { FaCheck } from "react-icons/fa6";
// import { FaEdit } from "react-icons/fa";

// const normalizePhone = (s = "") =>
//   s.replace(/[^\d]/g, "").replace(/^91/, "");

// const EditEnquiryModal = ({
//   show,
//   onClose,
//   enquiry,
//   onUpdated,
//   title,
//   leadMode = false,
// }) => {
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
//   const [initialServiceCount, setInitialServiceCount] = useState(0);

//   const [status, setStatus] = useState("Pending");
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paymentStatus, setPaymentStatus] = useState("Unpaid");

//   const [paidAmount, setPaidAmount] = useState("");

//   const [deepList, setDeepList] = useState([]);

//   const [editingFinal, setEditingFinal] = useState(false);
//   const [draftFinalTotal, setDraftFinalTotal] = useState("");

//   const [serverFinalTotal, setServerFinalTotal] = useState(0);
//   const [originalFinalTotal, setOriginalFinalTotal] = useState(0);

//   const [serverBookingAmount, setServerBookingAmount] = useState(0);

//   // AYTP + refund for lead mode only
//   const [amountYetToPay, setAmountYetToPay] = useState(0);
//   const [refundAmount, setRefundAmount] = useState(0);

//   // House painting fields
//   const [siteVisitCharges, setSiteVisitCharges] = useState(0);
//   const [firstPaid, setFirstPaid] = useState(false);
//   const [secondPaid, setSecondPaid] = useState(false);
//   const [finalPaid, setFinalPaid] = useState(false);

//   const [firstAmount, setFirstAmount] = useState(0);
//   const [secondAmount, setSecondAmount] = useState(0);
//   const [finalAmount, setFinalAmount] = useState(0);

//   const isHousePaintingService = services.some(
//     (s) => s.category?.toLowerCase() === "house painting"
//   );

//   // Refs to track service changes
//   const serviceUpdatesRef = useRef(new Set());
//   const initialLoadRef = useRef(true);

//   // -------------------------------------------
//   // LOAD ENQUIRY — restore EXACT old lead-mode AYTP logic
//   // -------------------------------------------
//   useEffect(() => {
//     if (!enquiry?.raw) return;

//     try {
//       const {
//         customer,
//         address,
//         selectedSlot,
//         service,
//         bookingDetails,
//         formName: fm,
//       } = enquiry.raw;

//       setCustomerName(customer?.name || "");
//       setCustomerPhone(
//         normalizePhone(enquiry?.contact) || customer?.phone || ""
//       );
//       setFormName(fm || enquiry?.formName || "");

//       setHouseFlatNumber(address?.houseFlatNumber || "");
//       setStreetArea(address?.streetArea || "");
//       setLandMark(address?.landMark || "");
//       setCity(address?.city || "");
//       setLocation(address?.location || null);

//       setSlotDate(selectedSlot?.slotDate || "");
//       setSlotTime(selectedSlot?.slotTime || "");

//       // Load services
//       const loadedServices = (service || []).map((s) => {
//         const raw = s || {};
//         const priceVal =
//           raw.price ?? raw.totalAmount ?? raw.amount ?? "";
//         return {
//           category: raw.category || "Deep Cleaning",
//           subCategory: raw.subCategory || "",
//           serviceName: raw.serviceName || raw.name || "",
//           price: priceVal !== undefined ? String(priceVal) : "",
//           bookingAmount: raw.bookingAmount || "",
//         };
//       });

//       setServices(loadedServices);
//       setInitialServiceCount(service?.length || 0);

//       // Backend totals
//       const backendOriginal = Number(
//         bookingDetails?.originalTotalAmount || 0
//       );
//       const backendFinal = Number(
//         bookingDetails?.finalTotal ??
//         bookingDetails?.originalTotalAmount ??
//         0
//       );
//       const backendPaid = Number(bookingDetails?.paidAmount || 0);
//       const backendBooking = Number(
//         bookingDetails?.bookingAmount || 0
//       );

//       setOriginalFinalTotal(backendOriginal);
//       setServerFinalTotal(backendFinal);
//       setDraftFinalTotal(String(backendFinal));
//       setPaidAmount(String(backendPaid));
//       setServerBookingAmount(backendBooking);

//       // House painting information
//       const isHP = (service || []).some(
//         (it) => it.category?.toLowerCase() === "house painting"
//       );
//       const svc = Number(bookingDetails?.siteVisitCharges || 0);
//       setSiteVisitCharges(svc);

//       if (isHP) {
//         const fPaid = bookingDetails?.firstPayment?.status === "paid";
//         const sPaid = bookingDetails?.secondPayment?.status === "paid";
//         const fnPaid = bookingDetails?.finalPayment?.status === "paid";

//         setFirstPaid(!!fPaid);
//         setSecondPaid(!!sPaid);
//         setFinalPaid(!!fnPaid);

//         setFirstAmount(
//           Number(bookingDetails?.firstPayment?.amount || 0)
//         );
//         setSecondAmount(
//           Number(bookingDetails?.secondPayment?.amount || 0)
//         );
//         setFinalAmount(
//           Number(bookingDetails?.finalPayment?.amount || 0)
//         );
//       }

//       // ---------------------------------------------------
//       // AYTP CALCULATION (RESTORED) — ONLY FOR LEAD MODE
//       // ---------------------------------------------------
//       if (leadMode) {
//         if (isHP) {
//           // House painting installment logic
//           const FT = backendFinal;

//           if (!firstPaid) {
//             setAmountYetToPay(Math.round(FT * 0.4));
//             setRefundAmount(0);
//           } else if (firstPaid && !secondPaid) {
//             setAmountYetToPay(Math.round(FT * 0.4));
//             setRefundAmount(0);
//           } else if (firstPaid && secondPaid && !finalPaid) {
//             setAmountYetToPay(Math.round(FT * 0.2));
//             setRefundAmount(0);
//           } else {
//             const totalPaid =
//               firstAmount + secondAmount + finalAmount;
//             const diff = FT - totalPaid;
//             if (diff < 0) {
//               setRefundAmount(Math.abs(diff));
//               setAmountYetToPay(0);
//             } else {
//               setRefundAmount(0);
//               setAmountYetToPay(diff);
//             }
//           }
//         } else {
//           // Deep cleaning AYTP = finalTotal - paid
//           const aytp = backendFinal - backendPaid;
//           if (aytp < 0) {
//             setRefundAmount(Math.abs(aytp));
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(aytp);
//           }
//         }
//       }
//     } catch (err) {
//       console.error("Load enquiry error:", err);
//     }

//     // Reset initial load flag after first load
//     if (initialLoadRef.current) {
//       initialLoadRef.current = false;
//     }
//   }, [enquiry, leadMode]);

//   // ---------------------------------------
//   // Deep cleaning list fetch
//   // ---------------------------------------
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(
//           `${BASE_URL}/deeppackage/deep-cleaning-packages`
//         );
//         const data = await res.json();
//         setDeepList(data?.data || []);
//       } catch (err) {
//         console.error("Error fetching deep packages:", err);
//         setDeepList([]);
//       }
//     };
//     fetchData();
//   }, []);

//   // ---------------------------------------
//   // Helper: compute house painting display amounts (used in leadMode)
//   // ---------------------------------------
//   const computeHousePaintingDisplay = (finalTotalValue, siteVisitChargesValue, flagsAndAmounts) => {
//     const FT = Number(finalTotalValue || 0);
//     const SV = Number(siteVisitChargesValue || 0);

//     const firstPaidFlag = !!flagsAndAmounts.firstPaid;
//     const secondPaidFlag = !!flagsAndAmounts.secondPaid;
//     const finalPaidFlag = !!flagsAndAmounts.finalPaid;

//     const fAmt = Number(flagsAndAmounts.firstAmount || 0);
//     const sAmt = Number(flagsAndAmounts.secondAmount || 0);
//     const fnAmt = Number(flagsAndAmounts.finalAmount || 0);

//     const slab40 = Math.round(FT * 0.4);
//     const slab20 = Math.round(FT * 0.2);

//     let paidDisplay = 0;
//     let aytp = 0;
//     let refund = 0;

//     if (!firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = SV;
//       aytp = slab40;
//     } else if (firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt;
//       aytp = slab40;
//     } else if (firstPaidFlag && secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt + sAmt;
//       aytp = slab20;
//     } else if (firstPaidFlag && secondPaidFlag && finalPaidFlag) {
//       paidDisplay = fAmt + sAmt + fnAmt;
//       aytp = 0;
//       if (paidDisplay > FT) refund = paidDisplay - FT;
//     } else {
//       paidDisplay = SV;
//       aytp = slab40;
//     }

//     return { paidDisplay, aytp, refund, slab40, slab20 };
//   };

//   // ---------------------------------------
//   // ADD SERVICE - SIMPLE ADDITION
//   // ---------------------------------------
//   const addService = () => {
//     setServices((prev) => {
//       const next = [
//         ...prev,
//         {
//           category: "Deep Cleaning",
//           subCategory: "",
//           serviceName: "",
//           price: "",
//           bookingAmount: "",
//         },
//       ];
//       return next;
//     });
//   };

//   // ---------------------------------------
//   // REMOVE SERVICE
//   // ---------------------------------------
//   const removeService = (idx) => {
//     if (services.length === 1) {
//       alert("At least one service must remain in the booking.");
//       return;
//     }

//     const removedPrice = Number(services[idx]?.price || 0);

//     setServices((prev) => {
//       const next = prev.filter((_, i) => i !== idx);

//       // If house painting, we don't change finalTotal here
//       const hp = next.some((s) => (s.category || "").toLowerCase() === "house painting");
//       if (hp) {
//         return next;
//       }

//       // Update finalTotal
//       setServerFinalTotal((prevTotal) => {
//         const newTotal = Math.max(0, Number(prevTotal || 0) - removedPrice);

//         // If we're in leadMode, recalc AYTP/refund
//         if (leadMode) {
//           const aytp = newTotal - Number(paidAmount || 0);
//           if (aytp < 0) {
//             setRefundAmount(Math.abs(aytp));
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(aytp);
//           }
//         }

//         return newTotal;
//       });

//       return next;
//     });
//   };

//   // ---------------------------------------
//   // ON SERVICE CHANGE - FIXED VERSION
//   // This now handles price changes correctly without double counting
//   // ---------------------------------------
//   const onServiceChange = (idx, field, value, isFromServiceSelection = false) => {
//     setServices((prev) => {
//       const copy = [...prev];
//       const oldPrice = Number(copy[idx]?.price || 0);

//       // Update the field
//       copy[idx] = {
//         ...copy[idx],
//         [field]: field === "price" && value === "" ? "" : value,
//       };

//       // Handle price field changes
//       if (field === "price") {
//         const newPrice = Number(value || 0);

//         // Calculate the actual difference
//         const priceDifference = newPrice - oldPrice;

//         // Only update if there's a change AND we're not in the initial load
//         if (priceDifference !== 0 && !initialLoadRef.current) {
//           setServerFinalTotal((prevTotal) => {
//             const newTotal = Number(prevTotal || 0) + priceDifference;

//             // If leadMode, recalc AYTP/refund
//             if (leadMode) {
//               const hpFlag = copy.some((s) => (s.category || "").toLowerCase() === "house painting");
//               if (!hpFlag) {
//                 const aytp = newTotal - Number(paidAmount || 0);
//                 if (aytp < 0) {
//                   setRefundAmount(Math.abs(aytp));
//                   setAmountYetToPay(0);
//                 } else {
//                   setRefundAmount(0);
//                   setAmountYetToPay(aytp);
//                 }
//               }
//             }

//             return newTotal;
//           });
//         }
//       }

//       return copy;
//     });
//   };

//   // ---------------------------------------
//   // HANDLE SERVICE SELECTION FROM DROPDOWN
//   // This ensures price is only added once when service is selected
//   // ---------------------------------------
//   const handleServiceSelection = (idx, selectedServiceName) => {
//     // Find the selected service from deepList
//     const selectedService = deepList.find(item =>
//       item.name === selectedServiceName ||
//       item.serviceName === selectedServiceName
//     );

//     if (selectedService) {
//       const newPrice = Number(selectedService.totalAmount || selectedService.price || 0);
//       const bookingAmount = Number(selectedService.bookingAmount || 0);

//       // Get current service price before update
//       const currentPrice = Number(services[idx]?.price || 0);

//       // Calculate the difference
//       const priceDifference = newPrice - currentPrice;

//       // Update the service
//       setServices((prev) => {
//         const copy = [...prev];
//         copy[idx] = {
//           ...copy[idx],
//           serviceName: selectedServiceName,
//           price: String(newPrice),
//           bookingAmount: String(bookingAmount),
//         };
//         return copy;
//       });

//       // Only update serverFinalTotal if there's a price difference AND we're not in initial load
//       if (priceDifference !== 0 && !initialLoadRef.current) {
//         setServerFinalTotal((prevTotal) => {
//           const newTotal = Number(prevTotal || 0) + priceDifference;

//           // If leadMode, recalc AYTP/refund
//           if (leadMode) {
//             const hpFlag = services.some((s) => (s.category || "").toLowerCase() === "house painting");
//             if (!hpFlag) {
//               const aytp = newTotal - Number(paidAmount || 0);
//               if (aytp < 0) {
//                 setRefundAmount(Math.abs(aytp));
//                 setAmountYetToPay(0);
//               } else {
//                 setRefundAmount(0);
//                 setAmountYetToPay(aytp);
//               }
//             }
//           }

//           return newTotal;
//         });
//       }
//     }
//   };

//   // Effect to handle AYTP calculation for non-house-painting services
//   useEffect(() => {
//     if (!services || services.length === 0 || initialLoadRef.current) return;

//     // If house painting service present, AYTP logic uses slabs, handled in below effect
//     if (!leadMode) return;

//     // For leadMode and non-house-painting, recalc AYTP as finalTotal - paid
//     const hpFlag = services.some((s) => (s.category || "").toLowerCase() === "house painting");
//     if (!hpFlag) {
//       const aytp = Number(serverFinalTotal || 0) - Number(paidAmount || 0);
//       if (aytp < 0) {
//         setRefundAmount(Math.abs(aytp));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(aytp);
//       }
//     }
//   }, [services, leadMode, serverFinalTotal, paidAmount]);

//   // ---------------------------------------
//   // House painting AYTP recalculation for lead mode when relevant values change
//   // ---------------------------------------
//   useEffect(() => {
//     if (!leadMode || initialLoadRef.current) return;

//     const hpFlag = services.some((s) => (s.category || "").toLowerCase() === "house painting");
//     if (!hpFlag) return;

//     // Use computeHousePaintingDisplay to set amountYetToPay and refund
//     const computed = computeHousePaintingDisplay(serverFinalTotal, siteVisitCharges, {
//       firstPaid,
//       secondPaid,
//       finalPaid,
//       firstAmount,
//       secondAmount,
//       finalAmount,
//     });

//     if (computed.refund > 0) {
//       setRefundAmount(computed.refund);
//       setAmountYetToPay(0);
//     } else {
//       setRefundAmount(0);
//       setAmountYetToPay(computed.aytp);
//     }
//   }, [
//     leadMode,
//     services,
//     serverFinalTotal,
//     siteVisitCharges,
//     firstPaid,
//     secondPaid,
//     finalPaid,
//     firstAmount,
//     secondAmount,
//     finalAmount,
//   ]);

//   // ---------------------------------------
//   // Manual Final Total edit apply (when admin edits final total via input)
//   // ---------------------------------------
//   const applyManualFinalTotal = () => {
//     const manualValue = Number(draftFinalTotal || 0);

//     if (!Number.isFinite(manualValue) || manualValue < 0) {
//       alert("Final total must be a positive number");
//       return;
//     }

//     setServerFinalTotal(manualValue);

//     // If leadMode, recalc AYTP/refund
//     if (leadMode) {
//       const hpFlag = services.some((s) => (s.category || "").toLowerCase() === "house painting");
//       if (!hpFlag) {
//         const aytp = manualValue - Number(paidAmount || 0);
//         if (aytp < 0) {
//           setRefundAmount(Math.abs(aytp));
//           setAmountYetToPay(0);
//         } else {
//           setRefundAmount(0);
//           setAmountYetToPay(aytp);
//         }
//       } else {
//         const computed = computeHousePaintingDisplay(manualValue, siteVisitCharges, {
//           firstPaid,
//           secondPaid,
//           finalPaid,
//           firstAmount,
//           secondAmount,
//           finalAmount,
//         });
//         if (computed.refund > 0) {
//           setRefundAmount(computed.refund);
//           setAmountYetToPay(0);
//         } else {
//           setRefundAmount(0);
//           setAmountYetToPay(computed.aytp);
//         }
//       }
//     }

//     setEditingFinal(false);
//   };

//   // ---------------------------------------
//   // Address & Slot handlers (used by address/time modals)
//   // ---------------------------------------
//   const handleAddressSelect = (addressObj) => {
//     if (!addressObj) return;
//     const { houseFlatNumber, streetArea, landmark, latLng } = addressObj;
//     setHouseFlatNumber(houseFlatNumber || "");
//     setStreetArea(streetArea || "");
//     setLandMark(landmark || "");
//     if (latLng && latLng.lat != null && latLng.lng != null) {
//       setLocation({
//         type: "Point",
//         coordinates: [latLng.lng, latLng.lat],
//       });
//     }
//   };

//   const handleSlotSelect = ({ slotDate: sd, slotTime: st }) => {
//     if (sd) setSlotDate(sd);
//     if (st) setSlotTime(st);
//   };

//   // ---------------------------------------
//   // Local UI flags for address/time modals
//   // ---------------------------------------
//   const [showAddressModal, setShowAddressModal] = useState(false);
//   const [showTimeModal, setShowTimeModal] = useState(false);

//   // ---------------------------------------
//   // Payment Summary UI (leadMode shows AYTP/refund; enquiry hides AYTP/refund)
//   // ---------------------------------------
//   const PaymentSummarySection = () => {
//     return (
//       <div
//         className="mt-3 p-3"
//         style={{
//           background: "#f8f9fa",
//           borderRadius: 8,
//           border: "1px solid #e3e3e3",
//         }}
//       >
//         <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

//         {/* Show original + change if changed */}
//         {originalFinalTotal > 0 && serverFinalTotal !== originalFinalTotal && (
//           <>
//             <div className="d-flex justify-content-between mb-1">
//               <span>Original Amount:</span>
//               <strong>₹{originalFinalTotal}</strong>
//             </div>

//             <div className="d-flex justify-content-between mb-2">
//               <span>Change:</span>
//               {serverFinalTotal > originalFinalTotal ? (
//                 <strong style={{ color: "green" }}>
//                   +₹{serverFinalTotal - originalFinalTotal}
//                 </strong>
//               ) : (
//                 <strong style={{ color: "red" }}>
//                   -₹{originalFinalTotal - serverFinalTotal}
//                 </strong>
//               )}
//             </div>
//           </>
//         )}

//         {/* House painting enquiry: site visit only */}
//         {isHousePaintingService && !leadMode ? (
//           <div className="d-flex justify-content-between mb-2">
//             <span>Site Visit Charges:</span>
//             <strong>₹{siteVisitCharges}</strong>
//           </div>
//         ) : (
//           <>
//             {/* Final Total display & manual edit */}
//             <div
//               className="d-flex justify-content-between mb-2"
//               style={{ alignItems: "center" }}
//             >
//               <span>Final Total:</span>

//               {editingFinal ? (
//                 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <Form.Control
//                     type="number"
//                     size="sm"
//                     value={draftFinalTotal}
//                     onChange={(e) => setDraftFinalTotal(e.target.value)}
//                     style={{ width: 120 }}
//                   />
//                   <div
//                     style={{ color: "#007a0a", cursor: "pointer" }}
//                     onClick={applyManualFinalTotal}
//                     title="Apply"
//                   >
//                     <FaCheck />
//                   </div>
//                   <div
//                     style={{ color: "#d40000", cursor: "pointer" }}
//                     onClick={() => {
//                       setDraftFinalTotal(String(serverFinalTotal));
//                       setEditingFinal(false);
//                     }}
//                     title="Cancel"
//                   >
//                     <ImCancelCircle />
//                   </div>
//                 </div>
//               ) : (
//                 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <strong style={{ color: "#007a0a" }}>₹{serverFinalTotal}</strong>
//                   <span
//                     style={{ cursor: "pointer", color: "#7F6663" }}
//                     onClick={() => {
//                       setDraftFinalTotal(String(serverFinalTotal));
//                       setEditingFinal(true);
//                     }}
//                     title="Edit final total"
//                   >
//                     <FaEdit />
//                   </span>
//                 </div>
//               )}
//             </div>

//             {/* Booking amount — always backend value, never recalculated in enquiry */}
//            {leadMode != true && <div className="d-flex justify-content-between mb-2">
//               <span>Booking Amount:</span>
//               <strong>₹{serverBookingAmount}</strong>
//             </div>}

//             {/* Paid amount */}
//             <div className="d-flex justify-content-between mb-2">
//               <span>Total Paid:</span>
//               <strong>₹{paidAmount}</strong>
//             </div>

//             {/* Lead mode only — show AYTP or refund */}
//             {leadMode && (
//               <>
//                 {refundAmount > 0 ? (
//                   <div className="d-flex justify-content-between mt-2">
//                     <span style={{ color: "red" }}>Refund Amount:</span>
//                     <strong style={{ color: "red" }}>₹{refundAmount}</strong>
//                   </div>
//                 ) : (
//                   <div className="d-flex justify-content-between mt-2">
//                     <span>Amount Yet To Pay:</span>
//                     <strong>₹{amountYetToPay}</strong>
//                   </div>
//                 )}
//               </>
//             )}

//             {/* House painting installments — leadMode only */}
//             {leadMode && isHousePaintingService && serverFinalTotal > 0 && (
//               <div
//                 className="d-flex justify-content-between mt-2"
//                 style={{ fontSize: 12 }}
//               >
//                 <span className="text-muted">Current Installment:</span>

//                 <strong>
//                   {!firstPaid
//                     ? "1st Installment (40%)"
//                     : firstPaid && !secondPaid
//                     ? "2nd Installment (40%)"
//                     : firstPaid && secondPaid && !finalPaid
//                     ? "Final Installment (20%)"
//                     : "Completed"}
//                 </strong>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     );
//   };

//   // -------------------------------------------------------
//   // HANDLE SAVE
//   // -------------------------------------------------------
//   const handleSave = async () => {
//     if (!enquiry?.bookingId) return;

//     // Basic Validation
//     if (!customerName.trim()) return alert("Customer name is required");
//     if (!customerPhone.trim() || customerPhone.length !== 10)
//       return alert("Valid phone number is required");

//     if (!houseFlatNumber.trim()) return alert("House/Flat number is required");
//     if (!streetArea.trim()) return alert("Street/Area is required");
//     if (!city.trim()) return alert("City is required");
//     if (!location?.coordinates)
//       return alert("Location coordinates are required");

//     if (!slotDate.trim()) return alert("Slot date is required");
//     if (!slotTime.trim()) return alert("Slot time is required");

//     if (services.length === 0)
//       return alert("At least one service must be added.");

//     for (let i = 0; i < services.length; i++) {
//       const s = services[i];
//       if (!s.category?.trim())
//         return alert(`Service ${i + 1}: Category is required`);
//       if (s.category.toLowerCase() !== "house painting") {
//         if (!s.subCategory?.trim())
//           return alert(`Service ${i + 1}: Subcategory is required`);
//         if (!s.serviceName?.trim())
//           return alert(`Service ${i + 1}: Service Name is required`);
//       }
//       if (!s.price || Number(s.price) <= 0)
//         return alert(`Service ${i + 1}: Valid price required`);
//     }

//     setSaving(true);

//     try {
//       const addressPayload = {
//         houseFlatNumber,
//         streetArea,
//         landMark,
//         city,
//         location: {
//           type: "Point",
//           coordinates: location.coordinates,
//         },
//       };

//       const slotPayload = {
//         slotDate,
//         slotTime,
//       };

//       const normalizedServices = services.map((s) => ({
//         category: s.category,
//         subCategory: s.subCategory,
//         serviceName: s.serviceName,
//         price: Number(s.price || 0),
//         quantity: 1,
//         teamMembersRequired: 0,
//         bookingAmount: Number(s.bookingAmount || 0),
//       }));

//       // ------------------------------
//       // build bookingDetailsPayload
//       // ------------------------------
//       let bookingDetailsPayload = {
//         finalTotal: serverFinalTotal,
//         bookingAmount: serverBookingAmount,
//         paidAmount: Number(paidAmount),
//       };

//       if (leadMode) {
//         bookingDetailsPayload.status = status;
//         bookingDetailsPayload.paymentMethod = paymentMethod;
//         bookingDetailsPayload.paymentStatus = paymentStatus;

//         // House painting: include site visit
//         if (isHousePaintingService) {
//           bookingDetailsPayload.siteVisitCharges = siteVisitCharges;
//         }
//       }

//       const finalPayload = {
//         customer: {
//           name: customerName,
//           phone: customerPhone,
//           customerId: enquiry?.raw?.customer?.customerId,
//         },
//         service: normalizedServices,
//         bookingDetails: bookingDetailsPayload,
//         address: addressPayload,
//         selectedSlot: slotPayload,
//         formName,
//       };

//       const endpoint = leadMode
//         ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
//         : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

//       const res = await fetch(endpoint, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(finalPayload),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.message || "Update failed.");

//       onUpdated?.(data.booking);
//       onClose();
//     } catch (err) {
//       alert(err.message || "Error updating enquiry.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // -------------------------------------------------------
//   // MAIN JSX RENDER
//   // -------------------------------------------------------
//   return (
//     <>
//       <Modal
//         show={show}
//         onHide={onClose}
//         size="lg"
//         centered
//         enforceFocus={false}
//       >
//         <Modal.Header closeButton>
//           <Modal.Title style={{ fontSize: 16 }}>
//             {title || "Edit Enquiry"}
//           </Modal.Title>
//         </Modal.Header>

//         <Modal.Body style={{ fontSize: 13 }}>
//           {/* CUSTOMER */}
//           <h6 className="mb-2">Customer *</h6>
//           <Row className="g-2 mb-3">
//             <Col md={6}>
//               <Form.Label>Name</Form.Label>
//               <Form.Control value={customerName} readOnly size="sm" />
//             </Col>

//             <Col md={6}>
//               <Form.Label>Phone *</Form.Label>
//               <InputGroup size="sm">
//                 <InputGroup.Text>+91</InputGroup.Text>
//                 <Form.Control value={customerPhone} readOnly />
//               </InputGroup>
//             </Col>
//           </Row>

//           {/* ADDRESS SECTION */}
//           <div className="d-flex justify-content-between mb-2">
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
//               <Form.Label>House / Flat No.</Form.Label>
//               <Form.Control value={houseFlatNumber} readOnly size="sm" />
//             </Col>
//             <Col md={4}>
//               <Form.Label>Street / Area</Form.Label>
//               <Form.Control value={streetArea} readOnly size="sm" />
//             </Col>
//             <Col md={4}>
//               <Form.Label>Landmark</Form.Label>
//               <Form.Control value={landMark} readOnly size="sm" />
//             </Col>
//           </Row>

//           <Row className="g-2 mb-3">
//             <Col md={4}>
//               <Form.Label>City</Form.Label>
//               <Form.Control value={city} readOnly size="sm" />
//             </Col>
//           </Row>

//           {/* SLOT */}
//           <div className="d-flex justify-content-between mb-2">
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
//               <Form.Control value={slotDate} readOnly size="sm" />
//             </Col>
//             <Col md={6}>
//               <Form.Label>Time</Form.Label>
//               <Form.Control value={slotTime} readOnly size="sm" />
//             </Col>
//           </Row>

//           {/* SERVICES */}
//           <div className="d-flex justify-content-between mb-2">
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

//           {services.map((s, idx) => {
//             const isDC = s.category?.toLowerCase() === "deep cleaning";
//             const isHP = s.category?.toLowerCase() === "house painting";

//             const filteredNames = deepList
//               .filter((item) => item.category === s.subCategory)
//               .map((item) => ({
//                 label: item.name,
//                 value: item.name,
//                 price: item.totalAmount,
//                 bookingAmount: item.bookingAmount,
//               }));

//             return (
//               <Row key={idx} className="g-2 mb-3 align-items-end">
//                 <Col md={isHP ? 4 : 3}>
//                   <Form.Label className="mb-1">Category *</Form.Label>
//                   <Form.Control value={s.category} disabled size="sm" />
//                 </Col>

//                 {!isHP && (
//                   <Col md={3}>
//                     <Form.Label className="mb-1">Subcategory</Form.Label>
//                     <Form.Select
//                       size="sm"
//                       value={s.subCategory}
//                       onChange={(e) =>
//                         onServiceChange(idx, "subCategory", e.target.value)
//                       }
//                     >
//                       <option value="">Select Category *</option>
//                       {[...new Set(deepList.map((i) => i.category))].map(
//                         (cat) => (
//                           <option key={cat} value={cat}>
//                             {cat}
//                           </option>
//                         )
//                       )}
//                     </Form.Select>
//                   </Col>
//                 )}

//                 {!isHP && (
//                   <Col md={3}>
//                     <Form.Label className="mb-1">Service Name *</Form.Label>
//                     <Form.Select
//                       size="sm"
//                       value={s.serviceName}
//                       onChange={(e) => {
//                         handleServiceSelection(idx, e.target.value);
//                       }}
//                     >
//                       <option value="">Select Service *</option>
//                       {filteredNames.map((i) => (
//                         <option key={i.value} value={i.value}>
//                           {i.label}
//                         </option>
//                       ))}
//                     </Form.Select>
//                   </Col>
//                 )}

//                 <Col md={isHP ? 4 : 2}>
//                   <Form.Label className="mb-1">
//                     {isDC ? "Price (₹)" : "Site Visit (₹)"}
//                   </Form.Label>
//                   <Form.Control
//                     size="sm"
//                     type="number"
//                     value={s.price}
//                     onChange={(e) =>
//                       onServiceChange(idx, "price", e.target.value)
//                     }
//                     disabled={true}
//                   />
//                 </Col>

//                 {!isHP && (
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

//           <Row className="mt-3">
//             <Col md={3}>
//               <Form.Label>Form Name *</Form.Label>
//               <Form.Control value={formName} size="sm" disabled />
//             </Col>
//           </Row>
//         </Modal.Body>

//         {/* PAYMENT SUMMARY */}
//         {PaymentSummarySection()}

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
//           initialLatLng={
//             location
//               ? { lat: location.coordinates[1], lng: location.coordinates[0] }
//               : undefined
//           }
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

// -09-12
// import React, { useEffect, useState } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { BASE_URL } from "../utils/config";
// import { ImCancelCircle } from "react-icons/im";
// import { FaCheck } from "react-icons/fa6";
// import { FaEdit } from "react-icons/fa";

// const normalizePhone = (s = "") =>
//   s.replace(/[^\d]/g, "").replace(/^91/, "");

// const EditEnquiryModal = ({
//   show,
//   onClose,
//   enquiry,
//   onUpdated,
//   title,
//   leadMode = false,
// }) => {
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
//   const [initialServiceCount, setInitialServiceCount] = useState(0);

//   const [status, setStatus] = useState("Pending");
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paymentStatus, setPaymentStatus] = useState("Unpaid");

//   const [paidAmount, setPaidAmount] = useState("");

//   const [deepList, setDeepList] = useState([]);

//   const [editingFinal, setEditingFinal] = useState(false);
//   const [draftFinalTotal, setDraftFinalTotal] = useState("");

//   const [serverFinalTotal, setServerFinalTotal] = useState(0);
//   const [originalFinalTotal, setOriginalFinalTotal] = useState(0);

//   const [serverBookingAmount, setServerBookingAmount] = useState(0);

//   // AYTP + refund for lead mode only
//   const [amountYetToPay, setAmountYetToPay] = useState(0);
//   const [refundAmount, setRefundAmount] = useState(0);

//   // House painting fields
//   const [siteVisitCharges, setSiteVisitCharges] = useState(0);
//   const [firstPaid, setFirstPaid] = useState(false);
//   const [secondPaid, setSecondPaid] = useState(false);
//   const [finalPaid, setFinalPaid] = useState(false);

//   const [firstAmount, setFirstAmount] = useState(0);
//   const [secondAmount, setSecondAmount] = useState(0);
//   const [finalAmount, setFinalAmount] = useState(0);

//   const isHousePaintingService = services.some(
//     (s) => s.category?.toLowerCase() === "house painting"
//   );

//   // -------------------------------------------
//   // LOAD ENQUIRY — restore EXACT old lead-mode AYTP logic
//   // -------------------------------------------
//   useEffect(() => {
//     if (!enquiry?.raw) return;

//     try {
//       const {
//         customer,
//         address,
//         selectedSlot,
//         service,
//         bookingDetails,
//         formName: fm,
//       } = enquiry.raw;

//       setCustomerName(customer?.name || "");
//       setCustomerPhone(
//         normalizePhone(enquiry?.contact) || customer?.phone || ""
//       );
//       setFormName(fm || enquiry?.formName || "");

//       setHouseFlatNumber(address?.houseFlatNumber || "");
//       setStreetArea(address?.streetArea || "");
//       setLandMark(address?.landMark || "");
//       setCity(address?.city || "");
//       setLocation(address?.location || null);

//       setSlotDate(selectedSlot?.slotDate || "");
//       setSlotTime(selectedSlot?.slotTime || "");

//       // Load services
//       setServices(
//         (service || []).map((s) => {
//           const raw = s || {};
//           const priceVal =
//             raw.price ?? raw.totalAmount ?? raw.amount ?? "";
//           return {
//             category: raw.category || "Deep Cleaning",
//             subCategory: raw.subCategory || "",
//             serviceName: raw.serviceName || raw.name || "",
//             price: priceVal !== undefined ? String(priceVal) : "",
//             bookingAmount: raw.bookingAmount || "",
//           };
//         })
//       );

//       setInitialServiceCount(service?.length || 0);

//       // Backend totals
//       const backendOriginal = Number(
//         bookingDetails?.originalTotalAmount || 0
//       );
//       const backendFinal = Number(
//         bookingDetails?.finalTotal ??
//         bookingDetails?.originalTotalAmount ??
//         0
//       );
//       const backendPaid = Number(bookingDetails?.paidAmount || 0);
//       const backendBooking = Number(
//         bookingDetails?.bookingAmount || 0
//       );

//       setOriginalFinalTotal(backendOriginal);
//       setServerFinalTotal(backendFinal);
//       setDraftFinalTotal(String(backendFinal));
//       setPaidAmount(String(backendPaid));
//       setServerBookingAmount(backendBooking);

//       // House painting information
//       const isHP = (service || []).some(
//         (it) => it.category?.toLowerCase() === "house painting"
//       );
//       const svc = Number(bookingDetails?.siteVisitCharges || 0);
//       setSiteVisitCharges(svc);

//       if (isHP) {
//         const fPaid = bookingDetails?.firstPayment?.status === "paid";
//         const sPaid = bookingDetails?.secondPayment?.status === "paid";
//         const fnPaid = bookingDetails?.finalPayment?.status === "paid";

//         setFirstPaid(!!fPaid);
//         setSecondPaid(!!sPaid);
//         setFinalPaid(!!fnPaid);

//         setFirstAmount(
//           Number(bookingDetails?.firstPayment?.amount || 0)
//         );
//         setSecondAmount(
//           Number(bookingDetails?.secondPayment?.amount || 0)
//         );
//         setFinalAmount(
//           Number(bookingDetails?.finalPayment?.amount || 0)
//         );
//       }

//       // ---------------------------------------------------
//       // AYTP CALCULATION (RESTORED) — ONLY FOR LEAD MODE
//       // ---------------------------------------------------
//       if (leadMode) {
//         if (isHP) {
//           // House painting installment logic
//           const FT = backendFinal;

//           if (!firstPaid) {
//             setAmountYetToPay(Math.round(FT * 0.4));
//             setRefundAmount(0);
//           } else if (firstPaid && !secondPaid) {
//             setAmountYetToPay(Math.round(FT * 0.4));
//             setRefundAmount(0);
//           } else if (firstPaid && secondPaid && !finalPaid) {
//             setAmountYetToPay(Math.round(FT * 0.2));
//             setRefundAmount(0);
//           } else {
//             const totalPaid =
//               firstAmount + secondAmount + finalAmount;
//             const diff = FT - totalPaid;
//             if (diff < 0) {
//               setRefundAmount(Math.abs(diff));
//               setAmountYetToPay(0);
//             } else {
//               setRefundAmount(0);
//               setAmountYetToPay(diff);
//             }
//           }
//         } else {
//           // Deep cleaning AYTP = finalTotal - paid
//           const aytp = backendFinal - backendPaid;
//           if (aytp < 0) {
//             setRefundAmount(Math.abs(aytp));
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(aytp);
//           }
//         }
//       }
//     } catch (err) {
//       console.error("Load enquiry error:", err);
//     }
//   }, [enquiry, leadMode]);
//   // ---------------------------------------
//   // Deep cleaning list fetch
//   // ---------------------------------------
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(
//           `${BASE_URL}/deeppackage/deep-cleaning-packages`
//         );
//         const data = await res.json();
//         setDeepList(data?.data || []);
//       } catch (err) {
//         console.error("Error fetching deep packages:", err);
//         setDeepList([]);
//       }
//     };
//     fetchData();
//   }, []);

//   // ---------------------------------------
//   // Helper: compute house painting display amounts (used in leadMode)
//   // ---------------------------------------
//   const computeHousePaintingDisplay = (finalTotalValue, siteVisitChargesValue, flagsAndAmounts) => {
//     const FT = Number(finalTotalValue || 0);
//     const SV = Number(siteVisitChargesValue || 0);

//     const firstPaidFlag = !!flagsAndAmounts.firstPaid;
//     const secondPaidFlag = !!flagsAndAmounts.secondPaid;
//     const finalPaidFlag = !!flagsAndAmounts.finalPaid;

//     const fAmt = Number(flagsAndAmounts.firstAmount || 0);
//     const sAmt = Number(flagsAndAmounts.secondAmount || 0);
//     const fnAmt = Number(flagsAndAmounts.finalAmount || 0);

//     const slab40 = Math.round(FT * 0.4);
//     const slab20 = Math.round(FT * 0.2);

//     let paidDisplay = 0;
//     let aytp = 0;
//     let refund = 0;

//     if (!firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = SV;
//       aytp = slab40;
//     } else if (firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt;
//       aytp = slab40;
//     } else if (firstPaidFlag && secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt + sAmt;
//       aytp = slab20;
//     } else if (firstPaidFlag && secondPaidFlag && finalPaidFlag) {
//       paidDisplay = fAmt + sAmt + fnAmt;
//       aytp = 0;
//       if (paidDisplay > FT) refund = paidDisplay - FT;
//     } else {
//       paidDisplay = SV;
//       aytp = slab40;
//     }

//     return { paidDisplay, aytp, refund, slab40, slab20 };
//   };

//   // ---------------------------------------
//   // ADD SERVICE
//   // - Option C: In enquiry mode, and in leadMode, adding a service increments only serverFinalTotal
//   // ---------------------------------------
//   const addService = () => {
//     setServices((prev) => {
//       const next = [
//         ...prev,
//         {
//           category: "Deep Cleaning",
//           subCategory: "",
//           serviceName: "",
//           price: "",
//           bookingAmount: "",
//         },
//       ];
//       return next;
//     });
//   };

//   // ---------------------------------------
//   // REMOVE SERVICE
//   // - Option C: subtract removed service price from serverFinalTotal only
//   // - Then, if leadMode is true, recalc AYTP/refund
//   // ---------------------------------------
//   const removeService = (idx) => {
//     if (services.length === 1) {
//       alert("At least one service must remain in the booking.");
//       return;
//     }

//     const removedPrice = Number(services[idx]?.price || 0);

//     setServices((prev) => {
//       const next = prev.filter((_, i) => i !== idx);

//       // If house painting, we don't change finalTotal here (siteVisit etc handled separately)
//       const hp = next.some((s) => (s.category || "").toLowerCase() === "house painting");
//       if (hp) {
//         return next;
//       }

//       // Update only finalTotal (Option C)
//       setServerFinalTotal((prevTotal) => {
//         const newTotal = Math.max(0, Number(prevTotal || 0) - removedPrice);

//         // If we're in leadMode, recalc AYTP/refund
//         if (leadMode) {
//           const aytp = newTotal - Number(paidAmount || 0);
//           if (aytp < 0) {
//             setRefundAmount(Math.abs(aytp));
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(aytp);
//           }
//         }

//         return newTotal;
//       });

//       return next;
//     });
//   };

//   const onServiceChange = (idx, field, value) => {
//     setServices((prev) => {
//       const copy = [...prev];
//       const old = Number(copy[idx]?.price || 0);

//       const updated = {
//         ...copy[idx],
//         [field]: field === "price" && value === "" ? "" : value,
//       };
//       copy[idx] = updated;

//       // Only react to price field edits
//       if (field === "price") {
//         const newVal = Number(updated.price || 0);
//         const delta = newVal - old;
//         if (delta !== 0) {
//           setServerFinalTotal((prevTotal) => {
//             const newTotal = Number(prevTotal || 0) + delta;

//             // If leadMode, recalc AYTP/refund using newTotal
//             if (leadMode) {
//               // House painting handled separately in a useEffect; if not HP, simple diff
//               const hpFlag = copy.some((s) => (s.category || "").toLowerCase() === "house painting");
//               if (!hpFlag) {
//                 const aytp = newTotal - Number(paidAmount || 0);
//                 if (aytp < 0) {
//                   setRefundAmount(Math.abs(aytp));
//                   setAmountYetToPay(0);
//                 } else {
//                   setRefundAmount(0);
//                   setAmountYetToPay(aytp);
//                 }
//               }
//             }

//             return newTotal;
//           });
//         }
//       }

//       return copy;
//     });
//   };

//   useEffect(() => {
//     if (!services || services.length === 0) return;

//     // If house painting service present, AYTP logic uses slabs, handled in below effect
//     // Do nothing here for enquiry mode
//     if (!leadMode) return;

//     // For leadMode and non-house-painting, recalc AYTP as finalTotal - paid
//     const hpFlag = services.some((s) => (s.category || "").toLowerCase() === "house painting");
//     if (!hpFlag) {
//       const aytp = Number(serverFinalTotal || 0) - Number(paidAmount || 0);
//       if (aytp < 0) {
//         setRefundAmount(Math.abs(aytp));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(aytp);
//       }
//     }
//   }, [services, leadMode, serverFinalTotal, paidAmount]);

//   // ---------------------------------------
//   // House painting AYTP recalculation for lead mode when relevant values change
//   // ---------------------------------------
//   useEffect(() => {
//     if (!leadMode) return;

//     const hpFlag = services.some((s) => (s.category || "").toLowerCase() === "house painting");
//     if (!hpFlag) return;

//     // Use computeHousePaintingDisplay to set amountYetToPay and refund
//     const computed = computeHousePaintingDisplay(serverFinalTotal, siteVisitCharges, {
//       firstPaid,
//       secondPaid,
//       finalPaid,
//       firstAmount,
//       secondAmount,
//       finalAmount,
//     });

//     if (computed.refund > 0) {
//       setRefundAmount(computed.refund);
//       setAmountYetToPay(0);
//     } else {
//       setRefundAmount(0);
//       setAmountYetToPay(computed.aytp);
//     }
//   }, [
//     leadMode,
//     services,
//     serverFinalTotal,
//     siteVisitCharges,
//     firstPaid,
//     secondPaid,
//     finalPaid,
//     firstAmount,
//     secondAmount,
//     finalAmount,
//   ]);

//   // ---------------------------------------
//   // Manual Final Total edit apply (when admin edits final total via input)
//   // - Option C: Always allow manual edit to change serverFinalTotal
//   // - If leadMode true, recalc AYTP/refund accordingly
//   // ---------------------------------------
//   const applyManualFinalTotal = () => {
//     const manualValue = Number(draftFinalTotal || 0);

//     if (!Number.isFinite(manualValue) || manualValue < 0) {
//       alert("Final total must be a positive number");
//       return;
//     }

//     setServerFinalTotal(manualValue);

//     // If leadMode, recalc AYTP/refund
//     if (leadMode) {
//       const hpFlag = services.some((s) => (s.category || "").toLowerCase() === "house painting");
//       if (!hpFlag) {
//         const aytp = manualValue - Number(paidAmount || 0);
//         if (aytp < 0) {
//           setRefundAmount(Math.abs(aytp));
//           setAmountYetToPay(0);
//         } else {
//           setRefundAmount(0);
//           setAmountYetToPay(aytp);
//         }
//       } else {
//         const computed = computeHousePaintingDisplay(manualValue, siteVisitCharges, {
//           firstPaid,
//           secondPaid,
//           finalPaid,
//           firstAmount,
//           secondAmount,
//           finalAmount,
//         });
//         if (computed.refund > 0) {
//           setRefundAmount(computed.refund);
//           setAmountYetToPay(0);
//         } else {
//           setRefundAmount(0);
//           setAmountYetToPay(computed.aytp);
//         }
//       }
//     }

//     setEditingFinal(false);
//   };

//   // ---------------------------------------
//   // Address & Slot handlers (used by address/time modals)
//   // ---------------------------------------
//   const handleAddressSelect = (addressObj) => {
//     if (!addressObj) return;
//     const { houseFlatNumber, streetArea, landmark, latLng } = addressObj;
//     setHouseFlatNumber(houseFlatNumber || "");
//     setStreetArea(streetArea || "");
//     setLandMark(landmark || "");
//     if (latLng && latLng.lat != null && latLng.lng != null) {
//       setLocation({
//         type: "Point",
//         coordinates: [latLng.lng, latLng.lat],
//       });
//     }
//   };

//   const handleSlotSelect = ({ slotDate: sd, slotTime: st }) => {
//     if (sd) setSlotDate(sd);
//     if (st) setSlotTime(st);
//   };
//   // ---------------------------------------
//   // Local UI flags for address/time modals
//   // ---------------------------------------
//   const [showAddressModal, setShowAddressModal] = useState(false);
//   const [showTimeModal, setShowTimeModal] = useState(false);

//   // ---------------------------------------
//   // Payment Summary UI (leadMode shows AYTP/refund; enquiry hides AYTP/refund)
//   // ---------------------------------------
//   const PaymentSummarySection = () => {
//     return (
//       <div
//         className="mt-3 p-3"
//         style={{
//           background: "#f8f9fa",
//           borderRadius: 8,
//           border: "1px solid #e3e3e3",
//         }}
//       >
//         <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

//         {/* Show original + change if changed */}
//         {originalFinalTotal > 0 && serverFinalTotal !== originalFinalTotal && (
//           <>
//             <div className="d-flex justify-content-between mb-1">
//               <span>Original Amount:</span>
//               <strong>₹{originalFinalTotal}</strong>
//             </div>

//             <div className="d-flex justify-content-between mb-2">
//               <span>Change:</span>
//               {serverFinalTotal > originalFinalTotal ? (
//                 <strong style={{ color: "green" }}>
//                   +₹{serverFinalTotal - originalFinalTotal}
//                 </strong>
//               ) : (
//                 <strong style={{ color: "red" }}>
//                   -₹{originalFinalTotal - serverFinalTotal}
//                 </strong>
//               )}
//             </div>
//           </>
//         )}

//         {/* House painting enquiry: site visit only */}
//         {isHousePaintingService && !leadMode ? (
//           <div className="d-flex justify-content-between mb-2">
//             <span>Site Visit Charges:</span>
//             <strong>₹{siteVisitCharges}</strong>
//           </div>
//         ) : (
//           <>
//             {/* Final Total display & manual edit */}
//             <div
//               className="d-flex justify-content-between mb-2"
//               style={{ alignItems: "center" }}
//             >
//               <span>Final Total:</span>

//               {editingFinal ? (
//                 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <Form.Control
//                     type="number"
//                     size="sm"
//                     value={draftFinalTotal}
//                     onChange={(e) => setDraftFinalTotal(e.target.value)}
//                     style={{ width: 120 }}
//                   />
//                   <div
//                     style={{ color: "#007a0a", cursor: "pointer" }}
//                     onClick={applyManualFinalTotal}
//                     title="Apply"
//                   >
//                     <FaCheck />
//                   </div>
//                   <div
//                     style={{ color: "#d40000", cursor: "pointer" }}
//                     onClick={() => {
//                       setDraftFinalTotal(String(serverFinalTotal));
//                       setEditingFinal(false);
//                     }}
//                     title="Cancel"
//                   >
//                     <ImCancelCircle />
//                   </div>
//                 </div>
//               ) : (
//                 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <strong style={{ color: "#007a0a" }}>₹{serverFinalTotal}</strong>
//                   <span
//                     style={{ cursor: "pointer", color: "#7F6663" }}
//                     onClick={() => {
//                       setDraftFinalTotal(String(serverFinalTotal));
//                       setEditingFinal(true);
//                     }}
//                     title="Edit final total"
//                   >
//                     <FaEdit />
//                   </span>
//                 </div>
//               )}
//             </div>

//             {/* Booking amount — always backend value, never recalculated in enquiry */}
//            {leadMode != true && <div className="d-flex justify-content-between mb-2">
//               <span>Booking Amount:</span>
//               <strong>₹{serverBookingAmount}</strong>
//             </div>}

//             {/* Paid amount */}
//             <div className="d-flex justify-content-between mb-2">
//               <span>Total Paid:</span>
//               <strong>₹{paidAmount}</strong>
//             </div>

//             {/* Lead mode only — show AYTP or refund */}
//             {leadMode && (
//               <>
//                 {refundAmount > 0 ? (
//                   <div className="d-flex justify-content-between mt-2">
//                     <span style={{ color: "red" }}>Refund Amount:</span>
//                     <strong style={{ color: "red" }}>₹{refundAmount}</strong>
//                   </div>
//                 ) : (
//                   <div className="d-flex justify-content-between mt-2">
//                     <span>Amount Yet To Pay:</span>
//                     <strong>₹{amountYetToPay}</strong>
//                   </div>
//                 )}
//               </>
//             )}

//             {/* House painting installments — leadMode only */}
//             {leadMode && isHousePaintingService && serverFinalTotal > 0 && (
//               <div
//                 className="d-flex justify-content-between mt-2"
//                 style={{ fontSize: 12 }}
//               >
//                 <span className="text-muted">Current Installment:</span>

//                 <strong>
//                   {!firstPaid
//                     ? "1st Installment (40%)"
//                     : firstPaid && !secondPaid
//                     ? "2nd Installment (40%)"
//                     : firstPaid && secondPaid && !finalPaid
//                     ? "Final Installment (20%)"
//                     : "Completed"}
//                 </strong>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     );
//   };
//   // -------------------------------------------------------
//   // HANDLE SAVE — Option C (Enquiry) + Full LeadMode Logic
//   // -------------------------------------------------------
//   const handleSave = async () => {
//     if (!enquiry?.bookingId) return;

//     // Basic Validation
//     if (!customerName.trim()) return alert("Customer name is required");
//     if (!customerPhone.trim() || customerPhone.length !== 10)
//       return alert("Valid phone number is required");

//     if (!houseFlatNumber.trim()) return alert("House/Flat number is required");
//     if (!streetArea.trim()) return alert("Street/Area is required");
//     if (!city.trim()) return alert("City is required");
//     if (!location?.coordinates)
//       return alert("Location coordinates are required");

//     if (!slotDate.trim()) return alert("Slot date is required");
//     if (!slotTime.trim()) return alert("Slot time is required");

//     if (services.length === 0)
//       return alert("At least one service must be added.");

//     for (let i = 0; i < services.length; i++) {
//       const s = services[i];
//       if (!s.category?.trim())
//         return alert(`Service ${i + 1}: Category is required`);
//       if (s.category.toLowerCase() !== "house painting") {
//         if (!s.subCategory?.trim())
//           return alert(`Service ${i + 1}: Subcategory is required`);
//         if (!s.serviceName?.trim())
//           return alert(`Service ${i + 1}: Service Name is required`);
//       }
//       if (!s.price || Number(s.price) <= 0)
//         return alert(`Service ${i + 1}: Valid price required`);
//     }

//     setSaving(true);

//     try {
//       const addressPayload = {
//         houseFlatNumber,
//         streetArea,
//         landMark,
//         city,
//         location: {
//           type: "Point",
//           coordinates: location.coordinates,
//         },
//       };

//       const slotPayload = {
//         slotDate,
//         slotTime,
//       };

//       const normalizedServices = services.map((s) => ({
//         category: s.category,
//         subCategory: s.subCategory,
//         serviceName: s.serviceName,
//         price: Number(s.price || 0),
//         quantity: 1,
//         teamMembersRequired: 0,
//         bookingAmount: Number(s.bookingAmount || 0),
//       }));

//       // ------------------------------
//       // build bookingDetailsPayload
//       // ------------------------------
//       let bookingDetailsPayload = {
//         finalTotal: serverFinalTotal,
//         bookingAmount: serverBookingAmount,
//         paidAmount: Number(paidAmount),
//       };

//       if (leadMode) {
//         bookingDetailsPayload.status = status;
//         bookingDetailsPayload.paymentMethod = paymentMethod;
//         bookingDetailsPayload.paymentStatus = paymentStatus;

//         // House painting: include site visit
//         if (isHousePaintingService) {
//           bookingDetailsPayload.siteVisitCharges = siteVisitCharges;
//         }
//       }

//       const finalPayload = {
//         customer: {
//           name: customerName,
//           phone: customerPhone,
//           customerId: enquiry?.raw?.customer?.customerId,
//         },
//         service: normalizedServices,
//         bookingDetails: bookingDetailsPayload,
//         address: addressPayload,
//         selectedSlot: slotPayload,
//         formName,
//       };

//       const endpoint = leadMode
//         ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
//         : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

//       const res = await fetch(endpoint, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(finalPayload),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.message || "Update failed.");

//       onUpdated?.(data.booking);
//       onClose();
//     } catch (err) {
//       alert(err.message || "Error updating enquiry.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // -------------------------------------------------------
//   // MAIN JSX RENDER
//   // -------------------------------------------------------
//   return (
//     <>
//       <Modal
//         show={show}
//         onHide={onClose}
//         size="lg"
//         centered
//         enforceFocus={false}
//       >
//         <Modal.Header closeButton>
//           <Modal.Title style={{ fontSize: 16 }}>
//             {title || "Edit Enquiry"}
//           </Modal.Title>
//         </Modal.Header>

//         <Modal.Body style={{ fontSize: 13 }}>
//           {/* CUSTOMER */}
//           <h6 className="mb-2">Customer *</h6>
//           <Row className="g-2 mb-3">
//             <Col md={6}>
//               <Form.Label>Name</Form.Label>
//               <Form.Control value={customerName} readOnly size="sm" />
//             </Col>

//             <Col md={6}>
//               <Form.Label>Phone *</Form.Label>
//               <InputGroup size="sm">
//                 <InputGroup.Text>+91</InputGroup.Text>
//                 <Form.Control value={customerPhone} readOnly />
//               </InputGroup>
//             </Col>
//           </Row>

//           {/* ADDRESS SECTION */}
//           <div className="d-flex justify-content-between mb-2">
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
//               <Form.Label>House / Flat No.</Form.Label>
//               <Form.Control value={houseFlatNumber} readOnly size="sm" />
//             </Col>
//             <Col md={4}>
//               <Form.Label>Street / Area</Form.Label>
//               <Form.Control value={streetArea} readOnly size="sm" />
//             </Col>
//             <Col md={4}>
//               <Form.Label>Landmark</Form.Label>
//               <Form.Control value={landMark} readOnly size="sm" />
//             </Col>
//           </Row>

//           <Row className="g-2 mb-3">
//             <Col md={4}>
//               <Form.Label>City</Form.Label>
//               <Form.Control value={city} readOnly size="sm" />
//             </Col>
//           </Row>

//           {/* SLOT */}
//           <div className="d-flex justify-content-between mb-2">
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
//               <Form.Control value={slotDate} readOnly size="sm" />
//             </Col>
//             <Col md={6}>
//               <Form.Label>Time</Form.Label>
//               <Form.Control value={slotTime} readOnly size="sm" />
//             </Col>
//           </Row>

//           {/* SERVICES */}
//           <div className="d-flex justify-content-between mb-2">
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

//           {services.map((s, idx) => {
//             const isDC = s.category?.toLowerCase() === "deep cleaning";
//             const isHP = s.category?.toLowerCase() === "house painting";

//             const filteredNames = deepList
//               .filter((item) => item.category === s.subCategory)
//               .map((item) => ({
//                 label: item.name,
//                 value: item.name,
//                 price: item.totalAmount,
//                 bookingAmount: item.bookingAmount,
//               }));

//             return (
//               <Row key={idx} className="g-2 mb-3 align-items-end">
//                 <Col md={isHP ? 4 : 3}>
//                   <Form.Label className="mb-1">Category *</Form.Label>
//                   <Form.Control value={s.category} disabled size="sm" />
//                 </Col>

//                 {!isHP && (
//                   <Col md={3}>
//                     <Form.Label className="mb-1">Subcategory</Form.Label>
//                     <Form.Select
//                       size="sm"
//                       value={s.subCategory}
//                       onChange={(e) =>
//                         onServiceChange(idx, "subCategory", e.target.value)
//                       }
//                     >
//                       <option value="">Select Category *</option>
//                       {[...new Set(deepList.map((i) => i.category))].map(
//                         (cat) => (
//                           <option key={cat} value={cat}>
//                             {cat}
//                           </option>
//                         )
//                       )}
//                     </Form.Select>
//                   </Col>
//                 )}

//                 {!isHP && (
//                   <Col md={3}>
//                     <Form.Label className="mb-1">Service Name *</Form.Label>
//                     <Form.Select
//                       size="sm"
//                       value={s.serviceName}
//                       onChange={(e) => {
//                         const selected = filteredNames.find(
//                           (it) => it.value === e.target.value
//                         );
//                         onServiceChange(idx, "serviceName", e.target.value);
//                         if (selected) {
//                           onServiceChange(idx, "price", selected.price);
//                           onServiceChange(
//                             idx,
//                             "bookingAmount",
//                             selected.bookingAmount
//                           );
//                         }
//                       }}
//                     >
//                       <option value="">Select Service *</option>
//                       {filteredNames.map((i) => (
//                         <option key={i.value} value={i.value}>
//                           {i.label}
//                         </option>
//                       ))}
//                     </Form.Select>
//                   </Col>
//                 )}

//                 <Col md={isHP ? 4 : 2}>
//                   <Form.Label className="mb-1">
//                     {isDC ? "Price (₹)" : "Site Visit (₹)"}
//                   </Form.Label>
//                   <Form.Control
//                     size="sm"
//                     type="number"
//                     value={s.price}
//                     onChange={(e) =>
//                       onServiceChange(idx, "price", e.target.value)
//                     }
//                     disabled={true}
//                   />
//                 </Col>

//                 {!isHP && (
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

//           <Row className="mt-3">
//             <Col md={3}>
//               <Form.Label>Form Name *</Form.Label>
//               <Form.Control value={formName} size="sm" disabled />
//             </Col>
//           </Row>
//         </Modal.Body>

//         {/* PAYMENT SUMMARY */}
//         {PaymentSummarySection()}

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
//           initialLatLng={
//             location
//               ? { lat: location.coordinates[1], lng: location.coordinates[0] }
//               : undefined
//           }
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

// working code
// import React, { useEffect, useState } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { BASE_URL } from "../utils/config";
// import { ImCancelCircle } from "react-icons/im";
// import { FaCheck } from "react-icons/fa6";
// import { FaEdit } from "react-icons/fa";

// // util: strip +91 from contact
// const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

// const EditEnquiryModal = ({
//   show,
//   onClose,
//   enquiry,
//   onUpdated,
//   title,
//   leadMode = false,
// }) => {
//   // OLD STATES (unchanged)
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
//   const [initialServiceCount, setInitialServiceCount] = useState(0);

//   const [status, setStatus] = useState("Pending");
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paymentStatus, setPaymentStatus] = useState("Unpaid");
//   const [paidAmount, setPaidAmount] = useState(""); // display string

//   const [deepList, setDeepList] = useState([]);

//   const [showDiscount, setShowDiscount] = useState(false);
//   const [discountMode, setDiscountMode] = useState("percent");
//   const [discountValue, setDiscountValue] = useState("");
//   const [discountAmount, setDiscountAmount] = useState(0);
//   const [discountApplied, setDiscountApplied] = useState(false);

// const [showAddressModal, setShowAddressModal] = useState(false);
// const [showTimeModal, setShowTimeModal] = useState(false);

//   const [editingFinal, setEditingFinal] = useState(false);
//   const [draftFinalTotal, setDraftFinalTotal] = useState("");

//   // NEW STATES — required for your logic
//   const [serverFinalTotal, setServerFinalTotal] = useState(0); // final total used for calculations
//   const [originalFinalTotal, setOriginalFinalTotal] = useState(0); // original backend total (unchanged)
//   const [amountYetToPay, setAmountYetToPay] = useState(0); // recalculated AYTP
//   const [refundAmount, setRefundAmount] = useState(0); // refund when overpaid

//   const [serverBookingAmount, setServerBookingAmount] = useState(0);

//   // House painting specific states
//   const [siteVisitCharges, setSiteVisitCharges] = useState(0);
//   // Payment flags from backend (we read these to determine stages)
//   const [firstPaid, setFirstPaid] = useState(false);
//   const [secondPaid, setSecondPaid] = useState(false);
//   const [finalPaid, setFinalPaid] = useState(false);
//   // Optional amounts in bookingDetails (first/second/final amounts)
//   const [firstAmount, setFirstAmount] = useState(0);
//   const [secondAmount, setSecondAmount] = useState(0);
//   const [finalAmount, setFinalAmount] = useState(0);

//   const isHousePaintingService = services.some(
//     (s) => s.category?.toString().toLowerCase() === "house painting"
//   );
//   // PART 2
//   // helpers, deepList fetch, load enquiry useEffect

//   // -------------------------------------------------------------------
//   // Helper: compute house painting AYTP & paidDisplay using your rules
//   // Percentages fixed: 1st=40%, 2nd=40%, final=20%
//   // -------------------------------------------------------------------
//   const computeHousePaintingDisplay = (
//     finalTotalValue,
//     siteVisitChargesValue,
//     flagsAndAmounts
//   ) => {
//     const FT = Number(finalTotalValue || 0);
//     const SV = Number(siteVisitChargesValue || 0);

//     const firstPaidFlag = !!flagsAndAmounts.firstPaid;
//     const secondPaidFlag = !!flagsAndAmounts.secondPaid;
//     const finalPaidFlag = !!flagsAndAmounts.finalPaid;

//     const fAmt = Number(flagsAndAmounts.firstAmount || 0);
//     const sAmt = Number(flagsAndAmounts.secondAmount || 0);
//     const fnAmt = Number(flagsAndAmounts.finalAmount || 0);

//     const slab40 = Math.round(FT * 0.4);
//     const slab20 = Math.round(FT * 0.2);

//     let paidDisplay = 0;
//     let aytp = 0;
//     let refund = 0;

//     if (!firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = SV;
//       aytp = slab40;
//     } else if (firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt;
//       aytp = slab40;
//     } else if (firstPaidFlag && secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt + sAmt;
//       aytp = slab20;
//     } else if (firstPaidFlag && secondPaidFlag && finalPaidFlag) {
//       paidDisplay = fAmt + sAmt + fnAmt;
//       aytp = 0;
//       if (paidDisplay > FT) refund = paidDisplay - FT;
//     } else {
//       paidDisplay = SV;
//       aytp = slab40;
//     }

//     return {
//       paidDisplay,
//       aytp,
//       refund,
//       slab40,
//       slab20,
//     };
//   };

//   // ---------------------------------------------------------------
//   // FETCH DEEP CLEANING PACKAGES (unchanged)
//   // ---------------------------------------------------------------
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(
//           `${BASE_URL}/deeppackage/deep-cleaning-packages`
//         );
//         const data = await res.json();
//         if (data && data.success && Array.isArray(data.data)) {
//           setDeepList(data.data);
//         } else {
//           setDeepList([]);
//         }
//       } catch (err) {
//         console.log("Error fetching deep cleaning data:", err);
//         setDeepList([]);
//       }
//     };
//     fetchData();
//   }, []);

//   // -------------------------------------------------------------------
//   // LOAD ENQUIRY DATA (UPDATED — includes finalTotal, AYTP, refund logic)
//   // Important: serverFinalTotal now reads bookingDetails.finalTotal (not originalTotalAmount)
//   // -------------------------------------------------------------------
//   useEffect(() => {
//     if (!enquiry?.raw) return;

//     try {
//       const {
//         customer,
//         address,
//         selectedSlot,
//         service,
//         bookingDetails,
//         formName: fm,
//       } = enquiry.raw;

//       setCustomerName(customer?.name || "");
//       setCustomerPhone(
//         normalizePhone(enquiry?.contact) || customer?.phone || ""
//       );
//       setFormName(fm || enquiry?.formName || "");

//       setHouseFlatNumber(address?.houseFlatNumber || "");
//       setStreetArea(address?.streetArea || "");
//       setLandMark(address?.landMark || "");
//       setCity(address?.city || "");
//       setLocation(address?.location || null);

//       setSlotDate(selectedSlot?.slotDate || "");
//       setSlotTime(selectedSlot?.slotTime || "");

//       // Load services (unchanged logic)
//       setServices(
//         (service || []).map((s) => {
//           const raw = s || {};
//           const priceVal = raw.price ?? raw.totalAmount ?? raw.amount ?? "";
//           return {
//             category: raw.category || "Deep Cleaning",
//             subCategory: raw.subCategory || "",
//             serviceName: raw.serviceName || raw.name || "",
//             price:
//               priceVal !== undefined && priceVal !== null
//                 ? String(priceVal)
//                 : "",
//             bookingAmount: raw.bookingAmount || "",
//           };
//         })
//       );

//       setInitialServiceCount((service || []).length || 0);

//       // ------------------------------
//       // Load backend totals
//       // ------------------------------
//       const backendOriginal = Number(bookingDetails?.originalTotalAmount || 0);
//       const backendFinal = Number(
//         bookingDetails?.finalTotal ?? bookingDetails?.originalTotalAmount ?? 0
//       );
//       const backendPaid = Number(bookingDetails?.paidAmount || 0);
//       const backendAYTP = Number(bookingDetails?.amountYetToPay || 0);

//       // Store original value for comparison (immutable)
//       setOriginalFinalTotal(backendOriginal);

//       // Use backend final total for calculations (this is what UI should show initially)
//       setServerFinalTotal(backendFinal);

//       // Load backend booking amount
//       const backendBooking = Number(bookingDetails?.bookingAmount || 0);
//       setServerBookingAmount(backendBooking);

//       // default paid amount display; may override for house painting lead mode
//       setPaidAmount(String(backendPaid));

//       // default AYTP/refund for non-house-painting or enquiry mode
//       if (backendAYTP < 0) {
//         setRefundAmount(Math.abs(backendAYTP));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(backendAYTP);
//       }

//       setStatus(bookingDetails?.status || "Pending");
//       setPaymentMethod(bookingDetails?.paymentMethod || "Cash");
//       setPaymentStatus(bookingDetails?.paymentStatus || "Unpaid");

//       // initialize draft to backendFinal so manual edit starts from that
//       setDraftFinalTotal(String(backendFinal));

//       // ------------------------------
//       // House painting specific loading (if present)
//       // ------------------------------
//       const isHousePainting = (service || []).some(
//         (it) =>
//           (it.category || "").toString().toLowerCase() === "house painting"
//       );

//       // siteVisitCharges if present
//       const svc = Number(bookingDetails?.siteVisitCharges || 0);
//       setSiteVisitCharges(svc);

//       if (isHousePainting) {
//         // Read payment flags from bookingDetails
//         const fPaid = bookingDetails?.firstPayment?.status === "paid";
//         const sPaid = bookingDetails?.secondPayment?.status === "paid";
//         const fnPaid = bookingDetails?.finalPayment?.status === "paid";
//         setFirstPaid(!!fPaid);
//         setSecondPaid(!!sPaid);
//         setFinalPaid(!!fnPaid);

//         const fAmt = Number(bookingDetails?.firstPayment?.amount || 0);
//         const sAmt = Number(bookingDetails?.secondPayment?.amount || 0);
//         const fnAmt = Number(bookingDetails?.finalPayment?.amount || 0);
//         setFirstAmount(fAmt);
//         setSecondAmount(sAmt);
//         setFinalAmount(fnAmt);

//         // If leadMode -> compute UI values using confirmed rules (override display AYTP for lead)
//         if (leadMode) {
//           const computed = computeHousePaintingDisplay(backendFinal, svc, {
//             firstPaid: fPaid,
//             secondPaid: sPaid,
//             finalPaid: fnPaid,
//             firstAmount: fAmt,
//             secondAmount: sAmt,
//             finalAmount: fnAmt,
//           });

//           // set paid display (string)
//           setPaidAmount(String(computed.paidDisplay || 0));

//           if (computed.refund > 0) {
//             setRefundAmount(computed.refund);
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(computed.aytp);
//           }
//         } else {
//           // enquiry mode: use backend AYTP (already set above)
//           const aytp = backendFinal - backendPaid;
//           if (aytp < 0) {
//             setRefundAmount(Math.abs(aytp));
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(aytp);
//           }
//         }
//       }
//     } catch (err) {
//       console.error("Error loading enquiry raw data:", err);
//     }
//   }, [enquiry, leadMode]);

//   const addService = () => {
//     // Add empty service record - admin will select service which sets price via onServiceChange
//     setServices((prev) => {
//       const next = [
//         ...prev,
//         {
//           category: "Deep Cleaning",
//           subCategory: "",
//           serviceName: "",
//           price: "",
//           bookingAmount: "",
//         },
//       ];
//       return next;
//     });
//   };

//   const removeService = (idx) => {
//     if (services.length === 1) {
//       alert("At least one service must remain in the booking.");
//       return;
//     }

//     const removedPrice = Number(services[idx].price || 0);

//     // Remove service from list
//     setServices((prev) => {
//       const next = prev.filter((_, i) => i !== idx);

//       // Lead mode: subtract removedPrice from current serverFinalTotal
//       if (leadMode && !isHousePaintingService) {
//         setServerFinalTotal((prevTotal) => {
//           const newTotal = Math.max(0, Number(prevTotal || 0) - removedPrice);
//           // recalc AYTP
//           const aytp = newTotal - Number(paidAmount || 0);
//           if (aytp < 0) {
//             setRefundAmount(Math.abs(aytp));
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(aytp);
//           }
//           return newTotal;
//         });
//       } else if (!isHousePaintingService) {
//         // Non-lead behaviour: recompute from services (old behaviour)
//         const sum = next.reduce((acc, s) => acc + Number(s.price || 0), 0);
//         setServerFinalTotal(sum);
//         if (!leadMode) {
//           const bookingAmt = Math.round(sum * 0.2);
//           setServerBookingAmount(bookingAmt);
//         }
//         const aytp = sum - Number(paidAmount || 0);
//         if (aytp < 0) {
//           setRefundAmount(Math.abs(aytp));
//           setAmountYetToPay(0);
//         } else {
//           setRefundAmount(0);
//           setAmountYetToPay(aytp);
//         }
//       }

//       return next;
//     });

//     // For house painting we do NOT change serverFinalTotal here (must come from backend/or manual edit)
//   };

//   const onServiceChange = (idx, field, value) => {
//     setServices((prev) => {
//       const copy = [...prev];
//       const old = copy[idx] ? Number(copy[idx].price || 0) : 0;

//       const updated = {
//         ...copy[idx],
//         [field]: field === "price" && value === "" ? "" : value,
//       };
//       copy[idx] = updated;

//       // If price changed and leadMode true (and not house painting), adjust serverFinalTotal by delta
//       if (field === "price" && leadMode && !isHousePaintingService && updated) {
//         const newVal = Number(updated.price || 0);
//         const delta = newVal - old;
//         if (delta !== 0) {
//           setServerFinalTotal((prevTotal) => {
//             const newTotal = Number(prevTotal || 0) + delta;
//             // recalc AYTP
//             const aytp = newTotal - Number(paidAmount || 0);
//             if (aytp < 0) {
//               setRefundAmount(Math.abs(aytp));
//               setAmountYetToPay(0);
//             } else {
//               setRefundAmount(0);
//               setAmountYetToPay(aytp);
//             }
//             return newTotal;
//           });
//         }
//       }

//       return copy;
//     });
//   };

//   useEffect(() => {
//     if (!services.length) return;

//     if (isHousePaintingService) {
//       // keep serverFinalTotal as is for house painting
//       return;
//     }

//     if (leadMode) {
//       // In leadMode we do NOT recompute finalTotal from services here.
//       // We rely on addService/removeService/onServiceChange to adjust serverFinalTotal incrementally.
//       return;
//     }

//     // For non-leadMode, compute finalTotal from services (old behaviour)
//     const sumOfServices = services.reduce(
//       (acc, s) => acc + Number(s.price || 0),
//       0
//     );

//     setServerFinalTotal(sumOfServices);

//     // For enquiry mode (deep cleaning), calculate booking amount as 20% of finalTotal
//     if (!leadMode) {
//       const bookingAmt = Math.round(sumOfServices * 0.2);
//       setServerBookingAmount(bookingAmt);
//     }

//     // Calculate amount yet to pay
//     const aytp = sumOfServices - Number(paidAmount || 0);

//     if (aytp < 0) {
//       setRefundAmount(Math.abs(aytp));
//       setAmountYetToPay(0);
//     } else {
//       setRefundAmount(0);
//       setAmountYetToPay(aytp);
//     }
//   }, [services, isHousePaintingService, leadMode, paidAmount]);

//   const applyManualFinalTotal = () => {
//     const manualValue = Number(draftFinalTotal || 0);

//     if (!Number.isFinite(manualValue) || manualValue <= 0) {
//       alert("Final total must be greater than 0");
//       return;
//     }

//     // LEAD MODE manual override: set final total exactly, then recalc AYTP
//     if (leadMode) {
//       setServerFinalTotal(manualValue);

//       const aytp = manualValue - Number(paidAmount || 0);

//       if (aytp < 0) {
//         setRefundAmount(Math.abs(aytp));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(aytp);
//       }

//       setEditingFinal(false);
//       return;
//     }

//     // Non-lead behaviour (enquiry) - keep booking amount logic
//     if (!isHousePaintingService) {
//       const bookingAmt = Math.round(manualValue * 0.2);
//       setServerBookingAmount(bookingAmt);
//     }

//     const aytp2 = manualValue - Number(paidAmount || 0);
//     if (aytp2 < 0) {
//       setRefundAmount(Math.abs(aytp2));
//       setAmountYetToPay(0);
//     } else {
//       setRefundAmount(0);
//       setAmountYetToPay(aytp2);
//     }

//     setServerFinalTotal(manualValue);
//     setEditingFinal(false);
//   };
//   // PART 5
//   // handleSave (save/update payload) — sends only fields you specified for updates

//   // ---------------------------------------------------------------
//   // HANDLER: SAVE FINAL LEAD/ENQUIRY UPDATE
//   // (keeps your existing API call behavior — only sending the fields you already expected)
//   // ---------------------------------------------------------------
//   const handleSave = async () => {
//     if (!enquiry?.bookingId) return;

//     // Validate all required fields
//     if (!customerName.trim()) return alert("Customer name is required");
//     if (!customerPhone.trim() || customerPhone.length !== 10)
//       return alert("Valid phone number is required");

//     if (!houseFlatNumber.trim()) return alert("House/Flat number is required");
//     if (!streetArea.trim()) return alert("Street/Area is required");
//     if (!city.trim()) return alert("City is required");
//     if (!location?.coordinates)
//       return alert("Location coordinates are required");

//     if (!slotDate.trim()) return alert("Slot date is required");
//     if (!slotTime.trim()) return alert("Slot time is required");

//     if (services.length === 0) return alert("At least one service required");

//     // Validate each service
//     for (let i = 0; i < services.length; i++) {
//       const s = services[i];
//       if (!s.category?.trim())
//         return alert(`Service ${i + 1}: Category required`);
//       if (s.category.toLowerCase() !== "house painting") {
//         if (!s.subCategory?.trim())
//           return alert(`Service ${i + 1}: Subcategory required`);
//         if (!s.serviceName?.trim())
//           return alert(`Service ${i + 1}: Service name required`);
//       }
//       if (!s.price || Number(s.price) <= 0)
//         return alert(`Service ${i + 1}: Valid price required`);
//     }

//     setSaving(true);

//     try {
//       // ADDRESS PAYLOAD
//       const addressPayload = {
//         houseFlatNumber,
//         streetArea,
//         landMark,
//         city,
//         location: {
//           type: "Point",
//           coordinates: location.coordinates,
//         },
//       };

//       // SLOT PAYLOAD
//       const slotPayload = {
//         slotDate,
//         slotTime,
//       };

//       // NORMALIZED SERVICES PAYLOAD
//       const normalizedServices = services.map((s) => ({
//         category: s.category,
//         subCategory: s.subCategory,
//         serviceName: s.serviceName,
//         price: Number(s.price || 0),
//         quantity: 1,
//         teamMembersRequired: 0,
//         bookingAmount: Number(s.bookingAmount || 0),
//       }));

//       // FINAL CALCULATION FIX
//       let finalAYTP = amountYetToPay;
//       let finalRefund = refundAmount;
//       if (refundAmount > 0) finalAYTP = 0;
//       if (amountYetToPay > 0) finalRefund = 0;

//       // BOOKING DETAILS PAYLOAD — send ONLY fields you requested
//       let bookingDetailsPayload = {
//         finalTotal: serverFinalTotal,
//         amountYetToPay: finalAYTP,
//         refundAmount: finalRefund,
//       };

//       if (!leadMode) {
//         bookingDetailsPayload.status = status;
//         bookingDetailsPayload.paymentMethod = paymentMethod;
//         bookingDetailsPayload.paymentStatus = paymentStatus;
//         bookingDetailsPayload.bookingAmount = serverBookingAmount;
//         bookingDetailsPayload.paidAmount = Number(paidAmount);

//         // Add site visit charges for house painting in enquiry mode
//         if (isHousePaintingService) {
//           bookingDetailsPayload.siteVisitCharges = siteVisitCharges;
//         }
//       }

//       // FINAL PAYLOAD
//       const finalPayload = {
//         customer: {
//           name: customerName,
//           phone: customerPhone,
//           customerId: enquiry?.raw?.customer?.customerId,
//         },
//         service: normalizedServices,
//         bookingDetails: bookingDetailsPayload,
//         address: addressPayload,
//         selectedSlot: slotPayload,
//         formName,
//       };

//       // REMOVE isEnquiry FOR LEAD MODE
//       if (!leadMode) {
//         finalPayload.isEnquiry = enquiry?.raw?.isEnquiry ?? true;
//       }

//       const endpoint = leadMode
//         ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
//         : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

//       const res = await fetch(endpoint, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(finalPayload),
//       });

//       const data = await res.json();

//       if (!res.ok) throw new Error(data?.message || "Update failed");

//       onUpdated?.(data.booking);
//       onClose();
//     } catch (err) {
//       alert(err.message || "Error updating enquiry");
//     } finally {
//       setSaving(false);
//     }
//   };
//   // PART 6
//   // UI: RENDER MODAL (unchanged layout) and export

//   // Helper: unique subcategories from deepList (use item.subcategory)
//   const getUniqueDeepCategories = () => {
//     if (!Array.isArray(deepList)) return [];
//     return [
//       ...new Set(
//         deepList
//           .map((it) => (it.category || "").toString().trim())
//           .filter(Boolean)
//       ),
//     ];
//   };

//   // ---------------------------------------------------------------
//   // UI: RENDER MODAL
//   // ---------------------------------------------------------------
//   return (
//     <>
//       <Modal
//         show={show}
//         onHide={onClose}
//         size="lg"
//         centered
//         enforceFocus={false}
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
//                 readOnly
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
//                   readOnly
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
//               House Painting allows only one service entry. (Price shown but
//               ignored for calculations)
//             </div>
//           )}

//           {services.map((s, idx) => {
//             const isDeepCleaning =
//               s.category?.toString().toLowerCase() === "deep cleaning";
//             const isHousePainting =
//               s.category?.toString().toLowerCase() === "house painting";

//             const filteredServiceNames = deepList
//               .filter((item) => {
//                 const a = (item.category || "").toString().trim().toLowerCase();
//                 const b = (s.subCategory || "").toString().trim().toLowerCase();
//                 return a && b && a === b;
//               })
//               .map((item) => ({
//                 label: item.name,
//                 value: item.name,
//                 price: item.totalAmount,
//                 bookingAmount: item.bookingAmount,
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
//                         <option value="">Select Category *</option>
//                         {getUniqueDeepCategories().map((cat) => (
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
//                             onServiceChange(
//                               idx,
//                               "bookingAmount",
//                               selectedItem.bookingAmount ?? ""
//                             );
//                           } else {
//                             onServiceChange(idx, "price", "");
//                             onServiceChange(idx, "bookingAmount", "");
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
//                   <Form.Label className="mb-1">
//                     {isDeepCleaning ? "Price (₹)" : "Site visiting charge (₹)"}
//                   </Form.Label>
//                   {/* Price is visible but for house painting it is ignored */}
//                   <Form.Control
//                     type="number"
//                     size="sm"
//                     value={s.price}
//                     min="0"
//                     onChange={(e) =>
//                       onServiceChange(idx, "price", e.target.value)
//                     }
//                     placeholder="0"
//                     disabled={true}
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

//         {/* ------------------------------------------------------ */}
//         {/* PAYMENT SUMMARY SECTION (UPDATED)                      */}
//         {/* ------------------------------------------------------ */}
//         <div
//           className="mt-3 p-3"
//           style={{
//             background: "#f8f9fa",
//             borderRadius: 8,
//             border: "1px solid #e3e3e3",
//           }}
//         >
//           <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

//           {/* SHOW ORIGINAL + CHANGE */}
//           {leadMode &&
//             originalFinalTotal > 0 &&
//             serverFinalTotal !== originalFinalTotal && (
//               <>
//                 <div className="d-flex justify-content-between mb-1">
//                   <span>Original Amount:</span>
//                   <strong>₹{originalFinalTotal}</strong>
//                 </div>

//                 <div className="d-flex justify-content-between mb-2">
//                   <span>Change:</span>
//                   {serverFinalTotal > originalFinalTotal ? (
//                     <strong style={{ color: "green" }}>
//                       +₹{serverFinalTotal - originalFinalTotal}
//                     </strong>
//                   ) : (
//                     <strong style={{ color: "red" }}>
//                       -₹{originalFinalTotal - serverFinalTotal}
//                     </strong>
//                   )}
//                 </div>
//               </>
//             )}

//           {/* HOUSE PAINTING - ENQUIRY MODE or FINALTOTAL = 0: show site visit only */}
//           {isHousePaintingService && (!leadMode || serverFinalTotal === 0) ? (
//             <div className="d-flex justify-content-between mb-1">
//               <span>Site Visit Charges:</span>
//               <strong>₹{siteVisitCharges}</strong>
//             </div>
//           ) : (
//             /* DEEP CLEANING OR HOUSE PAINTING WITH FINALTOTAL > 0 IN LEAD MODE */
//             <>
//               {/* FINAL TOTAL DISPLAY */}
//               <div
//                 className="d-flex justify-content-between mb-2"
//                 style={{ alignItems: "center" }}
//               >
//                 <span>Final Total:</span>

//                 {editingFinal ? (
//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     <Form.Control
//                       type="number"
//                       size="sm"
//                       value={draftFinalTotal}
//                       onChange={(e) => setDraftFinalTotal(e.target.value)}
//                       style={{ width: 120 }}
//                     />
//                     <div
//                       style={{ color: "#007a0a", cursor: "pointer" }}
//                       onClick={applyManualFinalTotal}
//                     >
//                       <FaCheck />
//                     </div>
//                     <div
//                       style={{ color: "#d40000", cursor: "pointer" }}
//                       onClick={() => {
//                         setDraftFinalTotal(String(serverFinalTotal));
//                         setEditingFinal(false);
//                       }}
//                     >
//                       <ImCancelCircle />
//                     </div>
//                   </div>
//                 ) : (
//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     {/* Final total should ALWAYS prefer the current serverFinalTotal */}
//                     <strong style={{ color: "#007a0a" }}>{`₹${
//                       serverFinalTotal || originalFinalTotal
//                     }`}</strong>
//                     <span
//                       style={{ cursor: "pointer", color: "#7F6663" }}
//                       onClick={() => {
//                         setDraftFinalTotal(
//                           String(serverFinalTotal || originalFinalTotal)
//                         );
//                         setEditingFinal(true);
//                       }}
//                     >
//                       <FaEdit />
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {/* BOOKING AMOUNT (only for enquiry deep cleaning) */}
//               {!leadMode && !isHousePaintingService && (
//                 <div className="d-flex justify-content-between mb-1">
//                   <span>Booking Amount (Paid First):</span>
//                   <strong>₹{serverBookingAmount}</strong>
//                 </div>
//               )}

//               {/* PAID AMOUNT (display) */}
//               <div className="d-flex justify-content-between mb-1">
//                 <span>Total Paid Amount:</span>
//                 <strong>₹{paidAmount}</strong>
//               </div>

//               {/* REFUND or AYTP */}
//               {refundAmount > 0 ? (
//                 <div className="d-flex justify-content-between mt-2">
//                   <span style={{ color: "red" }}>Refund Amount:</span>
//                   <strong style={{ color: "red" }}>₹{refundAmount}</strong>
//                 </div>
//               ) : (
//                 leadMode && (
//                   <>
//                     <div className="d-flex justify-content-between mt-2">
//                       <span>Amount Yet To Pay:</span>
//                       <strong>₹{amountYetToPay}</strong>
//                     </div>

//                     {/* Installment Label for House Painting */}
//                     {isHousePaintingService &&
//                       serverFinalTotal > 0 &&
//                       amountYetToPay > 0 && (
//                         <div
//                           className="d-flex justify-content-between mt-1"
//                           style={{ fontSize: 12 }}
//                         >
//                           <span className="text-muted">
//                             Current Installment:
//                           </span>

//                           <strong>
//                             {!firstPaid
//                               ? "1st Installment (40%)"
//                               : firstPaid && !secondPaid
//                               ? "2nd Installment (40%)"
//                               : firstPaid && secondPaid && !finalPaid
//                               ? "Final Installment (20%)"
//                               : "Completed"}
//                           </strong>
//                         </div>
//                       )}
//                   </>
//                 )
//               )}
//             </>
//           )}
//         </div>

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
//           initialLatLng={
//             location && Array.isArray(location.coordinates)
//               ? { lat: location.coordinates[1], lng: location.coordinates[0] }
//               : undefined
//           }
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

// ---- EditEnquiryModal.jsx
// import React, { useEffect, useState } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { BASE_URL } from "../utils/config";
// import { ImCancelCircle } from "react-icons/im";
// import { FaCheck } from "react-icons/fa6";
// import { FaEdit } from "react-icons/fa";

// // util: strip +91 from contact
// const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

// const EditEnquiryModal = ({
//   show,
//   onClose,
//   enquiry,
//   onUpdated,
//   title,
//   leadMode = false,
// }) => {
//   // OLD STATES (unchanged)
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
//   const [initialServiceCount, setInitialServiceCount] = useState(0);

//   const [status, setStatus] = useState("Pending");
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paymentStatus, setPaymentStatus] = useState("Unpaid");
//   const [paidAmount, setPaidAmount] = useState(""); // display string

//   const [deepList, setDeepList] = useState([]);

//   const [showDiscount, setShowDiscount] = useState(false);
//   const [discountMode, setDiscountMode] = useState("percent");
//   const [discountValue, setDiscountValue] = useState("");
//   const [discountAmount, setDiscountAmount] = useState(0);
//   const [discountApplied, setDiscountApplied] = useState(false);

//   const [showAddressModal, setShowAddressModal] = useState(false);
//   const [showTimeModal, setShowTimeModal] = useState(false);

//   const [editingFinal, setEditingFinal] = useState(false);
//   const [draftFinalTotal, setDraftFinalTotal] = useState("");

//   // NEW STATES — required for your logic
//   const [serverFinalTotal, setServerFinalTotal] = useState(0); // final total used for calculations
//   const [originalFinalTotal, setOriginalFinalTotal] = useState(0); // original backend final total
//   const [amountYetToPay, setAmountYetToPay] = useState(0); // recalculated AYTP
//   const [refundAmount, setRefundAmount] = useState(0); // refund when overpaid

//   const [serverBookingAmount, setServerBookingAmount] = useState(0);

//   // House painting specific states
//   const [siteVisitCharges, setSiteVisitCharges] = useState(0);
//   // Payment flags from backend (we read these to determine stages)
//   const [firstPaid, setFirstPaid] = useState(false);
//   const [secondPaid, setSecondPaid] = useState(false);
//   const [finalPaid, setFinalPaid] = useState(false);
//   // Optional amounts in bookingDetails (first/second/final amounts)
//   const [firstAmount, setFirstAmount] = useState(0);
//   const [secondAmount, setSecondAmount] = useState(0);
//   const [finalAmount, setFinalAmount] = useState(0);

//   const isHousePaintingService = services.some(
//     (s) => s.category?.toString().toLowerCase() === "house painting"
//   );

//   // -------------------------------------------------------------------
//   // Helper: compute house painting AYTP & paidDisplay using your rules
//   // Percentages fixed: 1st=40%, 2nd=40%, final=20%
//   // Rules implemented:
//   // Case 1 — Before any installment payment:
//   //   if paidAmount <= siteVisitCharges -> AYTP = 40% of finalTotal (paid display = siteVisitCharges)
//   // After 1st paid -> AYTP = 40% of finalTotal (paid display = firstAmount)
//   // After 2nd paid -> AYTP = 20% of finalTotal (paid display = first + second)
//   // After all paid -> AYTP = 0, refund if paid > finalTotal
//   // -------------------------------------------------------------------
//   const computeHousePaintingDisplay = (
//     finalTotalValue,
//     siteVisitChargesValue,
//     flagsAndAmounts
//   ) => {
//     const FT = Number(finalTotalValue || 0);
//     const SV = Number(siteVisitChargesValue || 0);

//     const firstPaidFlag = !!flagsAndAmounts.firstPaid;
//     const secondPaidFlag = !!flagsAndAmounts.secondPaid;
//     const finalPaidFlag = !!flagsAndAmounts.finalPaid;

//     const fAmt = Number(flagsAndAmounts.firstAmount || 0);
//     const sAmt = Number(flagsAndAmounts.secondAmount || 0);
//     const fnAmt = Number(flagsAndAmounts.finalAmount || 0);

//     const slab40 = Math.round(FT * 0.4);
//     const slab20 = Math.round(FT * 0.2);

//     let paidDisplay = 0;
//     let aytp = 0;
//     let refund = 0;

//     // no installment paid => show siteVisitCharges as paid display and AYTP = 40%
//     if (!firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = SV;
//       aytp = slab40;
//     }
//     // first paid only
//     else if (firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt;
//       aytp = slab40;
//     }
//     // first + second paid
//     else if (firstPaidFlag && secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt + sAmt;
//       aytp = slab20;
//     }
//     // all paid
//     else if (firstPaidFlag && secondPaidFlag && finalPaidFlag) {
//       paidDisplay = fAmt + sAmt + fnAmt;
//       aytp = 0;
//       if (paidDisplay > FT) refund = paidDisplay - FT;
//     } else {
//       // other combos (fallback) - treat like before first payment
//       paidDisplay = SV;
//       aytp = slab40;
//     }

//     return {
//       paidDisplay,
//       aytp,
//       refund,
//       slab40,
//       slab20,
//     };
//   };

//   // ---------------------------------------------------------------
//   // FETCH DEEP CLEANING PACKAGES (unchanged)
//   // ---------------------------------------------------------------
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(
//           `${BASE_URL}/deeppackage/deep-cleaning-packages`
//         );
//         const data = await res.json();
//         if (data && data.success && Array.isArray(data.data)) {
//           setDeepList(data.data);
//         } else {
//           setDeepList([]);
//         }
//       } catch (err) {
//         console.log("Error fetching deep cleaning data:", err);
//         setDeepList([]);
//       }
//     };
//     fetchData();
//   }, []);

//   // -------------------------------------------------------------------
//   // LOAD ENQUIRY DATA (UPDATED — includes finalTotal, AYTP, refund logic)
//   // -------------------------------------------------------------------
//   useEffect(() => {
//     if (!enquiry?.raw) return;

//     try {
//       const {
//         customer,
//         address,
//         selectedSlot,
//         service,
//         bookingDetails,
//         formName: fm,
//       } = enquiry.raw;

//       setCustomerName(customer?.name || "");
//       setCustomerPhone(
//         normalizePhone(enquiry?.contact) || customer?.phone || ""
//       );
//       setFormName(fm || enquiry?.formName || "");

//       setHouseFlatNumber(address?.houseFlatNumber || "");
//       setStreetArea(address?.streetArea || "");
//       setLandMark(address?.landMark || "");
//       setCity(address?.city || "");
//       setLocation(address?.location || null);

//       setSlotDate(selectedSlot?.slotDate || "");
//       setSlotTime(selectedSlot?.slotTime || "");

//       // Load services (unchanged logic)
//       setServices(
//         (service || []).map((s) => {
//           const raw = s || {};
//           const priceVal = raw.price ?? raw.totalAmount ?? raw.amount ?? "";
//           return {
//             category: raw.category || "Deep Cleaning",
//             subCategory: raw.subCategory || "",
//             serviceName: raw.serviceName || raw.name || "",
//             price:
//               priceVal !== undefined && priceVal !== null
//                 ? String(priceVal)
//                 : "",
//             bookingAmount: raw.bookingAmount || "",
//           };
//         })
//       );

//       setInitialServiceCount((service || []).length || 0);

//       // ------------------------------
//       // Load backend totals
//       // ------------------------------
//       const backendFinal = Number(bookingDetails?.originalTotalAmount || 0);
//       const backendPaid = Number(bookingDetails?.paidAmount || 0);
//       const backendAYTP = Number(bookingDetails?.amountYetToPay || 0);

//       // Store original value for comparison
//       setOriginalFinalTotal(backendFinal);

//       // Use backend final total for calculations (important for house painting)
//       setServerFinalTotal(backendFinal);

//       // Load backend booking amount
//       const backendBooking = Number(bookingDetails?.bookingAmount || 0);
//       setServerBookingAmount(backendBooking);

//       // default paid amount display; may override for house painting lead mode
//       setPaidAmount(String(backendPaid));

//       // default AYTP/refund for non-house-painting or enquiry mode
//       if (backendAYTP < 0) {
//         setRefundAmount(Math.abs(backendAYTP));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(backendAYTP);
//       }

//       setStatus(bookingDetails?.status || "Pending");
//       setPaymentMethod(bookingDetails?.paymentMethod || "Cash");
//       setPaymentStatus(bookingDetails?.paymentStatus || "Unpaid");

//       setDraftFinalTotal(String(backendFinal));

//       // ------------------------------
//       // House painting specific loading (if present)
//       // ------------------------------
//       const isHousePainting = (service || []).some(
//         (it) =>
//           (it.category || "").toString().toLowerCase() === "house painting"
//       );

//       // siteVisitCharges if present
//       const svc = Number(bookingDetails?.siteVisitCharges || 0);
//       setSiteVisitCharges(svc);

//       if (isHousePainting) {
//         // Read payment flags from bookingDetails
//         const fPaid = bookingDetails?.firstPayment?.status === "paid";
//         const sPaid = bookingDetails?.secondPayment?.status === "paid";
//         const fnPaid = bookingDetails?.finalPayment?.status === "paid";
//         setFirstPaid(!!fPaid);
//         setSecondPaid(!!sPaid);
//         setFinalPaid(!!fnPaid);

//         const fAmt = Number(bookingDetails?.firstPayment?.amount || 0);
//         const sAmt = Number(bookingDetails?.secondPayment?.amount || 0);
//         const fnAmt = Number(bookingDetails?.finalPayment?.amount || 0);
//         setFirstAmount(fAmt);
//         setSecondAmount(sAmt);
//         setFinalAmount(fnAmt);

//         // If leadMode -> compute UI values using confirmed rules (override display AYTP for lead)
//         if (leadMode) {
//           const computed = computeHousePaintingDisplay(backendFinal, svc, {
//             firstPaid: fPaid,
//             secondPaid: sPaid,
//             finalPaid: fnPaid,
//             firstAmount: fAmt,
//             secondAmount: sAmt,
//             finalAmount: fnAmt,
//           });

//           // set paid display (string)
//           setPaidAmount(String(computed.paidDisplay || 0));

//           if (computed.refund > 0) {
//             setRefundAmount(computed.refund);
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(computed.aytp);
//           }
//         } else {
//           // enquiry mode: use backend AYTP (already set above)
//           const aytp = backendFinal - backendPaid;
//           if (aytp < 0) {
//             setRefundAmount(Math.abs(aytp));
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(aytp);
//           }
//         }
//       }
//     } catch (err) {
//       console.error("Error loading enquiry raw data:", err);
//     }
//   }, [enquiry, leadMode]);

//   // -------------------------------------------------------------------
//   // ADD NEW SERVICE (Deep Cleaning only)
//   // -------------------------------------------------------------------
//   const addService = () => {
//     setServices((prev) => [
//       ...prev,
//       {
//         category: "Deep Cleaning",
//         subCategory: "",
//         serviceName: "",
//         price: "",
//         bookingAmount: "",
//       },
//     ]);
//   };

//   // -------------------------------------------------------------------
//   // REMOVE SERVICE — with safeguard (cannot remove if only ONE remains)
//   // -------------------------------------------------------------------
//   const removeService = (idx) => {
//     if (services.length === 1) {
//       alert("At least one service must remain in the booking.");
//       return;
//     }

//     const removedPrice = Number(services[idx].price || 0);

//     // Remove service from list
//     setServices((prev) => prev.filter((_, i) => i !== idx));

//     // For non-house-painting: recalc finalTotal as sum of services
//     if (!isHousePaintingService) {
//       setServerFinalTotal((prev) => {
//         const newTotal = prev - removedPrice;
//         // For enquiry mode (deep cleaning), recalculate booking amount as 20% of finalTotal
//         if (!leadMode) {
//           const newBookingAmount = Math.round(newTotal * 0.2);
//           setServerBookingAmount(newBookingAmount);
//         }
//         // Calculate AYTP
//         const aytp = newTotal - Number(paidAmount || 0);
//         if (aytp < 0) {
//           setRefundAmount(Math.abs(aytp));
//           setAmountYetToPay(0);
//         } else {
//           setRefundAmount(0);
//           setAmountYetToPay(aytp);
//         }
//         return newTotal;
//       });
//     }
//     // For house painting we do NOT change serverFinalTotal here (must come from backend/or manual edit)
//   };

//   // Updated address selection handler - now only updates local state
//   const handleAddressSelect = (addressData) => {
//     setHouseFlatNumber(addressData.houseFlatNumber || "");
//     setStreetArea(addressData.formattedAddress || "");
//     setLandMark(addressData.landmark || "");
//     setCity(addressData.city || "");
//     if (
//       addressData.lng !== undefined &&
//       addressData.lat !== undefined &&
//       !Number.isNaN(addressData.lng) &&
//       !Number.isNaN(addressData.lat)
//     ) {
//       setLocation({
//         type: "Point",
//         coordinates: [addressData.lng, addressData.lat],
//       });
//     }
//     setSlotDate("");
//     setSlotTime("");
//   };

//   // Updated slot selection handler - now only updates local state
//   const handleSlotSelect = (sel) => {
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

//   // -------------------------------------------------------------------
//   // SERVICE FIELDS UPDATE HANDLER
//   // -------------------------------------------------------------------
//   const onServiceChange = (idx, field, value) => {
//     setServices((prev) => {
//       const copy = [...prev];
//       const updated = {
//         ...copy[idx],
//         [field]: field === "price" && value === "" ? "" : value,
//       };
//       copy[idx] = updated;
//       return copy;
//     });
//   };

//   // -------------------------------------------------------------------
//   // AUTO RECALCULATE FINAL TOTAL WHENEVER SERVICES CHANGE (add/edit)
//   // For House Painting: DO NOT use services to compute finalTotal.
//   // Use backend.finalTotal (serverFinalTotal) instead.
//   // -------------------------------------------------------------------
//   useEffect(() => {
//     if (!services.length) return;

//     if (isHousePaintingService) {
//       // IMPORTANT: Do not override serverFinalTotal if house painting
//       // Keep serverFinalTotal as backend.finalTotal (or manual edited value)
//       // No recalculation from services here.
//       return;
//     }

//     // For non-house-painting, compute finalTotal from services
//     const sumOfServices = services.reduce(
//       (acc, s) => acc + Number(s.price || 0),
//       0
//     );

//     setServerFinalTotal(sumOfServices);

//     // For enquiry mode (deep cleaning), calculate booking amount as 20% of finalTotal
//     if (!leadMode) {
//       const bookingAmt = Math.round(sumOfServices * 0.2);
//       setServerBookingAmount(bookingAmt);
//     }

//     // Calculate amount yet to pay
//     const aytp = sumOfServices - Number(paidAmount || 0);

//     if (aytp < 0) {
//       setRefundAmount(Math.abs(aytp));
//       setAmountYetToPay(0);
//     } else {
//       setRefundAmount(0);
//       setAmountYetToPay(aytp);
//     }
//   }, [services, isHousePaintingService, leadMode, paidAmount]);

//   // -------------------------------------------------------------------
//   // MANUAL FINAL TOTAL EDIT (✔ APPLY)
//   // For house painting: allow manual edit — then apply AYTP logic.
//   // For other services: behave as before.
//   // -------------------------------------------------------------------
//   const applyManualFinalTotal = () => {
//     const v = Number(draftFinalTotal || 0);

//     if (!Number.isFinite(v) || v <= 0) {
//       alert("Final total must be greater than 0");
//       return;
//     }

//     // Update UI final total
//     setServerFinalTotal(v);

//     // If house painting in leadMode -> compute AYTP using rules
//     if (leadMode && isHousePaintingService) {
//       // Determine flags & amounts currently in state (these are read from backend earlier)
//       const computed = computeHousePaintingDisplay(v, siteVisitCharges, {
//         firstPaid,
//         secondPaid,
//         finalPaid,
//         firstAmount,
//         secondAmount,
//         finalAmount,
//       });

//       setPaidAmount(String(computed.paidDisplay || 0));

//       if (computed.refund > 0) {
//         setRefundAmount(computed.refund);
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(computed.aytp);
//       }
//     } else if (!leadMode && !isHousePaintingService) {
//       // ENQUIRY MODE + NON house painting
//       const bookingAmt = Math.round(v * 0.2);
//       setServerBookingAmount(bookingAmt);

//       const aytp = v - Number(paidAmount || 0);
//       if (aytp < 0) {
//         setRefundAmount(Math.abs(aytp));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(aytp);
//       }
//     } else {
//       // fallback
//       const aytp = v - Number(paidAmount || 0);
//       if (aytp < 0) {
//         setRefundAmount(Math.abs(aytp));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(aytp);
//       }
//     }

//     setEditingFinal(false);
//   };

//   // ---------------------------------------------------------------
//   // HANDLER: SAVE FINAL LEAD/ENQUIRY UPDATE
//   // (keeps your existing API call behavior — only sending the fields you already expected)
//   // ---------------------------------------------------------------
//   const handleSave = async () => {
//     if (!enquiry?.bookingId) return;

//     // Validate all required fields
//     if (!customerName.trim()) return alert("Customer name is required");
//     if (!customerPhone.trim() || customerPhone.length !== 10)
//       return alert("Valid phone number is required");

//     if (!houseFlatNumber.trim()) return alert("House/Flat number is required");
//     if (!streetArea.trim()) return alert("Street/Area is required");
//     if (!city.trim()) return alert("City is required");
//     if (!location?.coordinates)
//       return alert("Location coordinates are required");

//     if (!slotDate.trim()) return alert("Slot date is required");
//     if (!slotTime.trim()) return alert("Slot time is required");

//     if (services.length === 0) return alert("At least one service required");

//     // Validate each service
//     for (let i = 0; i < services.length; i++) {
//       const s = services[i];
//       if (!s.category?.trim())
//         return alert(`Service ${i + 1}: Category required`);
//       if (s.category.toLowerCase() !== "house painting") {
//         if (!s.subCategory?.trim())
//           return alert(`Service ${i + 1}: Subcategory required`);
//         if (!s.serviceName?.trim())
//           return alert(`Service ${i + 1}: Service name required`);
//       }
//       if (!s.price || Number(s.price) <= 0)
//         return alert(`Service ${i + 1}: Valid price required`);
//     }

//     setSaving(true);

//     try {
//       // ADDRESS PAYLOAD
//       const addressPayload = {
//         houseFlatNumber,
//         streetArea,
//         landMark,
//         city,
//         location: {
//           type: "Point",
//           coordinates: location.coordinates,
//         },
//       };

//       // SLOT PAYLOAD
//       const slotPayload = {
//         slotDate,
//         slotTime,
//       };

//       // NORMALIZED SERVICES PAYLOAD
//       const normalizedServices = services.map((s) => ({
//         category: s.category,
//         subCategory: s.subCategory,
//         serviceName: s.serviceName,
//         price: Number(s.price || 0),
//         quantity: 1,
//         teamMembersRequired: 0,
//         bookingAmount: Number(s.bookingAmount || 0),
//       }));

//       // FINAL CALCULATION FIX
//       let finalAYTP = amountYetToPay;
//       let finalRefund = refundAmount;
//       if (refundAmount > 0) finalAYTP = 0;
//       if (amountYetToPay > 0) finalRefund = 0;

//       // BOOKING DETAILS PAYLOAD
//       let bookingDetailsPayload = {
//         finalTotal: serverFinalTotal,
//         amountYetToPay: finalAYTP,
//         refundAmount: finalRefund,
//       };

//       if (!leadMode) {
//         bookingDetailsPayload.status = status;
//         bookingDetailsPayload.paymentMethod = paymentMethod;
//         bookingDetailsPayload.paymentStatus = paymentStatus;
//         bookingDetailsPayload.bookingAmount = serverBookingAmount;
//         bookingDetailsPayload.paidAmount = Number(paidAmount);

//         // Add site visit charges for house painting in enquiry mode
//         if (isHousePaintingService) {
//           bookingDetailsPayload.siteVisitCharges = siteVisitCharges;
//         }
//       }

//       // FINAL PAYLOAD
//       const finalPayload = {
//         customer: {
//           name: customerName,
//           phone: customerPhone,
//           customerId: enquiry?.raw?.customer?.customerId,
//         },
//         service: normalizedServices,
//         bookingDetails: bookingDetailsPayload,
//         address: addressPayload,
//         selectedSlot: slotPayload,
//         formName,
//       };

//       // REMOVE isEnquiry FOR LEAD MODE
//       if (!leadMode) {
//         finalPayload.isEnquiry = enquiry?.raw?.isEnquiry ?? true;
//       }

//       const endpoint = leadMode
//         ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
//         : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

//       const res = await fetch(endpoint, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(finalPayload),
//       });

//       const data = await res.json();

//       if (!res.ok) throw new Error(data?.message || "Update failed");

//       onUpdated?.(data.booking);
//       onClose();
//     } catch (err) {
//       alert(err.message || "Error updating enquiry");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Helper: unique subcategories from deepList (use item.subcategory)
//   const getUniqueDeepCategories = () => {
//     if (!Array.isArray(deepList)) return [];
//     return [
//       ...new Set(
//         deepList
//           .map((it) => (it.category || "").toString().trim())
//           .filter(Boolean)
//       ),
//     ];
//   };

//   // ---------------------------------------------------------------
//   // UI: RENDER MODAL
//   // ---------------------------------------------------------------
//   return (
//     <>
//       <Modal
//         show={show}
//         onHide={onClose}
//         size="lg"
//         centered
//         enforceFocus={false}
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
//                 readOnly
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
//                   readOnly
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
//               House Painting allows only one service entry. (Price shown but
//               ignored for calculations)
//             </div>
//           )}

//           {services.map((s, idx) => {
//             const isDeepCleaning =
//               s.category?.toString().toLowerCase() === "deep cleaning";
//             const isHousePainting =
//               s.category?.toString().toLowerCase() === "house painting";

//             const filteredServiceNames = deepList
//               .filter((item) => {
//                 const a = (item.category || "").toString().trim().toLowerCase();
//                 const b = (s.subCategory || "").toString().trim().toLowerCase();
//                 return a && b && a === b;
//               })
//               .map((item) => ({
//                 label: item.name,
//                 value: item.name,
//                 price: item.totalAmount,
//                 bookingAmount: item.bookingAmount,
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
//                         <option value="">Select Category *</option>
//                         {getUniqueDeepCategories().map((cat) => (
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
//                             onServiceChange(
//                               idx,
//                               "bookingAmount",
//                               selectedItem.bookingAmount ?? ""
//                             );
//                           } else {
//                             onServiceChange(idx, "price", "");
//                             onServiceChange(idx, "bookingAmount", "");
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
//                   <Form.Label className="mb-1">{isDeepCleaning ? "Price (₹)" : "Site visiting charge (₹)"}</Form.Label>
//                   {/* Price is visible but for house painting it is ignored */}
//                   <Form.Control
//                     type="number"
//                     size="sm"
//                     value={s.price}
//                     min="0"
//                     onChange={(e) =>
//                       onServiceChange(idx, "price", e.target.value)
//                     }
//                     placeholder="0"
//                     disabled={true}
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

//         {/* ------------------------------------------------------ */}
//         {/* PAYMENT SUMMARY SECTION (UPDATED)                      */}
//         {/* ------------------------------------------------------ */}
//         <div
//           className="mt-3 p-3"
//           style={{
//             background: "#f8f9fa",
//             borderRadius: 8,
//             border: "1px solid #e3e3e3",
//           }}
//         >
//           <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

//           {/* SHOW ORIGINAL + CHANGE */}
//           {leadMode &&
//             originalFinalTotal > 0 &&
//             serverFinalTotal !== originalFinalTotal && (
//               <>
//                 <div className="d-flex justify-content-between mb-1">
//                   <span>Original Amount:</span>
//                   <strong>₹{originalFinalTotal}</strong>
//                 </div>

//                 <div className="d-flex justify-content-between mb-2">
//                   <span>Change:</span>
//                   {serverFinalTotal > originalFinalTotal ? (
//                     <strong style={{ color: "green" }}>
//                       +₹{serverFinalTotal - originalFinalTotal}
//                     </strong>
//                   ) : (
//                     <strong style={{ color: "red" }}>
//                       -₹{originalFinalTotal - serverFinalTotal}
//                     </strong>
//                   )}
//                 </div>
//               </>
//             )}

//           {/* HOUSE PAINTING - ENQUIRY MODE or FINALTOTAL = 0: show site visit only */}
//           {isHousePaintingService && (!leadMode || serverFinalTotal === 0) ? (
//             <div className="d-flex justify-content-between mb-1">
//               <span>Site Visit Charges:</span>
//               <strong>₹{siteVisitCharges}</strong>
//             </div>
//           ) : (
//             /* DEEP CLEANING OR HOUSE PAINTING WITH FINALTOTAL > 0 IN LEAD MODE */
//             <>
//               {/* FINAL TOTAL DISPLAY */}
//               <div
//                 className="d-flex justify-content-between mb-2"
//                 style={{ alignItems: "center" }}
//               >
//                 <span>Final Total:</span>

//                 {editingFinal ? (
//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     <Form.Control
//                       type="number"
//                       size="sm"
//                       value={draftFinalTotal}
//                       onChange={(e) => setDraftFinalTotal(e.target.value)}
//                       style={{ width: 120 }}
//                     />
//                     <div
//                       style={{ color: "#007a0a", cursor: "pointer" }}
//                       onClick={applyManualFinalTotal}
//                     >
//                       <FaCheck />
//                     </div>
//                     <div
//                       style={{ color: "#d40000", cursor: "pointer" }}
//                       onClick={() => {
//                         setDraftFinalTotal(String(serverFinalTotal));
//                         setEditingFinal(false);
//                       }}
//                     >
//                       <ImCancelCircle />
//                     </div>
//                   </div>
//                 ) : (
//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     {/* Final total should ALWAYS prefer the backend final total (or manual edited serverFinalTotal) */}
//                     <strong style={{ color: "#007a0a" }}>{`₹${
//                       serverFinalTotal || originalFinalTotal
//                     }`}</strong>
//                     <span
//                       style={{ cursor: "pointer", color: "#7F6663" }}
//                       onClick={() => {
//                         setDraftFinalTotal(
//                           String(serverFinalTotal || originalFinalTotal)
//                         );
//                         setEditingFinal(true);
//                       }}
//                     >
//                       <FaEdit />
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {/* BOOKING AMOUNT (only for enquiry deep cleaning) */}
//               {!leadMode && !isHousePaintingService && (
//                 <div className="d-flex justify-content-between mb-1">
//                   <span>Booking Amount (Paid First):</span>
//                   <strong>₹{serverBookingAmount}</strong>
//                 </div>
//               )}

//               {/* PAID AMOUNT (display) */}
//               <div className="d-flex justify-content-between mb-1">
//                 <span>Total Paid Amount:</span>
//                 <strong>₹{paidAmount}</strong>
//               </div>

//               {/* REFUND or AYTP */}
//               {refundAmount > 0 ? (
//                 <div className="d-flex justify-content-between mt-2">
//                   <span style={{ color: "red" }}>Refund Amount:</span>
//                   <strong style={{ color: "red" }}>₹{refundAmount}</strong>
//                 </div>
//               ) : (
//                 leadMode && (
//                   <>
//                     <div className="d-flex justify-content-between mt-2">
//                       <span>Amount Yet To Pay:</span>
//                       <strong>₹{amountYetToPay}</strong>
//                     </div>

//                     {/* Installment Label for House Painting */}
//                     {isHousePaintingService &&
//                       serverFinalTotal > 0 &&
//                       amountYetToPay > 0 && (
//                         <div
//                           className="d-flex justify-content-between mt-1"
//                           style={{ fontSize: 12 }}
//                         >
//                           <span className="text-muted">
//                             Current Installment:
//                           </span>

//                           <strong>
//                             {!firstPaid
//                               ? "1st Installment (40%)"
//                               : firstPaid && !secondPaid
//                               ? "2nd Installment (40%)"
//                               : firstPaid && secondPaid && !finalPaid
//                               ? "Final Installment (20%)"
//                               : "Completed"}
//                           </strong>
//                         </div>
//                       )}
//                   </>
//                 )
//               )}
//             </>
//           )}
//         </div>

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

// // EditEnquiryModal.jsx
// import React, { useEffect, useState } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { BASE_URL } from "../utils/config";
// import { ImCancelCircle } from "react-icons/im";
// import { FaCheck } from "react-icons/fa6";
// import { FaEdit } from "react-icons/fa";

// // util: strip +91 from contact
// const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

// const EditEnquiryModal = ({
//   show,
//   onClose,
//   enquiry,
//   onUpdated,
//   title,
//   leadMode = false,
// }) => {
//   // OLD STATES (unchanged)
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
//   const [initialServiceCount, setInitialServiceCount] = useState(0);

//   const [status, setStatus] = useState("Pending");
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paymentStatus, setPaymentStatus] = useState("Unpaid");
//   const [paidAmount, setPaidAmount] = useState(""); // display string

//   const [deepList, setDeepList] = useState([]);

//   const [showDiscount, setShowDiscount] = useState(false);
//   const [discountMode, setDiscountMode] = useState("percent");
//   const [discountValue, setDiscountValue] = useState("");
//   const [discountAmount, setDiscountAmount] = useState(0);
//   const [discountApplied, setDiscountApplied] = useState(false);

//   const [showAddressModal, setShowAddressModal] = useState(false);
//   const [showTimeModal, setShowTimeModal] = useState(false);

//   const [editingFinal, setEditingFinal] = useState(false);
//   const [draftFinalTotal, setDraftFinalTotal] = useState("");

//   // NEW STATES — required for your logic
//   const [serverFinalTotal, setServerFinalTotal] = useState(0); // final total used for calculations
//   const [originalFinalTotal, setOriginalFinalTotal] = useState(0); // original backend final total
//   const [amountYetToPay, setAmountYetToPay] = useState(0); // recalculated AYTP
//   const [refundAmount, setRefundAmount] = useState(0); // refund when overpaid

//   const [serverBookingAmount, setServerBookingAmount] = useState(0);

//   // House painting specific states
//   const [siteVisitCharges, setSiteVisitCharges] = useState(0);
//   // Payment flags from backend (we read these to determine stages)
//   const [firstPaid, setFirstPaid] = useState(false);
//   const [secondPaid, setSecondPaid] = useState(false);
//   const [finalPaid, setFinalPaid] = useState(false);
//   // Optional amounts in bookingDetails (first/second/final amounts)
//   const [firstAmount, setFirstAmount] = useState(0);
//   const [secondAmount, setSecondAmount] = useState(0);
//   const [finalAmount, setFinalAmount] = useState(0);

//   const isHousePaintingService = services.some(
//     (s) => s.category?.toLowerCase() === "house painting"
//   );

//   // -------------------------------------------------------------------
//   // Helper: compute house painting AYTP & paidDisplay using your rules
//   // Percentages fixed: 1st=40%, 2nd=40%, final=20%
//   // Rules implemented:
//   // Case 1 — Before any installment payment:
//   //   if paidAmount <= siteVisitCharges -> AYTP = 40% of finalTotal (paid display = siteVisitCharges)
//   // After 1st paid -> AYTP = 40% of finalTotal (paid display = firstAmount)
//   // After 2nd paid -> AYTP = 20% of finalTotal (paid display = first + second)
//   // After all paid -> AYTP = 0, refund if paid > finalTotal
//   // -------------------------------------------------------------------
//   const computeHousePaintingDisplay = (
//     finalTotalValue,
//     siteVisitChargesValue,
//     flagsAndAmounts
//   ) => {
//     const FT = Number(finalTotalValue || 0);
//     const SV = Number(siteVisitChargesValue || 0);

//     const firstPaidFlag = !!flagsAndAmounts.firstPaid;
//     const secondPaidFlag = !!flagsAndAmounts.secondPaid;
//     const finalPaidFlag = !!flagsAndAmounts.finalPaid;

//     const fAmt = Number(flagsAndAmounts.firstAmount || 0);
//     const sAmt = Number(flagsAndAmounts.secondAmount || 0);
//     const fnAmt = Number(flagsAndAmounts.finalAmount || 0);

//     const slab40 = Math.round(FT * 0.4);
//     const slab20 = Math.round(FT * 0.2);

//     let paidDisplay = 0;
//     let aytp = 0;
//     let refund = 0;

//     // no installment paid => show siteVisitCharges as paid display and AYTP = 40%
//     if (!firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = SV;
//       aytp = slab40;
//     }
//     // first paid only
//     else if (firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt;
//       aytp = slab40;
//     }
//     // first + second paid
//     else if (firstPaidFlag && secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt + sAmt;
//       aytp = slab20;
//     }
//     // all paid
//     else if (firstPaidFlag && secondPaidFlag && finalPaidFlag) {
//       paidDisplay = fAmt + sAmt + fnAmt;
//       aytp = 0;
//       if (paidDisplay > FT) refund = paidDisplay - FT;
//     } else {
//       // other combos (fallback) - treat like before first payment
//       paidDisplay = SV;
//       aytp = slab40;
//     }

//     return {
//       paidDisplay,
//       aytp,
//       refund,
//       slab40,
//       slab20,
//     };
//   };

//   // ---------------------------------------------------------------
//   // FETCH DEEP CLEANING PACKAGES (unchanged)
//   // ---------------------------------------------------------------
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(
//           `${BASE_URL}/deeppackage/deep-cleaning-packages`
//         );
//         const data = await res.json();
//         if (data && data.success && Array.isArray(data.data)) {
//           setDeepList(data.data);
//         } else {
//           setDeepList([]);
//         }
//       } catch (err) {
//         console.log("Error fetching deep cleaning data:", err);
//         setDeepList([]);
//       }
//     };
//     fetchData();
//   }, []);

//   // -------------------------------------------------------------------
//   // LOAD ENQUIRY DATA (UPDATED — includes finalTotal, AYTP, refund logic)
//   // -------------------------------------------------------------------
//   useEffect(() => {
//     if (!enquiry?.raw) return;

//     try {
//       const {
//         customer,
//         address,
//         selectedSlot,
//         service,
//         bookingDetails,
//         formName: fm,
//       } = enquiry.raw;

//       setCustomerName(customer?.name || "");
//       setCustomerPhone(
//         normalizePhone(enquiry?.contact) || customer?.phone || ""
//       );
//       setFormName(fm || enquiry?.formName || "");

//       setHouseFlatNumber(address?.houseFlatNumber || "");
//       setStreetArea(address?.streetArea || "");
//       setLandMark(address?.landMark || "");
//       setCity(address?.city || "");
//       setLocation(address?.location || null);

//       setSlotDate(selectedSlot?.slotDate || "");
//       setSlotTime(selectedSlot?.slotTime || "");

//       // Load services (unchanged logic)
//       setServices(
//         (service || []).map((s) => {
//           const raw = s || {};
//           const priceVal = raw.price ?? raw.totalAmount ?? raw.amount ?? "";
//           return {
//             category: raw.category || "Deep Cleaning",
//             subCategory: raw.subCategory || "",
//             serviceName: raw.serviceName || raw.name || "",
//             price:
//               priceVal !== undefined && priceVal !== null
//                 ? String(priceVal)
//                 : "",
//             bookingAmount: raw.bookingAmount || "",
//           };
//         })
//       );

//       setInitialServiceCount((service || []).length || 0);

//       // ------------------------------
//       // Load backend totals
//       // ------------------------------
//       const backendFinal = Number(bookingDetails?.finalTotal || 0);
//       const backendPaid = Number(bookingDetails?.paidAmount || 0);
//       const backendAYTP = Number(bookingDetails?.amountYetToPay || 0);

//       // Store original value for comparison
//       setOriginalFinalTotal(backendFinal);

//       // Use backend final total for calculations (important for house painting)
//       setServerFinalTotal(backendFinal);

//       // Load backend booking amount
//       const backendBooking = Number(bookingDetails?.bookingAmount || 0);
//       setServerBookingAmount(backendBooking);

//       // default paid amount display; may override for house painting lead mode
//       setPaidAmount(String(backendPaid));

//       // default AYTP/refund for non-house-painting or enquiry mode
//       if (backendAYTP < 0) {
//         setRefundAmount(Math.abs(backendAYTP));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(backendAYTP);
//       }

//       setStatus(bookingDetails?.status || "Pending");
//       setPaymentMethod(bookingDetails?.paymentMethod || "Cash");
//       setPaymentStatus(bookingDetails?.paymentStatus || "Unpaid");

//       setDraftFinalTotal(String(backendFinal));

//       // ------------------------------
//       // House painting specific loading (if present)
//       // ------------------------------
//       const isHousePainting = (service || []).some(
//         (it) =>
//           (it.category || "").toString().toLowerCase() === "house painting"
//       );

//       // siteVisitCharges if present
//       const svc = Number(bookingDetails?.siteVisitCharges || 0);
//       setSiteVisitCharges(svc);

//       if (isHousePainting) {
//         // Read payment flags from bookingDetails
//         const fPaid = bookingDetails?.firstPayment?.status === "paid";
//         const sPaid = bookingDetails?.secondPayment?.status === "paid";
//         const fnPaid = bookingDetails?.finalPayment?.status === "paid";
//         setFirstPaid(!!fPaid);
//         setSecondPaid(!!sPaid);
//         setFinalPaid(!!fnPaid);

//         const fAmt = Number(bookingDetails?.firstPayment?.amount || 0);
//         const sAmt = Number(bookingDetails?.secondPayment?.amount || 0);
//         const fnAmt = Number(bookingDetails?.finalPayment?.amount || 0);
//         setFirstAmount(fAmt);
//         setSecondAmount(sAmt);
//         setFinalAmount(fnAmt);

//         // If leadMode -> compute UI values using confirmed rules (override display AYTP for lead)
//         if (leadMode) {
//           const computed = computeHousePaintingDisplay(backendFinal, svc, {
//             firstPaid: fPaid,
//             secondPaid: sPaid,
//             finalPaid: fnPaid,
//             firstAmount: fAmt,
//             secondAmount: sAmt,
//             finalAmount: fnAmt,
//           });

//           // set paid display (string)
//           setPaidAmount(String(computed.paidDisplay || 0));

//           if (computed.refund > 0) {
//             setRefundAmount(computed.refund);
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(computed.aytp);
//           }
//         } else {
//           // enquiry mode: use backend AYTP (already set above)
//           const aytp = backendFinal - backendPaid;
//           if (aytp < 0) {
//             setRefundAmount(Math.abs(aytp));
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(aytp);
//           }
//         }
//       }
//     } catch (err) {
//       console.error("Error loading enquiry raw data:", err);
//     }
//   }, [enquiry, leadMode]);

//   // -------------------------------------------------------------------
//   // ADD NEW SERVICE (Deep Cleaning only)
//   // -------------------------------------------------------------------
//   const addService = () => {
//     setServices((prev) => [
//       ...prev,
//       {
//         category: "Deep Cleaning",
//         subCategory: "",
//         serviceName: "",
//         price: "",
//         bookingAmount: "",
//       },
//     ]);
//   };

//   // -------------------------------------------------------------------
//   // REMOVE SERVICE — with safeguard (cannot remove if only ONE remains)
//   // -------------------------------------------------------------------
//   const removeService = (idx) => {
//     if (services.length === 1) {
//       alert("At least one service must remain in the booking.");
//       return;
//     }

//     const removedPrice = Number(services[idx].price || 0);

//     // Remove service from list
//     setServices((prev) => prev.filter((_, i) => i !== idx));

//     // For non-house-painting: recalc finalTotal as sum of services
//     if (!isHousePaintingService) {
//       setServerFinalTotal((prev) => {
//         const newTotal = prev - removedPrice;
//         // For enquiry mode (deep cleaning), recalculate booking amount as 20% of finalTotal
//         if (!leadMode) {
//           const newBookingAmount = Math.round(newTotal * 0.2);
//           setServerBookingAmount(newBookingAmount);
//         }
//         // Calculate AYTP
//         const aytp = newTotal - Number(paidAmount || 0);
//         if (aytp < 0) {
//           setRefundAmount(Math.abs(aytp));
//           setAmountYetToPay(0);
//         } else {
//           setRefundAmount(0);
//           setAmountYetToPay(aytp);
//         }
//         return newTotal;
//       });
//     }
//     // For house painting we do NOT change serverFinalTotal here (must come from backend/or manual edit)
//   };

//   // Updated address selection handler - now only updates local state
//   const handleAddressSelect = (addressData) => {
//     setHouseFlatNumber(addressData.houseFlatNumber || "");
//     setStreetArea(addressData.formattedAddress || "");
//     setLandMark(addressData.landmark || "");
//     setCity(addressData.city || "");
//     if (
//       addressData.lng !== undefined &&
//       addressData.lat !== undefined &&
//       !Number.isNaN(addressData.lng) &&
//       !Number.isNaN(addressData.lat)
//     ) {
//       setLocation({
//         type: "Point",
//         coordinates: [addressData.lng, addressData.lat],
//       });
//     }
//     setSlotDate("");
//     setSlotTime("");
//   };

//   // Updated slot selection handler - now only updates local state
//   const handleSlotSelect = (sel) => {
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

//   // -------------------------------------------------------------------
//   // SERVICE FIELDS UPDATE HANDLER
//   // -------------------------------------------------------------------
//   const onServiceChange = (idx, field, value) => {
//     setServices((prev) => {
//       const copy = [...prev];
//       const updated = {
//         ...copy[idx],
//         [field]: field === "price" && value === "" ? "" : value,
//       };
//       copy[idx] = updated;
//       return copy;
//     });
//   };

//   // -------------------------------------------------------------------
//   // AUTO RECALCULATE FINAL TOTAL WHENEVER SERVICES CHANGE (add/edit)
//   // For House Painting: DO NOT use services to compute finalTotal.
//   // Use backend.finalTotal (serverFinalTotal) instead.
//   // -------------------------------------------------------------------
//   useEffect(() => {
//     if (!services.length) return;

//     if (isHousePaintingService) {
//       // IMPORTANT: Do not override serverFinalTotal if house painting
//       // Keep serverFinalTotal as backend.finalTotal (or manual edited value)
//       // No recalculation from services here.
//       return;
//     }

//     // For non-house-painting, compute finalTotal from services
//     const sumOfServices = services.reduce(
//       (acc, s) => acc + Number(s.price || 0),
//       0
//     );

//     setServerFinalTotal(sumOfServices);

//     // For enquiry mode (deep cleaning), calculate booking amount as 20% of finalTotal
//     if (!leadMode) {
//       const bookingAmt = Math.round(sumOfServices * 0.2);
//       setServerBookingAmount(bookingAmt);
//     }

//     // Calculate amount yet to pay
//     const aytp = sumOfServices - Number(paidAmount || 0);

//     if (aytp < 0) {
//       setRefundAmount(Math.abs(aytp));
//       setAmountYetToPay(0);
//     } else {
//       setRefundAmount(0);
//       setAmountYetToPay(aytp);
//     }
//   }, [services, isHousePaintingService, leadMode, paidAmount]);

//   // -------------------------------------------------------------------
//   // MANUAL FINAL TOTAL EDIT (✔ APPLY)
//   // For house painting: allow manual edit — then apply AYTP logic.
//   // For other services: behave as before.
//   // -------------------------------------------------------------------
//   const applyManualFinalTotal = () => {
//     const v = Number(draftFinalTotal || 0);

//     if (!Number.isFinite(v) || v <= 0) {
//       alert("Final total must be greater than 0");
//       return;
//     }

//     // Update UI final total
//     setServerFinalTotal(v);

//     // If house painting in leadMode -> compute AYTP using rules
//     if (leadMode && isHousePaintingService) {
//       // Determine flags & amounts currently in state (these are read from backend earlier)
//       const computed = computeHousePaintingDisplay(v, siteVisitCharges, {
//         firstPaid,
//         secondPaid,
//         finalPaid,
//         firstAmount,
//         secondAmount,
//         finalAmount,
//       });

//       setPaidAmount(String(computed.paidDisplay || 0));

//       if (computed.refund > 0) {
//         setRefundAmount(computed.refund);
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(computed.aytp);
//       }
//     } else if (!leadMode && !isHousePaintingService) {
//       // ENQUIRY MODE + NON house painting
//       const bookingAmt = Math.round(v * 0.2);
//       setServerBookingAmount(bookingAmt);

//       const aytp = v - Number(paidAmount || 0);
//       if (aytp < 0) {
//         setRefundAmount(Math.abs(aytp));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(aytp);
//       }
//     } else {
//       // fallback
//       const aytp = v - Number(paidAmount || 0);
//       if (aytp < 0) {
//         setRefundAmount(Math.abs(aytp));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(aytp);
//       }
//     }

//     setEditingFinal(false);
//   };

//   // ---------------------------------------------------------------
//   // HANDLER: SAVE FINAL LEAD/ENQUIRY UPDATE
//   // (keeps your existing API call behavior — only sending the fields you already expected)
//   // ---------------------------------------------------------------
//   const handleSave = async () => {
//     if (!enquiry?.bookingId) return;

//     // Validate all required fields
//     if (!customerName.trim()) return alert("Customer name is required");
//     if (!customerPhone.trim() || customerPhone.length !== 10)
//       return alert("Valid phone number is required");

//     if (!houseFlatNumber.trim()) return alert("House/Flat number is required");
//     if (!streetArea.trim()) return alert("Street/Area is required");
//     if (!city.trim()) return alert("City is required");
//     if (!location?.coordinates)
//       return alert("Location coordinates are required");

//     if (!slotDate.trim()) return alert("Slot date is required");
//     if (!slotTime.trim()) return alert("Slot time is required");

//     if (services.length === 0) return alert("At least one service required");

//     // Validate each service
//     for (let i = 0; i < services.length; i++) {
//       const s = services[i];
//       if (!s.category?.trim())
//         return alert(`Service ${i + 1}: Category required`);
//       if (s.category.toLowerCase() !== "house painting") {
//         if (!s.subCategory?.trim())
//           return alert(`Service ${i + 1}: Subcategory required`);
//         if (!s.serviceName?.trim())
//           return alert(`Service ${i + 1}: Service name required`);
//       }
//       if (!s.price || Number(s.price) <= 0)
//         return alert(`Service ${i + 1}: Valid price required`);
//     }

//     setSaving(true);

//     try {
//       // ADDRESS PAYLOAD
//       const addressPayload = {
//         houseFlatNumber,
//         streetArea,
//         landMark,
//         city,
//         location: {
//           type: "Point",
//           coordinates: location.coordinates,
//         },
//       };

//       // SLOT PAYLOAD
//       const slotPayload = {
//         slotDate,
//         slotTime,
//       };

//       // NORMALIZED SERVICES PAYLOAD
//       const normalizedServices = services.map((s) => ({
//         category: s.category,
//         subCategory: s.subCategory,
//         serviceName: s.serviceName,
//         price: Number(s.price || 0),
//         quantity: 1,
//         teamMembersRequired: 0,
//         bookingAmount: Number(s.bookingAmount || 0),
//       }));

//       // FINAL CALCULATION FIX
//       let finalAYTP = amountYetToPay;
//       let finalRefund = refundAmount;
//       if (refundAmount > 0) finalAYTP = 0;
//       if (amountYetToPay > 0) finalRefund = 0;

//       // BOOKING DETAILS PAYLOAD
//       let bookingDetailsPayload = {
//         finalTotal: serverFinalTotal,
//         // originalTotalAmount: originalFinalTotal,
//         amountYetToPay: finalAYTP,
//         refundAmount: finalRefund,
//       };

//       if (!leadMode) {
//         bookingDetailsPayload.status = status;
//         bookingDetailsPayload.paymentMethod = paymentMethod;
//         bookingDetailsPayload.paymentStatus = paymentStatus;
//         bookingDetailsPayload.bookingAmount = serverBookingAmount;
//         bookingDetailsPayload.paidAmount = Number(paidAmount);

//         // Add site visit charges for house painting in enquiry mode
//         if (isHousePaintingService) {
//           bookingDetailsPayload.siteVisitCharges = siteVisitCharges;
//         }
//       }

//       // FINAL PAYLOAD
//       const finalPayload = {
//         customer: {
//           name: customerName,
//           phone: customerPhone,
//           customerId: enquiry?.raw?.customer?.customerId,
//         },
//         service: normalizedServices,
//         bookingDetails: bookingDetailsPayload,
//         address: addressPayload,
//         selectedSlot: slotPayload,
//         formName,
//       };

//       // REMOVE isEnquiry FOR LEAD MODE
//       if (!leadMode) {
//         finalPayload.isEnquiry = enquiry?.raw?.isEnquiry ?? true;
//       }

//       const endpoint = leadMode
//         ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
//         : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

//         console.log("booking pay load", finalPayload)

//       // const res = await fetch(endpoint, {
//       //   method: "PUT",
//       //   headers: { "Content-Type": "application/json" },
//       //   body: JSON.stringify(finalPayload),
//       // });

//       // const data = await res.json();

//       // if (!res.ok) throw new Error(data?.message || "Update failed");

//       // onUpdated?.(data.booking);
//       // onClose();
//     } catch (err) {
//       alert(err.message || "Error updating enquiry");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Helper: unique subcategories from deepList (use item.subcategory)
//   const getUniqueDeepCategories = () => {
//     if (!Array.isArray(deepList)) return [];
//     return [
//       ...new Set(
//         deepList
//           .map((it) => (it.category || "").toString().trim())
//           .filter(Boolean)
//       ),
//     ];
//   };

//   // ---------------------------------------------------------------
//   // UI: RENDER MODAL
//   // ---------------------------------------------------------------
//   return (
//     <>
//       <Modal
//         show={show}
//         onHide={onClose}
//         size="lg"
//         centered
//         enforceFocus={false}
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
//                 readOnly
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
//                   readOnly
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
//               House Painting allows only one service entry. (Price shown but
//               ignored for calculations)
//             </div>
//           )}

//           {services.map((s, idx) => {
//             const isDeepCleaning =
//               s.category?.toLowerCase() === "deep cleaning";
//             const isHousePainting =
//               s.category?.toLowerCase() === "house painting";

//             const filteredServiceNames = deepList
//               .filter((item) => {
//                 const a = (item.category || "").toString().trim().toLowerCase();
//                 const b = (s.subCategory || "").toString().trim().toLowerCase();
//                 return a && b && a === b;
//               })
//               .map((item) => ({
//                 label: item.name,
//                 value: item.name,
//                 price: item.totalAmount,
//                 bookingAmount: item.bookingAmount,
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
//                         <option value="">Select Category *</option>
//                         {getUniqueDeepCategories().map((cat) => (
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
//                             onServiceChange(
//                               idx,
//                               "bookingAmount",
//                               selectedItem.bookingAmount ?? ""
//                             );
//                           } else {
//                             onServiceChange(idx, "price", "");
//                             onServiceChange(idx, "bookingAmount", "");
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
//                   <Form.Label className="mb-1">{isDeepCleaning?  "Price (₹)" :"Site visiting charge (₹)"}</Form.Label>
//                   {/* Price is visible but for house painting it is ignored */}
//                   <Form.Control
//                     type="number"
//                     size="sm"
//                     value={s.price}
//                     min="0"
//                     onChange={(e) =>
//                       onServiceChange(idx, "price", e.target.value)
//                     }
//                     placeholder="0"
//                     disabled={true}
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

//         {/* ------------------------------------------------------ */}
//         {/* PAYMENT SUMMARY SECTION (UPDATED)                      */}
//         {/* ------------------------------------------------------ */}
//         <div
//           className="mt-3 p-3"
//           style={{
//             background: "#f8f9fa",
//             borderRadius: 8,
//             border: "1px solid #e3e3e3",
//           }}
//         >
//           <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

//           {/* SHOW ORIGINAL + CHANGE */}
//           {leadMode &&
//             originalFinalTotal > 0 &&
//             serverFinalTotal !== originalFinalTotal && (
//               <>
//                 <div className="d-flex justify-content-between mb-1">
//                   <span>Original Amount:</span>
//                   <strong>₹{originalFinalTotal}</strong>
//                 </div>

//                 <div className="d-flex justify-content-between mb-2">
//                   <span>Change:</span>
//                   {serverFinalTotal > originalFinalTotal ? (
//                     <strong style={{ color: "green" }}>
//                       +₹{serverFinalTotal - originalFinalTotal}
//                     </strong>
//                   ) : (
//                     <strong style={{ color: "red" }}>
//                       -₹{originalFinalTotal - serverFinalTotal}
//                     </strong>
//                   )}
//                 </div>
//               </>
//             )}

//           {/* HOUSE PAINTING - ENQUIRY MODE or FINALTOTAL = 0: show site visit only */}
//           {isHousePaintingService && (!leadMode || serverFinalTotal === 0) ? (
//             <div className="d-flex justify-content-between mb-1">
//               <span>Site Visit Charges:</span>
//               <strong>₹{siteVisitCharges}</strong>
//             </div>
//           ) : (
//             /* DEEP CLEANING OR HOUSE PAINTING WITH FINALTOTAL > 0 IN LEAD MODE */
//             <>
//               {/* FINAL TOTAL DISPLAY */}
//               <div
//                 className="d-flex justify-content-between mb-2"
//                 style={{ alignItems: "center" }}
//               >
//                 <span>Final Total:</span>

//                 {editingFinal ? (
//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     <Form.Control
//                       type="number"
//                       size="sm"
//                       value={draftFinalTotal}
//                       onChange={(e) => setDraftFinalTotal(e.target.value)}
//                       style={{ width: 120 }}
//                     />
//                     <div
//                       style={{ color: "#007a0a", cursor: "pointer" }}
//                       onClick={applyManualFinalTotal}
//                     >
//                       <FaCheck />
//                     </div>
//                     <div
//                       style={{ color: "#d40000", cursor: "pointer" }}
//                       onClick={() => {
//                         setDraftFinalTotal(String(serverFinalTotal));
//                         setEditingFinal(false);
//                       }}
//                     >
//                       <ImCancelCircle />
//                     </div>
//                   </div>
//                 ) : (
//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     {/* Final total should ALWAYS prefer the backend final total (or manual edited serverFinalTotal) */}
//                     <strong style={{ color: "#007a0a" }}>{`₹${
//                       serverFinalTotal || originalFinalTotal
//                     }`}</strong>
//                     <span
//                       style={{ cursor: "pointer", color: "#7F6663" }}
//                       onClick={() => {
//                         setDraftFinalTotal(
//                           String(serverFinalTotal || originalFinalTotal)
//                         );
//                         setEditingFinal(true);
//                       }}
//                     >
//                       <FaEdit />
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {/* BOOKING AMOUNT (only for enquiry deep cleaning) */}
//               {!leadMode && !isHousePaintingService && (
//                 <div className="d-flex justify-content-between mb-1">
//                   <span>Booking Amount (Paid First):</span>
//                   <strong>₹{serverBookingAmount}</strong>
//                 </div>
//               )}

//               {/* PAID AMOUNT (display) */}
//               <div className="d-flex justify-content-between mb-1">
//                 <span>Total Paid Amount:</span>
//                 <strong>₹{paidAmount}</strong>
//               </div>

//               {/* SITE VISIT CHARGES (for house painting with finalTotal > 0) */}
//               {/* {isHousePaintingService && serverFinalTotal > 0 && (
//                 <div className="d-flex justify-content-between mb-1">
//                   <span>Site Visit Charges:</span>
//                   <strong>₹{siteVisitCharges}</strong>
//                 </div>
//               )} */}

//               {/* NOTE: No installment breakdown displayed as per your request */}

//               {/* REFUND or AYTP */}
//               {refundAmount > 0 ? (
//                 <div className="d-flex justify-content-between mt-2">
//                   <span style={{ color: "red" }}>Refund Amount:</span>
//                   <strong style={{ color: "red" }}>₹{refundAmount}</strong>
//                 </div>
//               ) : (
//                 leadMode && (
//                   <>
//                     <div className="d-flex justify-content-between mt-2">
//                       <span>Amount Yet To Pay:</span>
//                       <strong>₹{amountYetToPay}</strong>
//                     </div>

//                     {/* Installment Label for House Painting */}
//                     {isHousePaintingService &&
//                       serverFinalTotal > 0 &&
//                       amountYetToPay > 0 && (
//                         <div
//                           className="d-flex justify-content-between mt-1"
//                           style={{ fontSize: 12 }}
//                         >
//                           <span className="text-muted">
//                             Current Installment:
//                           </span>

//                           <strong>
//                             {!firstPaid
//                               ? "1st Installment (40%)"
//                               : firstPaid && !secondPaid
//                               ? "2nd Installment (40%)"
//                               : firstPaid && secondPaid && !finalPaid
//                               ? "Final Installment (20%)"
//                               : "Completed"}
//                           </strong>
//                         </div>
//                       )}
//                   </>
//                 )
//               )}
//             </>
//           )}
//         </div>

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

// import React, { useEffect, useState } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { BASE_URL } from "../utils/config";
// import { ImCancelCircle } from "react-icons/im";
// import { FaCheck } from "react-icons/fa6";
// import { FaEdit } from "react-icons/fa";

// // util: strip +91 from contact
// const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

// const EditEnquiryModal = ({
//   show,
//   onClose,
//   enquiry,
//   onUpdated,
//   title,
//   leadMode = false,
// }) => {
//   // OLD STATES (unchanged)
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
//   const [initialServiceCount, setInitialServiceCount] = useState(0);

//   const [status, setStatus] = useState("Pending");
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paymentStatus, setPaymentStatus] = useState("Unpaid");
//   const [paidAmount, setPaidAmount] = useState("");

//   const [deepList, setDeepList] = useState([]);

//   const [showDiscount, setShowDiscount] = useState(false);
//   const [discountMode, setDiscountMode] = useState("percent");
//   const [discountValue, setDiscountValue] = useState("");
//   const [discountAmount, setDiscountAmount] = useState(0);
//   const [discountApplied, setDiscountApplied] = useState(false);

//   const [showAddressModal, setShowAddressModal] = useState(false);
//   const [showTimeModal, setShowTimeModal] = useState(false);

//   const [editingFinal, setEditingFinal] = useState(false);
//   const [draftFinalTotal, setDraftFinalTotal] = useState("");

//   // NEW STATES — required for your logic
//   const [serverFinalTotal, setServerFinalTotal] = useState(0); // final total after recalculation
//   const [originalFinalTotal, setOriginalFinalTotal] = useState(0); // original backend final total
//   const [amountYetToPay, setAmountYetToPay] = useState(0); // recalculated or backend AYTP
//   const [refundAmount, setRefundAmount] = useState(0); // when AYTP < 0

//   const [serverBookingAmount, setServerBookingAmount] = useState(0);

//   // House painting specific states
//   const [firstDue, setFirstDue] = useState(0);
//   const [secondDue, setSecondDue] = useState(0);
//   const [finalDue, setFinalDue] = useState(0);
//   const [firstPaid, setFirstPaid] = useState(false);
//   const [secondPaid, setSecondPaid] = useState(false);
//   const [finalPaid, setFinalPaid] = useState(false);
//   const [siteVisitCharges, setSiteVisitCharges] = useState(0);

//   const isHousePaintingService = services.some(
//     (s) => s.category?.toLowerCase() === "house painting"
//   );

//   // ---------------------------------------------------------------
//   // FETCH DEEP CLEANING PACKAGES (unchanged)
//   // ---------------------------------------------------------------
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(
//           `${BASE_URL}/deeppackage/deep-cleaning-packages`
//         );
//         const data = await res.json();
//         if (data && data.success && Array.isArray(data.data)) {
//           setDeepList(data.data);
//         } else {
//           setDeepList([]);
//         }
//       } catch (err) {
//         console.log("Error fetching deep cleaning data:", err);
//         setDeepList([]);
//       }
//     };
//     fetchData();
//   }, []);

//   // -------------------------------------------------------------------
//   // LOAD ENQUIRY DATA (UPDATED — includes finalTotal, AYTP, refund logic)
//   // -------------------------------------------------------------------
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

//     // Load services (unchanged logic)
//     setServices(
//       (service || []).map((s) => {
//         const raw = s || {};
//         const priceVal = raw.price ?? raw.totalAmount ?? raw.amount ?? "";
//         return {
//           category: raw.category || "Deep Cleaning",
//           subCategory: raw.subCategory || "",
//           serviceName: raw.serviceName || raw.name || "",
//           price:
//             priceVal !== undefined && priceVal !== null ? String(priceVal) : "",
//           bookingAmount: raw.bookingAmount || "",
//         };
//       })
//     );

//     setInitialServiceCount((service || []).length || 0);

//     // ------------------------------
//     // NEW — Load backend totals
//     // ------------------------------
//     const backendFinal = Number(bookingDetails?.finalTotal || 0);
//     const backendPaid = Number(bookingDetails?.paidAmount || 0);
//     const backendAYTP = Number(bookingDetails?.amountYetToPay || 0);

//     // Store original value for comparison
//     setOriginalFinalTotal(backendFinal);

//     // Used for recalculation
//     setServerFinalTotal(backendFinal);

//     // Load backend booking amount
//     const backendBooking = Number(bookingDetails?.bookingAmount || 0);
//     setServerBookingAmount(backendBooking);

//     // Paid amount
//     setPaidAmount(String(backendPaid));

//     // If AYTP < 0 => refund case
//     if (backendAYTP < 0) {
//       setRefundAmount(Math.abs(backendAYTP));
//       setAmountYetToPay(0);
//     } else {
//       setRefundAmount(0);
//       setAmountYetToPay(backendAYTP);
//     }

//     setStatus(bookingDetails?.status || "Pending");
//     setPaymentMethod(bookingDetails?.paymentMethod || "Cash");
//     setPaymentStatus(bookingDetails?.paymentStatus || "Unpaid");

//     setDraftFinalTotal(String(backendFinal));

//     // ------------------------------
//     // House painting specific loading (if present)
//     // ------------------------------
//     const isHousePainting = (service || []).some(
//       (it) => (it.category || "").toString().toLowerCase() === "house painting"
//     );

//     // siteVisitCharges if present
//     setSiteVisitCharges(Number(bookingDetails?.siteVisitCharges || 0));

//     if (isHousePainting) {
//       // Check first/second/final payment records from bookingDetails if available
//       const firstPaidFlag = bookingDetails?.firstPayment?.status === "paid";
//       const secondPaidFlag = bookingDetails?.secondPayment?.status === "paid";
//       const finalPaidFlag = bookingDetails?.finalPayment?.status === "paid";
//       setFirstPaid(!!firstPaidFlag);
//       setSecondPaid(!!secondPaidFlag);
//       setFinalPaid(!!finalPaidFlag);

//       // For lead mode: compute AYTP based on payment status
//       if (leadMode) {
//         computeHousePaintingAYTPForLead(backendFinal, backendPaid, {
//           firstPaid: !!firstPaidFlag,
//           secondPaid: !!secondPaidFlag,
//           finalPaid: !!finalPaidFlag,
//         });
//       } else {
//         // For enquiry mode: use simple AYTP logic
//         const aytp = backendFinal - backendPaid;
//         if (aytp < 0) {
//           setRefundAmount(Math.abs(aytp));
//           setAmountYetToPay(0);
//         } else {
//           setRefundAmount(0);
//           setAmountYetToPay(aytp);
//         }
//       }
//     }
//   }, [enquiry, leadMode]);

//   // Helper: compute house painting AYTP for lead mode (your specific requirement)
//   const computeHousePaintingAYTPForLead = (
//     finalTotalValue,
//     backendPaidValue,
//     paidFlags
//   ) => {
//     const ft = Number(finalTotalValue || 0);
//     const paid = Number(backendPaidValue || 0);

//     if (paid <= 0) {
//       // If no payment made, AYTP = 20% of finalTotal
//       const aytp = Math.round(ft * 0.2);
//       setAmountYetToPay(aytp);
//       setRefundAmount(0);
//     } else {
//       // If payment made, AYTP = 40% of finalTotal
//       const aytp = Math.round(ft * 0.4);
//       setAmountYetToPay(aytp);
//       setRefundAmount(0);
//     }
//   };

//   // -------------------------------------------------------------------
//   // ADD NEW SERVICE (Deep Cleaning only)
//   // -------------------------------------------------------------------
//   const addService = () => {
//     setServices((prev) => [
//       ...prev,
//       {
//         category: "Deep Cleaning",
//         subCategory: "",
//         serviceName: "",
//         price: "",
//         bookingAmount: "",
//       },
//     ]);
//   };

//   // -------------------------------------------------------------------
//   // REMOVE SERVICE — with safeguard (cannot remove if only ONE remains)
//   // -------------------------------------------------------------------
//   const removeService = (idx) => {
//     if (services.length === 1) {
//       alert("At least one service must remain in the booking.");
//       return;
//     }

//     const removedPrice = Number(services[idx].price || 0);

//     // Remove service from list
//     setServices((prev) => prev.filter((_, i) => i !== idx));

//     // Recalculate final total
//     setServerFinalTotal((prev) => {
//       const newTotal = prev - removedPrice;

//       // For enquiry mode (deep cleaning), recalculate booking amount as 20% of finalTotal
//       if (!leadMode && !isHousePaintingService) {
//         const newBookingAmount = Math.round(newTotal * 0.2);
//         setServerBookingAmount(newBookingAmount);
//       }

//       // Calculate AYTP
//       const aytp = newTotal - Number(paidAmount || 0);

//       if (aytp < 0) {
//         // refund scenario
//         setRefundAmount(Math.abs(aytp));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(aytp);
//       }

//       return newTotal;
//     });
//   };

//   // Updated address selection handler - now only updates local state
//   const handleAddressSelect = (addressData) => {
//     // Update local state only
//     setHouseFlatNumber(addressData.houseFlatNumber || "");
//     setStreetArea(addressData.formattedAddress || "");
//     setLandMark(addressData.landmark || "");
//     setCity(addressData.city || "");
//     if (
//       addressData.lng !== undefined &&
//       addressData.lat !== undefined &&
//       !Number.isNaN(addressData.lng) &&
//       !Number.isNaN(addressData.lat)
//     ) {
//       setLocation({
//         type: "Point",
//         coordinates: [addressData.lng, addressData.lat],
//       });
//     }

//     // Reset slot fields since address update clears them
//     setSlotDate("");
//     setSlotTime("");
//   };

//   // Updated slot selection handler - now only updates local state
//   const handleSlotSelect = (sel) => {
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

//   // -------------------------------------------------------------------
//   // SERVICE FIELDS UPDATE HANDLER
//   // -------------------------------------------------------------------
//   const onServiceChange = (idx, field, value) => {
//     setServices((prev) => {
//       const copy = [...prev];
//       const updated = {
//         ...copy[idx],
//         [field]: field === "price" && value === "" ? "" : value,
//       };
//       copy[idx] = updated;
//       return copy;
//     });
//   };

//   // -------------------------------------------------------------------
//   // AUTO RECALCULATE FINAL TOTAL WHENEVER SERVICES CHANGE (add/edit)
//   // -------------------------------------------------------------------
//   useEffect(() => {
//     if (!services.length) return;

//     // SUM OF ALL SERVICE PRICES
//     const sumOfServices = services.reduce(
//       (acc, s) => acc + Number(s.price || 0),
//       0
//     );

//     setServerFinalTotal(sumOfServices);

//     // For enquiry mode (deep cleaning), calculate booking amount as 20% of finalTotal
//     if (!leadMode && !isHousePaintingService) {
//       const bookingAmt = Math.round(sumOfServices * 0.2);
//       setServerBookingAmount(bookingAmt);
//     }

//     // Calculate amount yet to pay
//     const aytp = sumOfServices - Number(paidAmount || 0);

//     if (aytp < 0) {
//       // refund case
//       setRefundAmount(Math.abs(aytp));
//       setAmountYetToPay(0);
//     } else {
//       setRefundAmount(0);
//       setAmountYetToPay(aytp);
//     }
//   }, [services]); // updates whenever any service changes

//   // -------------------------------------------------------------------
//   // MANUAL FINAL TOTAL EDIT (✔ APPLY)
//   // -------------------------------------------------------------------
//   const applyManualFinalTotal = () => {
//     const v = Number(draftFinalTotal || 0);

//     if (!Number.isFinite(v) || v <= 0) {
//       alert("Final total must be greater than 0");
//       return;
//     }

//     setServerFinalTotal(v);

//     // Different logic based on leadMode and service type
//     if (leadMode && isHousePaintingService) {
//       // LEAD MODE + HOUSE PAINTING
//       const paid = Number(paidAmount || 0);

//       if (paid <= 0) {
//         // If no payment made, AYTP = 20% of finalTotal
//         const aytp = Math.round(v * 0.2);
//         setAmountYetToPay(aytp);
//         setRefundAmount(0);
//       } else {
//         // If payment made, AYTP = 40% of finalTotal
//         const aytp = Math.round(v * 0.4);
//         setAmountYetToPay(aytp);
//         setRefundAmount(0);
//       }
//     } else if (!leadMode && !isHousePaintingService) {
//       // ENQUIRY MODE + DEEP CLEANING
//       // Recalculate booking amount as 20% of finalTotal
//       const bookingAmt = Math.round(v * 0.2);
//       setServerBookingAmount(bookingAmt);

//       // Calculate AYTP
//       const aytp = v - Number(paidAmount || 0);
//       if (aytp < 0) {
//         setRefundAmount(Math.abs(aytp));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(aytp);
//       }
//     } else {
//       // Other cases (enquiry mode house painting or lead mode deep cleaning)
//       const aytp = v - Number(paidAmount || 0);
//       if (aytp < 0) {
//         setRefundAmount(Math.abs(aytp));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(aytp);
//       }
//     }

//     setEditingFinal(false);
//   };

//   // ---------------------------------------------------------------
//   // HANDLER: SAVE FINAL LEAD/ENQUIRY UPDATE
//   // ---------------------------------------------------------------
//   const handleSave = async () => {
//     if (!enquiry?.bookingId) return;

//     // Validate all required fields
//     if (!customerName.trim()) return alert("Customer name is required");
//     if (!customerPhone.trim() || customerPhone.length !== 10)
//       return alert("Valid phone number is required");

//     if (!houseFlatNumber.trim()) return alert("House/Flat number is required");
//     if (!streetArea.trim()) return alert("Street/Area is required");
//     if (!city.trim()) return alert("City is required");
//     if (!location?.coordinates)
//       return alert("Location coordinates are required");

//     if (!slotDate.trim()) return alert("Slot date is required");
//     if (!slotTime.trim()) return alert("Slot time is required");

//     if (services.length === 0) return alert("At least one service required");

//     // Validate each service
//     for (let i = 0; i < services.length; i++) {
//       const s = services[i];
//       if (!s.category?.trim())
//         return alert(`Service ${i + 1}: Category required`);
//       if (s.category.toLowerCase() !== "house painting") {
//         if (!s.subCategory?.trim())
//           return alert(`Service ${i + 1}: Subcategory required`);
//         if (!s.serviceName?.trim())
//           return alert(`Service ${i + 1}: Service name required`);
//       }
//       if (!s.price || Number(s.price) <= 0)
//         return alert(`Service ${i + 1}: Valid price required`);
//     }

//     setSaving(true);

//     // -----------------------------------------------------------
//     // ADDRESS PAYLOAD
//     // -----------------------------------------------------------
//     const addressPayload = {
//       houseFlatNumber,
//       streetArea,
//       landMark,
//       city,
//       location: {
//         type: "Point",
//         coordinates: location.coordinates,
//       },
//     };

//     // -----------------------------------------------------------
//     // SLOT PAYLOAD
//     // -----------------------------------------------------------
//     const slotPayload = {
//       slotDate,
//       slotTime,
//     };

//     // -----------------------------------------------------------
//     // NORMALIZED SERVICES PAYLOAD
//     // -----------------------------------------------------------
//     const normalizedServices = services.map((s) => ({
//       category: s.category,
//       subCategory: s.subCategory,
//       serviceName: s.serviceName,
//       price: Number(s.price || 0),
//       quantity: 1,
//       teamMembersRequired: 0,
//       bookingAmount: Number(s.bookingAmount || 0),
//     }));

//     // -------------------------------------------
//     // FINAL CALCULATION FIX
//     // -------------------------------------------
//     let finalAYTP = amountYetToPay;
//     let finalRefund = refundAmount;

//     if (refundAmount > 0) finalAYTP = 0;
//     if (amountYetToPay > 0) finalRefund = 0;

//     // -------------------------------------------
//     // BUILD BOOKING DETAILS PAYLOAD
//     // -------------------------------------------
//     // FOR LEAD → only send 4 fields
//     let bookingDetailsPayload = {
//       finalTotal: serverFinalTotal,
//       originalTotalAmount: originalFinalTotal,
//       amountYetToPay: finalAYTP,
//       refundAmount: finalRefund,
//     };

//     // FOR ENQUIRY → include all fields
//     if (!leadMode) {
//       bookingDetailsPayload.status = status;
//       bookingDetailsPayload.paymentMethod = paymentMethod;
//       bookingDetailsPayload.paymentStatus = paymentStatus;
//       bookingDetailsPayload.bookingAmount = serverBookingAmount;
//       bookingDetailsPayload.paidAmount = Number(paidAmount);

//       // Add site visit charges for house painting in enquiry mode
//       if (isHousePaintingService) {
//         bookingDetailsPayload.siteVisitCharges = siteVisitCharges;
//       }
//     }

//     // -------------------------------------------
//     // BUILD FINAL PAYLOAD
//     // -------------------------------------------
//     const finalPayload = {
//       customer: {
//         name: customerName,
//         phone: customerPhone,
//         customerId: enquiry?.raw?.customer?.customerId,
//       },
//       service: normalizedServices,
//       bookingDetails: bookingDetailsPayload,
//       address: addressPayload,
//       selectedSlot: slotPayload,
//       formName,
//     };

//     // REMOVE isEnquiry FOR LEAD MODE
//     if (!leadMode) {
//       finalPayload.isEnquiry = enquiry?.raw?.isEnquiry ?? true;
//     }

//     console.log("Final payload", finalPayload);

//     try {
//       const endpoint = leadMode
//         ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
//         : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

//       const res = await fetch(endpoint, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(finalPayload),
//       });

//       const data = await res.json();

//       if (!res.ok) throw new Error(data?.message || "Update failed");

//       onUpdated?.(data.booking);
//       onClose();
//     } catch (err) {
//       alert(err.message || "Error updating enquiry");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Helper: unique subcategories from deepList (use item.subcategory)
//   const getUniqueDeepCategories = () => {
//     if (!Array.isArray(deepList)) return [];
//     return [
//       ...new Set(
//         deepList
//           .map((it) => (it.category || "").toString().trim())
//           .filter(Boolean)
//       ),
//     ];
//   };

//   // ---------------------------------------------------------------
//   // UI: RENDER MODAL
//   // ---------------------------------------------------------------
//   return (
//     <>
//       <Modal
//         show={show}
//         onHide={onClose}
//         size="lg"
//         centered
//         enforceFocus={false}
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
//                 // Name is not editable in Edit Enquiry
//                 readOnly
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
//                   // Phone is not editable in Edit Enquiry
//                   readOnly
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
//               .filter((item) => {
//                 const a = (item.category || "").toString().trim().toLowerCase();
//                 const b = (s.subCategory || "").toString().trim().toLowerCase();
//                 return a && b && a === b;
//               })
//               .map((item) => ({
//                 label: item.name,
//                 value: item.name,
//                 price: item.totalAmount,
//                 bookingAmount: item.bookingAmount,
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
//                         <option value="">Select Category *</option>
//                         {getUniqueDeepCategories().map((cat) => (
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
//                             onServiceChange(
//                               idx,
//                               "bookingAmount",
//                               selectedItem.bookingAmount ?? ""
//                             );
//                           } else {
//                             // if user cleared or selected unknown, reset price & bookingAmount
//                             onServiceChange(idx, "price", "");
//                             onServiceChange(idx, "bookingAmount", "");
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
//                     // Make price non-editable in Edit Enquiry
//                     disabled={true}
//                   />
//                 </Col>

//                 {/* booking amount per-service hidden in UI — total shown in Payment Summary */}

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

//         {/* ------------------------------------------------------ */}
//         {/* PAYMENT SUMMARY SECTION (UPDATED)                      */}
//         {/* ------------------------------------------------------ */}
//         <div
//           className="mt-3 p-3"
//           style={{
//             background: "#f8f9fa",
//             borderRadius: 8,
//             border: "1px solid #e3e3e3",
//           }}
//         >
//           <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

//           {/* ---------------------- */}
//           {/* SHOW ORIGINAL + CHANGE */}
//           {/* ---------------------- */}
//           {leadMode &&
//             originalFinalTotal > 0 &&
//             serverFinalTotal !== originalFinalTotal && (
//               <>
//                 <div className="d-flex justify-content-between mb-1">
//                   <span>Original Amount:</span>
//                   <strong>₹{originalFinalTotal}</strong>
//                 </div>

//                 <div className="d-flex justify-content-between mb-2">
//                   <span>Change:</span>
//                   {serverFinalTotal > originalFinalTotal ? (
//                     <strong style={{ color: "green" }}>
//                       +₹{serverFinalTotal - originalFinalTotal}
//                     </strong>
//                   ) : (
//                     <strong style={{ color: "red" }}>
//                       -₹{originalFinalTotal - serverFinalTotal}
//                     </strong>
//                   )}
//                 </div>
//               </>
//             )}

//           {/* HOUSE PAINTING - ENQUIRY MODE or FINALTOTAL = 0 */}
//           {isHousePaintingService && (!leadMode || serverFinalTotal === 0) ? (
//             /* Only show site visit charges for house painting in enquiry mode or when finalTotal = 0 */
//             <div className="d-flex justify-content-between mb-1">
//               <span>Site Visit Charges:</span>
//               <strong>₹{siteVisitCharges}</strong>
//             </div>
//           ) : (
//             /* DEEP CLEANING OR HOUSE PAINTING WITH FINALTOTAL > 0 IN LEAD MODE */
//             <>
//               {/* ----------------------- */}
//               {/* FINAL TOTAL DISPLAY */}
//               {/* ----------------------- */}
//               <div
//                 className="d-flex justify-content-between mb-2"
//                 style={{ alignItems: "center" }}
//               >
//                 <span>Final Total:</span>

//                 {/* EDITING MODE */}
//                 {editingFinal ? (
//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     <Form.Control
//                       type="number"
//                       size="sm"
//                       value={draftFinalTotal} // ✅ correct binding
//                       onChange={(e) => setDraftFinalTotal(e.target.value)} // updates typing correctly
//                       style={{ width: 120 }}
//                     />

//                     <div
//                       style={{ color: "#007a0a", cursor: "pointer" }}
//                       onClick={applyManualFinalTotal}
//                     >
//                       <FaCheck />
//                     </div>

//                     <div
//                       style={{ color: "#d40000", cursor: "pointer" }}
//                       onClick={() => {
//                         setDraftFinalTotal(String(serverFinalTotal)); // reset input
//                         setEditingFinal(false);
//                       }}
//                     >
//                       <ImCancelCircle />
//                     </div>
//                   </div>
//                 ) : (
//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     <strong style={{ color: "#007a0a" }}>
//                       ₹{serverFinalTotal}
//                     </strong>
//                     <span
//                       style={{ cursor: "pointer", color: "#7F6663" }}
//                       onClick={() => {
//                         setDraftFinalTotal(String(serverFinalTotal)); // very important
//                         setEditingFinal(true);
//                       }}
//                     >
//                       <FaEdit />
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {/* ----------------------- */}
//               {/* BOOKING AMOUNT (only for enquiry deep cleaning) */}
//               {/* ----------------------- */}
//               {!leadMode && !isHousePaintingService && (
//                 <div className="d-flex justify-content-between mb-1">
//                   <span>Booking Amount (Paid First):</span>
//                   <strong>₹{serverBookingAmount}</strong>
//                 </div>
//               )}

//               {/* ----------------------- */}
//               {/* PAID AMOUNT */}
//               {/* ----------------------- */}
//               <div className="d-flex justify-content-between mb-1">
//                 <span>Total Paid Amount:</span>
//                 <strong>₹{paidAmount}</strong>
//               </div>

//               {/* ----------------------- */}
//               {/* SITE VISIT CHARGES (for house painting with finalTotal > 0) */}
//               {/* ----------------------- */}
//               {isHousePaintingService && serverFinalTotal > 0 && (
//                 <div className="d-flex justify-content-between mb-1">
//                   <span>Site Visit Charges:</span>
//                   <strong>₹{siteVisitCharges}</strong>
//                 </div>
//               )}

//               {/* ----------------------- */}
//               {/* HOUSE PAINTING: SHOW SLABS (only for lead mode) */}
//               {/* ----------------------- */}
//               {leadMode && isHousePaintingService && serverFinalTotal > 0 && (
//                 <div style={{ marginTop: 8, marginBottom: 8 }}>
//                   <div className="d-flex justify-content-between mb-1">
//                     <span>1st Payment (20%){firstPaid ? " — paid" : ""} </span>
//                     <strong>₹{firstDue}</strong>
//                   </div>

//                   <div className="d-flex justify-content-between mb-1">
//                     <span>2nd Payment (40%){secondPaid ? " — paid" : ""} </span>
//                     <strong>₹{secondDue}</strong>
//                   </div>

//                   <div className="d-flex justify-content-between mb-1">
//                     <span>
//                       Final Payment (40%){finalPaid ? " — paid" : ""}{" "}
//                     </span>
//                     <strong>₹{finalDue}</strong>
//                   </div>
//                 </div>
//               )}

//               {/* ----------------------- */}
//               {/* REFUND or AYTP */}
//               {/* ----------------------- */}
//               {refundAmount > 0 ? (
//                 <div className="d-flex justify-content-between mt-2">
//                   <span style={{ color: "red" }}>Refund Amount:</span>
//                   <strong style={{ color: "red" }}>₹{refundAmount}</strong>
//                 </div>
//               ) : (
//                 leadMode && (
//                   <div className="d-flex justify-content-between mt-2">
//                     <span>Amount Yet To Pay:</span>
//                     <strong>₹{amountYetToPay}</strong>
//                   </div>
//                 )
//               )}
//             </>
//           )}
//         </div>

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
